import { ashbyImporterAdapter } from "./ashby-importer.js";
import { greenhouseImporterAdapter } from "./greenhouse-importer.js";
import { leverImporterAdapter } from "./lever-importer.js";

export type JobImportAdapterResult = {
  title: string;
  company: string;
  location: string;
  description: string;
  applyUrl: string;
  warnings: string[];
  diagnostics: Record<string, unknown>;
};

export type JobImportAdapterAttempt = {
  matched: boolean;
  result: JobImportAdapterResult | null;
  warnings: string[];
  diagnostics: Record<string, unknown>;
};

export type JobImporterAdapter = {
  name: "greenhouse" | "lever" | "ashby";
  matches: (sourceUrl: string, html?: string) => boolean;
  extract: (html: string, sourceUrl: string) => JobImportAdapterAttempt;
};

export const jobImporterAdapters: JobImporterAdapter[] = [
  greenhouseImporterAdapter,
  leverImporterAdapter,
  ashbyImporterAdapter
];
