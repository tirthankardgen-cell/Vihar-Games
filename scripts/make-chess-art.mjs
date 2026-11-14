/** Chess courtyard illustration. Adapted from the shared Gulam Chor courtyard study; no card art or branding. Deterministic editable SVG, no runtime dependencies. */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "public/art/chess");
mkdirSync(output, { recursive: true });
let seed = 137;
function rnd(a, b) { seed = (seed * 1664525 + 1013904223) >>> 0; return a + (seed / 4294967296) * (b - a); }
const poly = (points, fill, extra = "") => `<path d="M${points.map((p) => p.join(",")).join(" L")}Z" fill="${fill}" ${extra}/>`;
const rect = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
function patches(x, y, w, h, count, colors) {
  return Array.from({ length: count }, () => {
    const px = rnd(x, x + w), py = rnd(y, y + h), size = rnd(6, 40);
    return poly([[px, py], [px + size, py - 3], [px + size * 0.7, py + size * 0.4], [px - 5, py + size * 0.65]], colors[Math.floor(rnd(0, colors.length))], `opacity="${rnd(0.12, 0.45).toFixed(2)}"`);
  }).join("");
}
function window(x, y, w, h, blue = false) {
  const frame = blue ? "#457f81" : "#ba8053", dark = blue ? "#25484a" : "#5d4134";
  return `<g>${rect(x - 13, y - 16, w + 26, h + 34, frame)}<path d="M${x},${y + h}V${y + w / 2}Q${x + w / 2},${y - 25} ${x + w},${y + w / 2}V${y + h}Z" fill="${dark}"/>${Array.from({ length: 5 }, (_, i) => rect(x + 6 + i * w / 5, y + w / 2, 3, h - w / 2, frame, 'opacity=".75"')).join("")}${rect(x - 19, y + h + 4, w + 38, 12, "#684634")}${rect(x - 16, y + h + 3, w + 32, 4, "#e6ba78")}</g>`;
}
function pot(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="11" rx="55" ry="12" fill="#493b29" opacity=".3"/><path d="M-35-50H35L27 2Q0 22-27 2Z" fill="#9d4d34"/><path d="M-29-46H5L0 11Q-20 9-22 0Z" fill="#c3744b"/><ellipse cy="-50" rx="37" ry="9" fill="#79442e"/><path d="M0-50Q-20-100-65-103Q-42-76-4-72M0-47Q2-120 44-132Q48-91 8-73M3-55Q34-104 72-86Q58-62 10-62M-2-61Q-18-145-44-153Q-51-109-6-71" fill="#405b36"/><path d="M2-56Q18-127 23-155" fill="none" stroke="#707844" stroke-width="4"/></g>`;
}
function tea(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="7" rx="17" ry="5" fill="#403b2c" opacity=".3"/><path d="M-14-34H14L10 3Q0 9-10 3Z" fill="#dac39a" fill-opacity=".65" stroke="#eccda0" stroke-width="2"/><path d="M-12-20H12L9 3Q0 7-9 3Z" fill="#a16c3a"/><ellipse cy="-20" rx="12" ry="3" fill="#cba468"/><path d="M-3-42Q-12-58-4-68M6-46Q14-60 6-72" fill="none" stroke="#f3d7ab" stroke-width="2" opacity=".45"/></g>`;
}
let scene = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1200" viewBox="0 0 1920 1200"><defs>
<linearGradient id="sky" x2="0" y2="1"><stop stop-color="#728b96"/><stop offset=".62" stop-color="#c5b394"/><stop offset="1" stop-color="#efba79"/></linearGradient>
<linearGradient id="earth" x2=".3" y2="1"><stop stop-color="#be8956"/><stop offset="1" stop-color="#78513b"/></linearGradient>
<linearGradient id="wall" x2="1" y2=".3"><stop stop-color="#d69d62"/><stop offset="1" stop-color="#ad6e42"/></linearGradient>
<radialGradient id="sun"><stop stop-color="#f6d69a" stop-opacity=".6"/><stop offset="1" stop-color="#f6d69a" stop-opacity="0"/></radialGradient>
<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".48" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".13"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter>
<pattern id="weave" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 0L18 18M-9 0L9 18M9 0L27 18" stroke="#cbb389" stroke-width="4"/><path d="M0 18L18 0M-9 18L9 0M9 18L27 0" stroke="#877047" stroke-width="3"/></pattern>
<clipPath id="leftwall"><path d="M0 190L409 261L433 918L0 1000Z"/></clipPath>
<clipPath id="rightwall"><path d="M1440 340L1920 230V1014L1440 878Z"/></clipPath>
</defs>
${rect(0, 0, 1920, 1200, "url(#sky)")}
<ellipse cx="1270" cy="355" rx="410" ry="310" fill="url(#sun)"/><circle cx="1250" cy="332" r="57" fill="#edd19a" opacity=".85"/>
${poly([[395,590],[630,428],[798,482],[1024,446],[1270,590]],"#bc9a7c")}
${poly([[750,614],[1040,461],[1170,506],[1359,430],[1630,637]],"#b28e72")}
${poly([[410,615],[635,477],[694,497],[645,520],[717,577],[790,590]],"#d1aa86")}
${poly([[1087,523],[1190,572],[1327,478],[1247,620]],"#ceab88")}
<g fill="#dbc4a0" opacity=".56"><path d="M437 228L535 224L558 214L616 226L736 235L703 244H472Z"/><path d="M1100 165H1185L1205 146L1239 159L1304 164L1390 181H1110Z"/><path d="M874 353L935 345L995 353L1097 357L961 363Z"/></g>
<g opacity=".72">${rect(463, 601, 143, 157, "#c3986c")}${rect(475, 581, 125, 23, "#ba8e62")}${window(504, 625, 30, 60)}${rect(1122, 580, 206, 220, "#cc9c67")}${rect(1160, 528, 134, 60, "#d4a870")}${window(1165, 615, 35, 58)}${window(1240, 615, 35, 58)}<path d="M1265 530V455" stroke="#665d44" stroke-width="4"/><path d="M1264 452L1320 471L1264 481" fill="#bf784b"/></g>
${rect(355, 717, 1135, 195, "#b78153")}${rect(349, 705, 1149, 20, "#d8a56d")}${rect(353, 727, 1143, 10, "#9b6b45")}
${patches(355,740,1120,160,125,["#deb279","#865b3d","#c59663"])}
${rect(0, 895, 1920, 305, "url(#earth)")}
<g fill="none" stroke="#70533d" stroke-width="2" opacity=".45"><path d="M0 980L1920 946M0 1094L1920 1036M180 1200L754 896M730 1200L953 896M1250 1200L1150 896M1875 1200L1365 896"/></g>
${poly([[0,1000],[514,900],[748,915],[324,1200],[0,1200]],"#594c38",'opacity=".3"')}
${poly([[1920,988],[1460,878],[1248,935],[1510,1200],[1920,1200]],"#61402c",'opacity=".3"')}
${poly([[0,190],[409,261],[433,918],[0,1000]],"url(#wall)")}
<g clip-path="url(#leftwall)">${patches(0,230,430,745,230,["#f0c388","#855e41","#b47b4f"])}<path d="M0 588L423 607M0 601L423 620" stroke="#946943" stroke-width="8"/>${window(52, 335, 80, 140)}${window(253, 358, 80, 128)}${window(78, 682, 84, 194,true)}${window(290, 677, 56, 130,true)}</g>
${poly([[0,170],[421,244],[430,268],[0,208]],"#805a3f")}${poly([[0,163],[423,237],[421,249],[0,181]],"#e1b777")}
${poly([[409,268],[474,298],[484,888],[432,920]],"#8e613e")}
<g stroke="#987143" fill="#e6b77b"><path d="M0 288L407 344" stroke-width="12"/><path d="M10 318L413 371" stroke-width="5"/></g>
${poly([[1440,340],[1920,230],[1920,1014],[1440,878]],"#b45c3f")}
<g clip-path="url(#rightwall)">${patches(1430,280,490,730,230,["#dc9765","#813f32","#dfad7a"])}<g stroke="#854e3b" stroke-width="3" opacity=".45">${Array.from({length:15},(_,i)=>`<path d="M1420 ${370+i*42}L1920 ${260+i*50}"/>`).join("")}</g></g>
${poly([[1421,332],[1920,218],[1920,245],[1440,359]],"#723f30")}${poly([[1416,320],[1920,208],[1920,225],[1418,344]],"#d8945c")}
${window(1532, 487, 114, 166, true)}${window(1768, 427, 112, 185, true)}
<path d="M1657 919V769Q1715 672 1772 761V949Z" fill="#613e2d"/><path d="M1671 918V776Q1714 706 1755 772V942Z" fill="#304b42"/><path d="M1713 744V933" stroke="#896a40" stroke-width="5"/>
<path d="M1471 685L1903 635L1920 664L1460 717Z" fill="#ce9564"/>
<path d="M1480 712L1917 659L1920 715L1480 768Z" fill="#593d2b" opacity=".3"/>
<path d="M1767 259V132M1750 142L1824 138" stroke="#695f42" stroke-width="4"/>
<g stroke="#ad8057" stroke-width="7"><path d="M484 714V823M531 714V823M578 714V823M625 714V823M672 714V823"/></g>
<path d="M460 722H694M460 807H694" stroke="#725435" stroke-width="6"/>
<g><path d="M0 830Q74 761 108 651T198 352Q232 263 310 166L287 147Q194 220 161 325L136 512Q94 617 0 660Z" fill="#423d2d"/><path d="M20 795L130 590L181 352L225 245L174 462L151 635L67 837Z" fill="#675037"/><path d="M159 424Q102 312 20 241L0 211Q120 271 182 374M182 333Q302 269 412 188L420 160Q286 205 203 287" fill="#423d2d"/></g>
`;
// Individually drawn canopy facets create a dry gouache colour study.
for (let i = 0; i < 550; i++) {
  const angle = rnd(0, Math.PI * 2), radius = Math.sqrt(rnd(0, 1));
  const x = 115 + Math.cos(angle) * radius * 500, y = 85 + Math.sin(angle) * radius * 335;
  const size = rnd(15, 48), palette = ["#283c30", "#354630", "#4d5633", "#697044", "#7f7c47", "#a18d51", "#253c33"];
  scene += poly([[x,y],[x+size*.55,y-size*.35],[x+size,y+size*.16],[x+size*.8,y+size*.8],[x+size*.25,y+size]],palette[Math.floor(rnd(0,palette.length))]);
}
scene += `<path d="M388 202Q1050 321 1539 324" fill="none" stroke="#67583c" stroke-width="3"/>`;
for (let i = 0; i < 34; i++) {
  const x = 405 + i * 33.4, t = i / 34, y = 207 + 168 * t - 50 * t * t;
  scene += `<path d="M${x} ${y}l-9 19 10 14 9-14Z" fill="${i % 3 === 0 ? "#ac6335" : "#d39a40"}"/><circle cx="${x}" cy="${y+7}" r="7" fill="#e0aa4b"/>`;
}
scene += `${pot(1468,913,1.2)}${pot(1845,1070,2.1)}${pot(380,962,1.25)}
<g transform="translate(488 972)"><path d="M-149 50L29-8L244 16L64 79Z" fill="#4c3928" opacity=".3"/><path d="M-141-40L15-76L161-49L4-7Z" fill="#97734c"/><path d="M-133-37L15-66L150-46L1-15Z" fill="url(#weave)"/><path d="M-141-40L-138 51M4-7L7 84M161-49L165 34M15-76L16-20" stroke="#694731" stroke-width="15"/><path d="M-142-40L3-6L163-49M-142-40L15-76L163-49" fill="none" stroke="#b08650" stroke-width="10"/></g>
<g transform="translate(1090 1050)"><ellipse cx="40" cy="45" rx="223" ry="65" fill="#57412f" opacity=".3"/><path d="M-174-67L33-115L224-56L11 9Z" fill="#987449"/><path d="M-160-65L33-104L208-53L12-1Z" fill="url(#weave)"/><path d="M-174-67L-166 54M11 9L14 113M224-56L224 65M33-115L36-48" stroke="#64442c" stroke-width="18"/><path d="M-175-67L12 10L225-56M-174-67L33-115L224-56" fill="none" stroke="#ad8050" stroke-width="14"/>
<path d="M-80-47L27-72L81-49L-21-20Z" fill="#e4cf9d"/><path d="M-68-44L-20-28M-53-48L-4-32M-38-52L11-36" stroke="#af6443" stroke-width="3"/>
${tea(137,-59,.9)}${tea(-111,-73,.8)}</g>
<g transform="translate(260 958)"><path d="M-81-22L68-49L99-24L-51 8Z" fill="#6e4d34"/><path d="M-74-20V66M81-20V47M-50 5V90" stroke="#523e2b" stroke-width="10"/>${tea(29,-31,.95)}<path d="M-48-63Q-70-47-56-31Q-29-22-12-40L-15-60Z" fill="#ad7750"/><ellipse cx="-31" cy="-64" rx="18" ry="7" fill="#6b4c35"/><path d="M-51-55Q-81-78-73-40L-57-38" fill="none" stroke="#ad7750" stroke-width="8"/></g>
<path d="M941 302Q952 291 963 302Q973 290 984 300M1040 254Q1048 246 1057 254Q1066 248 1074 253" stroke="#576568" stroke-width="3" fill="none" opacity=".7"/>
${patches(0,930,1920,260,160,["#b78b59","#dfad72","#5e4635"])}
${rect(0,0,1920,1200,"transparent",'filter="url(#paper)"')}
</svg>`;
writeFileSync(resolve(output, "courtyard.svg"), scene);

// Recompose the same courtyard for a tall screen. Keep the shutters and neem
// at its edges rather than cropping them out of a landscape painting.
let portrait = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="1365" viewBox="0 0 768 1365">${scene.slice(scene.indexOf("<defs>"), scene.indexOf("</defs>") + 7)}
${rect(0, 0, 768, 1365, "url(#sky)")}
<circle cx="590" cy="295" r="50" fill="#edd19a" opacity=".72"/>
${poly([[0,670],[148,534],[274,594],[405,511],[602,624],[768,565],[768,990],[0,990]],"#b99b7a")}
${poly([[238,700],[380,585],[489,622],[554,691]],"#d2af85")}
${rect(100,765,560,244,"#b78153")}${rect(96,750,570,20,"#d5a26b")}
${patches(110,785,550,210,65,["#deb279","#865b3d","#c59663"])}
${rect(0,995,768,370,"url(#earth)")}
<path d="M0 1090L768 1040M0 1215L768 1150M80 1365L291 995M600 1365L510 995" stroke="#75563d" stroke-width="3" opacity=".4"/>
${poly([[0,351],[151,383],[160,1020],[0,1080]],"#c18a54")}
${patches(0,395,145,620,80,["#edbd81","#8b6341","#a7774c"])}
<path d="M0 338L155 374L153 394L0 359" fill="#e1b777"/>
${window(33,494,72,135,true)}${window(50,774,69,178,true)}
${poly([[604,408],[768,343],[768,1083],[604,1011]],"#b45c3f")}
${patches(610,440,158,550,80,["#dc9765","#813f32","#dfad7a"])}
<path d="M594 399L768 332V352L599 424Z" fill="#d8945c"/>
${window(662,553,79,166,true)}
<path d="M654 1030V860Q702 793 746 860V1073Z" fill="#583e2d"/><path d="M668 1037V870Q701 822 732 870V1062Z" fill="#304b42"/><path d="M699 848V1047" stroke="#93794e" stroke-width="4"/>
<path d="M-15 907Q65 694 72 389Q83 266 161 136L137 111Q50 236 43 389L27 609L-15 734Z" fill="#423d2d"/>
<path d="M49 432Q19 328-33 282M68 331Q153 256 204 170" stroke="#423d2d" fill="none" stroke-width="18"/>
`;
for (let i=0;i<240;i++) {
  const angle=rnd(0,Math.PI*2), radius=Math.sqrt(rnd(0,1));
  const x=52+Math.cos(angle)*radius*275, y=40+Math.sin(angle)*radius*235, size=rnd(15,37);
  const colors=["#283c30","#354630","#4d5633","#697044","#7f7c47","#a18d51"];
  portrait+=poly([[x,y],[x+size*.6,y-size*.3],[x+size,y+size*.2],[x+size*.7,y+size],[x+size*.1,y+size*.8]],colors[Math.floor(rnd(0,colors.length))]);
}
portrait+=`<path d="M152 255Q429 330 693 277" stroke="#786344" stroke-width="3" fill="none"/>`;
for(let i=0;i<19;i++) {
  const x=169+i*28, t=i/18, y=260+75*t-60*t*t;
  portrait+=`<path d="M${x} ${y}l-7 15 7 11 7-11Z" fill="${i%3 ? "#d3a046" : "#ad6939"}"/>`;
}
portrait+=`${pot(135,1070,.8)}${pot(737,1200,1.2)}
<g transform="translate(420 1180)"><path d="M-164-35L30-76L211-30L10 20Z" fill="#97734c"/><path d="M-152-33L30-66L195-29L10 9Z" fill="url(#weave)"/><path d="M-164-35L-160 41M10 20L14 100M211-30L211 44" stroke="#694731" stroke-width="13"/><path d="M-164-35L10 20L211-30M-164-35L30-76L211-30" fill="none" stroke="#b08650" stroke-width="9"/>${tea(107,-40,.85)}</g>
${patches(0,1080,768,280,50,["#b78b59","#dfad72","#5e4635"])}
${rect(0,0,768,1365,"transparent",'filter="url(#paper)"')}
</svg>`;
writeFileSync(resolve(output, "courtyard-portrait.svg"), portrait);


