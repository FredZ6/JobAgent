import express from "express";
import { chromium } from "playwright";
import { resolveApplicationStorageDir, resolveServicePort } from "@rolecraft/config";
import {
  buildSuggestions,
  captureScreenshot,
  fillCommonFields,
  fillLongAnswerFields,
  PrefillResponse,
  type PrefillRequest,
  uploadResume
} from "./prefill.js";

const app = express();
app.use(express.json());

const port = resolveServicePort(process.env, 4000);
const storageDir = resolveApplicationStorageDir(process.env);

type PrefillRouteRequest = {
  body: PrefillRequest;
};

type PrefillRouteResponse = {
  status(code: number): PrefillRouteResponse;
  json(body: unknown): void;
};

app.post("/prefill", async (req: PrefillRouteRequest, res: PrefillRouteResponse) => {
  const payload = req.body as PrefillRequest;

  if (!payload?.applicationId || !payload.applyUrl) {
    return res.status(400).json({ error: "applicationId and applyUrl are required" });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const log: PrefillResponse["workerLog"] = [
    { level: "info", message: "prefill started", timestamp: new Date().toISOString() }
  ];
  try {
    await page.goto(payload.applyUrl, { waitUntil: "domcontentloaded" });
    const resumeUploadResult = await uploadResume(page, {
      applicationId: payload.applicationId,
      resume: payload.resume
    });
    log.push({
      level: resumeUploadResult.filled ? "info" : resumeUploadResult.status === "failed" ? "warn" : "info",
      message: resumeUploadResult.filled
        ? `resume upload completed via ${resumeUploadResult.strategy ?? "unknown"}`
        : `resume upload ${resumeUploadResult.status ?? "unknown"}${resumeUploadResult.failureReason ? `: ${resumeUploadResult.failureReason}` : ""}`,
      timestamp: new Date().toISOString()
    });
    const basicFieldResults = await fillCommonFields(page, buildSuggestions(payload.profile));
    const longAnswerResults = await fillLongAnswerFields(page, {
      applicationId: payload.applicationId,
      resume: payload.resume
    });
    if (longAnswerResults.length > 0) {
      const successfulLongAnswers = longAnswerResults.filter((result) => result.filled).length;
      log.push({
        level: successfulLongAnswers === longAnswerResults.length ? "info" : "warn",
        message: `long-answer autofill processed ${successfulLongAnswers}/${longAnswerResults.length} fields`,
        timestamp: new Date().toISOString()
      });
    }
    const screenshotPath = await captureScreenshot(page, payload.applicationId, storageDir);

    res.json({
      status: "completed",
      formSnapshot: { url: payload.applyUrl },
      fieldResults: [resumeUploadResult, ...basicFieldResults, ...longAnswerResults],
      screenshotPaths: [screenshotPath],
      workerLog: [...log, { level: "info", message: "prefill completed", timestamp: new Date().toISOString() }],
      errorMessage: null
    });
  } catch (error) {
    log.push({ level: "error", message: (error as Error).message, timestamp: new Date().toISOString() });
    res.status(500).json({
      status: "failed",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: log,
      errorMessage: (error as Error).message
    });
  } finally {
    await browser.close();
  }
});

app.listen(port, () => {
  console.log(`worker-playwright listening on port ${port}`);
});
