import type { JobImportDiagnostics, JobImportSummary } from "@rolecraft/shared-types";

export function formatImportWarning(warning: string) {
  switch (warning) {
    case "apply_url_not_detected":
      return "Apply URL not detected";
    case "used_body_text_fallback":
      return "Used body text fallback";
    case "fetch_failed":
      return "Fetching the job page failed";
    case "non_200_response":
      return "The job page returned a non-200 response";
    default:
      return warning.replace(/_/g, " ");
  }
}

export function buildImportDiagnosticsRows(diagnostics?: JobImportDiagnostics) {
  if (!diagnostics) {
    return [];
  }

  return [
    diagnostics.titleSource ? { label: "Title source", value: diagnostics.titleSource } : null,
    diagnostics.companySource ? { label: "Company source", value: diagnostics.companySource } : null,
    diagnostics.descriptionSource
      ? { label: "Description source", value: diagnostics.descriptionSource }
      : null,
    diagnostics.applyUrlSource ? { label: "Apply URL source", value: diagnostics.applyUrlSource } : null,
    diagnostics.fetchStatus != null ? { label: "Fetch status", value: String(diagnostics.fetchStatus) } : null,
    diagnostics.usedJsonLd != null
      ? { label: "Used JSON-LD", value: diagnostics.usedJsonLd ? "yes" : "no" }
      : null,
    diagnostics.usedBodyFallback != null
      ? { label: "Used body fallback", value: diagnostics.usedBodyFallback ? "yes" : "no" }
      : null
  ].filter((row): row is { label: string; value: string } => row !== null);
}

export function getImportStatusLabel(importSummary?: JobImportSummary) {
  return importSummary?.statusLabel ?? null;
}
