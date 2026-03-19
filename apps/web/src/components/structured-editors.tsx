type ExperienceItem = {
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  bullets: string[];
};

type ProjectItem = {
  name: string;
  tagline: string;
  bullets: string[];
  skills: string[];
};

type ExperienceEditorProps = {
  value: ExperienceItem[];
  onChange: (next: ExperienceItem[]) => void;
};

type ProjectEditorProps = {
  value: ProjectItem[];
  onChange: (next: ProjectItem[]) => void;
};

function normalizeLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ExperienceEditor({ value, onChange }: ExperienceEditorProps) {
  const items = value.length > 0 ? value : [];

  return (
    <div className="stack">
      <div className="button-row">
        <span className="field-label">Experience library</span>
        <button
          className="button button-secondary"
          type="button"
          onClick={() =>
            onChange([
              ...items,
              {
                role: "",
                company: "",
                startDate: "",
                endDate: "",
                bullets: []
              }
            ])
          }
        >
          Add experience
        </button>
      </div>
      {items.length === 0 ? <div className="inline-note">No experience entries yet.</div> : null}
      {items.map((item, index) => (
        <div key={`${item.role}-${index}`} className="analysis-card">
          <div className="analysis-grid">
            <label className="field">
              <span className="field-label">Role</span>
              <input
                className="field-input"
                value={item.role}
                onChange={(event) =>
                  onChange(
                    items.map((current, currentIndex) =>
                      currentIndex === index ? { ...current, role: event.target.value } : current
                    )
                  )
                }
              />
            </label>
            <label className="field">
              <span className="field-label">Company</span>
              <input
                className="field-input"
                value={item.company}
                onChange={(event) =>
                  onChange(
                    items.map((current, currentIndex) =>
                      currentIndex === index ? { ...current, company: event.target.value } : current
                    )
                  )
                }
              />
            </label>
            <label className="field">
              <span className="field-label">Start date</span>
              <input
                className="field-input"
                value={item.startDate}
                placeholder="2022-01"
                onChange={(event) =>
                  onChange(
                    items.map((current, currentIndex) =>
                      currentIndex === index ? { ...current, startDate: event.target.value } : current
                    )
                  )
                }
              />
            </label>
            <label className="field">
              <span className="field-label">End date</span>
              <input
                className="field-input"
                value={item.endDate}
                placeholder="Present"
                onChange={(event) =>
                  onChange(
                    items.map((current, currentIndex) =>
                      currentIndex === index ? { ...current, endDate: event.target.value } : current
                    )
                  )
                }
              />
            </label>
          </div>
          <label className="field">
            <span className="field-label">Bullets</span>
            <textarea
              className="field-textarea"
              value={item.bullets.join("\n")}
              placeholder="One bullet per line"
              onChange={(event) =>
                onChange(
                  items.map((current, currentIndex) =>
                    currentIndex === index ? { ...current, bullets: normalizeLines(event.target.value) } : current
                  )
                )
              }
            />
          </label>
          <div className="button-row">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
            >
              Remove entry
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectEditor({ value, onChange }: ProjectEditorProps) {
  const items = value.length > 0 ? value : [];

  return (
    <div className="stack">
      <div className="button-row">
        <span className="field-label">Project library</span>
        <button
          className="button button-secondary"
          type="button"
          onClick={() =>
            onChange([
              ...items,
              {
                name: "",
                tagline: "",
                bullets: [],
                skills: []
              }
            ])
          }
        >
          Add project
        </button>
      </div>
      {items.length === 0 ? <div className="inline-note">No project entries yet.</div> : null}
      {items.map((item, index) => (
        <div key={`${item.name}-${index}`} className="analysis-card">
          <div className="analysis-grid">
            <label className="field">
              <span className="field-label">Project name</span>
              <input
                className="field-input"
                value={item.name}
                onChange={(event) =>
                  onChange(
                    items.map((current, currentIndex) =>
                      currentIndex === index ? { ...current, name: event.target.value } : current
                    )
                  )
                }
              />
            </label>
            <label className="field">
              <span className="field-label">Tagline</span>
              <input
                className="field-input"
                value={item.tagline}
                onChange={(event) =>
                  onChange(
                    items.map((current, currentIndex) =>
                      currentIndex === index ? { ...current, tagline: event.target.value } : current
                    )
                  )
                }
              />
            </label>
          </div>
          <label className="field">
            <span className="field-label">Bullets</span>
            <textarea
              className="field-textarea"
              value={item.bullets.join("\n")}
              placeholder="One bullet per line"
              onChange={(event) =>
                onChange(
                  items.map((current, currentIndex) =>
                    currentIndex === index ? { ...current, bullets: normalizeLines(event.target.value) } : current
                  )
                )
              }
            />
          </label>
          <label className="field">
            <span className="field-label">Skills</span>
            <input
              className="field-input"
              value={item.skills.join(", ")}
              placeholder="TypeScript, NestJS, Prisma"
              onChange={(event) =>
                onChange(
                  items.map((current, currentIndex) =>
                    currentIndex === index
                      ? {
                          ...current,
                          skills: event.target.value
                            .split(",")
                            .map((skill) => skill.trim())
                            .filter(Boolean)
                        }
                      : current
                  )
                )
              }
            />
          </label>
          <div className="button-row">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
            >
              Remove entry
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
