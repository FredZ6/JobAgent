import { z } from "zod";

export const experienceEntrySchema = z.object({
  role: z.string().min(1),
  company: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  bullets: z.array(z.string().min(1)).default([])
});

export const projectEntrySchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  bullets: z.array(z.string().min(1)).default([]),
  skills: z.array(z.string().min(1)).default([])
});

export const candidateProfileSchema = z.object({
  fullName: z.string(),
  email: z.union([z.string().email(), z.literal("")]),
  phone: z.string(),
  linkedinUrl: z.string().url().or(z.literal("")),
  githubUrl: z.string().url().or(z.literal("")),
  location: z.string(),
  workAuthorization: z.string(),
  summary: z.string(),
  skills: z.array(z.string().min(1)).default([]),
  experienceLibrary: z.array(experienceEntrySchema).default([]),
  projectLibrary: z.array(projectEntrySchema).default([]),
  defaultAnswers: z.record(z.string(), z.string()).default({})
});

export type CandidateProfile = z.infer<typeof candidateProfileSchema>;
export type CandidateProfileInput = CandidateProfile;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type ProjectEntry = z.infer<typeof projectEntrySchema>;
