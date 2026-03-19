import { Body, Controller, Get, Inject, Put } from "@nestjs/common";
import { candidateProfileSchema } from "@openclaw/shared-types";

import { parseOrThrow } from "../lib/zod.js";
import { ProfileService } from "./profile.service.js";

@Controller("profile")
export class ProfileController {
  constructor(@Inject(ProfileService) private readonly profileService: ProfileService) {}

  @Get()
  getProfile() {
    return this.profileService.getProfile();
  }

  @Put()
  saveProfile(@Body() body: unknown) {
    const input = parseOrThrow(candidateProfileSchema, body);
    return this.profileService.saveProfile({
      ...input,
      skills: input.skills ?? [],
      experienceLibrary: (input.experienceLibrary ?? []).map((entry) => ({
        ...entry,
        bullets: entry.bullets ?? []
      })),
      projectLibrary: (input.projectLibrary ?? []).map((entry) => ({
        ...entry,
        bullets: entry.bullets ?? [],
        skills: entry.skills ?? []
      })),
      defaultAnswers: input.defaultAnswers ?? {}
    });
  }
}
