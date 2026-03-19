import express from "express";
import { chromium } from "playwright";
import {
  buildSuggestions,
  captureScreenshot,
  fillCommonFields,
  PrefillResponse,
  type PrefillRequest,
  uploadResume
} from "./prefill.js";

const app = express();
app.use(express.json());

const port = Number(process.env.PORT ?? 4000);
const storageDir = process.env.APPLICATION_STORAGE_DIR ?? "/app/storage/applications";

app.post("/prefill", async (req: any, res: any) => {
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
    const basicFieldResults = await fillCommonFields(page, buildSuggestions(payload.profile));
    const resumeUploadResult = await uploadResume(page, {
      applicationId: payload.applicationId,
      resume: payload.resume
    });
    const screenshotPath = await captureScreenshot(page, payload.applicationId, storageDir);

    res.json({
      status: "completed",
      formSnapshot: { url: payload.applyUrl },
      fieldResults: [...basicFieldResults, resumeUploadResult],
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
