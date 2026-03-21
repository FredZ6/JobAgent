import React from "react";
import type { UnresolvedAutomationItem } from "@rolecraft/shared-types";

export function UnresolvedAutomationItems(props: {
  items: UnresolvedAutomationItem[];
  emptyCopy: string;
}) {
  const { items, emptyCopy } = props;

  if (items.length === 0) {
    return <div className="inline-note">{emptyCopy}</div>;
  }

  return (
    <div className="stack">
      {items.map((item) => {
        const title = item.questionText || item.fieldLabel || item.fieldName;

        return (
          <div key={item.id} className="application-field">
            <div className="field-result-row">
              <strong>{title}</strong>
              <div className="pill-row">
                <span className="mini-pill">{item.fieldType}</span>
                <span className="mini-pill">{item.status}</span>
                {item.source ? <span className="mini-pill">{item.source}</span> : null}
              </div>
            </div>
            {item.questionText && item.questionText !== title ? (
              <p className="muted">Question: {item.questionText}</p>
            ) : null}
            {item.suggestedValue ? (
              <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
                {item.suggestedValue}
              </p>
            ) : null}
            {item.failureReason ? (
              <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
                {item.failureReason}
              </p>
            ) : (
              <p className="muted">This item still needs manual follow-up.</p>
            )}
            <p className="muted">
              Raised {new Date(item.createdAt).toLocaleString()}
              {item.resolvedAt ? ` · Resolved ${new Date(item.resolvedAt).toLocaleString()}` : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}
