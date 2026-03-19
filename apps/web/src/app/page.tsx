import { Panel } from "../components/panel";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <section className="hero-grid">
        <Panel
          eyebrow="MVP focus"
          title="A deliberate first slice"
          copy="This build is intentionally narrow: capture candidate context, import a job, and return a structured analysis that helps decide whether the role is worth deeper effort."
        >
          <div className="button-row">
            <a className="button button-primary" href="/settings">
              Configure LLM
            </a>
            <a className="button button-secondary" href="/jobs">
              Import a job
            </a>
          </div>
        </Panel>
        <Panel eyebrow="Acceptance" title="Round-one outcome">
          <div className="panel-metric">4</div>
          <div className="inline-note">Pages wired into one working loop.</div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel
          className="span-4"
          eyebrow="1"
          title="Settings"
          copy="One provider, one model, one API key path."
        />
        <Panel
          className="span-4"
          eyebrow="2"
          title="Profile"
          copy="Save the candidate context the analyzer actually needs."
        />
        <Panel
          className="span-4"
          eyebrow="3"
          title="Jobs + Analysis"
          copy="Import a URL, inspect the JD, then run analysis on demand."
        />
      </section>
    </>
  );
}
