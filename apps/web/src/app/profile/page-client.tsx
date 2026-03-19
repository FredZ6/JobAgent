"use client";

import React, { useMemo } from "react";
import { startTransition, useEffect, useState } from "react";

import { Field } from "../../components/field";
import { Panel } from "../../components/panel";
import { ExperienceEditor, ProjectEditor } from "../../components/structured-editors";
import { fetchProfile, saveProfile } from "../../lib/api";

type DefaultAnswerRow = {
  id: string;
  question: string;
  answer: string;
};

const defaultAnswerSuggestions = [
  "Why do you want to work here?",
  "Do you require sponsorship?",
  "What is your salary expectation?",
  "When can you start?"
];

let defaultAnswerRowId = 0;

function createDefaultAnswerRow(question = "", answer = ""): DefaultAnswerRow {
  defaultAnswerRowId += 1;
  return {
    id: `default-answer-${defaultAnswerRowId}`,
    question,
    answer
  };
}

function normalizeDefaultAnswerQuestion(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function hydrateDefaultAnswerRows(defaultAnswers: Record<string, string>) {
  return Object.entries(defaultAnswers).map(([question, answer]) => createDefaultAnswerRow(question, answer));
}

function serializeDefaultAnswerRows(rows: DefaultAnswerRow[]) {
  return rows.reduce<Record<string, string>>((record, row) => {
    const question = row.question.trim();
    const answer = row.answer.trim();

    if (question.length > 0 && answer.length > 0) {
      record[question] = answer;
    }

    return record;
  }, {});
}

function getDefaultAnswerValidation(rows: DefaultAnswerRow[]) {
  let partialRow = false;
  const normalizedQuestions = new Map<string, number>();

  for (const row of rows) {
    const question = row.question.trim();
    const answer = row.answer.trim();

    if (question.length === 0 && answer.length === 0) {
      continue;
    }

    if (question.length === 0 || answer.length === 0) {
      partialRow = true;
      continue;
    }

    const normalizedQuestion = normalizeDefaultAnswerQuestion(question);
    normalizedQuestions.set(normalizedQuestion, (normalizedQuestions.get(normalizedQuestion) ?? 0) + 1);
  }

  const duplicateQuestion = Array.from(normalizedQuestions.values()).some((count) => count > 1);

  if (duplicateQuestion) {
    return {
      isValid: false,
      message: "Questions must be unique after normalization."
    };
  }

  if (partialRow) {
    return {
      isValid: false,
      message: "Question and answer are both required."
    };
  }

  return {
    isValid: true,
    message: ""
  };
}

const initialState = {
  fullName: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  githubUrl: "",
  location: "",
  workAuthorization: "",
  summary: "",
  skills: [] as string[],
  experienceLibrary: [] as Array<{
    role: string;
    company: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>,
  projectLibrary: [] as Array<{
    name: string;
    tagline: string;
    bullets: string[];
    skills: string[];
  }>,
  defaultAnswers: {} as Record<string, string>
};

export default function ProfilePage() {
  const [form, setForm] = useState(initialState);
  const [savedForm, setSavedForm] = useState(initialState);
  const [defaultAnswerRows, setDefaultAnswerRows] = useState<DefaultAnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Enter a valid email address.";
    }

    if (form.linkedinUrl && !/^https?:\/\//.test(form.linkedinUrl)) {
      errors.linkedinUrl = "LinkedIn URL must start with http:// or https://.";
    }

    if (form.githubUrl && !/^https?:\/\//.test(form.githubUrl)) {
      errors.githubUrl = "GitHub URL must start with http:// or https://.";
    }

    return errors;
  }, [form]);

  const defaultAnswerValidation = useMemo(
    () => getDefaultAnswerValidation(defaultAnswerRows),
    [defaultAnswerRows]
  );

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const isValid = Object.keys(validationErrors).length === 0 && defaultAnswerValidation.isValid;

  function commitDefaultAnswerRows(nextRows: DefaultAnswerRow[]) {
    setDefaultAnswerRows(nextRows);
    setForm((current) => ({
      ...current,
      defaultAnswers: serializeDefaultAnswerRows(nextRows)
    }));
  }

  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await fetchProfile();
        setForm(data);
        setSavedForm(data);
        setDefaultAnswerRows(hydrateDefaultAnswerRows(data.defaultAnswers));
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function onSubmit(formData: FormData) {
    if (!isValid) {
      setError("Fix validation errors before saving the profile.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
        githubUrl: String(formData.get("githubUrl") ?? ""),
        location: String(formData.get("location") ?? ""),
        workAuthorization: String(formData.get("workAuthorization") ?? ""),
        summary: String(formData.get("summary") ?? ""),
        skills: String(formData.get("skills") ?? "")
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        experienceLibrary: form.experienceLibrary,
        projectLibrary: form.projectLibrary,
        defaultAnswers: serializeDefaultAnswerRows(defaultAnswerRows)
      };

      const saved = await saveProfile(payload);
      setForm(saved);
      setSavedForm(saved);
      setDefaultAnswerRows(hydrateDefaultAnswerRows(saved.defaultAnswers));
      setMessage("Profile saved. Future analysis runs now have fresh candidate context.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="content-grid">
      <Panel
        className="span-8"
        eyebrow="Candidate context"
        title="Profile"
        copy="Keep this honest and current. The analyzer is only as good as the context it receives."
      >
        {loading ? (
          <div className="inline-note">Loading candidate profile...</div>
        ) : (
          <form action={onSubmit} className="stack">
            <div className="analysis-grid">
              <Field
                label="Full name"
                name="fullName"
                value={form.fullName}
                onChange={(value) => setForm((current) => ({ ...current, fullName: value }))}
              />
              <Field
                label="Email"
                name="email"
                value={form.email}
                onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                error={validationErrors.email}
              />
              <Field
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
              />
              <Field
                label="Location"
                name="location"
                value={form.location}
                onChange={(value) => setForm((current) => ({ ...current, location: value }))}
              />
              <Field
                label="LinkedIn URL"
                name="linkedinUrl"
                value={form.linkedinUrl}
                onChange={(value) => setForm((current) => ({ ...current, linkedinUrl: value }))}
                error={validationErrors.linkedinUrl}
              />
              <Field
                label="GitHub URL"
                name="githubUrl"
                value={form.githubUrl}
                onChange={(value) => setForm((current) => ({ ...current, githubUrl: value }))}
                error={validationErrors.githubUrl}
              />
            </div>
            <Field
              label="Work authorization"
              name="workAuthorization"
              value={form.workAuthorization}
              onChange={(value) => setForm((current) => ({ ...current, workAuthorization: value }))}
            />
            <Field
              label="Summary"
              name="summary"
              value={form.summary}
              onChange={(value) => setForm((current) => ({ ...current, summary: value }))}
              textarea
            />
            <Field
              label="Skills"
              name="skills"
              value={form.skills.join(", ")}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  skills: value
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean)
                }))
              }
              placeholder="TypeScript, React, Prisma"
            />
            <ExperienceEditor
              value={form.experienceLibrary}
              onChange={(experienceLibrary) => setForm((current) => ({ ...current, experienceLibrary }))}
            />
            <ProjectEditor
              value={form.projectLibrary}
              onChange={(projectLibrary) => setForm((current) => ({ ...current, projectLibrary }))}
            />
            <div className="stack">
              <div className="button-row">
                <h3 className="field-label">Default answers</h3>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => commitDefaultAnswerRows([...defaultAnswerRows, createDefaultAnswerRow()])}
                >
                  Add answer
                </button>
              </div>
              <p className="field-description">
                Reuse honest answers to the questions you see again and again. High-risk questions still require a
                saved match before they will autofill.
              </p>
              {defaultAnswerRows.length === 0 ? (
                <div className="analysis-card">
                  <div className="stack">
                    <div className="inline-note">Suggested prompts</div>
                    <div className="button-row">
                      {defaultAnswerSuggestions.map((prompt) => (
                        <span key={prompt} className="status-pill">
                          {prompt}
                        </span>
                      ))}
                    </div>
                    <div className="inline-note">Add your own rows when you are ready.</div>
                  </div>
                </div>
              ) : null}
              {defaultAnswerRows.map((row) => (
                <div key={row.id} className="analysis-card">
                  <div className="analysis-grid">
                    <Field
                      label="Question"
                      name={`${row.id}-question`}
                      value={row.question}
                      onChange={(value) =>
                        commitDefaultAnswerRows(
                          defaultAnswerRows.map((currentRow) =>
                            currentRow.id === row.id ? { ...currentRow, question: value } : currentRow
                          )
                        )
                      }
                    />
                    <Field
                      label="Answer"
                      name={`${row.id}-answer`}
                      value={row.answer}
                      onChange={(value) =>
                        commitDefaultAnswerRows(
                          defaultAnswerRows.map((currentRow) =>
                            currentRow.id === row.id ? { ...currentRow, answer: value } : currentRow
                          )
                        )
                      }
                      textarea
                    />
                  </div>
                  <div className="button-row">
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() =>
                        commitDefaultAnswerRows(defaultAnswerRows.filter((currentRow) => currentRow.id !== row.id))
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {defaultAnswerValidation.message ? <div className="field-error">{defaultAnswerValidation.message}</div> : null}
            </div>
            <div className="button-row">
              <button className="button button-primary" type="submit" disabled={saving || !isDirty || !isValid}>
                {saving ? "Saving..." : "Save profile"}
              </button>
              {isDirty ? <span className="dirty-text">Unsaved changes</span> : <span className="inline-note">Saved</span>}
              {message ? <span className="success-text">{message}</span> : null}
              {error ? <span className="error-text">{error}</span> : null}
            </div>
          </form>
        )}
      </Panel>
      <Panel
        className="span-4"
        eyebrow="Ground rule"
        title="No invented experience"
        copy="This MVP is opinionated: the system should help with focus and framing, not fabricate background you do not have."
      />
    </section>
  );
}
