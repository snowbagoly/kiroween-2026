// The needle's arc: degrees either side of upright, and the point it turns on (in the drawing's units).
export const GALVANOMETER_SWING = 50;
export const GALVANOMETER_PIVOT = { x: 130, y: 128 };

// The objects in the office, each drawn once [design 8, R11.4]: the calendar, the wall clock, the window,
// the oil lamp, the galvanometer, the straight key, the sounder and the figure. Each function returns
// { viewBox, body }; svgOf() wraps that as an <svg> element, and mountDrawings() fills
// <svg data-draw="..."> elements. Ids inside a drawing start with its id option, so two copies on the
// page don't collide. The shared paints they use (#wood, #brass, #bakelite, ...) are in PAINTS.

// Wraps a drawing as an <svg> element with the given attributes (position, size, class...).
export function svgOf({ viewBox, body }, attrs = '') {
  return `<svg viewBox="${viewBox}" ${attrs}>${body}</svg>`;
}

// A month calendar, every day up to crossedTo crossed off in pencil.
// November 1903 starts on a Sunday (the first column).
export function drawCalendar({ month = 'November 1903', firstWeekday = 0, days = 30, crossedTo = 3 } = {}) {
  const cell = { w: 10.5, h: 10 };
  const cells = Array.from({ length: days }, (_, i) => {
    const at = firstWeekday + i;
    return { day: i + 1, x: 10 + (at % 7) * cell.w, y: 48 + Math.floor(at / 7) * cell.h };
  });
  const grid = cells.map(({ x, y }) => `<rect x="${x}" y="${y}" width="${cell.w}" height="${cell.h}"/>`).join('');
  const numbers = cells.map(({ day, x, y }) => `<text x="${(x + cell.w - 1.2).toFixed(1)}" y="${y + 3.6}">${day}</text>`).join('');
  const crosses = cells.filter(({ day }) => day <= crossedTo).map(({ x, y }) =>
    `M${x + 2} ${y + 2}l${cell.w - 4} ${cell.h - 4}M${x + cell.w - 2} ${y + 2}l${-(cell.w - 4)} ${cell.h - 4}`).join('');
  return {
    viewBox: '0 -18 94 142',
    body: `
      <circle cx="47" cy="-14" r="2.5" fill="#6a5a3a"/>
      <path fill="none" stroke="#3a2e22" stroke-width="1" d="M47 -14 L16 0 M47 -14 L78 0"/>
      <rect width="94" height="124" fill="#c4b590"/>
      <rect x="8" y="6" width="78" height="22" fill="#5a4a36"/>
      <path fill="#2e251c" d="M8 22 Q30 16 50 20 Q70 24 86 18 V28 H8Z"/>
      <text x="47" y="39" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="8" letter-spacing="1" fill="#2a2018">${month}</text>
      <g fill="none" stroke="#9a8a68" stroke-width=".5">${grid}</g>
      <g font-family="IM Fell English SC, serif" font-size="3.4" text-anchor="end" fill="#5a4a36">${numbers}</g>
      <path fill="none" stroke="#3a3026" stroke-width=".9" stroke-linecap="round" opacity=".85" d="${crosses}"/>
      <rect width="94" height="124" fill="none" stroke="#a89878" stroke-width="1"/>`,
  };
}

// A regulator wall clock with a swinging pendulum. Its hands point where the clock's --hour and
// --minute properties say (see office.css), so the office can keep the game clock on it.
export function drawClock({ id = 'clock' } = {}) {
  const ticks = (from, to) => Array.from({ length: 60 }, (_, i) => i).filter((i) => (i % 5 === 0) === (from === 'major'))
    .map((i) => {
      const a = i * Math.PI / 30;
      const inner = i % 15 === 0 ? 27 : i % 5 === 0 ? 28.5 : 31.5;
      const point = (r) => `${(50 + r * Math.sin(a)).toFixed(1)} ${(62 - r * Math.cos(a)).toFixed(1)}`;
      return `M${point(inner)}L${point(33)}`;
    }).join('');
  return {
    viewBox: '0 0 100 290',
    body: `
      <defs>
        <linearGradient id="${id}-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4a2e18"/><stop offset="1" stop-color="#2a180c"/>
        </linearGradient>
        <radialGradient id="${id}-bob" cx=".38" cy=".35" r=".7">
          <stop offset="0" stop-color="#f6dc98"/><stop offset=".45" stop-color="#b08a3e"/><stop offset="1" stop-color="#4a3410"/>
        </radialGradient>
      </defs>
      <path fill="#2a180c" d="M4 22 L50 0 L96 22Z"/>
      <circle cx="50" cy="3" r="4" fill="url(#brass)"/><circle cx="6" cy="20" r="3" fill="url(#brass)"/><circle cx="94" cy="20" r="3" fill="url(#brass)"/>
      <rect x="8" y="20" width="84" height="248" rx="5" fill="url(#${id}-wood)"/>
      <rect x="13" y="25" width="74" height="238" rx="3" fill="none" stroke="#5a3a20" stroke-width="1.2"/>
      <path fill="#2a180c" d="M24 268 h52 l-10 16 h-32z"/><circle cx="50" cy="286" r="3.5" fill="url(#brass)"/>
      <circle cx="50" cy="62" r="38" fill="url(#brass)"/>
      <circle cx="50" cy="62" r="34" fill="#ddd0ae"/>
      <circle cx="50" cy="62" r="25" fill="none" stroke="#8a7a5a" stroke-width=".6"/>
      <path stroke="#1a120c" stroke-width="2.2" d="${ticks('major')}"/>
      <path stroke="#3a2e22" stroke-width=".7" d="${ticks('minor')}"/>
      <path class="hour-hand" stroke="#1a120c" stroke-width="3" stroke-linecap="round" d="M50 66 V44"/>
      <path class="minute-hand" stroke="#1a120c" stroke-width="1.8" stroke-linecap="round" d="M50 67 V35"/>
      <circle cx="50" cy="62" r="2.4" fill="url(#brass)"/>
      <!-- The pendulum, behind the glass of the case door. -->
      <rect x="24" y="110" width="52" height="146" rx="2" fill="#0f0905"/>
      <g class="pendulum">
        <rect x="47" y="110" width="6" height="8" fill="#6a5a3a"/>
        <path fill="none" stroke="url(#brass)" stroke-width="1.6" d="M48 118 V214 M52 118 V214"/>
        <path fill="none" stroke="url(#brass)" stroke-width="1.4" d="M44 164 q6 -10 12 0 q-6 10 -12 0z"/>
        <circle cx="50" cy="226" r="14" fill="url(#${id}-bob)"/>
        <circle cx="50" cy="226" r="14" fill="none" stroke="#5a3e14" stroke-width="1.2"/>
        <circle cx="50" cy="226" r="9" fill="none" stroke="#e6c47e" stroke-width=".8" opacity=".6"/>
      </g>
      <path fill="#ffe8b0" opacity=".06" d="M24 110 h20 l-20 60z"/>
      <rect x="24" y="110" width="52" height="146" rx="2" fill="none" stroke="url(#brass)" stroke-width="2"/>`,
  };
}

// The office window at night: rain on the glass, the marsh outside with the pole the wires run to,
// and the lamp's reflection at reflection (in the window's own units, 200 by 240). In the office the
// sky behind it lightens toward dawn (window-dawn, window-morning; see office.css). Drops cling to the
// glass and now and then run down (clingDrops in scenery.js); with dropsLayer they're an HTML layer over
// the window rather than part of it, so they move without repainting it (the office window, which is
// otherwise still; a picture that moves as a whole has them drawn in it).
export function drawWindow({ id = 'window', reflection = [46, 204], dropsLayer = false } = {}) {
  return {
    viewBox: '0 0 200 240',
    body: `
      <defs>
        <clipPath id="${id}-glass"><rect x="14" y="14" width="172" height="212"/></clipPath>
        <linearGradient id="${id}-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0a0c10"/><stop offset=".6" stop-color="#16181d"/><stop offset="1" stop-color="#26262a"/>
        </linearGradient>
        <linearGradient id="${id}-dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2a3346"/><stop offset=".45" stop-color="#5c6270"/><stop offset=".68" stop-color="#a99a84"/>
        </linearGradient>
        <linearGradient id="${id}-morning" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8a96a6"/><stop offset=".5" stop-color="#c9c3b4"/><stop offset=".68" stop-color="#f0d9aa"/>
        </linearGradient>
        <pattern id="${id}-rain" width="38" height="140" patternUnits="userSpaceOnUse">
          <path stroke="#cbbb98" stroke-width=".6" d="M7 10 l-3 11 M26 45 l-3 11 M15 85 l-3 11 M35 110 l-3 11 M20 2 l-3 11 M4 64 l-3 11"/>
        </pattern>
        <radialGradient id="${id}-flame">
          <stop offset="0" stop-color="#fff2c8"/><stop offset=".4" stop-color="#ffc86a" stop-opacity=".8"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/>
        </radialGradient>
        <!-- The figure in the glass is lit by the lamp from the left, and fades out toward its feet. -->
        <linearGradient id="${id}-figure" x1="0" y1="0" x2=".5" y2="1">
          <stop offset="0" stop-color="#cdb88e" stop-opacity=".34"/><stop offset=".55" stop-color="#9a8766" stop-opacity=".16"/><stop offset="1" stop-color="#6a5c46" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g clip-path="url(#${id}-glass)">
        <rect width="200" height="240" fill="url(#${id}-night)"/>
        <rect class="window-dawn" width="200" height="240" fill="url(#${id}-dawn)"/>
        <rect class="window-morning" width="200" height="240" fill="url(#${id}-morning)"/>
        <rect x="0" y="128" width="200" height="34" fill="#3a3632" opacity=".4"/>
        <g fill="#4a443c" opacity=".3"><ellipse cx="60" cy="138" rx="44" ry="2"/><ellipse cx="140" cy="146" rx="52" ry="1.6"/></g>
        <path fill="#07080a" d="M0 162 Q60 158 110 161 Q160 164 200 160 V240 H0Z"/>
        <g class="reeds" fill="#07080a" data-reeds='{"x": [8, 192], "base": 166, "h": [3, 9], "n": 90, "seed": 141, "depth": 6}'></g>
        <g class="tree" fill="none" stroke="#07080a" stroke-linecap="round" data-tree='{"x": 160, "y": 163, "length": 15, "seed": 142, "lean": -0.45, "depth": 5, "thin": 0.6}'></g>
        <g fill="#07080a"><rect x="22" y="152" width="2" height="13"/><rect x="38" y="155" width="1.6" height="10"/><rect x="51" y="157" width="1.3" height="7"/></g>
        <path fill="none" stroke="#07080a" stroke-width=".6" d="M10 154 Q17 158 23 153 Q31 158 39 156 Q45 159 52 158"/>
        <g fill="#07080a"><path d="M86 163 L87 62 h3 L91 163Z"/><rect x="74" y="68" width="30" height="2.5"/></g>
        <g fill="#3a3a38" opacity=".7"><rect x="76" y="65" width="2" height="3"/><rect x="87.5" y="64" width="2" height="4"/><rect x="99" y="65" width="2" height="3"/></g>
        <path fill="none" stroke="#07080a" stroke-width=".8" d="M77 68 Q70 40 74 14 M100 68 Q130 36 170 14"/>
        <g class="window-rain" opacity=".08"><rect x="-40" y="-140" width="300" height="420" fill="url(#${id}-rain)"/></g>
        <!-- Someone standing in the room behind the operator, reflected in the glass; hidden until the last warning shows it. -->
        <g class="window-figure" opacity="0" fill="url(#${id}-figure)" transform="translate(114 50) scale(.56)">${FIGURE_SHAPE}</g>
      </g>
      <!-- The lamp nearby, reflected in the dark glass. -->
      <g class="lamp-reflection" transform="translate(${reflection[0]} ${reflection[1]})">
        <circle r="20" fill="url(#${id}-flame)" opacity=".2"/>
        <path fill="#ffe2a0" opacity=".45" d="M0 -5 q-2.5 4.5 0 8 q2.5 -3.5 0 -8z"/>
      </g>
      <g fill="#d6cbb0" data-drops='[{"x": [16, 184], "y": [16, 224], "n": 50, "seed": 143, "r": [0.7, 2]}, {"x": [16, 184], "y": [108, 113], "n": 18, "seed": 144, "r": [0.9, 1.6]}, {"x": [16, 184], "y": [217, 223], "n": 20, "seed": 145, "r": [1, 1.8]}]'></g>
      <path fill="none" stroke="#cfc3a6" stroke-width=".8" opacity=".14" d="M14 113 H186 M14 223 H186"/>
      <g data-cling='{"panes": [[14, 14, 100, 113], [100, 14, 186, 113], [14, 120, 100, 223], [100, 120, 186, 223]], "seed": 146, "scale": 0.6, "id": "${id}-streak", "layer": ${dropsLayer}}'></g>
      <g fill="none" stroke="#1a110a">
        <rect x="7" y="7" width="186" height="226" stroke-width="14"/>
        <path d="M100 7 V233 M7 120 H193" stroke-width="7"/>
      </g>
      <rect x="7" y="7" width="186" height="226" fill="none" stroke="#3a2616" stroke-width="1.5"/>
`,
  };
}

// The tall, thin figure with arms hanging a little too long: seen in the last flash of light when the
// line dies, and, once, reflected in the window behind the operator's chair.
export const FIGURE_SHAPE = `
  <ellipse cx="50" cy="26" rx="10" ry="13.5" transform="rotate(-9 50 26)"/>
  <path d="M46 38 L54 38 L55 47 C62 50 70 54 72 62 L68 150 L72 300 L28 300 L32 150 L28 62 C30 54 38 50 45 47 Z"/>
  <path d="M28 62 C24 66 22 76 22 90 L20 182 C20 187 26 187 26 182 L29 92 Z"/>
  <path d="M72 62 C76 66 78 76 78 90 L80 182 C80 187 74 187 74 182 L71 92 Z"/>`;

export function drawFigure() {
  return { viewBox: '0 0 100 300', body: FIGURE_SHAPE };
}

// The oil lamp: brass foot, glass font, chimney and flame (lamp-flame), and the smoke that rises once
// it has gone out (lamp-smoke, shown at dawn).
export function drawLamp({ id = 'lamp' } = {}) {
  return {
    viewBox: '0 0 60 150',
    body: `
      <defs>
        <radialGradient id="${id}-flame">
          <stop offset="0" stop-color="#fff2c8"/><stop offset=".4" stop-color="#ffc86a" stop-opacity=".8"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="146" rx="26" ry="4" fill="#000" opacity=".5"/>
      <path fill="url(#brass)" d="M8 146 h44 l-7 -12 h-30z"/>
      <path fill="#6a4a24" opacity=".85" d="M14 134 q-8 -26 16 -36 q24 10 16 36z"/>
      <path fill="#fff" opacity=".12" d="M18 128 q-4 -16 8 -24 q-8 10 -4 24z"/>
      <rect x="21" y="86" width="18" height="14" rx="2" fill="url(#brass)"/>
      <path fill="#e8d6b0" opacity=".3" d="M21 86 q-5 -22 3 -46 h12 q8 24 3 46z"/>
      <path class="lamp-smoke" fill="none" stroke="#b9ae9c" stroke-width="1.6" stroke-linecap="round" d="M30 40 q-5 -8 1 -16 q6 -8 -1 -17 q-6 -8 1 -16"/>
      <g class="lamp-flame">
        <circle cx="30" cy="66" r="24" fill="url(#${id}-flame)" opacity=".6"/>
        <path fill="#fff0c0" d="M30 54 q-6 10 0 18 q6 -8 0 -18z"/>
      </g>
`,
  };
}

// The line galvanometer on its board, with steps marked on its dial (10 lives, or 5 in Dead Air). Its
// needle is turned from outside, or fixed at the given strength (0 to 1); the wires run down to wiresTo.
export function drawGalvanometer({ id = 'galvanometer', needle = null, wiresTo = 300, steps = 10 } = {}) {
  const needleAt = (before) => (needle === null ? ''
    : ` transform="${before}rotate(${-GALVANOMETER_SWING + needle * GALVANOMETER_SWING * 2} ${GALVANOMETER_PIVOT.x} ${GALVANOMETER_PIVOT.y})"`);
  return {
    viewBox: '0 0 260 200',
    body: `
      <defs>
        <filter id="${id}-blur" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter>
        <radialGradient id="${id}-age">
          <stop offset=".6" stop-color="#8a6a30" stop-opacity="0"/><stop offset="1" stop-color="#8a6a30" stop-opacity=".28"/>
        </radialGradient>
      </defs>
      <!-- Its two terminals, and the line's wires running down to the desk. -->
      <path d="M78 196 C76 ${196 + (wiresTo - 196) * .33} 84 ${196 + (wiresTo - 196) * .62} 80 ${wiresTo} M182 196 C186 ${196 + (wiresTo - 196) * .33} 176 ${196 + (wiresTo - 196) * .62} 180 ${wiresTo}" stroke="#120c08" stroke-width="2.4" fill="none"/>
      <rect x="8" y="2" width="244" height="196" rx="10" fill="url(#wood)"/>
      <!-- The board's grain, running across it, with a knot low on the right. -->
      <g fill="none" stroke="#1e1007" stroke-width="1" opacity=".3">
        <path d="M12 22 C70 16 120 28 180 20 S240 18 248 22"/>
        <path d="M12 46 C60 52 110 40 170 48 S236 50 248 44"/>
        <path d="M12 74 C50 70 100 80 160 72 S230 70 248 76"/>
        <path d="M12 104 C70 110 130 98 190 106 S240 108 248 102"/>
        <path d="M12 132 C60 128 110 138 170 130 S232 128 248 134"/>
        <path d="M12 160 C40 164 90 154 150 162 C180 166 196 172 206 168 C214 164 224 158 248 162"/>
        <path d="M12 184 C70 188 140 178 200 186 S240 188 248 184"/>
        <ellipse cx="214" cy="170" rx="9" ry="4" stroke-width="1.2"/>
        <ellipse cx="214" cy="170" rx="4" ry="1.6"/>
      </g>
      <rect x="8" y="2" width="244" height="5" rx="2" fill="#8a5d3a" opacity=".45"/>
      <g fill="url(#brass)">
        <circle cx="24" cy="18" r="4"/><circle cx="236" cy="18" r="4"/>
        <circle cx="24" cy="182" r="4"/><circle cx="236" cy="182" r="4"/>
      </g>
      <circle cx="130" cy="100" r="88" fill="url(#brass)"/>
      <circle cx="130" cy="100" r="80" fill="#3b2a0c"/>
      <circle cx="130" cy="100" r="77" fill="#e6dcc0"/>
      <circle cx="130" cy="100" r="77" fill="url(#${id}-age)"/>
      <circle cx="130" cy="100" r="77" fill="none" stroke="#b8a678" stroke-width="3" opacity=".6"/>
      <g fill="#6a4c18"><circle cx="71" cy="41" r="2.6"/><circle cx="189" cy="41" r="2.6"/><circle cx="71" cy="159" r="2.6"/><circle cx="189" cy="159" r="2.6"/></g>
      <g class="scale" font-family="IM Fell English SC, serif" font-size="11" fill="#2a2018">${galvanometerScale(steps)}</g>
      <text x="130" y="152" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="13" letter-spacing="3" fill="#2a2018">Line</text>
      <text x="130" y="166" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="7" letter-spacing="1" fill="#5a4a33">M. &amp; W. Tel. Co.</text>
      <g class="needle-shadow" filter="url(#${id}-blur)" opacity=".28"${needleAt('translate(3 4) ')}>
        <g class="needle-tremble"><path d="M130 140 L128.8 128 L130 54 L131.2 128 Z" fill="#000"/></g>
      </g>
      <g class="needle"${needleAt('')}>
        <g class="needle-tremble">
          <path d="M130 140 L128.8 128 L130 54 L131.2 128 Z" fill="#14100c"/>
          <circle cx="130" cy="138" r="4" fill="#14100c"/>
        </g>
      </g>
      <circle cx="130" cy="128" r="5" fill="url(#brass)"/>
      <ellipse cx="100" cy="60" rx="46" ry="22" fill="#fff" opacity=".07" transform="rotate(-25 100 60)"/>
      <path d="M72 82 A60 60 0 0 1 128 42" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".16"/>
      <!-- A crack across the glass, from a star near the top right; hidden until the line nearly dies. -->
      <g class="glass-crack" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <g stroke="#2a2016" stroke-width="1" opacity=".6" transform="translate(.6 .8)">${GLASS_CRACK}</g>
        <g stroke="#fff" stroke-width=".7" opacity=".85">${GLASS_CRACK}</g>
        <path d="M156 68 l4 -1 l1 4 l-3 3 l-4 -2z" fill="#fff" opacity=".35" stroke="none"/>
      </g>
      <g fill="url(#brass)"><rect x="70" y="186" width="16" height="12" rx="2"/><rect x="174" y="186" width="16" height="12" rx="2"/></g>
`,
  };
}

// The crack in the galvanometer's glass, running out from where it broke.
const GLASS_CRACK = `
  <path d="M158 70 L169 59 L174 51 L183 45"/>
  <path d="M158 70 L151 57 L148 45 L142 31"/>
  <path d="M158 70 L171 79 L185 83 L199 91"/>
  <path d="M158 70 L149 85 L139 92 L127 105 L113 111 L104 121"/>
  <path d="M158 70 L163 87 L166 100"/>
  <path d="M139 92 L133 84 M174 51 L180 56"/>`;

// Ticks along the needle's arc, one per step from 0 to steps (every one numbered on a 5 step dial,
// every other one on a 10 step dial), with the lowest fifth of the arc marked in red.
export function galvanometerScale(steps = 10) {
  const point = (deg, r) => {
    const rad = (deg * Math.PI) / 180;
    return [GALVANOMETER_PIVOT.x + r * Math.sin(rad), GALVANOMETER_PIVOT.y - r * Math.cos(rad)].map((v) => v.toFixed(1));
  };
  const angleAt = (i) => -GALVANOMETER_SWING + i * (GALVANOMETER_SWING * 2 / steps);
  const [rx1, ry1] = point(-GALVANOMETER_SWING, 70);
  const [rx2, ry2] = point(-GALVANOMETER_SWING * .6, 70);
  let svg = `<path d="M${rx1} ${ry1} A70 70 0 0 1 ${rx2} ${ry2}" stroke="#a3261b" stroke-width="5" fill="none" opacity=".55"/>`;
  for (let i = 0; i <= steps; i++) {
    const major = steps <= 5 || i % 2 === 0;
    const [x1, y1] = point(angleAt(i), major ? 64 : 67);
    const [x2, y2] = point(angleAt(i), 74);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2a2018" stroke-width="${major ? 1.6 : 1}"/>`;
    if (major) {
      const [tx, ty] = point(angleAt(i), 83);
      svg += `<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle">${i}</text>`;
    }
  }
  return svg;
}

// The straight key: wooden base, brass lever with its knob, spring, contacts, binding posts and wires.
// In the office the lever moves and the contacts spark while Space is down (office.css).
export function drawKey() {
  return {
    viewBox: '0 0 400 240',
    body: `
      <!-- Its shadow on the desk: a soft, wide one leaning away from the lamp, and the dark line
           where the base meets the wood. Plain gradients, so they cost nothing. -->
      <ellipse cx="214" cy="208" rx="210" ry="22" fill="url(#key-ambient)"/>
      <rect x="34" y="203" width="332" height="13" fill="url(#key-contact)"/>
      <ellipse cx="34" cy="207" rx="12" ry="7" fill="url(#key-corner)"/><ellipse cx="366" cy="207" rx="14" ry="7" fill="url(#key-corner)"/>
      <!-- The line's two wires, from the binding posts back to the wall behind the desk. -->
      <path d="M328 150 C 352 118, 392 128, 430 147" stroke="#7a3b1c" stroke-width="3" fill="none"/>
      <path d="M353 150 C 376 132, 418 136, 452 147" stroke="#6a3216" stroke-width="3" fill="none"/>
      <!-- The base: polished wood, its grain, a lit top edge, a darker bevel, and a screw at each end. -->
      <rect x="30" y="160" width="340" height="46" rx="6" fill="url(#wood)"/>
      <g fill="none" stroke="#1e1007" stroke-width="1" opacity=".35">
        <path d="M40 172 C110 168 190 176 270 171 S350 168 362 172"/>
        <path d="M38 182 C120 186 200 178 290 184 S352 186 364 182"/>
        <path d="M44 193 C130 190 210 196 300 192 S350 194 360 195"/>
      </g>
      <rect x="30" y="160" width="340" height="5" rx="2" fill="#8a5d3a" opacity=".5"/>
      <rect x="30" y="199" width="340" height="7" rx="3" fill="#000" opacity=".25"/>
      <g fill="url(#brass)"><circle cx="46" cy="183" r="4.5"/><circle cx="354" cy="183" r="4.5"/></g>
      <path stroke="#3b2a0c" stroke-width="1.2" d="M43 181 l6 4 M351 181 l6 4"/>
      <!-- Binding posts, each with a knurled nut. -->
      <rect x="320" y="140" width="16" height="22" rx="2" fill="url(#brass)"/>
      <rect x="345" y="140" width="16" height="22" rx="2" fill="url(#brass)"/>
      <g fill="#7a5a24"><rect x="318" y="136" width="20" height="6" rx="2"/><rect x="343" y="136" width="20" height="6" rx="2"/></g>
      <path stroke="#3b2a0c" stroke-width=".8" d="M322 136 v6 M326 136 v6 M330 136 v6 M334 136 v6 M347 136 v6 M351 136 v6 M355 136 v6 M359 136 v6"/>
      <!-- The anvil, with its silver contact point. -->
      <rect x="118" y="146" width="18" height="16" rx="2" fill="url(#brass)"/>
      <rect x="121" y="143" width="12" height="4" rx="1" fill="#d6d6cc"/>
      <path d="M200 160 l7 -4 l-14 -4 l14 -4 l-14 -4 l14 -4 l-7 -4" stroke="#8d8d8d" stroke-width="2" fill="none"/>
      <path d="M256 162 L268 112 L298 112 L310 162 Z" fill="url(#brass)"/>
      <path d="M270 114 L262 160" stroke="#f6dfa4" stroke-width="1.5" opacity=".4"/>
      <g class="lever">
        <rect x="70" y="116" width="240" height="14" rx="5" fill="url(#brass)"/>
        <path d="M76 118.5 H304" stroke="#f6dfa4" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
        <rect x="120" y="130" width="14" height="8" fill="url(#brass)"/>
        <rect x="123" y="137" width="8" height="3" rx="1" fill="#d6d6cc"/>
        <rect x="76" y="112" width="26" height="5" rx="2" fill="url(#brass)"/>
        <rect x="79" y="96" width="20" height="18" fill="#15100c"/>
        <ellipse cx="89" cy="94" rx="44" ry="14" fill="url(#bakelite)"/>
        <ellipse cx="84" cy="90" rx="30" ry="6" fill="#5a4e43" opacity=".35"/>
        <ellipse cx="74" cy="89" rx="10" ry="2.5" fill="#fff" opacity=".12"/>
      </g>
      <circle cx="283" cy="123" r="7" fill="#3b2a0c"/>
      <circle cx="283" cy="123" r="3" fill="#c9a35a"/>
      <!-- A tiny spark where the contacts meet. -->
      <g class="contact-spark">
        <circle cx="127" cy="141" r="9" fill="url(#sparkGrad)"/>
        <path d="M127 134 V148 M120 141 H134" stroke="#e8f4ff" stroke-width="1"/>
      </g>
`,
  };
}

// The sounder that clicks out received messages [R4.1]: a wooden base, two coils, and a brass arm
// that drops onto them while a tone sounds (the arm group, moved by office.css).
export function drawSounder() {
  return {
    viewBox: '0 0 260 160',
    body: `
      <ellipse cx="134" cy="146" rx="128" ry="12" fill="url(#key-ambient)"/>
      <rect x="14" y="112" width="232" height="32" rx="5" fill="url(#wood)"/>
      <rect x="14" y="112" width="232" height="4" rx="2" fill="#8a5d3a" opacity=".5"/>
      <g fill="url(#brass)"><circle cx="28" cy="128" r="3.6"/><circle cx="232" cy="128" r="3.6"/></g>
      <rect x="58" y="62" width="30" height="52" rx="4" fill="#1a1410"/>
      <rect x="96" y="62" width="30" height="52" rx="4" fill="#1a1410"/>
      <path stroke="#3a2a1c" stroke-width="1" d="M60 70 H86 M60 78 H86 M60 86 H86 M60 94 H86 M60 102 H86 M98 70 H124 M98 78 H124 M98 86 H124 M98 94 H124 M98 102 H124"/>
      <rect x="54" y="56" width="38" height="7" rx="2" fill="url(#brass)"/>
      <rect x="92" y="56" width="38" height="7" rx="2" fill="url(#brass)"/>
      <rect x="190" y="30" width="14" height="84" rx="2" fill="url(#brass)"/>
      <rect x="160" y="18" width="8" height="26" rx="2" fill="url(#brass)"/>
      <g class="arm">
        <rect x="46" y="38" width="160" height="10" rx="3" fill="url(#brass)"/>
        <path d="M52 40 H200" stroke="#f6dfa4" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>
      </g>
      <circle cx="197" cy="43" r="5" fill="#3b2a0c"/><circle cx="197" cy="43" r="2" fill="#c9a35a"/>
`,
  };
}

// The paints shared by every drawing, defined once on the page.
export const PAINTS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a22"/><stop offset="1" stop-color="#22130a"/></linearGradient>
  <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6c47c"/><stop offset=".5" stop-color="#a47a31"/><stop offset="1" stop-color="#4f3811"/></linearGradient>
  <radialGradient id="bakelite" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#4a4038"/><stop offset="1" stop-color="#0d0a08"/></radialGradient>
  <radialGradient id="key-ambient"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".6" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <radialGradient id="key-corner"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <linearGradient id="key-contact" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".85"/><stop offset=".45" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <radialGradient id="sparkGrad"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#bfe3ff"/><stop offset="1" stop-color="#5aa0ff" stop-opacity="0"/></radialGradient>
</defs></svg>`;

export const DRAWINGS = {
  calendar: drawCalendar,
  clock: drawClock,
  window: drawWindow,
  lamp: drawLamp,
  galvanometer: drawGalvanometer,
  key: drawKey,
  sounder: drawSounder,
  figure: drawFigure,
};

// Fills every <svg data-draw="name"> under root with that drawing (options in data-options, as JSON).
export function mountDrawings(root) {
  for (const el of root.querySelectorAll('[data-draw]')) {
    const { viewBox, body } = DRAWINGS[el.dataset.draw](JSON.parse(el.dataset.options ?? '{}'));
    el.setAttribute('viewBox', viewBox);
    el.innerHTML = body;
  }
}
