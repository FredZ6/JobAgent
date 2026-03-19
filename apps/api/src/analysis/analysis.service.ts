import { Inject, Injectable } from "@nestjs/common";
import type { OrchestrationMetadata } from "@openclaw/shared-types";

import { TemporalService } from "../temporal/temporal.service.js";
import { DirectAnalysisService } from "./direct-analysis.service.js";

@Injectable()
export class AnalysisService {
  constructor(
    @Inject(DirectAnalysisService) private readonly directAnalysisService: DirectAnalysisService,
    @Inject(TemporalService) private readonly temporalService: TemporalService
  ) {}

  async analyzeJob(jobId: string) {
    if (process.env.TEMPORAL_ENABLED === "true") {
      return this.temporalService.executeAnalyzeJobWorkflow(jobId);
    }

    return this.directAnalysisService.analyzeJob(jobId, {
      executionMode: "direct"
    } satisfies OrchestrationMetadata);
  }
}
