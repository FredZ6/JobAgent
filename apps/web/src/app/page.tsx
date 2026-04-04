import Link from "next/link";

const workflowSteps = [
  {
    title: "Foundation",
    copy: "Start with candidate facts, reusable stories, and default answers before any role-specific generation begins."
  },
  {
    title: "Intake",
    copy: "Import the role, inspect source quality, and keep the job record trustworthy before deeper work starts."
  },
  {
    title: "Review",
    copy: "Treat analysis, resume generation, and prefill attempts as evidence that can be compared before submission."
  }
];

export default function HomePage() {
  return (
    <div className="premium-home">
      <section className="premium-hero">
        <section className="panel premium-hero-panel">
          <div className="panel-inner premium-hero-inner">
            <div className="eyebrow">Human-in-the-loop application ops</div>
            <h2 className="premium-hero-title">Run every application from one high-trust workspace</h2>
            <p className="premium-hero-copy">
              Rolecraft keeps candidate context, job evidence, generated assets, and final review checkpoints in one local-first system so automation stays visible and submission stays deliberate.
            </p>
            <div className="premium-hero-note">
              Built for serious applicants who want speed, but only when the workflow still makes room for judgment.
            </div>
            <div className="button-row">
              <Link className="button button-primary" href="/dashboard">
                Open dashboard
              </Link>
              <Link className="button button-secondary" href="/jobs">
                Review case queue
              </Link>
              <Link className="button button-ghost" href="/profile">
                Open profile
              </Link>
            </div>
            <div className="hero-pill-list">
              <div className="hero-pill">Local-first record</div>
              <div className="hero-pill">Reviewable outputs</div>
              <div className="hero-pill">Human final step</div>
            </div>
          </div>
        </section>

        <section className="panel premium-rail-panel">
          <div className="panel-inner premium-rail-inner">
            <h3>Operating model</h3>
            <div className="premium-rail-list">
              <div className="premium-rail-item">
                <strong>Visible automation</strong>
                <p>Every run stays inspectable instead of disappearing into one-click convenience.</p>
              </div>
              <div className="premium-rail-item">
                <strong>Evidence-led review</strong>
                <p>Importer quality, analysis output, and resume variants stay attached to each role.</p>
              </div>
              <div className="premium-rail-item">
                <strong>Explicit final control</strong>
                <p>The last submission step remains intentionally human-controlled.</p>
              </div>
            </div>
            <Link className="inline-link" href="/settings">
              Review settings
            </Link>
          </div>
        </section>
      </section>

      <section className="proof-strip" aria-label="Product proof">
        <article className="proof-card">
          <div className="proof-label">Why it feels trustworthy</div>
          <h3>Local-first context</h3>
          <p>Your candidate record and role evidence stay close to the work instead of being scattered across tools.</p>
        </article>
        <article className="proof-card">
          <div className="proof-label">Why it feels controlled</div>
          <h3>Reviewable automation</h3>
          <p>Generated outputs behave like artifacts you can inspect, compare, and reject when they are not good enough.</p>
        </article>
        <article className="proof-card">
          <div className="proof-label">Why it feels safe</div>
          <h3>Manual submission</h3>
          <p>Rolecraft helps you prepare the application, but it does not hide or automate the final act of applying.</p>
        </article>
      </section>

      <section className="content-grid premium-lower-grid">
        <section className="panel span-7 workflow-panel">
          <div className="panel-inner">
            <div className="eyebrow">Three-stage workflow</div>
            <h2 className="panel-title">Designed for control at every step</h2>
            <p className="panel-copy">
              The product behaves more like a disciplined workspace than a magical assistant: capture context, review evidence, then move toward submission with clear checkpoints.
            </p>
            <div className="workflow-stage-grid">
              {workflowSteps.map((step, index) => (
                <article key={step.title} className="workflow-stage">
                  <div className="workflow-stage-index">0{index + 1}</div>
                  <div className="workflow-stage-body">
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="panel span-5 premium-launch-panel">
          <div className="panel-inner">
            <div className="eyebrow">Workspace entry points</div>
            <h2 className="panel-title">Launch the right surface fast</h2>
            <p className="panel-copy">
              Use the premium shell as a stable frame, then drop into the exact part of the workflow that needs attention.
            </p>
            <div className="launch-stack">
              <Link className="launch-link" href="/profile">
                <span className="launch-link-label">Profile foundation</span>
                <strong>Candidate profile</strong>
                <p>Refine the candidate record that the rest of the workflow depends on.</p>
              </Link>
              <Link className="launch-link" href="/settings">
                <span className="launch-link-label">Runtime controls</span>
                <strong>Settings control room</strong>
                <p>Keep model, provider, and API choices explicit before generating anything.</p>
              </Link>
              <Link className="launch-link" href="/jobs">
                <span className="launch-link-label">Case queue</span>
                <strong>Jobs pipeline</strong>
                <p>Inspect imported roles, compare evidence, and keep each application moving deliberately.</p>
              </Link>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
