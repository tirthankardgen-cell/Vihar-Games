import type { Size } from "@/games/mosaic-shift/engine";
export function Pattern({ size, viewBox = "0 0 300 300" }: { size: Size; viewBox?: string }) {
  return <svg viewBox={viewBox} aria-hidden="true" fill="none">
    <rect width="300" height="300" fill="#F4EFE3" />
    <rect x="9" y="9" width="282" height="282" stroke="#355E82" strokeWidth="2" />
    <rect x="17" y="17" width="266" height="266" stroke="#698D88" />
    {size === 3 && <g stroke="#355E82" strokeWidth="3">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => <g key={a} transform={`rotate(${a} 150 150)`}><path d="M150 147C105 111 119 53 150 39C181 53 195 111 150 147Z" fill={a % 90 ? "#698D8840" : "#355E8220"} /><path d="M150 53V125" /></g>)}
      <circle cx="150" cy="150" r="22" fill="#B47758" stroke="#F4EFE3" strokeWidth="6" />
      {[[42, 42], [258, 42], [42, 258], [258, 258]].map(([x, y]) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="9" fill="#698D88" /><path d={`M${x - 14} ${y}h28M${x} ${y - 14}v28`} /></g>)}
    </g>}
    {size === 4 && <g stroke="#355E82" strokeWidth="2.5">
      <path d="M150 27L175 100L248 75L200 135L273 150L200 165L248 225L175 200L150 273L125 200L52 225L100 165L27 150L100 135L52 75L125 100Z" fill="#355E8220" />
      <path d="M150 69L174 126L231 150L174 174L150 231L126 174L69 150L126 126Z" fill="#698D8860" />
      <path d="M150 110L190 150L150 190L110 150Z" fill="#B47758" />
      {[0, 90, 180, 270].map(a => <g key={a} transform={`rotate(${a} 150 150)`}><path d="M39 34L66 39L39 66L34 39Z" fill="#698D88" /><path d="M110 27h80M150 27v15" /></g>)}
    </g>}
    {size === 5 && <g stroke="#355E82" strokeWidth="3" strokeLinecap="round">
      <path d="M35 261C120 263 60 210 134 207S218 153 145 143S63 68 154 53S243 95 265 38" />
      {[[73, 242, -35], [126, 209, 20], [204, 175, 130], [142, 140, 35], [102, 104, -100], [155, 53, -40], [234, 70, 110]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}><path d="M0 0C-35 -4 -39 -32 -31 -44C-9 -38 4 -20 0 0Z" fill={i % 2 ? "#698D8870" : "#355E8230"} /><path d="M0 0L-27 -34" /></g>)}
      {[[57, 58], [245, 235], [164, 265]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="10" fill="#B47758" stroke="none" /><circle cx={x} cy={y} r="3" fill="#F4EFE3" stroke="none" /></g>)}
    </g>}
  </svg>;
}
export function MakerMark() { return <svg viewBox="0 0 60 60" fill="none" aria-hidden="true"><circle cx="30" cy="30" r="27" stroke="currentColor" /><circle cx="30" cy="30" r="22" stroke="currentColor" strokeDasharray="2 3" /><path d="m18 29 9 9 17-19M24 12h12M24 48h12" stroke="currentColor" strokeWidth="2" /></svg>; }
