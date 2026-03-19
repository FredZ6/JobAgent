import { z } from "zod";

export const resumeExperienceSectionSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  bullets: z.array(z.string().min(1)).default([])
});

export const resumeProjectSectionSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  bullets: z.array(z.string().min(1)).default([])
});

export const resumeChangeSummarySchema = z.object({
  highlightedStrengths: z.array(z.string().min(1)).default([]),
  deemphasizedItems: z.array(z.string().min(1)).default([]),
  notes: z.array(z.string().min(1)).default([])
});

export const resumeContentSchema = z.object({
  headline: z.string().min(1),
  professionalSummary: z.string().min(1),
  keySkills: z.array(z.string().min(1)).default([]),
  experience: z.array(resumeExperienceSectionSchema).default([]),
  projects: z.array(resumeProjectSectionSchema).default([]),
  changeSummary: resumeChangeSummarySchema
});

export const resumeVersionSchema = z.object({
  id: z.string().min(1),
  jobId: z.string().min(1),
  sourceProfileId: z.string().min(1),
  status: z.enum(["draft", "completed", "failed"]),
  headline: z.string().min(1),
  professionalSummary: z.string().min(1),
  skills: z.array(z.string().min(1)).default([]),
  experienceSections: z.array(resumeExperienceSectionSchema).default([]),
  projectSections: z.array(resumeProjectSectionSchema).default([]),
  changeSummary: resumeChangeSummarySchema,
  structuredContent: resumeContentSchema,
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type ResumeContent = z.infer<typeof resumeContentSchema>;
export type ResumeVersion = z.infer<typeof resumeVersionSchema>;
