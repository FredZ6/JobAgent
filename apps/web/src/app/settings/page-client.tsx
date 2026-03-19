"use client";

import React, { useMemo } from "react";
import { startTransition, useEffect, useState } from "react";

import { Field } from "../../components/field";
import { Panel } from "../../components/panel";
import { fetchSettings, saveSettings } from "../../lib/api";

const providerDefaults = {
  openai: {
    model: "gpt-5.4",
    apiKeyPlaceholder: "sk-..."
  },
  gemini: {
    model: "gemini-2.5-flash",
    apiKeyPlaceholder: "AIza..."
  }
} as const;

type Provider = keyof typeof providerDefaults;

const initialState = {
  provider: "openai",
  model: "gpt-5.4",
  apiKey: "",
  isConfigured: false
};

export default function SettingsPage() {
  const [form, setForm] = useState(initialState);
  const [savedForm, setSavedForm] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!form.provider.trim()) {
      errors.provider = "Provider is required.";
    }
    if (!form.model.trim()) {
      errors.model = "Model is required.";
    }
    return errors;
  }, [form.model, form.provider]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const isValid = Object.keys(validationErrors).length === 0;
  const apiKeyPlaceholder = providerDefaults[form.provider as Provider]?.apiKeyPlaceholder ?? "sk-...";

  function handleProviderChange(nextProviderValue: string) {
    const nextProvider = nextProviderValue as Provider;

    setForm((current) => {
      const previousProvider = current.provider as Provider;
      const shouldSwapModel = current.model === providerDefaults[previousProvider].model;

      return {
        ...current,
        provider: nextProvider,
        model: shouldSwapModel ? providerDefaults[nextProvider].model : current.model
      };
    });
  }

  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await fetchSettings();
        setForm(data);
        setSavedForm(data);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function onSubmit(formData: FormData) {
    if (!isValid) {
      setError("Fix validation errors before saving settings.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        provider: String(formData.get("provider") ?? "") as Provider,
        model: String(formData.get("model") ?? ""),
        apiKey: String(formData.get("apiKey") ?? ""),
        isConfigured: true
      };
      const saved = await saveSettings(payload);
      setForm(saved);
      setSavedForm(saved);
      setMessage("Settings saved. The analyzer will use this configuration.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="content-grid">
      <Panel
        className="span-7"
        eyebrow="LLM configuration"
        title="Settings"
        copy="Keep the first round narrow: one provider, one model, one credential path."
      >
        {loading ? (
          <div className="inline-note">Loading current settings...</div>
        ) : (
          <form action={onSubmit} className="stack">
            <Field
              label="Provider"
              name="provider"
              value={form.provider}
              onChange={handleProviderChange}
              select
              options={[
                { value: "openai", label: "OpenAI" },
                { value: "gemini", label: "Gemini" }
              ]}
              error={validationErrors.provider}
            />
            <Field
              label="Model"
              name="model"
              value={form.model}
              onChange={(value) => setForm((current) => ({ ...current, model: value }))}
              placeholder="gpt-5.4"
              error={validationErrors.model}
            />
            <Field
              label="API Key"
              name="apiKey"
              value={form.apiKey}
              onChange={(value) => setForm((current) => ({ ...current, apiKey: value }))}
              placeholder={apiKeyPlaceholder}
            />
            <div className="button-row">
              <button className="button button-primary" type="submit" disabled={saving || !isDirty || !isValid}>
                {saving ? "Saving..." : "Save settings"}
              </button>
              {isDirty ? <span className="dirty-text">Unsaved changes</span> : <span className="inline-note">Saved</span>}
              {message ? <span className="success-text">{message}</span> : null}
              {error ? <span className="error-text">{error}</span> : null}
            </div>
          </form>
        )}
      </Panel>
      <Panel
        className="span-5"
        eyebrow="Why this matters"
        title="First-run checklist"
        copy="For round one, success is not about provider orchestration. It is about one reliable path from job import to structured analysis."
      >
        <div className="pill-row">
          <span className="mini-pill">single provider</span>
          <span className="mini-pill">manual analyze trigger</span>
          <span className="mini-pill">human-in-the-loop</span>
        </div>
      </Panel>
    </section>
  );
}
