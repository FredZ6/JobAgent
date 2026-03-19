import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../lib/prisma.service.js";
import { type LlmProviderName } from "../llm/llm-provider.types.js";
import { LlmLongAnswerService } from "./llm-long-answer.service.js";
import { findDefaultAnswerMatch } from "../profile/profile.service.js";
import { SettingsService } from "../settings/settings.service.js";

type LongAnswerQuestionInput = {
  fieldName: string;
  fieldLabel?: string;
  questionText?: string;
  hints?: string[];
};

const highRiskQuestionPatterns = [
  {
    category: "sponsorship",
    patterns: ["sponsor", "sponsorship", "visa", "work authorization", "work permit", "authorized to work"]
  },
  {
    category: "salary_expectation",
    patterns: ["salary", "compensation", "pay expectation", "salary expectation", "pay range"]
  },
  {
    category: "availability",
    patterns: ["start date", "when can you start", "availability", "notice period"]
  },
  {
    category: "relocation",
    patterns: ["relocate", "relocation", "willing to relocate"]
  },
  {
    category: "legal_declaration",
    patterns: ["certify", "attest", "declaration", "agreement", "consent"]
  }
] as const;

const supportedProviders = ["openai", "gemini"] as const;

function normalizeQuestionSignal(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function identifyHighRiskCategory(question: LongAnswerQuestionInput) {
  const signals = [
    question.questionText,
    question.fieldLabel,
    question.fieldName,
    ...(question.hints ?? [])
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map(normalizeQuestionSignal);

  for (const riskPattern of highRiskQuestionPatterns) {
    if (signals.some((signal) => riskPattern.patterns.some((pattern) => signal.includes(pattern)))) {
      return riskPattern.category;
    }
  }

  return null;
}

function buildQuestionIdentity(question: LongAnswerQuestionInput) {
  return {
    fieldName: question.fieldName,
    ...(question.fieldLabel ? { fieldLabel: question.fieldLabel } : {}),
    ...(question.questionText ? { questionText: question.questionText } : {})
  };
}

@Injectable()
export class LongAnswerService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(SettingsService) private readonly settingsService: SettingsService,
    @Inject(LlmLongAnswerService) private readonly llmLongAnswerService: LlmLongAnswerService
  ) {}

  async generateForApplication(applicationId: string, questions: LongAnswerQuestionInput[]) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        resumeVersion: {
          include: {
            sourceProfile: true
          }
        }
      }
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    const [latestAnalysis, settings] = await Promise.all([
      this.prisma.jobAnalysis.findFirst({
        where: {
          jobId: application.jobId,
          status: "completed"
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      this.settingsService.getSettings()
    ]);

    const defaultAnswers =
      application.resumeVersion.sourceProfile.defaultAnswers &&
      typeof application.resumeVersion.sourceProfile.defaultAnswers === "object"
        ? (application.resumeVersion.sourceProfile.defaultAnswers as Record<string, string>)
        : {};

    const answers = await Promise.all(
      questions.map(async (question) => {
      const defaultAnswerMatch = findDefaultAnswerMatch(defaultAnswers, question);

      if (defaultAnswerMatch) {
        return {
          ...buildQuestionIdentity(question),
          decision: "fill" as const,
          answer: defaultAnswerMatch.answer,
          source: "default_answer_match" as const
        };
      }

      const matchedRiskCategory = identifyHighRiskCategory(question);

      if (matchedRiskCategory) {
        return {
          ...buildQuestionIdentity(question),
          decision: "manual_review_required" as const,
          source: "manual_review_required" as const,
          manualReason: "high_risk_question_missing_default_answer" as const,
          matchedRiskCategory
        };
      }

      this.assertSupportedProvider(settings.provider);

      const shouldUseLlm =
        this.isUsableProviderSettings(settings) && !this.isDemoFallbackMode();

      if (shouldUseLlm) {
        try {
          const answer = await this.llmLongAnswerService.generate({
            provider: settings.provider as LlmProviderName,
            model: settings.model,
            apiKey: settings.apiKey,
            question,
            job: application.job,
            resumeHeadline: application.resumeVersion.headline,
            profileSummary: application.resumeVersion.sourceProfile.summary,
            analysisSummary:
              typeof latestAnalysis?.summary === "string" && latestAnalysis.summary.length > 0
                ? latestAnalysis.summary
                : undefined
          });

          return {
            ...buildQuestionIdentity(question),
            decision: "fill" as const,
            answer,
            source: "llm_generated" as const
          };
        } catch {
          // Fall through to the deterministic fallback for best-effort coverage.
        }
      }

      return {
        ...buildQuestionIdentity(question),
        decision: "fill" as const,
        answer: this.generateFallbackAnswer({
          question,
          job: application.job,
          resumeHeadline: application.resumeVersion.headline,
          profileSummary: application.resumeVersion.sourceProfile.summary,
          analysisSummary:
            typeof latestAnalysis?.summary === "string" && latestAnalysis.summary.length > 0
              ? latestAnalysis.summary
              : undefined
        }),
        source: "deterministic_fallback" as const
      };
    })
    );

    return {
      applicationId,
      answers
    };
  }

  private isDemoFallbackMode() {
    return process.env.JOB_ANALYSIS_MODE === "mock" && process.env.JOB_RESUME_MODE === "mock";
  }

  private isUsableProviderSettings(settings: {
    provider: string;
    model: string;
    apiKey: string;
  }) {
    return (
      supportedProviders.includes(settings.provider as (typeof supportedProviders)[number]) &&
      settings.model.trim().length > 0 &&
      settings.apiKey.trim().length > 0
    );
  }

  private assertSupportedProvider(provider: string) {
    if (!supportedProviders.includes(provider as (typeof supportedProviders)[number])) {
      throw new InternalServerErrorException(
        `Unsupported LLM provider configuration: ${provider}`
      );
    }
  }

  private generateFallbackAnswer(input: {
    question: LongAnswerQuestionInput;
    job: {
      title: string;
      company: string;
      description: string;
    };
    resumeHeadline: string;
    profileSummary: string;
    analysisSummary?: string;
  }) {
    const prompt = input.question.questionText ?? input.question.fieldLabel ?? input.question.fieldName;
    const supportingSummary =
      input.analysisSummary && input.analysisSummary.length > 0
        ? input.analysisSummary
        : input.profileSummary || `My experience is closely aligned with ${input.job.title}.`;

    return `I want to contribute to ${input.job.company} as a ${input.job.title} because ${supportingSummary} My background reflected in my ${input.resumeHeadline} resume is relevant to ${prompt.toLowerCase()}.`;
  }
}
