// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "./page-client";
import { fetchSettings, saveSettings } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  fetchSettings: vi.fn(),
  saveSettings: vi.fn()
}));

const mockedFetchSettings = vi.mocked(fetchSettings);
const mockedSaveSettings = vi.mocked(saveSettings);

const baseSettings = {
  provider: "openai" as const,
  model: "gpt-5.4",
  apiKey: "",
  isConfigured: false
};

function renderSettingsPage() {
  return render(<SettingsPage />);
}

afterEach(() => {
  cleanup();
});

describe("SettingsPage provider selector", () => {
  beforeEach(() => {
    mockedFetchSettings.mockReset();
    mockedSaveSettings.mockReset();
    mockedSaveSettings.mockResolvedValue(baseSettings);
  });

  it("renders provider as a select with OpenAI and Gemini options", async () => {
    mockedFetchSettings.mockResolvedValue(baseSettings);

    renderSettingsPage();

    const providerSelect = await screen.findByRole("combobox", { name: "Provider" });

    expect(providerSelect).not.toBeNull();
    expect(screen.getByRole("option", { name: "OpenAI" })).not.toBeNull();
    expect(screen.getByRole("option", { name: "Gemini" })).not.toBeNull();
    expect(screen.getByPlaceholderText("sk-...")).not.toBeNull();
  });

  it("updates the recommended model and api key placeholder when switching provider from the default", async () => {
    const user = userEvent.setup();

    mockedFetchSettings.mockResolvedValue(baseSettings);

    renderSettingsPage();

    const providerSelect = await screen.findByRole("combobox", { name: "Provider" });
    const modelInput = screen.getByLabelText("Model");

    expect((modelInput as HTMLInputElement).value).toBe("gpt-5.4");

    await user.selectOptions(providerSelect, "gemini");

    expect((modelInput as HTMLInputElement).value).toBe("gemini-2.5-flash");
    expect(screen.getByPlaceholderText("AIza...")).not.toBeNull();
  });

  it("keeps a custom model when switching provider after manual edits", async () => {
    const user = userEvent.setup();

    mockedFetchSettings.mockResolvedValue(baseSettings);

    renderSettingsPage();

    const providerSelect = await screen.findByRole("combobox", { name: "Provider" });
    const modelInput = screen.getByLabelText("Model");

    await user.clear(modelInput);
    await user.type(modelInput, "gpt-5.4-mini");
    await user.selectOptions(providerSelect, "gemini");

    expect((modelInput as HTMLInputElement).value).toBe("gpt-5.4-mini");
    expect(screen.getByPlaceholderText("AIza...")).not.toBeNull();
  });

  it("does not crash when hydrating an unexpected saved provider and switching to a valid one", async () => {
    const user = userEvent.setup();

    mockedFetchSettings.mockResolvedValue({
      provider: "legacy-provider",
      model: "custom-model",
      apiKey: "legacy-key",
      isConfigured: true
    } as never);

    renderSettingsPage();

    const providerSelect = await screen.findByRole("combobox", { name: "Provider" });
    const modelInput = screen.getByLabelText("Model");

    await expect(user.selectOptions(providerSelect, "gemini")).resolves.toBeUndefined();

    expect((providerSelect as HTMLSelectElement).value).toBe("gemini");
    expect((modelInput as HTMLInputElement).value).toBe("custom-model");
    expect(screen.getByPlaceholderText("AIza...")).not.toBeNull();
  });

  it("preserves save behavior with the selected provider and editable model", async () => {
    const user = userEvent.setup();

    mockedFetchSettings.mockResolvedValue(baseSettings);
    mockedSaveSettings.mockResolvedValue({
      provider: "gemini",
      model: "gemini-2.5-flash",
      apiKey: "AIza-test",
      isConfigured: true
    });

    renderSettingsPage();

    const providerSelect = await screen.findByRole("combobox", { name: "Provider" });

    await user.selectOptions(providerSelect, "gemini");
    await user.clear(screen.getByLabelText("API Key"));
    await user.type(screen.getByLabelText("API Key"), "AIza-test");
    await user.click(screen.getByRole("button", { name: "Save settings" }));

    await waitFor(() => {
      expect(mockedSaveSettings).toHaveBeenCalledWith({
        provider: "gemini",
        model: "gemini-2.5-flash",
        apiKey: "AIza-test",
        isConfigured: true
      });
    });
  });
});
