import "reflect-metadata";

import { fileURLToPath } from "node:url";

import { NativeConnection, Worker } from "@temporalio/worker";
import { resolveTemporalRuntime } from "@rolecraft/config";

import * as activities from "./activities.js";

async function bootstrap() {
  const runtime = resolveTemporalRuntime(process.env);
  const connection = await NativeConnection.connect({
    address: runtime.address
  });

  const worker = await Worker.create({
    connection,
    taskQueue: runtime.taskQueue,
    workflowsPath: fileURLToPath(new URL("./workflows.ts", import.meta.url)),
    activities
  });

  console.log(`worker-temporal listening on ${runtime.address} for ${runtime.taskQueue}`);

  await worker.run();
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
