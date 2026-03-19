export const dynamic = "force-dynamic";

export default function NotFoundPage() {
  return (
    <section className="content-grid">
      <div className="panel panel-strong span-12">
        <div className="stack">
          <p className="eyebrow">Not Found</p>
          <h1 className="panel-title">This page does not exist.</h1>
          <p className="panel-copy">
            The link may be outdated, or the resource may have been removed from this local run.
          </p>
          <div className="button-row">
            <a className="button button-primary" href="/">
              Back to overview
            </a>
            <a className="button button-secondary" href="/dashboard">
              Open dashboard
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
