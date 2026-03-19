import { Injectable, InternalServerErrorException } from "@nestjs/common";
import {
  type CandidateProfile,
  type JobAnalysisResult,
  type ResumeContent,
  resumeContentSchema
} from "@openclaw/shared-types";
import { isWorkflowRunCancelledError } from "../lib/workflow-run-cancellation.js";

type GenerateInput = {
  profile: CandidateProfile;
  jobTitle: string;
  jobCompany: string;
  jobDescription: string;
  analysis: JobAnalysisResult | null;
  model: string;
  apiKey: string;
  signal?: AbortSignal;
};

@Injectable()
export class LlmResumeService {
  async generate(input: GenerateInput): Promise<ResumeContent> {
    if (!input.apiKey || process.env.JOB_RESUME_MODE === "mock") {
      return this.mockResume(input);
    }

    let response: Response;

    try {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${input.apiKey}`
        },
        signal: input.signal,
        body: JSON.stringify({
          model: input.model,
          instructions:
            "You generate a tailored resume from saved candidate facts. Never invent experience. Re-rank, rephrase, and emphasize only what exists in the provided profile.",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: JSON.stringify(input)
                }
              ]
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "resume_content",
              schema: {
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
              }
            }
          }
        })
      });
    } catch (error) {
      if (isWorkflowRunCancelledError(error, input.signal)) {
        throw error;
      }

      throw error;
    }

    if (!response.ok) {
      throw new InternalServerErrorException("OpenAI resume generation request failed");
    }

    const payload = (await response.json()) as { output_text?: string };
    return resumeContentSchema.parse(JSON.parse(payload.output_text ?? ""));
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
