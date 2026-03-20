import { describe, expect, it } from "vitest";

import { candidateProfileSchema } from "./profile";

describe("candidateProfileSchema", () => {
  it("accepts a valid profile payload", () => {
    const result = candidateProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-123-4567",
      linkedinUrl: "https://linkedin.com/in/ada",
      githubUrl: "https://github.com/ada",
      location: "Winnipeg, MB",
      workAuthorization: "Open work permit",
      summary: "Full-stack engineer with product sense.",
      skills: ["TypeScript", "React"],
      experienceLibrary: [
        {
          role: "Senior Engineer",
          company: "Analytical Engines",
          startDate: "2022-01",
          endDate: "Present",
          bullets: ["Led workflow automation", "Shipped internal tools"]
        }
      ],
      projectLibrary: [
        {
          name: "Rolecraft",
          tagline: "Human-in-the-loop automation",
          bullets: ["Built core workflow", "Integrated structured AI output"],
          skills: ["TypeScript", "Prisma"]
        }
      ],
      defaultAnswers: {
        salary: "Negotiable"
      }
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = candidateProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "bad-email",
      phone: "555-123-4567",
      linkedinUrl: "",
      githubUrl: "",
      location: "Winnipeg, MB",
      workAuthorization: "Open work permit",
      summary: "Full-stack engineer with product sense.",
      skills: [],
      experienceLibrary: [],
      projectLibrary: [],
      defaultAnswers: {}
    });

    expect(result.success).toBe(false);
  });
});
