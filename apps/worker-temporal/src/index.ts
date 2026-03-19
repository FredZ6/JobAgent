import "reflect-metadata";

import { fileURLToPath } from "node:url";

import { NativeConnection, Worker } from "@temporalio/worker";

import * as activities from "./activities.js";

async function bootstrap() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? "temporal:7233"
  });

  const worker = await Worker.create({
    connection,
    taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? "openclaw-analysis",
    workflowsPath: fileURLToPath(new URL("./workflows.ts", import.meta.url)),
    activities
  });

  console.log(
    `worker-temporal listening on ${process.env.TEMPORAL_ADDRESS ?? "temporal:7233"} for ${
      process.env.TEMPORAL_TASK_QUEUE ?? "openclaw-analysis"
    }`
  );

  await worker.run();
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
