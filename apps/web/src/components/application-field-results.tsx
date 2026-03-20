import React from "react";
import type { ApplicationDto } from "@openclaw/shared-types";

import {
  getFieldResultDisplayName,
  getFieldResultState,
  getFieldResultStatusLabel,
  getFieldResultValueLabel,
  groupFieldResults,
  summarizeFieldResults
} from "../lib/field-results";

type FieldResult = ApplicationDto["fieldResults"][number];

export function ApplicationFieldResults(props: {
  results: FieldResult[];
  emptyCopy: string;
  summaryTitle?: string;
}) {
  const { results, emptyCopy, summaryTitle = "Automation summary" } = props;

  if (results.length === 0) {
    return <div className="inline-note">{emptyCopy}</div>;
  }

  const summary = summarizeFieldResults(results);
  const groups = groupFieldResults(results);

  return (
    <div className="stack">
      <div className="stack">
        <strong>{summaryTitle}</strong>
        <div className="field-grid">
          <div className="application-field">
            <div className="field-result-row">
              <strong>Filled</strong>
              <span className="mini-pill">{summary.filled}</span>
            </div>
          </div>
          <div className="application-field">
            <div className="field-result-row">
              <strong>Failed</strong>
              <span className="mini-pill">{summary.failed}</span>
            </div>
          </div>
          <div className="application-field">
            <div className="field-result-row">
              <strong>Unresolved</strong>
              <span className="mini-pill">{summary.unresolved}</span>
            </div>
          </div>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.key} className="stack">
          <div className="field-result-row">
            <strong>{group.title}</strong>
            <span className="mini-pill">{group.items.length}</span>
          </div>
          {group.items.map((result, index) => {
            const displayName = getFieldResultDisplayName(result);
            const valueLabel = getFieldResultValueLabel(result);
            const state = getFieldResultState(result);
            const attemptedStrategies = Array.isArray(result.metadata?.attemptedStrategies)
              ? result.metadata.attemptedStrategies.join(", ")
              : null;

            return (
              <div key={`${group.key}-${result.fieldName}-${index}`} className="application-field">
                <div className="field-result-row">
                  <strong>{displayName}</strong>
                  <div className="pill-row">
                    <span className="mini-pill">{getFieldResultStatusLabel(result)}</span>
                    {result.strategy ? <span className="mini-pill">{result.strategy}</span> : null}
                    {result.source ? <span className="mini-pill">{result.source}</span> : null}
                    {result.fieldType ? <span className="mini-pill">{result.fieldType}</span> : null}
                  </div>
                </div>
                {result.questionText && result.questionText !== displayName ? (
                  <p className="muted">Question: {result.questionText}</p>
                ) : null}
                <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
                  {valueLabel}: {result.suggestedValue && result.suggestedValue.length > 0 ? result.suggestedValue : "not provided"}
                </p>
                {attemptedStrategies ? <p className="muted">Attempted: {attemptedStrategies}</p> : null}
                {result.failureReason ? (
                  <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
                    Reason: {result.failureReason}
                  </p>
                ) : null}
                {!result.failureReason && state === "unresolved" ? (
                  <p className="muted">The worker identified this field but did not complete it.</p>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
