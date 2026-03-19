import type { ApplicationDto } from "@openclaw/shared-types";

type FieldResultLike = ApplicationDto["fieldResults"][number];

export type FieldResultState = "filled" | "failed" | "unresolved";
export type FieldResultGroupKey = "resume_upload" | "long_text" | "basic_text" | "other";

export type FieldResultGroup = {
  key: FieldResultGroupKey;
  title: string;
  items: FieldResultLike[];
};

const groupOrder: FieldResultGroupKey[] = ["resume_upload", "long_text", "basic_text", "other"];

function humanizeFieldName(fieldName: string) {
  return fieldName
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getFieldResultState(field: FieldResultLike): FieldResultState {
  if (field.status === "filled" || field.filled) {
    return "filled";
  }

  if (field.status === "failed" || field.failureReason) {
    return "failed";
  }

  return "unresolved";
}

export function getFieldResultStatusLabel(field: FieldResultLike) {
  if (field.status) {
    return field.status.replace(/_/g, " ");
  }

  return getFieldResultState(field);
}

export function getFieldResultDisplayName(field: FieldResultLike) {
  return field.fieldLabel ?? field.questionText ?? humanizeFieldName(field.fieldName);
}

export function getFieldResultValueLabel(field: FieldResultLike) {
  if (field.fieldType === "resume_upload") {
    return "File";
  }

  if (field.fieldType === "long_text") {
    return "Answer";
  }

  return "Suggested value";
}

export function summarizeFieldResults(fields: FieldResultLike[]) {
  return fields.reduce(
    (summary, field) => {
      const state = getFieldResultState(field);

      if (state === "filled") {
        summary.filled += 1;
      } else if (state === "failed") {
        summary.failed += 1;
      } else {
        summary.unresolved += 1;
      }

      return summary;
    },
    { filled: 0, failed: 0, unresolved: 0 }
  );
}

export function groupFieldResults(fields: FieldResultLike[]): FieldResultGroup[] {
  const grouped = new Map<FieldResultGroupKey, FieldResultLike[]>();

  for (const field of fields) {
    const key = (field.fieldType ?? "other") as FieldResultGroupKey;
    const resolvedKey = groupOrder.includes(key) ? key : "other";
    const existing = grouped.get(resolvedKey) ?? [];
    existing.push(field);
    grouped.set(resolvedKey, existing);
  }

  return groupOrder
    .map((key) => ({
      key,
      title:
        key === "resume_upload"
          ? "Resume upload"
          : key === "long_text"
            ? "Long answers"
            : key === "basic_text"
              ? "Basic fields"
              : "Other fields",
      items: grouped.get(key) ?? []
    }))
    .filter((group) => group.items.length > 0);
}
