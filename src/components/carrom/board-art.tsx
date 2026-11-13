import styles from "./carrom.module.css";

export function Coin({ color = "cream" }: { color?: "cream" | "ink" | "queen" | "striker" }) {
  const fill = { cream: "#fff1ce", ink: "#293d35", queen: "#af6443", striker: "#dfb36d" }[color];
  return <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill={fill} stroke={color === "ink" ? "#dfb36d" : "#293d35"} strokeWidth="1.5" /><circle cx="24" cy="24" r="16" fill="none" stroke={color === "ink" ? "#a69b78" : "#8e744e"} strokeWidth="1" />{color === "queen" ? <path d="m24 13 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#fff1ce" /> : color === "striker" ? <><path d="m24 12 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" fill="none" stroke="#293d35" /><circle cx="24" cy="24" r="3" fill="#293d35" /></> : <circle cx="24" cy="24" r="2" fill={color === "ink" ? "#dfb36d" : "#8e744e"} />}</svg>;
}

// Shared flat board geometry, also used below the live Canvas 2D renderer.
export function BoardArt({ position = 0, angle = 0, power = 50, aiming = false, showPieces = true }: { position?: number; angle?: number; power?: number; aiming?: boolean; showPieces?: boolean }) {
  const strikerX = 300 + position * 1.4;
  const radians = angle * Math.PI / 180;
  const length = 70 + power * 1.25;
  const coins = [
    ...Array.from({ length: 6 }, (_, i) => ({ x: 300 + 23 * Math.sin(i * Math.PI / 3), y: 300 + 23 * Math.cos(i * Math.PI / 3), cream: i % 2 === 0 })),
    ...Array.from({ length: 12 }, (_, i) => ({ x: 300 + 46 * Math.sin(i * Math.PI / 6), y: 300 + 46 * Math.cos(i * Math.PI / 6), cream: i % 2 === 1 })),
  ];
  return <svg className={styles.boardArt} viewBox="0 0 600 600" role="img" aria-hidden={!showPieces} aria-label="Flat carrom board with four pockets, nine cream coins, nine dark coins, a red queen, and a patterned striker">
    <rect x="3" y="3" width="594" height="594" rx="8" fill="#9b6944" stroke="#e2bd7f" strokeWidth="3" />
    <rect x="14" y="14" width="572" height="572" rx="3" fill="#c99558" stroke="#5e4935" strokeWidth="2" />
    <rect x="29" y="29" width="542" height="542" rx="2" fill="#f5e6c5" stroke="#604e38" strokeWidth="2" />
    <g stroke="#c6ad7e" strokeWidth=".65" opacity=".4"><path d="M80 40v520M158 40v520M236 40v520M314 40v520M392 40v520M470 40v520M548 40v520" /></g>
    {[0, 90, 180, 270].map((rotation) => <g key={rotation} transform={`rotate(${rotation} 300 300)`} fill="none" stroke="#5b4935" strokeWidth="1.8">
      <path d="M160 470h280a12 12 0 0 1 0 24H160a12 12 0 0 1 0-24Z" />
      <circle cx="160" cy="482" r="12" fill="#af6443" stroke="#5b4935" /><circle cx="440" cy="482" r="12" fill="#af6443" stroke="#5b4935" />
      <path d="m95 505 80-80m-18 5 18-5-5 18" /><path d="M163 452a22 22 0 1 1 29-29" />
      <path d="M35 15h95m340 0h95" stroke="#e2bd7f" />
    </g>)}
    <g fill="none" stroke="#af6443"><circle cx="300" cy="300" r="65" strokeWidth="1.5" /><circle cx="300" cy="300" r="59" strokeWidth=".7" />{Array.from({ length: 12 }, (_, i) => <path key={i} d="m300 235-5-10 5 3 5-3Z" transform={`rotate(${i * 30} 300 300)`} strokeWidth="1" />)}</g>
    {[[56, 56], [544, 56], [56, 544], [544, 544]].map(([x, y]) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="23" fill="#293d35" /><circle cx={x} cy={y} r="20" fill="none" stroke="#c99558" strokeWidth="1.5" /></g>)}
    {showPieces && <g>
    {coins.map((coin, i) => <g key={i}><circle cx={coin.x} cy={coin.y} r="10.6" fill={coin.cream ? "#fff5df" : "#293d35"} stroke="#6d6146" strokeWidth="1.3" /><circle cx={coin.x} cy={coin.y} r="7.5" fill="none" stroke={coin.cream ? "#c6ad7e" : "#929277"} strokeWidth=".7" /></g>)}
    <circle cx="300" cy="300" r="10.6" fill="#af6443" stroke="#733f2f" strokeWidth="1.3" /><path d="m300 293 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#f5e6c5" />
    {aiming && <g stroke="#2b4a42" fill="none"><path d={`M${strikerX} 482l${Math.sin(radians) * length} ${-Math.cos(radians) * length}`} strokeWidth="2" strokeDasharray="5 5" /><circle cx={strikerX} cy="482" r="22" strokeWidth="1.2" strokeDasharray="3 4" /></g>}
    <g transform={`translate(${strikerX} 482)`}><circle r="16" fill="#dfb36d" stroke="#293d35" strokeWidth="1.7" /><circle r="12" fill="none" stroke="#7c603b" /><path d="m0-9 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" fill="none" stroke="#293d35" /><circle r="2" fill="#293d35" /></g>
    </g>}
  </svg>;
}
