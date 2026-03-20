import { describe, it } from "vitest";

const happyPathSteps = [
  "PUT /profile",
  "PUT /settings/llm",
  "POST /jobs/import-by-url",
  "POST /jobs/:id/analyze",
  "POST /jobs/:id/generate-resume",
  "POST /jobs/:id/prefill",
  "GET /applications/:id"
] as const;

describe("runtime happy path API", () => {
  it.skipIf(!process.env.RUN_RUNTIME_HAPPY_PATH)(
    "documents the main product loop from profile setup through Application Review",
    async () => {
      for (const step of happyPathSteps) {
        void step;
      }

      throw new Error("Happy-path runtime harness is not implemented yet");
    }
  );
});
