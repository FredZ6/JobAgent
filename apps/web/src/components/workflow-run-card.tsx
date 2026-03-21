import Link from "next/link";
import React from "react";
import type { ReactNode } from "react";

import type { WorkflowRun } from "@rolecraft/shared-types";

import { getWorkflowRunStatusCopy } from "../lib/workflow-run-status";

type WorkflowRunCardLink = {
  href: string;
  label: string;
};

type WorkflowRunCardProps = {
  run: WorkflowRun;
  title?: string;
  subtitle?: string;
  className?: string;
  leadingControl?: ReactNode;
  links?: WorkflowRunCardLink[];
  actions?: ReactNode;
};

export function WorkflowRunCard({
  run,
  title,
  subtitle,
  className,
  leadingControl,
  links = [],
  actions
}: WorkflowRunCardProps) {
  const statusCopy = getWorkflowRunStatusCopy(run);
  const statusNote =
    run.executionMode === "temporal" && run.status === "running"
      ? "Stops the run at the next safe cancellation point."
      : run.executionMode === "direct" && run.status === "running"
        ? "Stops the run at the next safe cancellation point in this API process."
        : null;

  return (
    <div className={`job-card workflow-run-card ${className ?? ""}`.trim()}>
      {leadingControl}
      <div className="pill-row">
        <span className="mini-pill">
          {run.kind === "generate_resume" ? "resume" : run.kind.replace(/_/g, " ")}
        </span>
        <span className="mini-pill">{statusCopy.label}</span>
        <span className="mini-pill">{run.executionMode}</span>
      </div>
      {title ? (
        <div className="workflow-run-heading">
          <h3>{title}</h3>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
      ) : null}
      <div className="workflow-run-body">
        <p className="muted workflow-run-summary">{statusCopy.detail}</p>
        <div className="workflow-run-meta">
          <p className="muted">
            Started {run.startedAt ? new Date(run.startedAt).toLocaleString() : "not started yet"}
            {run.completedAt ? ` · Completed ${new Date(run.completedAt).toLocaleString()}` : ""}
          </p>
          <p className="muted">
            {run.workflowType ? `${run.workflowType} · ` : ""}
            {run.taskQueue ? `queue ${run.taskQueue} · ` : ""}
            {run.workflowId ? `workflow ${run.workflowId}` : "direct execution"}
          </p>
          {run.retryOfRunId ? <p className="muted">Retry of {run.retryOfRunId}</p> : null}
          {statusNote ? <div className="inline-note">{statusNote}</div> : null}
        </div>
      </div>
      {links.length > 0 || actions ? (
        <div className="workflow-run-actions">
          {links.map((link) => (
            <Link
              key={`${run.id}-${link.href}-${link.label}`}
              className="button button-secondary"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
          {actions}
        </div>
      ) : null}
    </div>
  );
}
