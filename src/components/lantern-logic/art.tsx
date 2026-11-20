import styles from "./lantern.module.css";
export function LanternArt({ variant = "workshop", finished, size = 5 }: { variant?: "small" | "workshop" | "festival"; finished?: readonly number[]; size?: number }) {
  const abstract = [0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0];
  const cells = finished ?? abstract, n = finished ? size : 5, unit = 132 / n;
  return <svg className={styles.lanternArt} viewBox="0 0 300 380" fill="none" aria-hidden="true">
    <path d="M150 0v37m-18 10c0-24 36-24 36 0" stroke="#47384B" strokeWidth="2" />
    <path d="M120 46h60v15h-60z" fill="#47384B" />
    <path d="M86 75Q150 50 214 75L234 113v140l-20 40q-64 25-128 0l-20-40V113Z" fill="#FFF9EE" stroke="#47384B" strokeWidth="2" />
    <path d="M86 75 72 115v136l14 42m128-218 14 40v136l-14 42M106 69v232m88-232v232" stroke="#D6C7B5" strokeWidth="1.5" />
    <path d="M66 113h168M66 253h168" stroke="#47384B" strokeWidth="1.5" />
    <path d="M120 301h60v10h-60z" fill="#47384B" /><path d="M150 311v22m-10-18v41m20-41v41m-10-23v39" stroke="#AB615A" strokeWidth="3" />
    <path d="M42 147h9m-5-5v10m204 65h9m-5-5v10" stroke="#D1A24E" strokeWidth="1.5" />
    {cells.map((c, i) => c === 1 && <rect key={i} x={84 + i % n * unit} y={117 + Math.floor(i / n) * unit} width={unit - 1} height={unit - 1} fill="#D1A24E" />)}
    {!finished && <><path d="M84 117h132v132H84z" stroke="#47384B" strokeOpacity=".35" />{[1, 2, 3, 4].map((i) => <path key={i} d={`M${84 + i * unit} 117v132M84 ${117 + i * unit}h132`} stroke="#47384B" strokeOpacity=".18" />)}</>}
    {variant === "festival" && <><path d="M19 75v30m-10-15h20m262 184v24m-12-12h24" stroke="#D1A24E" /><circle cx="257" cy="101" r="3" fill="#AB615A" /></>}
  </svg>;
}
export function WorkshopArt() {
  return <figure className={styles.workshopArt}><div className={styles.artLabel}><span>THE LANTERN WORKSHOP</span><span>EST. IN A QUIET MOMENT</span></div><LanternArt variant="festival" /><figcaption><span>Every little square<br />holds a possibility.</span><span className={styles.artSeal}>MADE OF<br />LIGHT & LOGIC</span></figcaption></figure>;
}
