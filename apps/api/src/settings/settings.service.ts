import { Inject, Injectable } from "@nestjs/common";
import { llmSettingsSchema, type LlmSettingsInput } from "@openclaw/shared-types";

import { PrismaService } from "../lib/prisma.service.js";

@Injectable()
export class SettingsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getSettings() {
    const settings = await this.prisma.llmSetting.findFirst({
      orderBy: {
        createdAt: "asc"
      }
    });

    if (settings) {
      return settings;
    }

    return llmSettingsSchema.parse({
      provider: "openai",
      model: "gpt-5.4",
      apiKey: "",
      isConfigured: false
    });
  }

  async saveSettings(input: LlmSettingsInput) {
    const existing = await this.prisma.llmSetting.findFirst({
      orderBy: {
        createdAt: "asc"
      }
    });

    if (existing) {
      return this.prisma.llmSetting.update({
        where: { id: existing.id },
        data: {
          ...input,
          isConfigured: Boolean(input.apiKey)
        }
      });
    }

    return this.prisma.llmSetting.create({
      data: {
        ...input,
        isConfigured: Boolean(input.apiKey)
      }
    });
  }
}
