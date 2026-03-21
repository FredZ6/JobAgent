import React from "react";
import type {
  UnresolvedAutomationItem,
  UpdateUnresolvedAutomationItemRequest
} from "@rolecraft/shared-types";

export function UnresolvedAutomationItems(props: {
  items: UnresolvedAutomationItem[];
  emptyCopy: string;
  onUpdateItem?: (
    itemId: string,
    payload: UpdateUnresolvedAutomationItemRequest
  ) => Promise<UnresolvedAutomationItem>;
}) {
  const { items, emptyCopy, onUpdateItem } = props;
  const [notesById, setNotesById] = React.useState<Record<string, string>>({});
  const [pendingItemId, setPendingItemId] = React.useState<string | null>(null);
  const [errorById, setErrorById] = React.useState<Record<string, string>>({});

  if (items.length === 0) {
    return <div className="inline-note">{emptyCopy}</div>;
  }

  async function handleUpdate(
    item: UnresolvedAutomationItem,
    status: UpdateUnresolvedAutomationItemRequest["status"]
  ) {
    if (!onUpdateItem) {
      return;
    }

    const note = notesById[item.id]?.trim();

    setPendingItemId(item.id);
    setErrorById((current) => ({
      ...current,
      [item.id]: ""
    }));

    try {
      await onUpdateItem(item.id, {
        status,
        ...(note ? { note } : {})
      });
    } catch (error) {
      setErrorById((current) => ({
        ...current,
        [item.id]: error instanceof Error ? error.message : "Failed to update item"
      }));
    } finally {
      setPendingItemId((current) => (current === item.id ? null : current));
    }
  }

  return (
    <div className="stack">
      {items.map((item) => {
        const title = item.questionText || item.fieldLabel || item.fieldName;
        const noteValue = notesById[item.id] ?? "";
        const isPending = pendingItemId === item.id;
        const isActionable = item.status === "unresolved" && Boolean(onUpdateItem);
        const itemError = errorById[item.id] ?? "";

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
            {isActionable ? (
              <div className="stack">
                <label className="stack" htmlFor={`unresolved-note-${item.id}`}>
                  <span className="muted">Add note for {title}</span>
                  <input
                    id={`unresolved-note-${item.id}`}
                    className="field-input"
                    type="text"
                    aria-label={`Add note for ${title}`}
                    value={noteValue}
                    onChange={(event) =>
                      setNotesById((current) => ({
                        ...current,
                        [item.id]: event.target.value
                      }))
                    }
                    disabled={isPending}
                    placeholder="Optional note"
                  />
                </label>
                <div className="button-row">
                  <button
                    className="button button-primary"
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpdate(item, "resolved")}
                  >
                    {isPending ? "Saving..." : `Mark resolved for ${title}`}
                  </button>
                  <button
                    className="button button-secondary"
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpdate(item, "ignored")}
                  >
                    {isPending ? "Saving..." : `Ignore for ${title}`}
                  </button>
                </div>
                {itemError ? <p className="error-text">{itemError}</p> : null}
              </div>
            ) : null}
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
