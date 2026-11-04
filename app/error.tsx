"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <h1>Something broke</h1>
      <p className="muted">{error.message || "An unexpected error occurred."}</p>
      <div className="btnrow">
        <button className="primary" onClick={reset} type="button">Try again</button>
        <button onClick={() => (window.location.href = "/")} type="button">Home</button>
      </div>
    </main>
  );
}
