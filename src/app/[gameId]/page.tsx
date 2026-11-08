import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGame, modeLabels } from "@/lib/catalog/registry";

type Props = { params: Promise<{ gameId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = getGame((await params).gameId);
  if (!game) notFound();
  return {
    title: game.name,
    description: `${game.description} Coming soon to Vihar Games.`,
    alternates: { canonical: `/${game.id}` },
    openGraph: { title: `${game.name} | Vihar Games`, description: game.description, url: `/${game.id}` },
  };
}

export default async function GamePage({ params }: Props) {
  const game = getGame((await params).gameId);
  if (!game) notFound();
  return (
    <main id="main-content" className="page-shell detail-page">
      <Link className="back-link" href="/#collection"><span aria-hidden="true">←</span> All games</Link>
      <section className="game-overview">
        <div>
          <span className="game-symbol overview-symbol" aria-hidden="true">{game.symbol}</span>
          <p className="eyebrow">{game.category} · {game.playersLabel}</p>
          <h1>{game.name}</h1>
          {game.hindiName && <p className="hindi-title" lang="hi">{game.hindiName}</p>}
          <p className="lead">{game.description}</p>
          <span className="status-badge">Coming soon</span>
          <p className="availability-note">This game is on the way. You’ll be able to play here when it arrives.</p>
          <div className="detail-actions">
            <Link className="button button-ink" href={`/${game.id}/play`}>Play · coming soon</Link>
            <Link className="text-link" href={`/${game.id}/how-to-play`}>Rules · coming soon <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <aside className="mode-panel" aria-labelledby="mode-title">
          <p className="eyebrow">Look forward to</p>
          <h2 id="mode-title">Ways to play</h2>
          <ul>{game.plannedModes.map((mode) => <li key={mode}>{modeLabels[mode]}</li>)}</ul>
          <p>These modes will arrive with the game.</p>
        </aside>
      </section>
    </main>
  );
}
