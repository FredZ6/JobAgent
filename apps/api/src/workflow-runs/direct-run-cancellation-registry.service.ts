import { Injectable } from "@nestjs/common";

import { WorkflowRunCancelledError } from "../lib/workflow-run-cancellation.js";

@Injectable()
export class DirectRunCancellationRegistryService {
  private readonly controllers = new Map<string, AbortController>();

  register(runId: string) {
    const existing = this.controllers.get(runId);
    if (existing) {
      return existing.signal;
    }

    const controller = new AbortController();
    this.controllers.set(runId, controller);
    return controller.signal;
  }

  has(runId: string) {
    return this.controllers.has(runId);
  }

  cancel(runId: string) {
    const controller = this.controllers.get(runId);
    if (!controller) {
      return false;
    }

    if (!controller.signal.aborted) {
      controller.abort(new WorkflowRunCancelledError());
    }

    return true;
  }

  cleanup(runId: string) {
    this.controllers.delete(runId);
  }
}
