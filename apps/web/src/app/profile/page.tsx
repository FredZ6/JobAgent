"use client";

import { useMemo } from "react";
import { startTransition, useEffect, useState } from "react";

import { Field } from "../../components/field";
import { Panel } from "../../components/panel";
import { ExperienceEditor, ProjectEditor } from "../../components/structured-editors";
import { fetchProfile, saveProfile } from "../../lib/api";

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

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const isValid = Object.keys(validationErrors).length === 0;

  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await fetchProfile();
        setForm(data);
        setSavedForm(data);
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
        defaultAnswers: form.defaultAnswers
      };

      const saved = await saveProfile(payload);
      setForm(saved);
      setSavedForm(saved);
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
