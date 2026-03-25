import Link from "next/link";
import { Panel } from "../components/panel";

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
            <Link className="button button-primary" href="/settings">
              Configure LLM
            </Link>
            <Link className="button button-secondary" href="/jobs">
              Import a job
            </Link>
          </div>
        </Panel>
        <Panel eyebrow="Acceptance" title="Round-one outcome">
          <div className="panel-metric">4</div>
          <div className="inline-note">Pages wired into one working loop.</div>
        </Panel>
      </section>

      <section className="content-grid">
        <Link className="card-link span-4" href="/settings">
          <Panel title="Settings" copy="One provider, one model, one API key path." />
        </Link>
        <Link className="card-link span-4" href="/profile">
          <Panel title="Profile" copy="Save the candidate context the analyzer actually needs." />
        </Link>
        <Link className="card-link span-4" href="/jobs">
          <Panel
            title="Jobs + Analysis"
            copy="Import a URL, inspect the JD, then run analysis on demand."
          />
        </Link>
      </section>
    </>
  );
}
