import Link from "next/link";
import { type Game, modeLabels } from "@/lib/catalog/registry";

export function ComingSoon({ game, rules = false }: { game: Game; rules?: boolean }) {
  return (
    <main id="main-content" className="page-shell detail-page">
      <Link className="back-link" href={`/${game.id}`}>
        <span aria-hidden="true">←</span> About {game.name}
      </Link>
      <section className="coming-soon-panel">
        <span className="game-symbol" aria-hidden="true">{game.symbol}</span>
        <p className="eyebrow">Coming soon</p>
        <h1>{rules ? `How to play ${game.name}` : `${game.name} is on the way.`}</h1>
        <p className="lead">
          {rules
            ? "The full rules will be published when the game is ready."
            : "We’re getting the table ready. Play will open here when the game arrives."}
        </p>
        <p>{game.description}</p>
        {!rules && (
          <div className="planned-modes">
            <h2>Planned ways to play</h2>
            <ul>{game.plannedModes.map((mode) => <li key={mode}>{modeLabels[mode]}</li>)}</ul>
          </div>
        )}
        <Link className="button button-ink" href="/#collection">Explore the collection</Link>
      </section>
    </main>
  );
}
