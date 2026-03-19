import { describe, expect, it } from "vitest";

import { resumeContentSchema, resumeVersionSchema } from "./resume";

describe("resume schemas", () => {
  it("accepts a structured resume payload", () => {
    const result = resumeContentSchema.safeParse({
      headline: "Platform Engineer",
      professionalSummary: "Builder of thoughtful systems.",
      keySkills: ["TypeScript", "Node.js"],
      experience: [
        {
          title: "Senior Engineer",
          company: "Analytical Engines",
          bullets: ["Led workflow automation", "Improved developer velocity"]
        }
      ],
      projects: [
        {
          name: "OpenClaw",
          tagline: "A job workflow copilot",
          bullets: ["Built structured analysis", "Added local-first runtime"]
        }
      ],
      changeSummary: {
        highlightedStrengths: ["Workflow design", "TypeScript systems"],
        deemphasizedItems: ["Legacy maintenance work"],
        notes: ["No new experience was added"]
      }
    });

    expect(result.success).toBe(true);
  });

  it("rejects a resume without a headline", () => {
    const result = resumeContentSchema.safeParse({
      headline: "",
      professionalSummary: "Builder of thoughtful systems.",
      keySkills: ["TypeScript"],
      experience: [],
      projects: [],
      changeSummary: {
        highlightedStrengths: [],
        deemphasizedItems: [],
        notes: []
      }
    });

    expect(result.success).toBe(false);
  });

  it("accepts a persisted resume version payload", () => {
    const result = resumeVersionSchema.safeParse({
      id: "resume_123",
      jobId: "job_123",
      sourceProfileId: "profile_123",
      status: "completed",
      headline: "Platform Engineer",
      professionalSummary: "Builder of thoughtful systems.",
      skills: ["TypeScript", "Node.js"],
      experienceSections: [
        {
          title: "Senior Engineer",
          company: "Analytical Engines",
          bullets: ["Led workflow automation"]
        }
      ],
      projectSections: [
        {
          name: "OpenClaw",
          tagline: "A job workflow copilot",
          bullets: ["Built structured analysis"]
        }
      ],
      changeSummary: {
        highlightedStrengths: ["Workflow design"],
        deemphasizedItems: [],
        notes: ["No fabricated experience"]
      },
      structuredContent: {
        headline: "Platform Engineer",
        professionalSummary: "Builder of thoughtful systems.",
        keySkills: ["TypeScript", "Node.js"],
        experience: [],
        projects: [],
        changeSummary: {
          highlightedStrengths: [],
          deemphasizedItems: [],
          notes: []
        }
      },
      errorMessage: null,
      createdAt: "2026-03-11T00:00:00.000Z",
      updatedAt: "2026-03-11T00:00:00.000Z"
    });

    expect(result.success).toBe(true);
  });
});
