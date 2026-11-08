import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="page-shell detail-page">
      <section className="coming-soon-panel">
        <p className="eyebrow">404</p>
        <h1>That table isn’t here.</h1>
        <p className="lead">Let’s find you a game in the collection.</p>
        <Link className="button button-ink" href="/">Back to Vihar Games</Link>
      </section>
    </main>
  );
}
