import type { Metadata } from "next";
import Link from "next/link";
import { PlayMark } from "@/components/play-mark";
import { games } from "@/lib/catalog/registry";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  return (
    <main id="main-content" className="page-shell">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">The familiar joy of play</p>
          <h1 id="hero-title">Make time for{" "}<br />one more round.</h1>
          <p>Board games, friendly rivalries, and quiet puzzles. A new place for the games you grew up with.</p>
          <div className="hero-actions">
            <a className="button button-paper" href="#collection">Explore the collection <span aria-hidden="true">↓</span></a>
            <span className="hero-note">A growing collection of {games.length} games</span>
          </div>
        </div>
        <div className="hero-art"><PlayMark /><p>Gather. Think. Play.</p></div>
      </section>

      <section id="collection" className="collection" aria-labelledby="collection-title">
        <div className="section-heading">
          <div><p className="eyebrow">A seat for everyone</p><h2 id="collection-title">Find your favourite.</h2></div>
          <p>Tic Tac Toe is ready to play.{" "}<br />More familiar favourites are on the way.</p>
        </div>
        <ul className="game-grid">
          {games.map((game, index) => (
            <li key={game.id}>
              <Link className="game-card" href={`/${game.id}`}>
                <div className="card-top">
                  <span className="game-symbol" aria-hidden="true">{game.symbol}</span>
                  <span className="card-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <p className="eyebrow card-category">{game.category}</p>
                <h3>{game.name}</h3>
                <p className="card-description">{game.description}</p>
                <p className="players-label">{game.playersLabel}</p>
                <div className="card-bottom"><span className="status-badge">{game.availability === "playable" ? "Play now" : "Coming soon"}</span><span aria-hidden="true">↗</span></div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
