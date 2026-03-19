import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { type CandidateProfile, type JobAnalysisResult, jobAnalysisResultSchema } from "@openclaw/shared-types";
import { isWorkflowRunCancelledError } from "../lib/workflow-run-cancellation.js";

type AnalyzeInput = {
  profile: CandidateProfile;
  jobDescription: string;
  model: string;
  apiKey: string;
  signal?: AbortSignal;
};

@Injectable()
export class LlmAnalysisService {
  async analyze({ profile, jobDescription, model, apiKey, signal }: AnalyzeInput): Promise<JobAnalysisResult> {
    if (!apiKey || process.env.JOB_ANALYSIS_MODE === "mock") {
      return this.mockAnalysis(profile, jobDescription);
    }

    let response: Response;

    try {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        signal,
        body: JSON.stringify({
          model,
          instructions:
            "You analyze job descriptions against a candidate profile. Return concise, truthful structured JSON only. Do not invent experience.",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: JSON.stringify({
                    candidateProfile: profile,
                    jobDescription
                  })
                }
              ]
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "job_analysis",
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  matchScore: { type: "integer", minimum: 0, maximum: 100 },
                  summary: { type: "string" },
                  requiredSkills: {
                    type: "array",
                    items: { type: "string" }
                  },
                  missingSkills: {
                    type: "array",
                    items: { type: "string" }
                  },
                  redFlags: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["matchScore", "summary", "requiredSkills", "missingSkills", "redFlags"]
              }
            }
          }
        })
      });
    } catch (error) {
      if (isWorkflowRunCancelledError(error, signal)) {
        throw error;
      }

      throw error;
    }

    if (!response.ok) {
      throw new InternalServerErrorException("OpenAI analysis request failed");
    }

    const payload = await response.json() as { output_text?: string };
    const rawText = payload.output_text ?? "";
    const parsed = JSON.parse(rawText);
    return jobAnalysisResultSchema.parse(parsed);
  }

  private mockAnalysis(profile: CandidateProfile, jobDescription: string): JobAnalysisResult {
    const profileSkills = new Set(profile.skills.map((skill) => skill.toLowerCase()));
    const detectedSkills = ["TypeScript", "React", "Node.js", "Prisma", "Docker", "PostgreSQL"].filter((skill) =>
      jobDescription.toLowerCase().includes(skill.toLowerCase())
    );
    const missingSkills = detectedSkills.filter((skill) => !profileSkills.has(skill.toLowerCase()));
    const matchedSkills = detectedSkills.length - missingSkills.length;
    const matchScore = Math.max(35, Math.min(95, 60 + matchedSkills * 10 - missingSkills.length * 7));

    return {
      matchScore,
      summary:
        missingSkills.length === 0
          ? "Strong fit across the main technical requirements with no obvious gaps in the imported description."
          : `Promising fit overall, but the imported description suggests follow-up on ${missingSkills.join(", ")}.`,
      requiredSkills: detectedSkills.length > 0 ? detectedSkills : ["Communication", "Problem solving"],
      missingSkills,
      redFlags: jobDescription.toLowerCase().includes("senior")
        ? ["Role appears senior; validate level expectations against your profile."]
        : ["No explicit salary or level details were detected in the imported text."]
    };
  }
}
