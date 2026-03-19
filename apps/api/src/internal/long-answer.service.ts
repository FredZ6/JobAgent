import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../lib/prisma.service.js";
import { findDefaultAnswerMatch } from "../profile/profile.service.js";

type LongAnswerQuestionInput = {
  fieldName: string;
  fieldLabel?: string;
  questionText?: string;
  hints?: string[];
};

@Injectable()
export class LongAnswerService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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

    const latestAnalysis = await this.prisma.jobAnalysis.findFirst({
      where: {
        jobId: application.jobId,
        status: "completed"
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const defaultAnswers =
      application.resumeVersion.sourceProfile.defaultAnswers &&
      typeof application.resumeVersion.sourceProfile.defaultAnswers === "object"
        ? (application.resumeVersion.sourceProfile.defaultAnswers as Record<string, string>)
        : {};

    const answers = questions.map((question) => {
      const defaultAnswerMatch = findDefaultAnswerMatch(defaultAnswers, question);

      if (defaultAnswerMatch) {
        return {
          fieldName: question.fieldName,
          fieldLabel: question.fieldLabel,
          questionText: question.questionText,
          answer: defaultAnswerMatch.answer,
          source: "default_answer_match" as const
        };
      }

      return {
        fieldName: question.fieldName,
        fieldLabel: question.fieldLabel,
        questionText: question.questionText,
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
    });

    return {
      applicationId,
      answers
    };
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
