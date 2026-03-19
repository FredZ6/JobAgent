import { Inject, Injectable } from "@nestjs/common";
import { candidateProfileSchema, type CandidateProfileInput } from "@openclaw/shared-types";

import { PrismaService } from "../lib/prisma.service.js";

@Injectable()
export class ProfileService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getProfile() {
    const profile = await this.prisma.candidateProfile.findFirst({
      orderBy: {
        createdAt: "asc"
      }
    });

    if (profile) {
      return {
        ...profile,
        skills: profile.skills as string[],
        experienceLibrary: profile.experienceLibrary as CandidateProfileInput["experienceLibrary"],
        projectLibrary: profile.projectLibrary as CandidateProfileInput["projectLibrary"],
        defaultAnswers: profile.defaultAnswers as Record<string, string>
      };
    }

    return candidateProfileSchema.parse({
      fullName: "",
      email: "",
      phone: "",
      linkedinUrl: "",
      githubUrl: "",
      location: "",
      workAuthorization: "",
      summary: "",
      skills: [],
      experienceLibrary: [],
      projectLibrary: [],
      defaultAnswers: {}
    });
  }

  async saveProfile(input: CandidateProfileInput) {
    const existing = await this.prisma.candidateProfile.findFirst({
      orderBy: {
        createdAt: "asc"
      }
    });

    if (existing) {
      const profile = await this.prisma.candidateProfile.update({
        where: { id: existing.id },
        data: {
          ...input,
          skills: input.skills,
          experienceLibrary: input.experienceLibrary,
          projectLibrary: input.projectLibrary,
          defaultAnswers: input.defaultAnswers
        }
      });

      return {
        ...profile,
        skills: profile.skills as string[],
        experienceLibrary: profile.experienceLibrary as CandidateProfileInput["experienceLibrary"],
        projectLibrary: profile.projectLibrary as CandidateProfileInput["projectLibrary"],
        defaultAnswers: profile.defaultAnswers as Record<string, string>
      };
    }

    const profile = await this.prisma.candidateProfile.create({
      data: {
        ...input,
        skills: input.skills,
        experienceLibrary: input.experienceLibrary,
        projectLibrary: input.projectLibrary,
        defaultAnswers: input.defaultAnswers
      }
    });

    return {
      ...profile,
      skills: profile.skills as string[],
      experienceLibrary: profile.experienceLibrary as CandidateProfileInput["experienceLibrary"],
      projectLibrary: profile.projectLibrary as CandidateProfileInput["projectLibrary"],
      defaultAnswers: profile.defaultAnswers as Record<string, string>
    };
  }
}
