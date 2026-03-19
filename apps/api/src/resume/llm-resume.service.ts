import { Inject, Injectable } from "@nestjs/common";
import {
  type CandidateProfile,
  type JobAnalysisResult,
  type ResumeContent,
  resumeContentSchema
} from "@openclaw/shared-types";
import { isWorkflowRunCancelledError } from "../lib/workflow-run-cancellation.js";
import { LlmGatewayService } from "../llm/llm-gateway.service.js";
import { type LlmProviderName } from "../llm/llm-provider.types.js";

type GenerateInput = {
  profile: CandidateProfile;
  jobTitle: string;
  jobCompany: string;
  jobDescription: string;
  analysis: JobAnalysisResult | null;
  provider: LlmProviderName;
  model: string;
  apiKey: string;
  signal?: AbortSignal;
};

@Injectable()
export class LlmResumeService {
  constructor(@Inject(LlmGatewayService) private readonly llmGatewayService: LlmGatewayService) {}

  async generate(input: GenerateInput): Promise<ResumeContent> {
    if (!input.apiKey || process.env.JOB_RESUME_MODE === "mock") {
      return this.mockResume(input);
    }

    let responseText: string;

    try {
      responseText = await this.llmGatewayService.generateStructuredJson({
        provider: input.provider,
        model: input.model,
        apiKey: input.apiKey,
        instructions:
          "You generate a tailored resume from saved candidate facts. Never invent experience. Re-rank, rephrase, and emphasize only what exists in the provided profile.",
        promptPayload: input,
        schemaName: "resume_content",
        jsonSchema: {
          type: "object",
          additionalProperties: false,
          properties: {
            headline: { type: "string" },
            professionalSummary: { type: "string" },
            keySkills: {
              type: "array",
              items: { type: "string" }
            },
            experience: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  company: { type: "string" },
                  bullets: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["title", "company", "bullets"]
              }
            },
            projects: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  tagline: { type: "string" },
                  bullets: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["name", "tagline", "bullets"]
              }
            },
            changeSummary: {
              type: "object",
              additionalProperties: false,
              properties: {
                highlightedStrengths: { type: "array", items: { type: "string" } },
                deemphasizedItems: { type: "array", items: { type: "string" } },
                notes: { type: "array", items: { type: "string" } }
              },
              required: ["highlightedStrengths", "deemphasizedItems", "notes"]
            }
          },
          required: [
            "headline",
            "professionalSummary",
            "keySkills",
            "experience",
            "projects",
            "changeSummary"
          ]
        },
        signal: input.signal
      });
    } catch (error) {
      if (isWorkflowRunCancelledError(error, input.signal)) {
        throw error;
      }

      throw error;
    }

    return resumeContentSchema.parse(JSON.parse(responseText));
  }

  private mockResume({
    profile,
    jobTitle,
    jobCompany,
    analysis
  }: GenerateInput): ResumeContent {
    const keySkills = analysis?.requiredSkills.length
      ? analysis.requiredSkills.filter((skill) => profile.skills.includes(skill)).concat(
          profile.skills.filter((skill) => !analysis.requiredSkills.includes(skill)).slice(0, 3)
        )
      : profile.skills.slice(0, 6);

    const experience = profile.experienceLibrary.map((entry) => ({
      title: entry.role,
      company: entry.company,
      bullets: entry.bullets.slice(0, 3)
    }));

    const projects = profile.projectLibrary.map((project) => ({
      name: project.name,
      tagline: project.tagline,
      bullets: project.bullets.slice(0, 3)
    }));

    return {
      headline: `${jobTitle} candidate for ${jobCompany}`,
      professionalSummary:
        analysis?.summary ??
        `${profile.fullName} is a product-minded engineer with experience relevant to ${jobTitle}.`,
      keySkills: keySkills.filter(Boolean).slice(0, 8),
      experience,
      projects,
      changeSummary: {
        highlightedStrengths: analysis?.requiredSkills.slice(0, 3) ?? profile.skills.slice(0, 3),
        deemphasizedItems: analysis?.missingSkills ?? [],
        notes: ["Generated from saved profile facts only.", "No new experience was introduced."]
      }
    };
  }
}
