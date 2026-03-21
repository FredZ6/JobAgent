import { Body, Controller, Get, Header, Inject, Param, Post, Query, StreamableFile } from "@nestjs/common";
import { createReadStream } from "node:fs";
import { parseOrThrow } from "../lib/zod.js";
import {
  auditActorTypeSchema,
  approvalRequestSchema,
  applicationEventTypeSchema,
  markRetryReadyRequestSchema,
  markSubmitFailedRequestSchema,
  markSubmittedRequestSchema,
  reopenSubmissionRequestSchema,
  updateUnresolvedAutomationItemRequestSchema
} from "@rolecraft/shared-types";
import { z } from "zod";

import { ApplicationsService } from "./applications.service.js";

const applicationEventsQuerySchema = z.object({
  actorType: auditActorTypeSchema.optional(),
  eventType: applicationEventTypeSchema.optional(),
  source: z.string().min(1).optional(),
  q: z.string().trim().optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

@Controller("applications")
export class ApplicationsController {
  constructor(@Inject(ApplicationsService) private readonly applicationsService: ApplicationsService) {}

  @Get()
  listApplications() {
    return this.applicationsService.listAllApplications();
  }

  @Get(":id")
  getApplication(@Param("id") id: string) {
    return this.applicationsService.getApplication(id);
  }

  @Get(":id/automation-sessions")
  listAutomationSessions(@Param("id") id: string) {
    return this.applicationsService.listAutomationSessions(id);
  }

  @Get(":id/submission-review")
  getSubmissionReview(@Param("id") id: string) {
    return this.applicationsService.getSubmissionReview(id);
  }

  @Get(":id/events")
  getApplicationEvents(@Param("id") id: string, @Query() query: unknown) {
    const filters = parseOrThrow(applicationEventsQuerySchema, query);
    return this.applicationsService.getApplicationEvents(id, filters);
  }

  @Post(":id/approval")
  updateApproval(@Param("id") id: string, @Body() body: unknown) {
    const payload = parseOrThrow(approvalRequestSchema, body);
    return this.applicationsService.updateApproval(id, payload);
  }

  @Post(":id/mark-submitted")
  markSubmitted(@Param("id") id: string, @Body() body: unknown) {
    const payload = parseOrThrow(markSubmittedRequestSchema, body);
    return this.applicationsService.markSubmitted(id, payload);
  }

  @Post(":id/mark-submit-failed")
  markSubmitFailed(@Param("id") id: string, @Body() body: unknown) {
    const payload = parseOrThrow(markSubmitFailedRequestSchema, body);
    return this.applicationsService.markSubmitFailed(id, payload);
  }

  @Post(":id/reopen-submission")
  reopenSubmission(@Param("id") id: string, @Body() body: unknown) {
    const payload = parseOrThrow(reopenSubmissionRequestSchema, body);
    return this.applicationsService.reopenSubmission(id, payload);
  }

  @Post(":id/mark-retry-ready")
  markRetryReady(@Param("id") id: string, @Body() body: unknown) {
    const payload = parseOrThrow(markRetryReadyRequestSchema, body);
    return this.applicationsService.markRetryReady(id, payload);
  }

  @Get(":id/screenshots/:name")
  @Header("Content-Type", "image/png")
  async getScreenshot(@Param("id") id: string, @Param("name") name: string) {
    const { filePath, filename } = await this.applicationsService.getScreenshotFile(id, name);

    return new StreamableFile(createReadStream(filePath), {
      disposition: `inline; filename="${filename}"`
    });
  }

  @Post(":applicationId/unresolved-items/:itemId")
  updateUnresolvedAutomationItem(
    @Param("applicationId") applicationId: string,
    @Param("itemId") itemId: string,
    @Body() body: unknown
  ) {
    const payload = parseOrThrow(updateUnresolvedAutomationItemRequestSchema, body);
    return this.applicationsService.updateUnresolvedAutomationItem(applicationId, itemId, payload);
  }
}
