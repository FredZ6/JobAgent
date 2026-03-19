import { Body, Controller, Get, Inject, Put } from "@nestjs/common";
import { llmSettingsSchema } from "@openclaw/shared-types";

import { parseOrThrow } from "../lib/zod.js";
import { SettingsService } from "./settings.service.js";

@Controller("settings/llm")
export class SettingsController {
  constructor(@Inject(SettingsService) private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  saveSettings(@Body() body: unknown) {
    const input = parseOrThrow(llmSettingsSchema, body);
    return this.settingsService.saveSettings({
      ...input,
      isConfigured: input.isConfigured ?? Boolean(input.apiKey)
    });
  }
}
