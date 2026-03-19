import { Module } from "@nestjs/common";

import { AnalysisService } from "./analysis/analysis.service.js";
import { DirectAnalysisService } from "./analysis/direct-analysis.service.js";
import { LlmAnalysisService } from "./analysis/llm-analysis.service.js";
import { HealthController } from "./health/health.controller.js";
import { JobsController } from "./jobs/jobs.controller.js";
import { JobImporterService } from "./jobs/job-importer.service.js";
import { PrismaService } from "./lib/prisma.service.js";
import { ProfileController } from "./profile/profile.controller.js";
import { ProfileService } from "./profile/profile.service.js";
import { ResumeController } from "./resume/resume.controller.js";
import { ResumePdfService } from "./resume/resume-pdf.service.js";
import { DirectResumeService } from "./resume/direct-resume.service.js";
import { LlmResumeService } from "./resume/llm-resume.service.js";
import { ResumeService } from "./resume/resume.service.js";
import { GeminiLlmProviderService } from "./llm/gemini-llm-provider.service.js";
import { LlmGatewayService } from "./llm/llm-gateway.service.js";
import { OpenAiLlmProviderService } from "./llm/openai-llm-provider.service.js";
import { SettingsController } from "./settings/settings.controller.js";
import { SettingsService } from "./settings/settings.service.js";
import { ApplicationsController } from "./applications/applications.controller.js";
import { ApplicationsService } from "./applications/applications.service.js";
import { DashboardController } from "./dashboard/dashboard.controller.js";
import { DashboardService } from "./dashboard/dashboard.service.js";
import { InternalController } from "./internal/internal.controller.js";
import { LlmLongAnswerService } from "./internal/llm-long-answer.service.js";
import { LongAnswerService } from "./internal/long-answer.service.js";
import { TemporalService } from "./temporal/temporal.service.js";
import { WorkflowRunBulkActionsService } from "./workflow-runs/workflow-run-bulk-actions.service.js";
import { WorkflowRunCancelService } from "./workflow-runs/workflow-run-cancel.service.js";
import { DirectRunCancellationRegistryService } from "./workflow-runs/direct-run-cancellation-registry.service.js";
import { WorkflowRunRetriesService } from "./workflow-runs/workflow-run-retries.service.js";
import { WorkflowRunsController } from "./workflow-runs/workflow-runs.controller.js";
import { WorkflowRunsService } from "./workflow-runs/workflow-runs.service.js";

@Module({
  controllers: [
    HealthController,
    ProfileController,
    SettingsController,
    JobsController,
    ResumeController,
    ApplicationsController,
    DashboardController,
    InternalController,
    WorkflowRunsController
  ],
  providers: [
    PrismaService,
    ProfileService,
    SettingsService,
    JobImporterService,
    AnalysisService,
    DirectAnalysisService,
    LlmAnalysisService,
    DirectResumeService,
    ResumeService,
    ResumePdfService,
    LlmResumeService,
    OpenAiLlmProviderService,
    GeminiLlmProviderService,
    LlmGatewayService,
    LlmLongAnswerService,
    ApplicationsService,
    DashboardService,
    LongAnswerService,
    TemporalService,
    WorkflowRunsService,
    DirectRunCancellationRegistryService,
    WorkflowRunBulkActionsService,
    WorkflowRunCancelService,
    WorkflowRunRetriesService
  ]
})
export class AppModule {}
