import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingProfile = await prisma.candidateProfile.findFirst();
  if (!existingProfile) {
    await prisma.candidateProfile.create({
      data: {
        fullName: "Demo Candidate",
        email: "demo@example.com",
        phone: "555-0100",
        linkedinUrl: "https://linkedin.com/in/demo-candidate",
        githubUrl: "https://github.com/demo-candidate",
        location: "Winnipeg, MB",
        workAuthorization: "Open to work in Canada",
        summary: "Product-minded engineer focused on thoughtful internal tools.",
        skills: ["TypeScript", "React", "Node.js"],
        experienceLibrary: [
          {
            role: "Senior Full-Stack Engineer",
            company: "North Star Labs",
            startDate: "2022-01",
            endDate: "Present",
            bullets: [
              "Built internal workflow automation for recruiting and operations teams.",
              "Shipped TypeScript and React tools that reduced manual coordination overhead."
            ]
          }
        ],
        projectLibrary: [
          {
            name: "Rolecraft",
            tagline: "Human-in-the-loop workflow automation",
            bullets: [
              "Designed a local-first monorepo for AI-assisted job workflows.",
              "Integrated structured analysis and review-focused UX patterns."
            ],
            skills: ["TypeScript", "Next.js", "NestJS", "Prisma"]
          }
        ],
        defaultAnswers: {}
      }
    });
  }

  const existingSetting = await prisma.llmSetting.findFirst();
  if (!existingSetting) {
    await prisma.llmSetting.create({
      data: {
        provider: "openai",
        model: "gpt-5.4",
        apiKey: "",
        isConfigured: false
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
