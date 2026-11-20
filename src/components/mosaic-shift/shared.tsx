import Link from "next/link";
import { Pattern } from "./art";
import { target, type Size } from "@/games/mosaic-shift/engine";
import styles from "./mosaic.module.css";
export function StudioNav({ children, embedded = false, onExit }: { children?: React.ReactNode; embedded?: boolean; onExit?: () => void }) {
  return <header className={styles.nav}><Link href="/mosaic-shift" className={styles.brand} onClick={onExit}><span className={styles.brandTile} aria-hidden="true">✳</span><span>MOSAIC SHIFT<small>VIHAR CERAMIC STUDIO</small></span></Link><nav aria-label="Studio navigation">{children}{!embedded && <Link href="/" className={styles.collection} onClick={onExit}>Collection ↗</Link>}</nav></header>;
}
export function StudioFooter() { return <footer className={styles.footer}><span>A LITTLE PATIENCE. A LITTLE PATTERN.</span><span>HANDMADE FOR A MOMENT OF PLAY</span></footer>; }
export function MosaicPreview({ size = 3, complete = false }: { size?: Size; complete?: boolean }) {
  const tiles = target(size);
  return <div className={styles.preview} style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }} aria-label={complete ? "Target mosaic in ascending order" : "A ceramic mosaic with one offset tile"} role="img">{tiles.map((tile, index) => <div key={tile} className={tile ? styles.previewTile : styles.previewEmpty} style={!complete && tile === size * size - 1 ? { transform: "translate(-6%, 6%)" } : undefined}>{tile ? <><Pattern size={size} viewBox={`${(tile - 1) % size * 300 / size} ${Math.floor((tile - 1) / size) * 300 / size} ${300 / size} ${300 / size}`} /><span>{tile}</span></> : <span className={styles.emptyLabel}>{index === size * size - 1 ? "EMPTY" : "✧"}</span>}</div>)}</div>;
}
