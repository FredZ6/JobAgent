import { Controller, Get, Inject, Query } from "@nestjs/common";
import { parseOrThrow } from "../lib/zod.js";
import { z } from "zod";
import { auditActorTypeSchema } from "@openclaw/shared-types";

import { DashboardService } from "./dashboard.service.js";

const dashboardTimelineQuerySchema = z.object({
  actorType: auditActorTypeSchema.optional(),
  entityType: z.enum(["job", "application"]).optional(),
  eventType: z
    .enum([
      "job_imported",
      "analysis_completed",
      "resume_generated",
      "prefill_run",
      "approval_updated",
      "submission_marked",
      "submission_failed",
      "submission_reopened",
      "submission_retry_ready"
    ])
    .optional(),
  source: z.string().min(1).optional(),
  q: z.string().trim().optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

@Controller("dashboard")
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboardService: DashboardService) {}

  @Get("overview")
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get("timeline")
  getTimeline(@Query() query: unknown) {
    const filters = parseOrThrow(dashboardTimelineQuerySchema, query);
    return this.dashboardService.getTimeline(filters);
  }

  @Get("history")
  getHistory() {
    return this.dashboardService.getHistory();
  }
}
