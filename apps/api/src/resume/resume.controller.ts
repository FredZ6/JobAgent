import { Controller, Get, Header, Inject, Param, Query, StreamableFile } from "@nestjs/common";

import { ResumePdfService, type ResumePdfTemplate } from "./resume-pdf.service.js";
import { ResumeService } from "./resume.service.js";

export function buildResumePdfStreamOptions(
  filename: string,
  disposition: "attachment" | "inline"
) {
  return {
    type: "application/pdf",
    disposition: `${disposition}; filename="${filename}"`
  };
}

export function normalizeResumePdfTemplate(template?: string): ResumePdfTemplate {
  return template === "modern" ? "modern" : "classic";
}

@Controller("resume-versions")
export class ResumeController {
  constructor(
    @Inject(ResumeService) private readonly resumeService: ResumeService,
    @Inject(ResumePdfService) private readonly resumePdfService: ResumePdfService
  ) {}

  @Get(":id")
  getResumeVersion(@Param("id") id: string) {
    return this.resumeService.getResumeVersion(id);
  }

  @Get(":id/print")
  @Header("Content-Type", "text/html; charset=utf-8")
  getPrintableResume(@Param("id") id: string, @Query("template") template?: string) {
    return this.resumePdfService.renderPrintHtml(id, normalizeResumePdfTemplate(template));
  }

  @Get(":id/pdf/inline")
  async previewPdf(@Param("id") id: string, @Query("template") template?: string) {
    const { buffer, filename } = await this.resumePdfService.renderPdf(
      id,
      normalizeResumePdfTemplate(template)
    );

    return new StreamableFile(buffer, buildResumePdfStreamOptions(filename, "inline"));
  }

  @Get(":id/pdf")
  async downloadPdf(@Param("id") id: string, @Query("template") template?: string) {
    const { buffer, filename } = await this.resumePdfService.renderPdf(
      id,
      normalizeResumePdfTemplate(template)
    );

    return new StreamableFile(buffer, buildResumePdfStreamOptions(filename, "attachment"));
  }
}
