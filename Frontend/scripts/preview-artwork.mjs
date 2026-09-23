// Shared geometry and palette are the only values to change for a consistent redesign.
const LAYOUT = { width: 960, height: 540, windowX: 60, windowY: 44, windowW: 840, windowH: 452, topbarH: 44 };
const PALETTES = {
  engineering: { background: "#e7ebf7", background2: "#f5f6fc", ink: "#242943", muted: "#7c8298", accent: "#6968b9", accentSoft: "#ecebfa", border: "#dce0eb", surface: "#ffffff" },
  design: { background: "#f0e9f5", background2: "#faf6fb", ink: "#383043", muted: "#8d8298", accent: "#8668a0", accentSoft: "#f0e9f5", border: "#e5dfe8", surface: "#ffffff" },
  healthcare: { background: "#e9f3f0", background2: "#f7fbf9", ink: "#25433f", muted: "#80938d", accent: "#538f82", accentSoft: "#e9f5ef", border: "#dce9e3", surface: "#ffffff" },
  sales: { background: "#eaf2ed", background2: "#f7fbf8", ink: "#25493c", muted: "#7f9589", accent: "#568a70", accentSoft: "#e8f4eb", border: "#dce9e0", surface: "#ffffff" },
  marketing: { background: "#f5eaf0", background2: "#fcf8fa", ink: "#4b3543", muted: "#9b8592", accent: "#ad7895", accentSoft: "#f7eaf1", border: "#eadfe6", surface: "#ffffff" },
  data: { background: "#e7eef6", background2: "#f6f9fc", ink: "#263f59", muted: "#8394a5", accent: "#5e85ad", accentSoft: "#e8f1fa", border: "#dce6ef", surface: "#ffffff" },
  finance: { background: "#e9f1e8", background2: "#f7faf6", ink: "#294734", muted: "#839484", accent: "#628e66", accentSoft: "#e9f4e8", border: "#dfe9dd", surface: "#ffffff" },
  product: { background: "#e9edf6", background2: "#f8f9fc", ink: "#323d58", muted: "#8992a5", accent: "#727ea9", accentSoft: "#eef0f9", border: "#e0e5ef", surface: "#ffffff" },
  operations: { background: "#f1ece5", background2: "#fbf9f6", ink: "#514437", muted: "#9c8f80", accent: "#9b8061", accentSoft: "#f7efe6", border: "#eae2d8", surface: "#ffffff" },
  support: { background: "#e8f1f4", background2: "#f7fafb", ink: "#29454f", muted: "#83989e", accent: "#5d929c", accentSoft: "#e6f3f5", border: "#dce9ed", surface: "#ffffff" },
  people: { background: "#f5eae7", background2: "#fcf8f7", ink: "#51403b", muted: "#a0928d", accent: "#aa7d71", accentSoft: "#f8ede9", border: "#ede2df", surface: "#ffffff" },
  education: { background: "#f5efe2", background2: "#fcfaf5", ink: "#4f4532", muted: "#a39a84", accent: "#ab9161", accentSoft: "#f8f1e2", border: "#ebe5d8", surface: "#ffffff" },
  legal: { background: "#ececf2", background2: "#f9f9fb", ink: "#353b50", muted: "#8e93a4", accent: "#767f9a", accentSoft: "#eef0f6", border: "#e1e4ec", surface: "#ffffff" },
  security: { background: "#e7edf1", background2: "#f6f9fa", ink: "#283d49", muted: "#82949e", accent: "#5c8291", accentSoft: "#e8f1f4", border: "#dae5e9", surface: "#ffffff" },
  logistics: { background: "#edf0e8", background2: "#f9faf6", ink: "#424d39", muted: "#939b87", accent: "#849668", accentSoft: "#eef4e7", border: "#e1e9da", surface: "#ffffff" },
  general: { background: "#edf2ee", background2: "#f9fbf9", ink: "#304840", muted: "#8d9c92", accent: "#668f78", accentSoft: "#eaf4ec", border: "#dfe9e2", surface: "#ffffff" },
};

const rect = (x, y, w, h, fill, r = 0, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const line = (x, y, w, color = "var(--line)", h = 7) => rect(x, y, w, h, color, h / 2);
const label = (x, y, text, size = 12, fill = "var(--ink)", weight = 500, extra = "") =>
  `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" ${extra}>${text}</text>`;
const avatar = (x, y, fill, initials) => `<circle cx="${x}" cy="${y}" r="16" fill="${fill}"/>${label(x, y + 4, initials, 10, "var(--ink)", 700, 'text-anchor="middle"')}`;

function frame(category, appName, section, content) {
  const p = PALETTES[category];
  const { width, height, windowX, windowY, windowW, windowH, topbarH } = LAYOUT;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${appName} interface preview</title>
  <desc id="desc">Illustrative fictional ${category} application interface; not a screenshot of an employer product.</desc>
  <style>
    /* Edit these palette tokens to restyle this sample. Geometry lives in LAYOUT in the generator. */
    svg { --bg:${p.background}; --bg2:${p.background2}; --ink:${p.ink}; --muted:${p.muted}; --accent:${p.accent}; --accent-soft:${p.accentSoft}; --border:${p.border}; --surface:${p.surface}; --line:${p.border}; font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
  </style>
  <defs>
    <linearGradient id="backdrop" x2="1" y2="1"><stop stop-color="var(--bg)"/><stop offset="1" stop-color="var(--bg2)"/></linearGradient>
    <linearGradient id="panel" x2="0" y2="1"><stop stop-color="var(--surface)"/><stop offset="1" stop-color="var(--bg2)"/></linearGradient>
    <filter id="windowShadow" x="-20%" y="-25%" width="140%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="23" flood-color="var(--ink)" flood-opacity=".14"/></filter>
    <filter id="cardShadow" x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="var(--ink)" flood-opacity=".07"/></filter>
    <clipPath id="windowClip"><rect x="${windowX}" y="${windowY}" width="${windowW}" height="${windowH}" rx="18"/></clipPath>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#backdrop)"/>
  <circle cx="858" cy="75" r="188" fill="var(--surface)" opacity=".26"/>
  <circle cx="80" cy="517" r="169" fill="var(--accent)" opacity=".045"/>
  <rect x="${windowX}" y="${windowY}" width="${windowW}" height="${windowH}" rx="18" fill="var(--surface)" filter="url(#windowShadow)"/>
  <g clip-path="url(#windowClip)">
    <rect x="${windowX}" y="${windowY}" width="${windowW}" height="${topbarH}" fill="var(--surface)"/>
    <path d="M${windowX} ${windowY + topbarH}H${windowX + windowW}" stroke="var(--border)"/>
    <circle cx="84" cy="66" r="5" fill="#ed9c9c"/><circle cx="101" cy="66" r="5" fill="#e8c27d"/><circle cx="118" cy="66" r="5" fill="#9cc9ad"/>
    ${label(148, 71, appName, 12, "var(--ink)", 700)}
    ${label(837, 71, section, 11, "var(--muted)", 500, 'text-anchor="end"')}
    ${content}
  </g>
  <rect x="${windowX}" y="${windowY}" width="${windowW}" height="${windowH}" rx="18" fill="none" stroke="var(--border)"/>
</svg>`;
}

// One six-second timeline per hovered card. The document is mounted only while visible.
function motionPointer(category) {
  const destinations = {
    design: [174, 196, 565, 286], healthcare: [365, 316, 807, 273],
    sales: [522, 293, 657, 251], marketing: [490, 278, 599, 231],
    data: [500, 292, 657, 251], finance: [484, 298, 599, 231],
    product: [384, 264, 616, 328], operations: [389, 265, 616, 328],
    support: [384, 264, 616, 328], people: [384, 264, 616, 328],
    education: [384, 264, 616, 328], legal: [384, 264, 616, 328],
    security: [384, 264, 616, 328], logistics: [384, 264, 616, 328],
    general: [384, 264, 616, 328],
  };
  const [x1, y1, x2, y2] = destinations[category];
  return {
    markup: `<g class="motion-pointer"><path d="M0 0v25l7-7 6 13 5-2-6-13h12Z" fill="#fff" stroke="#283044" stroke-width="2" stroke-linejoin="round"/><circle class="motion-tap" cx="2" cy="2" r="10" fill="none" stroke="#fff" stroke-width="2"/></g>`,
    css: `.motion-pointer{animation:pointerRoute 6s ease-in-out infinite;filter:drop-shadow(0 3px 4px #151c3760)}.motion-tap{animation:pointerTap 6s ease-out infinite;transform-origin:2px 2px}@keyframes pointerRoute{0%{transform:translate(782px,407px)}23%{transform:translate(${x1}px,${y1}px)}56%,76%{transform:translate(${x2}px,${y2}px)}100%{transform:translate(782px,407px)}}@keyframes pointerTap{0%,52%,60%,100%{opacity:0;transform:scale(.4)}56%{opacity:.8;transform:scale(1.5)}59%{opacity:0;transform:scale(2)}}`,
  };
}

function rowMotionCss(count) {
  return Array.from({ length: count }, (_, i) => {
    const start = 8 + i * 13;
    return `.motion-row-${i + 1}{animation:row${i + 1} 6s ease-out infinite}@keyframes row${i + 1}{0%,${start}%{opacity:.32;transform:translateY(5px)}${start + 8}%,91%{opacity:1;transform:translateY(0)}100%{opacity:.32;transform:translateY(5px)}}`;
  }).join("");
}

function motionSvg(svg, css) {
  const shared = `
    /* One six-second loop; the host unmounts this document on card leave. */
    ${css}
    @media(prefers-reduced-motion:reduce){.motion-pointer,.motion-tap{display:none}.motion-row,.motion-layer,.motion-swatch,.motion-art,.motion-line,.motion-area,.motion-bar,.motion-dot,.motion-fill,.motion-kpi,.motion-calendar,.motion-trace,.motion-scan{animation:none!important;opacity:1!important;transform:none!important;stroke-dashoffset:0!important}}
  `;
  return svg.replace("</style>", `${shared}</style>`);
}

function engineering(animated = false) {
  const code = [
    [184, "01", "import", " { useJobs } ", "from", " '@work/api'"],
    [212, "02", "export", " function ", "JobBoard", "() {"],
    [240, "03", "  const ", "{ jobs, loading }", " = ", "useJobs()"],
    [268, "04", "  return", " jobs.map(job => (", "", ""],
    [296, "05", "    &lt;Card ", "key={job.id}", " ", "job={job}", " /&gt;"],
    [324, "06", "  ))", "", "", ""],
  ].map(([y, n, a, b, c, d], index) => {
    const content = `${label(250, Number(y), String(n), 12, "#a2a9bb", 400)}${label(290, Number(y), String(a), 13, "#a78ad1", 500)}${label(290 + String(a).length * 7.2, Number(y), String(b), 13, "#dce4f6", 400)}${label(290 + (String(a).length + String(b).length) * 7.2, Number(y), String(c), 13, "#8bcac0", 500)}${label(290 + (String(a).length + String(b).length + String(c).length) * 7.2, Number(y), String(d), 13, "#e7c48d", 400)}`;
    return animated ? `<g class="motion-code motion-code-${index + 1}">${content}</g>` : content;
  }).join("");
  const content = `
    ${rect(60, 88, 170, 408, "#f7f8fc")}
    <path d="M230 88v408" stroke="var(--border)"/>
    ${label(85, 126, "EXPLORER", 10, "var(--muted)", 700, 'letter-spacing="1.8"')}
    ${label(86, 162, "▾  src", 12, "var(--ink)", 600)}
    ${label(103, 191, "◇  components", 11, "var(--muted)")}
    ${rect(72, 206, 148, 31, "var(--accent-soft)", 6)}
    ${label(103, 226, "▣  JobBoard.tsx", 11, "var(--accent)", 700)}
    ${label(103, 259, "◇  api.ts", 11, "var(--muted)")}
    ${label(86, 304, "▾  public", 12, "var(--ink)", 600)}
    ${label(103, 332, "▧  assets", 11, "var(--muted)")}
    ${rect(230, 88, 670, 35, "#fbfbfd")}
    ${rect(244, 96, 144, 27, "var(--surface)", 5)}
    ${label(263, 115, "JobBoard.tsx", 11, "var(--ink)", 600)}
    ${label(857, 111, "⌘  K", 11, "var(--muted)", 500, 'text-anchor="end"')}
    ${rect(230, 123, 670, 259, "#252b3e")}
    ${rect(230, 123, 48, 259, "#202638")}
    ${code}
    ${rect(230, 382, 670, 114, "#f9fafc")}
    <path d="M230 382h670" stroke="var(--border)"/>
    ${label(253, 407, "TERMINAL", 10, "var(--accent)", 700, 'letter-spacing="1.5"')}
    ${animated ? `<g class="motion-success">${label(253, 433, "✓  Compiled successfully in 842ms", 12, "#518a78", 600)}</g>` : label(253, 433, "✓  Compiled successfully in 842ms", 12, "#518a78", 600)}
    ${label(253, 456, "local: http://localhost:3000", 11, "var(--muted)")}
    ${rect(740, 397, 125, 26, "var(--accent-soft)", 13)}
    ${label(802, 414, "All checks passed", 10, "var(--accent)", 700, 'text-anchor="middle"')}
    ${animated ? `<rect x="253" y="475" width="230" height="4" rx="2" fill="var(--accent-soft)"/><rect class="motion-progress" x="253" y="475" width="230" height="4" rx="2" fill="var(--accent)"/><g class="motion-cursor"><path d="M0 0v25l7-7 6 13 5-2-6-13h12Z" fill="#fff" stroke="#283044" stroke-width="2" stroke-linejoin="round"/><circle class="motion-click" cx="2" cy="2" r="10" fill="none" stroke="#fff" stroke-width="2"/></g>` : ""}
  `;
  const svg = frame("engineering", "Northstar Studio", "Engineering workspace", content);
  if (!animated) return svg;
  const reveal = Array.from({ length: 6 }, (_, i) => {
    const start = 6 + i * 10;
    return `@keyframes codeLine${i + 1} { 0%,${start}% { opacity:0; transform:translateY(4px) } ${start + 7}%,91% { opacity:1; transform:translateY(0) } 99%,100% { opacity:0; transform:translateY(0) } } .motion-code-${i + 1} { animation:codeLine${i + 1} 6s ease-out infinite; }`;
  }).join("\n");
  const motionCss = `
    /* Motion is only active while the host mounts this SVG on hover. */
    ${reveal}
    .motion-code, .motion-cursor, .motion-progress, .motion-success { will-change:transform,opacity; }
    .motion-cursor { animation:cursorMove 6s ease-in-out infinite; filter:drop-shadow(0 3px 4px #151c3770); }
    .motion-click { animation:cursorClick 6s ease-out infinite; transform-origin:2px 2px; }
    .motion-progress { transform-box:fill-box; transform-origin:left center; animation:progressFill 6s ease-in-out infinite; }
    .motion-success { animation:successAppear 6s ease-out infinite; }
    @keyframes cursorMove { 0% {transform:translate(710px,350px)} 21% {transform:translate(565px,300px)} 38% {transform:translate(452px,218px)} 54% {transform:translate(535px,280px)} 75%,91% {transform:translate(777px,409px)} 100% {transform:translate(710px,350px)} }
    @keyframes cursorClick { 0%,72%,78%,100% {opacity:0;transform:scale(.4)} 74% {opacity:.85;transform:scale(1.5)} 77% {opacity:0;transform:scale(2)} }
    @keyframes progressFill { 0%,13% {transform:scaleX(.03)} 72%,91% {transform:scaleX(1)} 100% {transform:scaleX(.03)} }
    @keyframes successAppear { 0%,67% {opacity:.2} 74%,92% {opacity:1} 100% {opacity:.2} }
    @media (prefers-reduced-motion:reduce) { .motion-code,.motion-cursor,.motion-progress,.motion-success,.motion-click {animation:none!important} .motion-cursor,.motion-click {display:none} .motion-progress {transform:scaleX(1)} }
  `;
  return svg.replace("</style>", `${motionCss}</style>`);
}

function design(animated = false) {
  const pointer = animated ? motionPointer("design") : null;
  const content = `
    ${rect(60, 88, 166, 408, "#faf8fc")}
    <path d="M226 88v408" stroke="var(--border)"/>
    ${label(82, 125, "LAYERS", 10, "var(--muted)", 700, 'letter-spacing="1.8"')}
    ${label(83, 163, "⌄  Landing page", 12, "var(--ink)", 650)}
    ${animated ? '<g class="motion-layer motion-layer-1">' : ""}${rect(72, 181, 143, 31, "var(--accent-soft)", 6)}
    ${label(98, 201, "▣  Hero section", 11, "var(--accent)", 700)}
    ${animated ? '</g><g class="motion-layer motion-layer-2">' : ""}${label(99, 235, "▧  Navigation", 11, "var(--muted)")}${animated ? '</g><g class="motion-layer motion-layer-3">' : ""}
    ${label(99, 266, "▧  Feature cards", 11, "var(--muted)")}${animated ? '</g>' : ""}
    ${label(84, 310, "ASSETS", 10, "var(--muted)", 700, 'letter-spacing="1.8"')}
    ${animated ? '<g class="motion-swatch motion-swatch-1">' : ""}${rect(85, 326, 52, 49, "#d9d3e5", 7)}${animated ? '</g><g class="motion-swatch motion-swatch-2">' : ""}${rect(148, 326, 52, 49, "#e7cbbf", 7)}${animated ? '</g>' : ""}
    ${rect(226, 88, 504, 408, "#e9e6ed")}
    ${rect(283, 130, 393, 321, "var(--surface)", 11, 'filter="url(#cardShadow)"')}
    ${label(306, 157, "forma", 17, "var(--ink)", 800)}
    ${label(576, 155, "Work     Studio     About", 8, "var(--muted)", 600)}
    ${rect(306, 181, 346, 245, "#f6f0eb", 8)}
    ${label(325, 220, "A calmer way", 25, "var(--ink)", 750)}
    ${label(325, 249, "to create.", 25, "var(--ink)", 750)}
    ${line(325, 273, 132, "#d9cbc3", 6)}${line(325, 286, 105, "#d9cbc3", 6)}
    ${rect(325, 313, 92, 30, "var(--accent)", 15)}
    ${label(371, 332, "Explore work", 9, "#ffffff", 700, 'text-anchor="middle"')}
    ${animated ? '<g class="motion-art">' : ""}${rect(492, 211, 130, 154, "#e6dce9", 15, 'transform="rotate(7 557 288)" filter="url(#cardShadow)"')}
    ${rect(509, 224, 111, 133, "#a88cba", 13, 'transform="rotate(-6 564 291)" filter="url(#cardShadow)"')}
    <circle cx="565" cy="282" r="33" fill="#e8d6ca"/><path d="M531 339c10-34 60-40 71 0" fill="#594e62"/>${animated ? '</g>' : ""}
    ${rect(730, 88, 170, 408, "#faf8fc")}
    <path d="M730 88v408" stroke="var(--border)"/>
    ${label(750, 125, "PROPERTIES", 10, "var(--muted)", 700, 'letter-spacing="1.8"')}
    ${label(751, 163, "Hero section", 12, "var(--ink)", 700)}
    ${label(751, 198, "Layout", 10, "var(--muted)", 650)}
    ${rect(751, 210, 57, 28, "var(--surface)", 5, 'stroke="var(--border)"')}
    ${rect(818, 210, 57, 28, "var(--surface)", 5, 'stroke="var(--border)"')}
    ${label(779, 228, "393", 10, "var(--ink)", 600, 'text-anchor="middle"')}
    ${label(846, 228, "321", 10, "var(--ink)", 600, 'text-anchor="middle"')}
    ${label(751, 273, "Palette", 10, "var(--muted)", 650)}
    <circle cx="762" cy="296" r="11" fill="#8668a0"/><circle cx="793" cy="296" r="11" fill="#e7cbbf"/><circle cx="824" cy="296" r="11" fill="#594e62"/><circle cx="855" cy="296" r="11" fill="#f6f0eb"/>
    ${label(751, 349, "Typography", 10, "var(--muted)", 650)}
    ${line(751, 367, 111, "#d6d0dc", 8)}${line(751, 385, 78, "#ded9e2", 7)}
    ${pointer?.markup || ""}
  `;
  const svg = frame("design", "Forma Design", "Untitled / landing", content);
  if (!animated) return svg;
  return motionSvg(svg, `${pointer.css}${rowMotionCss(3).replaceAll("motion-row", "motion-layer")}.motion-swatch{animation:swatchIn 6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.motion-swatch-2{animation-delay:-.4s}@keyframes swatchIn{0%,12%{opacity:.2;transform:scale(.82)}23%,91%{opacity:1;transform:scale(1)}100%{opacity:.2;transform:scale(.82)}}.motion-art{animation:artFloat 6s ease-in-out infinite}@keyframes artFloat{0%,100%{transform:translateY(5px)}45%,78%{transform:translateY(-4px)}}`);
}

function healthcare(animated = false) {
  const pointer = animated ? motionPointer("healthcare") : null;
  const rows = [
    [318, "#d9e8e3", "AL", "Ava Lewis", "09:15 AM", "Confirmed", "#e7f4ec", "#4d8973"],
    [375, "#e9e0d8", "JR", "James Reed", "10:30 AM", "Check-in", "#f9efe4", "#a57950"],
    [432, "#e3e1ef", "MP", "Mia Patel", "11:45 AM", "Confirmed", "#e7f4ec", "#4d8973"],
  ].map(([y, color, initials, name, time, status, bg, ink], index) => `
    ${animated ? `<g class="motion-row motion-row-${index + 1}">` : ""}
    ${rect(279, Number(y)-24, 402, 49, "var(--surface)", 10, 'stroke="var(--border)"')}
    ${avatar(309, Number(y), String(color), String(initials))}
    ${label(339, Number(y)-2, String(name), 11, "var(--ink)", 700)}
    ${label(339, Number(y)+12, "Follow-up consultation", 9, "var(--muted)")}
    ${label(526, Number(y)+4, String(time), 10, "var(--muted)", 600)}
    ${rect(582, Number(y)-11, 83, 22, String(bg), 11)}
    ${label(623, Number(y)+3, String(status), 9, String(ink), 700, 'text-anchor="middle"')}
    ${animated ? '</g>' : ""}
  `).join("");
  const content = `
    ${rect(60, 88, 178, 408, "#f8fbf9")}
    <path d="M238 88v408" stroke="var(--border)"/>
    ${rect(82, 112, 30, 30, "var(--accent)", 8)}
    ${label(97, 133, "+", 22, "#ffffff", 600, 'text-anchor="middle"')}
    ${label(120, 132, "wellnest", 15, "var(--ink)", 750)}
    ${label(85, 184, "WORKSPACE", 10, "var(--muted)", 700, 'letter-spacing="1.5"')}
    ${rect(75, 200, 150, 35, "var(--accent-soft)", 7)}
    ${label(96, 223, "▦  Overview", 11, "var(--accent)", 700)}
    ${label(96, 262, "▤  Appointments", 11, "var(--muted)")}
    ${label(96, 299, "○  Patients", 11, "var(--muted)")}
    ${label(96, 336, "◫  Care plans", 11, "var(--muted)")}
    ${rect(238, 88, 662, 408, "#fcfefd")}
    ${label(276, 137, "Good morning, Dr. Morgan", 21, "var(--ink)", 750)}
    ${label(276, 158, "Here is what your day looks like.", 11, "var(--muted)")}
    ${rect(750, 111, 116, 30, "var(--accent)", 15)}
    ${label(808, 131, "+ New visit", 10, "#ffffff", 700, 'text-anchor="middle"')}
    ${rect(276, 182, 183, 70, "var(--surface)", 10, 'stroke="var(--border)" filter="url(#cardShadow)"')}
    ${label(293, 206, "Appointments", 10, "var(--muted)", 650)}
    ${label(293, 236, "12", 23, "var(--ink)", 750)}
    ${rect(471, 182, 183, 70, "var(--surface)", 10, 'stroke="var(--border)" filter="url(#cardShadow)"')}
    ${label(488, 206, "Checked in", 10, "var(--muted)", 650)}
    ${label(488, 236, "08", 23, "var(--ink)", 750)}
    ${label(278, 271, "Upcoming appointments", 12, "var(--ink)", 700)}
    ${rows}
    ${rect(702, 182, 166, 274, "var(--surface)", 10, 'stroke="var(--border)" filter="url(#cardShadow)"')}
    ${label(720, 210, "Today · May 14", 11, "var(--ink)", 700)}
    ${label(722, 246, "M   T   W   T   F", 10, "var(--muted)", 650)}
    ${[725,753,781,809,837].map((x,i) => `${animated && i===2 ? '<g class="motion-calendar">' : ""}${rect(x, 260, 22, 23, i===2?"var(--accent)":"var(--accent-soft)", 7)}${label(x+11, 276, String(12+i), 9, i===2?"#ffffff":"var(--ink)", 650, 'text-anchor="middle"')}${animated && i===2 ? '</g>' : ""}`).join("")}
    ${label(721, 318, "Next visit", 10, "var(--muted)", 650)}
    ${avatar(739, 350, "#d9e8e3", "AL")}
    ${label(766, 347, "Ava Lewis", 10, "var(--ink)", 700)}
    ${label(766, 363, "09:15 AM", 9, "var(--muted)")}
    ${rect(719, 394, 131, 29, "var(--accent-soft)", 8)}
    ${label(784, 413, "View schedule →", 10, "var(--accent)", 700, 'text-anchor="middle"')}
    ${pointer?.markup || ""}
  `;
  const svg = frame("healthcare", "Wellnest Care", "Care workspace", content);
  if (!animated) return svg;
  return motionSvg(svg, `${pointer.css}${rowMotionCss(3)}.motion-calendar{animation:calendarPulse 6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes calendarPulse{0%,28%,100%{transform:scale(1)}40%,48%{transform:scale(1.16)}}`);
}

// Field-specific content; shared layout primitives keep the full set visually coherent.
const PRODUCTS = {
  engineering: { app: "Northstar Studio", area: "Engineering", heading: "Release activity", metric: "48", unit: "merged changes", rows: ["JobBoard.tsx · refined search", "API gateway · cache update", "Design system · card states"], side: "Deployment health", second: "99.9%", notes: ["Build passed", "Preview ready"] },
  design: { app: "Forma Design", area: "Design", heading: "Recent projects", metric: "24", unit: "active artboards", rows: ["Landing page · final review", "Mobile flow · new prototype", "Brand kit · updated tokens"], side: "Review status", second: "08", notes: ["Components synced", "Ready for handoff"] },
  healthcare: { app: "Wellnest Care", area: "Care", heading: "Care plans", metric: "12", unit: "visits today", rows: ["Ava Lewis · follow-up", "James Reed · annual exam", "Mia Patel · consultation"], side: "Clinic capacity", second: "78%", notes: ["9 rooms available", "2 urgent slots"] },
  sales: { app: "Relay Revenue", area: "Sales", heading: "Pipeline overview", metric: "$842k", unit: "open pipeline", rows: ["Northwind · discovery", "Horizon Labs · proposal", "Meridian · negotiation"], side: "Win rate", second: "34.8%", notes: ["12 meetings this week", "5 deals closing soon"], chart: "line" },
  marketing: { app: "Mosaic Campaigns", area: "Marketing", heading: "Campaign performance", metric: "248k", unit: "total reach", rows: ["Autumn launch · live", "Product story · scheduled", "Community digest · draft"], side: "Conversion", second: "5.6%", notes: ["4 channels active", "Audience +18%"], chart: "bars" },
  data: { app: "Meridian Analytics", area: "Data insights", heading: "Analytics overview", metric: "1.28m", unit: "events processed", rows: ["Revenue model · refreshed", "Cohort analysis · shared", "Retention view · updated"], side: "Query health", second: "98.4%", notes: ["14 dashboards", "Data fresh 2 min ago"], chart: "line" },
  finance: { app: "Cedar Finance", area: "Finance", heading: "Financial overview", metric: "$1.24m", unit: "net revenue", rows: ["Quarterly close · on track", "Expense review · 8 items", "Forecast · updated"], side: "Cash flow", second: "+12.4%", notes: ["6 reports ready", "Next close in 4 days"], chart: "bars" },
  product: { app: "Orbit Product", area: "Product", heading: "Roadmap", metric: "18", unit: "active initiatives", rows: ["Search experience · in progress", "Onboarding v2 · planned", "Mobile navigation · review"], side: "Cycle progress", second: "72%", notes: ["4 teams aligned", "Release on Friday"], layout: "board" },
  operations: { app: "Atlas Operations", area: "Operations", heading: "Team operations", metric: "32", unit: "workflows running", rows: ["Vendor intake · approved", "Office expansion · tracking", "Budget review · in progress"], side: "Service level", second: "96%", notes: ["8 tasks due today", "3 approvals needed"], layout: "board" },
  support: { app: "Harbor Support", area: "Customer support", heading: "Support inbox", metric: "86", unit: "conversations", rows: ["Avery · billing question", "Sam · setup assistance", "Taylor · feature request"], side: "First response", second: "4m", notes: ["92% satisfaction", "12 agents online"], layout: "inbox" },
  people: { app: "Kinship People", area: "People", heading: "Hiring pipeline", metric: "28", unit: "active candidates", rows: ["Product Designer · interview", "Data Analyst · screening", "Support Lead · offer"], side: "Open roles", second: "09", notes: ["6 interviews today", "2 offers pending"], layout: "board" },
  education: { app: "Lumina Learning", area: "Education", heading: "Learning dashboard", metric: "312", unit: "active learners", rows: ["Design systems · lesson 04", "Data basics · live cohort", "Intro to coding · new quiz"], side: "Completion", second: "81%", notes: ["18 courses live", "Next session 2:00 PM"], layout: "courses" },
  legal: { app: "Accord Legal", area: "Legal", heading: "Matter workspace", metric: "42", unit: "open matters", rows: ["Supplier agreement · review", "Policy update · signature", "NDA request · approved"], side: "Review queue", second: "07", notes: ["3 due this week", "All files encrypted"], layout: "documents" },
  security: { app: "Sentinel Secure", area: "Security", heading: "Security overview", metric: "98.6", unit: "security score", rows: ["Login anomaly · triaged", "Endpoint scan · clean", "Policy check · complete"], side: "Active alerts", second: "03", notes: ["24 systems monitored", "Last scan 3 min ago"], layout: "signals" },
  logistics: { app: "Waypoint Logistics", area: "Logistics", heading: "Shipment control", metric: "1,284", unit: "shipments in transit", rows: ["Route A12 · in transit", "Route B08 · at hub", "Route C24 · delivered"], side: "On-time rate", second: "97.2%", notes: ["38 vehicles active", "5 hubs connected"], layout: "routes" },
  general: { app: "Pathfinder Work", area: "Careers", heading: "Opportunity board", metric: "284", unit: "open opportunities", rows: ["New role · applications open", "Team update · posted today", "Career path · explore roles"], side: "New this week", second: "36", notes: ["Explore opportunities", "Find your next role"], layout: "board" },
};

function sidebar(item, active = "Overview") {
  const entries = [active, item.layout === "inbox" ? "Conversations" : item.layout === "routes" ? "Shipments" : "Projects", "Reports", "Settings"];
  return `
    ${rect(60, 88, 176, 408, "#fafbfc")}
    <path d="M236 88v408" stroke="var(--border)"/>
    ${rect(80, 108, 30, 30, "var(--accent)", 8)}
    ${label(95, 129, item.app.slice(0, 1), 16, "#ffffff", 750, 'text-anchor="middle"')}
    ${label(119, 128, item.app.split(" ")[0], 14, "var(--ink)", 750)}
    ${label(84, 183, item.area.toUpperCase(), 9, "var(--muted)", 700, 'letter-spacing="1.4"')}
    ${entries.map((entry, index) => `${index === 0 ? rect(75, 198, 150, 35, "var(--accent-soft)", 7) : ""}${label(95, 222 + index * 41, ["▦", "▤", "▥", "⚙"][index] + "  " + entry, 11, index === 0 ? "var(--accent)" : "var(--muted)", index === 0 ? 700 : 500)}`).join("")}
    ${rect(77, 422, 146, 50, "var(--accent-soft)", 8)}
    ${label(91, 442, "Workspace", 10, "var(--ink)", 700)}
    ${label(91, 457, "All systems ready", 9, "var(--muted)")}
  `;
}

function lineChart(animated = false) {
  return `
    <path d="M284 360H661M284 330H661M284 300H661M284 270H661" stroke="var(--border)" stroke-dasharray="4 6"/>
    <path ${animated ? 'class="motion-area"' : ""} d="M286 347 C320 338 337 348 371 314 S423 327 458 292 S510 307 550 272 S612 294 656 251 V361 H286Z" fill="var(--accent-soft)" opacity=".8"/>
    <path ${animated ? 'class="motion-line"' : ""} d="M286 347 C320 338 337 348 371 314 S423 327 458 292 S510 307 550 272 S612 294 656 251" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
    <circle ${animated ? 'class="motion-dot"' : ""} cx="656" cy="251" r="5" fill="var(--accent)" stroke="#fff" stroke-width="3"/>
    ${label(286, 381, "MON", 9, "var(--muted)")}${label(449, 381, "WED", 9, "var(--muted)")}${label(625, 381, "FRI", 9, "var(--muted)")}
  `;
}

function barChart(animated = false) {
  const heights = [55, 82, 69, 105, 84, 129, 112, 153, 129, 169, 145];
  return `
    <path d="M284 360H661M284 320H661M284 280H661" stroke="var(--border)" stroke-dasharray="4 6"/>
    ${heights.map((h, i) => rect(291 + i * 33, 360 - h, 19, h, i === 9 ? "var(--accent)" : "var(--accent-soft)", 5, animated ? `class="motion-bar" style="animation-delay:-${(i*.11).toFixed(2)}s"` : "")).join("")}
    ${label(288, 381, "JAN", 9, "var(--muted)")}${label(456, 381, "JUN", 9, "var(--muted)")}${label(623, 381, "DEC", 9, "var(--muted)")}
  `;
}

function dashboard(category, item, animated = false) {
  const pointer = animated ? motionPointer(category) : null;
  const content = `
    ${sidebar(item)}
    ${rect(236, 88, 664, 408, "#fcfdfd")}
    ${label(271, 134, item.heading, 21, "var(--ink)", 750)}
    ${label(271, 156, "A clear view of what matters today.", 11, "var(--muted)")}
    ${rect(754, 110, 112, 30, "var(--accent)", 15)}
    ${label(810, 130, "View report →", 10, "#ffffff", 700, 'text-anchor="middle"')}
    ${rect(270, 181, 412, 228, "var(--surface)", 10, 'stroke="var(--border)" filter="url(#cardShadow)"')}
    ${label(290, 208, item.unit.toUpperCase(), 10, "var(--muted)", 700, 'letter-spacing="1.2"')}
    ${animated ? '<g class="motion-kpi">' : ""}${label(289, 248, item.metric, 31, "var(--ink)", 750)}${animated ? '</g>' : ""}
    ${rect(543, 205, 115, 25, "var(--accent-soft)", 13)}
    ${label(600, 222, "↗  +18.2%", 10, "var(--accent)", 750, 'text-anchor="middle"')}
    ${item.chart === "bars" ? barChart(animated) : lineChart(animated)}
    ${rect(698, 181, 169, 105, "var(--surface)", 10, 'stroke="var(--border)" filter="url(#cardShadow)"')}
    ${label(716, 209, item.side, 10, "var(--muted)", 650)}
    ${label(716, 251, item.second, 26, "var(--ink)", 750)}
    ${rect(698, 298, 169, 111, "var(--surface)", 10, 'stroke="var(--border)" filter="url(#cardShadow)"')}
    ${label(716, 324, "AT A GLANCE", 9, "var(--muted)", 700, 'letter-spacing="1.2"')}
    ${item.notes.map((note, i) => `${rect(716, 343 + i*29, 7, 7, "var(--accent)", 4)}${label(731, 351 + i*29, note, 10, "var(--ink)", 550)}`).join("")}
    ${label(271, 446, "Updated just now", 10, "var(--muted)")}
    ${pointer?.markup || ""}
  `;
  const svg = frame(category, item.app, item.area + " dashboard", content);
  if (!animated) return svg;
  const chartCss = item.chart === "bars"
    ? `.motion-bar{transform-box:fill-box;transform-origin:center bottom;animation:barRise 6s ease-in-out infinite}@keyframes barRise{0%,9%{transform:scaleY(.05)}55%,91%{transform:scaleY(1)}100%{transform:scaleY(.05)}}`
    : `.motion-line{stroke-dasharray:600;stroke-dashoffset:600;animation:lineDraw 6s ease-in-out infinite}.motion-area{animation:areaIn 6s ease-in-out infinite}.motion-dot{animation:dotIn 6s ease-in-out infinite}@keyframes lineDraw{0%,8%{stroke-dashoffset:600}72%,91%{stroke-dashoffset:0}100%{stroke-dashoffset:600}}@keyframes areaIn{0%,36%{opacity:0}72%,91%{opacity:.8}100%{opacity:0}}@keyframes dotIn{0%,66%{opacity:0}75%,91%{opacity:1}100%{opacity:0}}`;
  return motionSvg(svg, `${pointer.css}${chartCss}.motion-kpi{animation:kpiIn 6s ease-out infinite}@keyframes kpiIn{0%,8%{opacity:.25;transform:translateY(5px)}25%,91%{opacity:1;transform:translateY(0)}100%{opacity:.25;transform:translateY(5px)}}`);
}

function workspaceAccent(category) {
  const titles = {
    product: "SPRINT PROGRESS", operations: "WORKFLOW SYNC", support: "RESPONSE COVERAGE",
    people: "HIRING PROGRESS", education: "LESSON COMPLETION", legal: "DOCUMENT REVIEW",
    security: "THREAT SCAN", logistics: "ROUTE PROGRESS", general: "MATCHING PROGRESS",
  };
  const title = label(272, 449, titles[category], 9, "var(--muted)", 700, 'letter-spacing="1.1"');
  if (category === "logistics") return { markup: `${title}<path d="M275 466C327 456 353 476 397 465S465 452 511 465S583 475 656 460" fill="none" stroke="var(--accent-soft)" stroke-width="6" stroke-linecap="round"/><path class="motion-trace" d="M275 466C327 456 353 476 397 465S465 452 511 465S583 475 656 460" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>`, css: `.motion-trace{stroke-dasharray:460;stroke-dashoffset:460;animation:trace 6s ease-in-out infinite}@keyframes trace{0%,8%{stroke-dashoffset:460}76%,91%{stroke-dashoffset:0}100%{stroke-dashoffset:460}}` };
  if (category === "legal") return { markup: `${title}<path d="M272 468H672" stroke="var(--border)" stroke-width="2"/><path class="motion-trace" d="M284 464q35-24 57-3t48-5q18-19 29 4t53-10" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>`, css: `.motion-trace{stroke-dasharray:270;stroke-dashoffset:270;animation:trace 6s ease-in-out infinite}@keyframes trace{0%,14%{stroke-dashoffset:270}73%,91%{stroke-dashoffset:0}100%{stroke-dashoffset:270}}` };
  if (category === "security") return { markup: `${title}${rect(272, 458, 400, 14, "var(--accent-soft)", 7)}${rect(272, 458, 48, 14, "var(--accent)", 7, 'class="motion-scan" opacity=".55"')}`, css: `.motion-scan{animation:scan 6s ease-in-out infinite}@keyframes scan{0%,9%{transform:translateX(0)}74%,91%{transform:translateX(350px)}100%{transform:translateX(0)}}` };
  return { markup: `${title}${rect(272, 460, 400, 7, "var(--accent-soft)", 4)}${rect(272, 460, 400, 7, "var(--accent)", 4, 'class="motion-fill"')}`, css: `.motion-fill{transform-box:fill-box;transform-origin:left center;animation:fill 6s ease-in-out infinite}@keyframes fill{0%,10%{transform:scaleX(.06)}75%,91%{transform:scaleX(.9)}100%{transform:scaleX(.06)}}` };
}

function workspace(category, item, animated = false) {
  const pointer = animated ? motionPointer(category) : null;
  const accent = animated ? workspaceAccent(category) : null;
  const rows = item.rows.map((name, i) => `
    ${animated ? `<g class="motion-row motion-row-${i + 1}">` : ""}
    ${rect(272, 237 + i * 65, 405, 54, "var(--surface)", 9, 'stroke="var(--border)"')}
    ${rect(287, 250 + i * 65, 27, 27, "var(--accent-soft)", 7)}
    ${label(300, 269 + i * 65, item.layout === "documents" ? "▤" : item.layout === "routes" ? "↗" : item.layout === "signals" ? "✓" : "•", 13, "var(--accent)", 700, 'text-anchor="middle"')}
    ${label(329, 258 + i * 65, name, 11, "var(--ink)", 700)}
    ${line(329, 270 + i * 65, 93 + i*20, "var(--line)", 5)}
    ${rect(593, 252 + i * 65, 68, 22, "var(--accent-soft)", 11)}
    ${label(627, 267 + i * 65, ["On track", "In review", "Complete"][i], 9, "var(--accent)", 700, 'text-anchor="middle"')}
    ${animated ? '</g>' : ""}
  `).join("");
  const content = `
    ${sidebar(item)}
    ${rect(236, 88, 664, 408, "#fcfdfd")}
    ${label(271, 135, item.heading, 21, "var(--ink)", 750)}
    ${label(271, 157, "Your team, work and progress in one place.", 11, "var(--muted)")}
    ${rect(754, 110, 112, 30, "var(--accent)", 15)}
    ${label(810, 130, "+ New item", 10, "#ffffff", 700, 'text-anchor="middle"')}
    ${rect(271, 178, 193, 57, "var(--surface)", 10, 'stroke="var(--border)" filter="url(#cardShadow)"')}
    ${label(288, 198, item.unit, 10, "var(--muted)", 650)}
    ${label(288, 225, item.metric, 21, "var(--ink)", 750)}
    ${rect(480, 178, 197, 57, "var(--surface)", 10, 'stroke="var(--border)" filter="url(#cardShadow)"')}
    ${label(497, 198, item.side, 10, "var(--muted)", 650)}
    ${label(497, 225, item.second, 21, "var(--ink)", 750)}
    ${rows}
    ${rect(698, 178, 169, 254, "var(--surface)", 10, 'stroke="var(--border)" filter="url(#cardShadow)"')}
    ${label(716, 207, "TEAM PULSE", 10, "var(--muted)", 700, 'letter-spacing="1.2"')}
    ${avatar(730, 245, "var(--accent-soft)", "AM")}
    ${avatar(765, 245, "#eee6e2", "JR")}
    ${avatar(800, 245, "#e6e8f1", "SK")}
    ${label(716, 288, "This week", 11, "var(--ink)", 700)}
    ${item.notes.map((note, i) => `${rect(716, 312 + i*42, 7, 7, "var(--accent)", 4)}${label(731, 320 + i*42, note, 10, "var(--ink)", 550)}`).join("")}
    ${rect(716, 390, 132, 25, "var(--accent-soft)", 7)}
    ${label(782, 407, "Open workspace →", 9, "var(--accent)", 700, 'text-anchor="middle"')}
    ${accent?.markup || ""}
    ${pointer?.markup || ""}
  `;
  const svg = frame(category, item.app, item.area + " workspace", content);
  if (!animated) return svg;
  return motionSvg(svg, `${pointer.css}${rowMotionCss(3)}${accent.css}`);
}

function detail(category, item, animated = false) {
  const rows = [...item.rows, item.notes[0], item.notes[1]].map((name, i) => `
    ${animated ? `<g class="motion-row motion-row-${i + 1}">` : ""}
    ${rect(272, 209 + i * 47, 402, 39, i % 2 ? "#fafbfc" : "var(--surface)", 6)}
    ${avatar(295, 229 + i * 47, ["var(--accent-soft)", "#f4ece6", "#e9ecf5"][i % 3], ["AL", "JR", "MP"][i % 3])}
    ${label(322, 226 + i * 47, name, 10, "var(--ink)", 650)}
    ${line(322, 235 + i * 47, 88 + i*12, "var(--line)", 5)}
    ${rect(587, 217 + i * 47, 72, 23, "var(--accent-soft)", 11)}
    ${label(623, 233 + i * 47, i % 2 ? "In review" : "Active", 9, "var(--accent)", 700, 'text-anchor="middle"')}
    ${animated ? "</g>" : ""}
  `).join("");
  const content = `
    ${sidebar(item, "Activity")}
    ${rect(236, 88, 664, 408, "#fcfdfd")}
    ${label(272, 133, item.heading, 20, "var(--ink)", 750)}
    ${label(272, 155, "Team activity and current priorities", 11, "var(--muted)")}
    ${rect(751, 109, 115, 30, "var(--accent)", 15)}
    ${label(808, 129, "+ Add update", 10, "#ffffff", 700, 'text-anchor="middle"')}
    ${rect(271, 181, 404, 273, "var(--surface)", 10, 'stroke="var(--border)" filter="url(#cardShadow)"')}
    ${rows}
    ${rect(697, 181, 170, 273, "var(--surface)", 10, 'stroke="var(--border)" filter="url(#cardShadow)"')}
    ${label(716, 211, "OVERVIEW", 9, "var(--muted)", 700, 'letter-spacing="1.3"')}
    ${label(716, 255, item.metric, 28, "var(--ink)", 750)}
    ${label(716, 273, item.unit, 10, "var(--muted)")}
    ${rect(716, 295, 130, 7, "var(--accent-soft)", 4)}
    ${rect(716, 295, 91, 7, "var(--accent)", 4)}
    ${label(716, 335, item.side, 10, "var(--muted)")}
    ${label(716, 366, item.second, 21, "var(--ink)", 750)}
    ${rect(715, 392, 132, 26, "var(--accent-soft)", 7)}
    ${label(781, 409, "View details →", 9, "var(--accent)", 700, 'text-anchor="middle"')}
  `;
  return frame(category, item.app, item.area + " activity", content + (animated ? motionPointer(category === "engineering" ? "general" : category).markup : ""));
}

/** Trusted source artwork for the frame-driven Remotion compositions. No filesystem side effects on import. */
export function previewArtwork(category, variant = 1) {
  const item = PRODUCTS[category];
  if (!item) throw new Error(`Unknown preview category: ${category}`);
  const svg = variant === 2 ? detail(category, item, true) :
    ({ engineering, design, healthcare }[category]?.(true) ??
      (item.chart ? dashboard(category, item, true) : workspace(category, item, true)));
  // Keep palette declarations, discard all wall-clock animation rules.
  return svg.replace(/<style>[\s\S]*?<\/style>/g, (style, offset) =>
    offset === svg.indexOf("<style>") ? style.slice(0, style.indexOf("}") + 1) + "</style>" : "")
    .replace(/style="animation-delay:[^"]*"/g, "");
}


export { PRODUCTS, engineering, design, healthcare, dashboard, workspace, detail };
