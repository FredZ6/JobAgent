export function extractApiErrorMessage(body: string, status: number) {
  const trimmed = body.trim();

  if (!trimmed) {
    return `Request failed with ${status}`;
  }

  try {
    const parsed = JSON.parse(trimmed) as { message?: unknown };

    if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return parsed.message;
    }
  } catch {
    // Ignore parse failures and fall back to the raw body text.
  }

  return trimmed;
}
