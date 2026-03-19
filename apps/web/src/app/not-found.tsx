import Link from "next/link";

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
            <Link className="button button-primary" href="/">
              Back to overview
            </Link>
            <Link className="button button-secondary" href="/dashboard">
              Open dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
