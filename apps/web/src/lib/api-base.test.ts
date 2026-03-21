import { describe, expect, it } from "vitest";

import { resolveWebApiBaseUrl } from "./api-base";

describe("resolveWebApiBaseUrl", () => {
  it("prefers NEXT_PUBLIC_API_URL in browser mode", () => {
    expect(
      resolveWebApiBaseUrl(
        {
          NEXT_PUBLIC_API_URL: " https://public.example.com/ ",
          API_URL: "http://server-only.example.com"
        },
        { browser: true }
      )
    ).toBe("https://public.example.com");
  });

  it("ignores API_URL in browser mode when NEXT_PUBLIC_API_URL is unset", () => {
    expect(
      resolveWebApiBaseUrl(
        {
          API_URL: "http://server-only.example.com"
        },
        { browser: true }
      )
    ).toBe("http://localhost:3001");
  });

  it("falls back to API_URL in server mode", () => {
    expect(
      resolveWebApiBaseUrl(
        {
          API_URL: " http://server-only.example.com:3001/ "
        },
        { browser: false }
      )
    ).toBe("http://server-only.example.com:3001");
  });

  it("falls back to the default URL when neither value is set", () => {
    expect(resolveWebApiBaseUrl({}, { browser: false })).toBe("http://localhost:3001");
  });

  it("prefers NEXT_PUBLIC_API_URL over API_URL in server mode", () => {
    expect(
      resolveWebApiBaseUrl(
        {
          NEXT_PUBLIC_API_URL: "https://public.example.com/",
          API_URL: "http://server-only.example.com"
        },
        { browser: false }
      )
    ).toBe("https://public.example.com");
  });
});
