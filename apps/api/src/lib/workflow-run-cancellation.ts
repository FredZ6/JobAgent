type AbortAwareRequest = {
  aborted?: boolean;
  destroyed?: boolean;
  once(event: "aborted" | "close", listener: () => void): unknown;
};

export class WorkflowRunCancelledError extends Error {
  constructor(message = "Workflow run was cancelled") {
    super(message);
    this.name = "WorkflowRunCancelledError";
  }
}

export function buildRequestAbortSignal(request: AbortAwareRequest): AbortSignal {
  const controller = new AbortController();

  const abort = () => {
    if (!controller.signal.aborted) {
      controller.abort(new WorkflowRunCancelledError());
    }
  };

  if (request.aborted || request.destroyed) {
    abort();
    return controller.signal;
  }

  request.once("aborted", abort);
  request.once("close", () => {
    if (request.aborted || request.destroyed) {
      abort();
    }
  });

  return controller.signal;
}

export function mergeWorkflowRunCancellationSignals(...signals: Array<AbortSignal | undefined>) {
  const activeSignals = signals.filter((signal): signal is AbortSignal => Boolean(signal));

  if (activeSignals.length === 0) {
    return undefined;
  }

  if (activeSignals.length === 1) {
    return activeSignals[0];
  }

  const controller = new AbortController();

  const abort = (signal?: AbortSignal) => {
    if (!controller.signal.aborted) {
      controller.abort(signal?.reason ?? new WorkflowRunCancelledError());
    }
  };

  for (const signal of activeSignals) {
    if (signal.aborted) {
      abort(signal);
      break;
    }

    signal.addEventListener("abort", () => abort(signal), { once: true });
  }

  return controller.signal;
}

export function throwIfWorkflowRunCancelled(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new WorkflowRunCancelledError();
  }
}

export function isWorkflowRunCancelledError(error: unknown, signal?: AbortSignal) {
  if (error instanceof WorkflowRunCancelledError) {
    return true;
  }

  if (signal?.aborted) {
    return true;
  }

  return error instanceof Error && error.name === "AbortError";
}
