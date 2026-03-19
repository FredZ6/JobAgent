// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "./page-client";
import { fetchProfile, saveProfile } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  fetchProfile: vi.fn(),
  saveProfile: vi.fn()
}));

vi.mock("../../components/panel", () => ({
  Panel: ({
    eyebrow,
    title,
    copy,
    children
  }: {
    eyebrow?: string;
    title?: string;
    copy?: string;
    children: React.ReactNode;
  }) => (
    <section>
      {eyebrow ? <div>{eyebrow}</div> : null}
      {title ? <h2>{title}</h2> : null}
      {copy ? <p>{copy}</p> : null}
      {children}
    </section>
  )
}));

vi.mock("../../components/field", () => ({
  Field: ({
    label,
    name,
    value,
    onChange,
    textarea = false,
    placeholder,
    error,
    description
  }: {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    textarea?: boolean;
    placeholder?: string;
    error?: string;
    description?: string;
  }) => (
    <label>
      <span>{label}</span>
      {description ? <span>{description}</span> : null}
      {textarea ? (
        <textarea name={name} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input name={name} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
      {error ? <span>{error}</span> : null}
    </label>
  )
}));

vi.mock("../../components/structured-editors", () => ({
  ExperienceEditor: () => <div>Experience editor</div>,
  ProjectEditor: () => <div>Project editor</div>
}));

const mockedFetchProfile = vi.mocked(fetchProfile);
const mockedSaveProfile = vi.mocked(saveProfile);

const baseProfile = {
  fullName: "Demo Candidate",
  email: "demo@example.com",
  phone: "555-0100",
  linkedinUrl: "https://linkedin.com/in/demo-candidate",
  githubUrl: "https://github.com/demo-candidate",
  location: "Winnipeg, MB",
  workAuthorization: "Open to work in Canada",
  summary: "Product-minded engineer focused on thoughtful internal tools.",
  skills: ["TypeScript", "React", "Node.js"],
  experienceLibrary: [],
  projectLibrary: [],
  defaultAnswers: {} as Record<string, string>
};

function renderProfilePage() {
  return render(<ProfilePage />);
}

afterEach(() => {
  cleanup();
});

async function waitForDefaultAnswersSection() {
  const heading = await screen.findByRole("heading", { name: "Default answers" });
  const section = heading.closest("section");

  if (!section) {
    throw new Error("Default answers section not found");
  }

  return within(section);
}

describe("ProfilePage default answers editor", () => {
  beforeEach(() => {
    mockedFetchProfile.mockReset();
    mockedSaveProfile.mockReset();
    mockedSaveProfile.mockResolvedValue(baseProfile);
  });

  it("hydrates fetched defaultAnswers into editable rows and saves edits back to the profile payload", async () => {
    const user = userEvent.setup();

    mockedFetchProfile.mockResolvedValue({
      ...baseProfile,
      defaultAnswers: {
        "Why do you want to work here?": "I like building useful internal tools."
      }
    });

    renderProfilePage();

    const defaultAnswersSection = await waitForDefaultAnswersSection();
    const questionInputs = defaultAnswersSection.getAllByLabelText("Question");

    expect(questionInputs).toHaveLength(1);
    expect((questionInputs[0] as HTMLInputElement).value).toBe("Why do you want to work here?");
    expect((defaultAnswersSection.getByLabelText("Answer") as HTMLTextAreaElement).value).toBe(
      "I like building useful internal tools."
    );

    await user.clear(defaultAnswersSection.getByLabelText("Answer"));
    await user.type(
      defaultAnswersSection.getByLabelText("Answer"),
      "I enjoy working on practical internal tools."
    );
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(mockedSaveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultAnswers: {
            "Why do you want to work here?": "I enjoy working on practical internal tools."
          }
        })
      );
    });
  });

  it("adds and removes default-answer rows", async () => {
    const user = userEvent.setup();

    mockedFetchProfile.mockResolvedValue({
      ...baseProfile,
      defaultAnswers: {}
    });

    renderProfilePage();

    const defaultAnswersSection = await waitForDefaultAnswersSection();

    expect(defaultAnswersSection.queryAllByLabelText("Question")).toHaveLength(0);

    await user.click(defaultAnswersSection.getByRole("button", { name: "Add answer" }));

    expect(defaultAnswersSection.getAllByLabelText("Question")).toHaveLength(1);
    expect((defaultAnswersSection.getByLabelText("Question") as HTMLInputElement).value).toBe("");
    expect((defaultAnswersSection.getByLabelText("Answer") as HTMLTextAreaElement).value).toBe("");

    await user.click(defaultAnswersSection.getByRole("button", { name: "Remove" }));

    expect(defaultAnswersSection.queryAllByLabelText("Question")).toHaveLength(0);
  });

  it("blocks save for duplicate questions", async () => {
    const user = userEvent.setup();

    mockedFetchProfile.mockResolvedValue({
      ...baseProfile,
      defaultAnswers: {
        "Why do you want to work here?": "I like building useful internal tools.",
        "What is your salary expectation?": "Open to discussion"
      }
    });

    renderProfilePage();

    const defaultAnswersSection = await waitForDefaultAnswersSection();
    const questionInputs = defaultAnswersSection.getAllByLabelText("Question");

    await user.clear(questionInputs[1]);
    await user.type(questionInputs[1], "Why do you want to work here?");

    expect((screen.getByRole("button", { name: "Save profile" }) as HTMLButtonElement).disabled).toBe(true);
    expect(defaultAnswersSection.getByText("Questions must be unique after normalization.")).not.toBeNull();
  });

  it("blocks save for partial rows", async () => {
    const user = userEvent.setup();

    mockedFetchProfile.mockResolvedValue({
      ...baseProfile,
      defaultAnswers: {}
    });

    renderProfilePage();

    const defaultAnswersSection = await waitForDefaultAnswersSection();

    await user.click(defaultAnswersSection.getByRole("button", { name: "Add answer" }));
    await user.type(defaultAnswersSection.getByLabelText("Question"), "Why do you want to work here?");

    expect((screen.getByRole("button", { name: "Save profile" }) as HTMLButtonElement).disabled).toBe(true);
    expect(defaultAnswersSection.getByText("Question and answer are both required.")).not.toBeNull();
  });

  it("ignores fully blank rows so they do not block save", async () => {
    const user = userEvent.setup();

    mockedFetchProfile.mockResolvedValue({
      ...baseProfile,
      defaultAnswers: {
        "Why do you want to work here?": "I like building useful internal tools."
      }
    });

    renderProfilePage();

    const defaultAnswersSection = await waitForDefaultAnswersSection();

    await user.click(defaultAnswersSection.getByRole("button", { name: "Add answer" }));
    const answerInputs = defaultAnswersSection.getAllByLabelText("Answer");
    await user.clear(answerInputs[0]);
    await user.type(answerInputs[0], "I enjoy practical internal tools.");

    expect((screen.getByRole("button", { name: "Save profile" }) as HTMLButtonElement).disabled).toBe(false);
    expect(defaultAnswersSection.queryByText("Question and answer are both required.")).toBeNull();
  });

  it("shows suggested prompts in the empty state without inserting them", async () => {
    mockedFetchProfile.mockResolvedValue({
      ...baseProfile,
      defaultAnswers: {}
    });

    renderProfilePage();

    const defaultAnswersSection = await waitForDefaultAnswersSection();

    expect(defaultAnswersSection.getByText("Suggested prompts")).not.toBeNull();
    expect(defaultAnswersSection.getByText("Why do you want to work here?")).not.toBeNull();
    expect(defaultAnswersSection.getByText("Do you require sponsorship?")).not.toBeNull();
    expect(defaultAnswersSection.getByText("What is your salary expectation?")).not.toBeNull();
    expect(defaultAnswersSection.getByText("When can you start?")).not.toBeNull();
    expect(screen.queryByDisplayValue("Why do you want to work here?")).toBeNull();
  });
});
