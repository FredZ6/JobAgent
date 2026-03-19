export default function LegacyInternalErrorPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "#f6f2e8",
        color: "#1f1b16",
        fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif'
      }}
    >
      <div
        style={{
          width: "min(40rem, 100%)",
          border: "1px solid rgba(31, 27, 22, 0.16)",
          borderRadius: "24px",
          padding: "2rem",
          background: "rgba(255, 252, 246, 0.96)",
          boxShadow: "0 24px 64px rgba(31, 27, 22, 0.08)"
        }}
      >
        <p style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.78rem" }}>
          Error 500
        </p>
        <h1 style={{ margin: "0.75rem 0 0", fontSize: "2rem", lineHeight: 1.1 }}>
          Something went wrong while rendering this page.
        </h1>
        <p style={{ margin: "1rem 0 0", fontSize: "1rem", lineHeight: 1.6 }}>
          This lightweight fallback keeps production builds off the built-in legacy error page.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "2.75rem",
              padding: "0 1.1rem",
              borderRadius: "999px",
              background: "#d3643b",
              color: "#fffdf8",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            Back to overview
          </a>
          <a
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "2.75rem",
              padding: "0 1.1rem",
              borderRadius: "999px",
              border: "1px solid rgba(31, 27, 22, 0.18)",
              color: "#1f1b16",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            Open dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
