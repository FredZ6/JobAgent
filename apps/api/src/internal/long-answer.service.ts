import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { resolveAnalysisRuntime, resolveResumeRuntime } from "@rolecraft/config";

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

type LongAnswerJobFocus = {
  topResponsibilities: string[];
  topRequirements: string[];
};

type LongAnswerAnalysisContext = {
  summary?: string;
  requiredSkills: string[];
  missingSkills: string[];
  redFlags: string[];
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
const maxJobFocusItems = 3;

const responsibilityHeaderSignals = [
  "responsibilities",
  "what you will do",
  "what you'll do",
  "what youll do",
  "what the role does",
  "in this role",
  "role overview",
  "your responsibilities",
  "you will"
];

const requirementHeaderSignals = [
  "requirements",
  "qualifications",
  "what we're looking for",
  "what you bring",
  "must have",
  "must-haves",
  "preferred qualifications",
  "desired qualifications"
];

const responsibilitySignalWords = [
  "build",
  "design",
  "own",
  "lead",
  "partner",
  "ship",
  "improve",
  "maintain",
  "develop",
  "implement",
  "support",
  "drive",
  "create"
];

const requirementSignalWords = [
  "experience",
  "proficient",
  "strong",
  "knowledge",
  "familiar",
  "familiarity",
  "background",
  "ability",
  "skills",
  "understanding",
  "preferred",
  "required",
  "bonus"
];

const normalizedResponsibilityHeaderSignals = responsibilityHeaderSignals.map((signal) =>
  normalizeJobSignal(signal)
);
const normalizedRequirementHeaderSignals = requirementHeaderSignals.map((signal) =>
  normalizeJobSignal(signal)
);

function normalizeQuestionSignal(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function normalizeJobSignal(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function stripBulletPrefix(value: string) {
  return value.replace(/^\s*[-*•\u2022]+\s*/, "").trim();
}

function isShortSectionHeader(line: string) {
  const normalized = normalizeJobSignal(line);
  if (normalized.length === 0 || normalized.length > 45) {
    return false;
  }

  return (
    normalizedResponsibilityHeaderSignals.some(
      (signal) =>
        normalized === signal ||
        normalized.startsWith(`${signal} `) ||
        normalized.startsWith(`${signal}:`)
    ) ||
    normalizedRequirementHeaderSignals.some(
      (signal) =>
        normalized === signal ||
        normalized.startsWith(`${signal} `) ||
        normalized.startsWith(`${signal}:`)
    )
  );
}

function classifyJobFocusLine(line: string): "responsibilities" | "requirements" | null {
  const normalized = normalizeJobSignal(line);

  if (normalized.length === 0) {
    return null;
  }

  const responsibilityScore = responsibilitySignalWords.reduce(
    (score, signal) => score + (normalized.includes(signal) ? 1 : 0),
    0
  );
  const requirementScore = requirementSignalWords.reduce(
    (score, signal) => score + (normalized.includes(signal) ? 1 : 0),
    0
  );

  if (responsibilityScore === 0 && requirementScore === 0) {
    return null;
  }

  if (responsibilityScore === requirementScore) {
    return normalized.includes("experience") || normalized.includes("required") || normalized.includes("preferred")
      ? "requirements"
      : "responsibilities";
  }

  return responsibilityScore > requirementScore ? "responsibilities" : "requirements";
}

function hasMeaningfulJobFocusSignal(line: string) {
  const normalized = normalizeJobSignal(line);
  const combinedSignalCount = [...responsibilitySignalWords, ...requirementSignalWords].reduce(
    (score, signal) => score + (normalized.includes(signal) ? 1 : 0),
    0
  );

  return (
    combinedSignalCount >= 2 ||
    normalized.includes("responsibilities") ||
    normalized.includes("requirements") ||
    normalized.includes("qualifications")
  );
}

function looksLikeDescriptiveSentence(line: string) {
  const normalized = normalizeJobSignal(line);
  return normalized.split(" ").filter(Boolean).length >= 4;
}

function limitJobFocusLines(lines: string[]) {
  return Array.from(new Set(lines.map((line) => line.trim()).filter(Boolean))).slice(0, maxJobFocusItems);
}

function extractJobFocus(description: string): LongAnswerJobFocus {
  const topResponsibilities: string[] = [];
  const topRequirements: string[] = [];
  const lines = description
    .split(/\r?\n+/)
    .flatMap((line) => line.split(/(?<=\.)\s+/))
    .map((line) => line.trim())
    .filter(Boolean);

  let currentSection: "responsibilities" | "requirements" | null = null;
  let currentSectionCaptures = 0;

  for (const rawLine of lines) {
    const strippedLine = stripBulletPrefix(rawLine);
    const normalizedLine = normalizeJobSignal(strippedLine);

    if (isShortSectionHeader(strippedLine)) {
      currentSection = normalizedResponsibilityHeaderSignals.some(
        (signal) =>
          normalizedLine === signal ||
          normalizedLine.startsWith(`${signal} `) ||
          normalizedLine.startsWith(`${signal}:`)
      )
        ? "responsibilities"
        : "requirements";
      currentSectionCaptures = 0;
      continue;
    }

    const looksBulleted = /^\s*[-*•\u2022]/.test(rawLine) || /^\s*\d+[.)]/.test(rawLine);
    const looksLikeSectionBreak =
      isShortSectionHeader(strippedLine) ||
      (currentSectionCaptures > 0 && !looksBulleted && !hasMeaningfulJobFocusSignal(strippedLine));

    if (looksLikeSectionBreak) {
      currentSection = null;
      currentSectionCaptures = 0;
    }

    if (
      currentSection &&
      currentSectionCaptures < 3 &&
      (looksBulleted ||
        hasMeaningfulJobFocusSignal(strippedLine) ||
        (currentSectionCaptures === 0 && looksLikeDescriptiveSentence(strippedLine)))
    ) {
      if (currentSection === "responsibilities") {
        topResponsibilities.push(strippedLine);
      } else {
        topRequirements.push(strippedLine);
      }

      currentSectionCaptures += 1;
      continue;
    }

    if (!looksBulleted && !hasMeaningfulJobFocusSignal(strippedLine)) {
      continue;
    }

    const classified = classifyJobFocusLine(strippedLine);
    if (!classified) {
      continue;
    }

    if (classified === "responsibilities" && topResponsibilities.length < maxJobFocusItems) {
      topResponsibilities.push(strippedLine);
    } else if (classified === "requirements" && topRequirements.length < maxJobFocusItems) {
      topRequirements.push(strippedLine);
    }
  }

  return {
    topResponsibilities: limitJobFocusLines(topResponsibilities),
    topRequirements: limitJobFocusLines(topRequirements)
  };
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .map((entry) => entry.trim());
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

  async generateForApplication(
    applicationId: string,
    questions: LongAnswerQuestionInput[],
    signal?: AbortSignal
  ) {
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
    const jobFocus = extractJobFocus(application.job.description);
    const analysis: LongAnswerAnalysisContext = {
      summary: typeof latestAnalysis?.summary === "string" ? latestAnalysis.summary : undefined,
      requiredSkills: toStringArray(latestAnalysis?.requiredSkills),
      missingSkills: toStringArray(latestAnalysis?.missingSkills),
      redFlags: toStringArray(latestAnalysis?.redFlags)
    };

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
            jobFocus,
            resumeHeadline: application.resumeVersion.headline,
            profileSummary: application.resumeVersion.sourceProfile.summary,
            analysis,
            signal
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
          analysisSummary: analysis.summary
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
    return (
      resolveAnalysisRuntime(process.env).mode === "mock" &&
      resolveResumeRuntime(process.env).mode === "mock"
    );
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
