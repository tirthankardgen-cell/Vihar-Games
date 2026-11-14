"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { Game } from "@/lib/catalog/registry";
import { PlayMark } from "./play-mark";
import styles from "./catalog.module.css";

function pageSize() {
  if (innerWidth >= 700) return innerHeight >= 720 ? 6 : 3;
  if (innerWidth >= 560) return innerHeight >= 720 ? 4 : 2;
  return innerHeight >= 720 ? 2 : 1;
}
function subscribe(listener: () => void) { window.addEventListener("resize", listener); return () => window.removeEventListener("resize", listener); }
export function Catalog({ games }: { games: readonly Game[] }) {
  const size = useSyncExternalStore(subscribe, pageSize, () => 6), [page, setPage] = useState(0);
  const pages = Math.ceil(games.length / size), current = Math.min(page, pages - 1), start = current * size;
  const playable = games.filter((game) => game.availability === "playable").length;
  return <main id="main-content" className={styles.catalogPage}>
    <section className={styles.intro} aria-labelledby="catalog-title"><div><p className={styles.eyebrow}>THE FAMILIAR JOY OF PLAY</p><h1 id="catalog-title">Make time for one more round.</h1><p>Board games, quiet puzzles, and a little open sky.</p></div><div className={styles.introArt}><PlayMark /></div></section>
    <section id="collection" className={styles.collectionHeading} aria-labelledby="collection-title"><div><h2 id="collection-title">Find your favourite.</h2><p>{playable} ready to play · {games.length} games in the collection</p></div><span className={styles.collectionNote}>Ready to play first.<br />More favourites on the way.</span></section>
    <ul className={styles.cards} aria-labelledby="collection-title">{games.slice(start, start + size).map((game, index) => <li key={game.id}><Link href={`/${game.id}`} className={styles.card} data-availability={game.availability}>
      <div className={styles.cardHeader}><span className={styles.symbol} aria-hidden="true">{game.symbol}</span><div><p className={styles.eyebrow}>{game.category}</p><h3>{game.name}</h3></div><span className={styles.number} aria-hidden="true">{String(start + index + 1).padStart(2, "0")}</span></div>
      <p className={styles.description}>{game.description}</p><p className={styles.players}>{game.playersLabel}</p><div className={styles.cardBottom}><span className={styles.badge}>{game.availability === "playable" ? "Play now" : "Coming soon"}</span><span aria-hidden="true">↗</span></div>
    </Link></li>)}</ul>
    <nav className={styles.pagination} aria-label="Game catalog pages"><button disabled={current === 0} onClick={() => setPage(current - 1)}>← Previous</button><span aria-live="polite">{start + 1}–{Math.min(start + size, games.length)} of {games.length} <small>PAGE {current + 1} / {pages}</small></span><button disabled={current === pages - 1} onClick={() => setPage(current + 1)}>Next →</button></nav>
  </main>;
}
