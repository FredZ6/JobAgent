import { PropsWithChildren } from "react";

type PanelProps = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  copy?: string;
  className?: string;
}>;

export function Panel({ eyebrow, title, copy, className, children }: PanelProps) {
  return (
    <section className={`panel ${className ?? ""}`.trim()}>
      <div className="panel-inner">
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        {title ? <h2 className="panel-title">{title}</h2> : null}
        {copy ? <p className="panel-copy">{copy}</p> : null}
        <div className="stack" style={{ marginTop: title || copy ? 18 : 0 }}>
          {children}
        </div>
      </div>
    </section>
  );
}
