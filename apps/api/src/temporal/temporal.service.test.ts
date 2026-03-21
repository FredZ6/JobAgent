import { describe, expect, it, vi, beforeEach } from "vitest";

const temporalMocks = vi.hoisted(() => {
  const signal = vi.fn();
  const getHandle = vi.fn(() => ({
    cancel: vi.fn(),
    signal
  }));
  const execute = vi.fn();
  const workflow = {
    execute,
    getHandle
  };
  const connect = vi.fn();

  return {
    signal,
    getHandle,
    execute,
    workflow,
    connect
  };
});

vi.mock("@temporalio/client", () => ({
  CancelledFailure: class CancelledFailure extends Error {},
  WorkflowFailedError: class WorkflowFailedError extends Error {
    cause?: unknown;
    constructor(message = "Workflow failed", cause?: unknown) {
      super(message);
      this.cause = cause;
    }
  },
  Connection: {
    connect: temporalMocks.connect
  },
  Client: class Client {
    workflow = temporalMocks.workflow;

    constructor() {}
  }
}));

import { TemporalService } from "./temporal.service.js";

describe("TemporalService pause/resume signaling", () => {
  beforeEach(() => {
    temporalMocks.signal.mockReset();
    temporalMocks.getHandle.mockClear();
    temporalMocks.execute.mockReset();
    temporalMocks.connect.mockResolvedValue({});
  });

  it("signals pause on an existing workflow handle", async () => {
    const service = new TemporalService({} as any);

    await (service as any).pauseWorkflow("prefill-job-job_1-123");

    expect(temporalMocks.getHandle).toHaveBeenCalledWith("prefill-job-job_1-123");
    expect(temporalMocks.signal).toHaveBeenCalledWith("pause");
  });

  it("signals resume on an existing workflow handle", async () => {
    const service = new TemporalService({} as any);

    await (service as any).resumeWorkflow("prefill-job-job_1-123");

    expect(temporalMocks.getHandle).toHaveBeenCalledWith("prefill-job-job_1-123");
    expect(temporalMocks.signal).toHaveBeenCalledWith("resume");
  });
});
