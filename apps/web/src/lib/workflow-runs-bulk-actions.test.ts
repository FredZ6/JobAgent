import { describe, expect, it } from "vitest";

import type { WorkflowRunListItem } from "@openclaw/shared-types";

import {
  buildSelectedJobTargets,
  buildSelectedRunDetailTargets
} from "./workflow-runs-bulk-actions";

function buildListItem(id: string, jobId: string): WorkflowRunListItem {
  return {
    workflowRun: {
      id,
      jobId,
      retryOfRunId: null,
      applicationId: null,
      resumeVersionId: null,
      kind: "analyze",
      status: "completed",
      executionMode: "direct",
      workflowId: null,
      workflowType: null,
      taskQueue: null,
      startedAt: "2026-03-18T10:00:00.000Z",
      completedAt: "2026-03-18T10:01:00.000Z",
      errorMessage: null,
      createdAt: "2026-03-18T10:00:00.000Z",
      updatedAt: "2026-03-18T10:01:00.000Z"
    },
    job: {
      id: jobId,
      title: `Job ${jobId}`,
      company: "Example Co"
    },
    application: null,
    resumeVersion: null
  };
}

describe("workflow-runs-bulk-actions helpers", () => {
  it("builds selected run-detail targets", () => {
    expect(buildSelectedRunDetailTargets(["run_1", "run_2"])).toEqual({
      urls: ["/workflow-runs/run_1", "/workflow-runs/run_2"],
      error: null
    });
  });

  it("deduplicates selected job targets", () => {
    expect(
      buildSelectedJobTargets(
        [buildListItem("run_1", "job_1"), buildListItem("run_2", "job_1"), buildListItem("run_3", "job_2")],
        ["run_1", "run_2", "run_3"]
      )
    ).toEqual({
      urls: ["/jobs/job_1", "/jobs/job_2"],
      error: null
    });
  });

  it("rejects opening more than five run details at once", () => {
    expect(
      buildSelectedRunDetailTargets(["run_1", "run_2", "run_3", "run_4", "run_5", "run_6"])
    ).toEqual({
      urls: [],
      error: "Select 5 runs or fewer to open details at once."
    });
  });

  it("rejects opening more than five jobs at once", () => {
    expect(
      buildSelectedJobTargets(
        [
          buildListItem("run_1", "job_1"),
          buildListItem("run_2", "job_2"),
          buildListItem("run_3", "job_3"),
          buildListItem("run_4", "job_4"),
          buildListItem("run_5", "job_5"),
          buildListItem("run_6", "job_6")
        ],
        ["run_1", "run_2", "run_3", "run_4", "run_5", "run_6"]
      )
    ).toEqual({
      urls: [],
      error: "Select 5 jobs or fewer to open at once."
    });
  });
});
