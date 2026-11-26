// Slide 2 of the story [R17.1].

// 2. A rented room under the roof, by a candle stub: what is left, counted out on the table beside an
// empty purse, the rent book and a sheet of the waltz; wet roofs and chimney pots outside. As the letter
// says "It will not last me the month", a draught bends the candle flame and the light dips (story.css).
export const roomScene = () => {
  // A coin lying flat, seen at a slant: its edge, its face, a rim and a glint of the candle.
  const coin = (x, y, r, [face, edge, rim, glint]) => `
    <ellipse cx="${x}" cy="${y + 2}" rx="${r}" ry="${r * .32}" fill="${edge}"/>
    <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .32}" fill="${face}"/>
    <ellipse cx="${x}" cy="${y}" rx="${r * .82}" ry="${r * .25}" fill="none" stroke="${rim}" stroke-width=".8"/>
    <path fill="none" stroke="${glint}" stroke-width="1.2" stroke-linecap="round" d="M${x - r * .7} ${y - r * .12} q${r * .4} ${-r * .14} ${r * .9} ${-r * .14}"/>`;
  const pile = (x, y, r, n, metal) => Array.from({ length: n }, (_, i) => coin(x, y - i * 3, r, metal)).join('');
  const COPPER = ['#a8643a', '#5a2e14', '#6a3a1c', '#e0a068'];
  const SILVER = ['#c4b698', '#6a6252', '#857c68', '#f4e8c8'];

  // The waltz in manuscript: staves, clefs, the six flats of E-flat minor, and the notes, in ink.
  const INK = '#2a2a3a';
  const staff = (x0, x1, top) => [0, 6, 12, 18, 24].map((dy) => `M${x0} ${top + dy} H${x1}`).join(' ');
  const head = (x, y, open) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.9" transform="rotate(-22 ${x} ${y})"`
    + ` fill="${open ? 'none' : INK}" stroke="${INK}" stroke-width="1.3"/>`;
  // A note: its head at x, y; the stem up or down; open for a half note; dot for a dotted one.
  const note = (x, y, { up = true, open = false, dot = false } = {}) => head(x, y, open)
    + `<path stroke="${INK}" stroke-width="1.2" d="${up ? `M${x + 3.8} ${y - 1} V${y - 21}` : `M${x - 3.8} ${y + 1} V${y + 21}`}"/>`
    + (dot ? `<circle cx="${x + 9}" cy="${y - 1}" r="1.4" fill="${INK}"/>` : '');
  // A chord of the left hand's "pah": two heads a third apart, on one stem.
  const chord = (x, y) => head(x, y) + head(x, y + 6) + `<path stroke="${INK}" stroke-width="1.2" d="M${x - 3.8} ${y + 7} V${y + 26}"/>`;
  const flat = (x, y) => `<path fill="none" stroke="${INK}" stroke-width="1.1" d="M${x} ${y - 10} V${y + 3} q6 -6 6 -2 q0 3 -6 5"/>`;
  const flats = (x, top, steps) => steps.map((st, i) => flat(x + i * 6, top + st * 3)).join('');
  const TREBLE_FLATS = [4, 1, 5, 2, 6, 3]; // B, E, A, D, G, C, in steps down from the top line
  const BASS_FLATS = [6, 3, 7, 4, 8, 5];
  const trebleClef = (x, t) => `<path fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" d="M${x + 2} ${t + 34}
    C${x + 3} ${t + 18} ${x + 1} ${t} ${x + 5} ${t - 8} C${x + 10} ${t - 2} ${x + 7} ${t + 8} ${x - 4} ${t + 17}
    C${x - 10} ${t + 23} ${x - 6} ${t + 30} ${x + 2} ${t + 30} C${x + 9} ${t + 30} ${x + 10} ${t + 20} ${x + 2} ${t + 19}
    C${x - 3} ${t + 19} ${x - 3} ${t + 25} ${x + 1} ${t + 25} M${x + 2} ${t + 34} q-1 5 -5 4 q-3 -1 -2 -4"/>`;
  const bassClef = (x, t) => `<path fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"
    d="M${x - 3} ${t + 5} C${x + 2} ${t - 2} ${x + 12} ${t + 1} ${x + 10} ${t + 9} C${x + 8} ${t + 16} ${x} ${t + 21} ${x - 4} ${t + 23}"/>`
    + `<circle cx="${x - 2}" cy="${t + 6}" r="2.2" fill="${INK}"/><circle cx="${x + 15}" cy="${t + 3}" r="1.3" fill="${INK}"/>`
    + `<circle cx="${x + 15}" cy="${t + 9}" r="1.3" fill="${INK}"/>`;
  const time = (x, t) => `<g font-family="serif" font-weight="bold" font-size="13" fill="${INK}" text-anchor="middle">`
    + `<text x="${x}" y="${t + 11}">3</text><text x="${x}" y="${t + 23}">4</text></g>`;
  // Oom-pah-pah: a low note on the beat, a chord on two and three.
  const oomPahPah = (x, root, gap = 28) => note(x, root) + chord(x + gap, 102) + chord(x + gap * 2, 102);
  const music = () => {
    const T1 = 52, B1 = 96, T2 = 150;
    return `
        <g fill="none" stroke="#7a6a50" stroke-width="1.1">
          <path d="${staff(22, 400, T1)} ${staff(22, 400, B1)} ${staff(22, 400, T2)}"/>
          <path d="M22 ${T1} V${B1 + 24} M190 ${T1} V${B1 + 24} M280 ${T1} V${B1 + 24} M400 ${T1} V${B1 + 24}
            M22 ${T2} V${T2 + 24} M160 ${T2} V${T2 + 24} M250 ${T2} V${T2 + 24} M330 ${T2} V${T2 + 24} M400 ${T2} V${T2 + 24}"/>
        </g>
        <path fill="none" stroke="${INK}" stroke-width="2" d="M18 ${T1} q-6 17 0 34 q-6 17 0 34"/>
        ${trebleClef(30, T1)}${flats(44, T1, TREBLE_FLATS)}${time(88, T1)}
        ${bassClef(30, B1)}${flats(46, B1, BASS_FLATS)}${time(88, B1)}
        ${note(112, 64, { open: true, dot: true })}
        ${note(204, 55, { up: false })}${note(230, 61, { up: false })}${note(256, 64, { up: false })}
        <path fill="none" stroke="${INK}" stroke-width="1.1" d="M200 48 Q230 36 260 46"/>
        ${note(296, 70, { open: true })}${note(356, 67)}
        <text x="104" y="90" font-family="Georgia, serif" font-style="italic" font-weight="bold" font-size="12" fill="${INK}">p</text>
        ${oomPahPah(110, 117)}${oomPahPah(200, 111)}${oomPahPah(294, 117, 36)}
        ${trebleClef(30, T2)}${flats(44, T2, TREBLE_FLATS)}
        <path fill="none" stroke="${INK}" stroke-width="3" d="M87.8 ${T2 - 8.5} L103.8 ${T2 - 11.5}"/>
        ${note(84, T2 + 12)}${note(100, T2 + 9)}${note(124, T2 + 6, { up: false })}${note(146, T2 + 3, { up: false })}
        ${note(172, T2 + 9, { open: true, dot: true })}
        <!-- A bar scratched out and left. -->
        ${note(262, T2 + 15)}${note(288, T2 + 12)}${note(314, T2 + 9)}
        <path fill="none" stroke="${INK}" stroke-width="1.6" d="M254 ${T2 + 20} l10 -22 l8 24 l9 -24 l8 24 l9 -24 l8 24 l9 -22 l6 20"/>
        ${note(344, T2 + 6, { up: false, open: true })}${note(384, T2 + 12)}`;
  };

  return `
  <svg class="slide" data-scene="room" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" style="--focus: 820px 660px; --zoom: 1.12">
    <defs>
      <!-- Cheap striped paper, faded, with a damp stain spreading from the corner under the eaves. -->
      <pattern id="ro-paper" width="72" height="72" patternUnits="userSpaceOnUse">
        <rect width="72" height="72" fill="#2c231b"/><rect width="26" height="72" fill="#30261d"/>
        <path fill="#372b20" d="M49 14 q5 7 0 14 q-5 -7 0 -14z M49 50 q5 7 0 14 q-5 -7 0 -14z M45 32 q4 3 8 0 q-4 -3 -8 0z"/>
      </pattern>
      <radialGradient id="ro-damp" cx="240" cy="190" r="260" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#4a3e2a" stop-opacity=".5"/><stop offset=".6" stop-color="#3a3020" stop-opacity=".25"/>
        <stop offset="1" stop-color="#3a3020" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="ro-night" x1="0" y1="58" x2="0" y2="300" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#101216"/><stop offset=".5" stop-color="#2a2629"/><stop offset="1" stop-color="#65503a"/>
      </linearGradient>
      <!-- The town's rows, lighter and warmer the further off, each fading into the mist at its foot. -->
      <linearGradient id="ro-far" x1="0" y1="330" x2="0" y2="420" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#2c2421"/><stop offset="1" stop-color="#3e3128"/>
      </linearGradient>
      <linearGradient id="ro-back" x1="0" y1="288" x2="0" y2="340" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#241e1c"/><stop offset="1" stop-color="#342922"/>
      </linearGradient>
      <linearGradient id="ro-between" x1="0" y1="310" x2="0" y2="370" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#1c1819"/><stop offset="1" stop-color="#2a221f"/>
      </linearGradient>
      <!-- Soft puffs of smoke; a gradient rather than the blur filter, which would smear puffs this small away. -->
      <radialGradient id="ro-puff-far"><stop offset="0" stop-color="#7a6452"/><stop offset="1" stop-color="#7a6452" stop-opacity="0"/></radialGradient>
      <radialGradient id="ro-puff-near"><stop offset="0" stop-color="#6a6266"/><stop offset="1" stop-color="#6a6266" stop-opacity="0"/></radialGradient>
      <linearGradient id="ro-table" x1="0" y1="540" x2="0" y2="900" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#3a2614"/><stop offset=".4" stop-color="#4a3018"/><stop offset="1" stop-color="#22160b"/>
      </linearGradient>
      <!-- The candle is the only light. -->
      <radialGradient id="ro-candlelight" cx="470" cy="552" r="900" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffd590" stop-opacity=".42"/><stop offset=".25" stop-color="#e8a050" stop-opacity=".18"/>
        <stop offset=".6" stop-color="#e8a050" stop-opacity=".05"/><stop offset="1" stop-color="#e8a050" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="ro-flame" cx=".5" cy=".62" r=".5">
        <stop offset="0" stop-color="#fff6d8"/><stop offset=".45" stop-color="#ffd27a"/><stop offset="1" stop-color="#e98a2a" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="ro-halo">
        <stop offset="0" stop-color="#ffd27a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="ro-dark" cx="700" cy="620" r="980" gradientUnits="userSpaceOnUse">
        <stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".78"/>
      </radialGradient>
      <linearGradient id="ro-enamel" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e8e0cc"/><stop offset=".5" stop-color="#cfc6b0"/><stop offset="1" stop-color="#8a8270"/>
      </linearGradient>
      <linearGradient id="ro-wax" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#f4e6c4"/><stop offset=".6" stop-color="#e2d0a6"/><stop offset="1" stop-color="#a8966e"/>
      </linearGradient>
      <filter id="ro-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
      <clipPath id="ro-glass"><rect x="948" y="58" width="484" height="424"/></clipPath>
      <pattern id="ro-rain" width="76" height="280" patternUnits="userSpaceOnUse">
        <path stroke="#cbbb98" stroke-width="1" d="M14 20 l-6 22 M52 90 l-6 22 M30 170 l-6 22 M70 220 l-6 22 M40 4 l-6 22 M8 128 l-6 22"/>
      </pattern>
    </defs>
    <g class="camera">
      <!-- The wall, and the eaves sloping down into the room. -->
      <rect width="1600" height="560" fill="url(#ro-paper)"/>
      <rect width="1600" height="560" fill="url(#ro-damp)"/>
      <path fill="#17110c" d="M-20 -20 H760 L-20 400Z"/>
      <path fill="none" stroke="#2a1e14" stroke-width="6" d="M760 -20 L-20 400"/>
      <path fill="#3e3326" opacity=".6" d="M640 46 l14 4 l-4 30 l-12 -6z"/>

      <!-- The window under the eaves: a sash of four panes, and outside the town by night in the rain. -->
      <rect x="928" y="38" width="524" height="464" fill="#2a2018"/>
      <g clip-path="url(#ro-glass)">
        <rect x="948" y="58" width="484" height="424" fill="url(#ro-night)"/>
        <!-- Low cloud lit from beneath by the town. -->
        <g transform="translate(0 -110)">
          <g class="clouds" fill="#6a5440" filter="url(#ln-blur)" opacity=".55">
            <ellipse cx="1060" cy="300" rx="160" ry="22"/><ellipse cx="1330" cy="282" rx="190" ry="26"/><ellipse cx="1200" cy="330" rx="240" ry="18"/>
          </g>
        </g>
        <g transform="translate(0 -86)">
          <!-- Far off: a spire with its clock lit, a mill chimney, the dome of the town hall, a gasholder. -->
          <g fill="url(#ro-far)">
            <path d="M950 600 V352 h30 v-14 h40 l20 -14 l20 14 h50 v-20 h60 v20 h40 l24 -16 l24 16 h60 v-10 h50 v10 h60 V600Z"/>
            <path d="M1000 352 V286 h22 v66Z M998 286 l13 -70 l13 70Z"/>
            <path d="M1112 352 L1116 232 h10 L1130 352Z"/>
            <path d="M1268 340 V312 h70 v28Z M1272 312 a31 31 0 0 1 62 0Z M1300 281 v-14 h6 v14Z M1297 268 l6 -8 l6 8z"/>
          </g>
          <path fill="none" stroke="#2c2421" stroke-width="1.6" d="M1372 348 V300 M1392 348 V300 M1412 348 V300 M1432 348 V300 M1372 300 H1440 M1372 324 H1440 M1372 300 L1392 324 L1412 300 L1432 324"/>
          <path fill="#272020" d="M1370 348 h70 v-26 q-35 -8 -70 0z"/>
          <circle cx="1011" cy="300" r="5" fill="#d9a050" opacity=".75"/>
          <!-- The mill chimney's smoke: puffs leave the stack one after another, swell and drift off on the wind.
               Slow and short from this far off, quick and long from the near stack: that reads as distance. -->
          <g class="plume plume-far" fill="url(#ro-puff-far)">
            <ellipse cx="1121" cy="226" rx="9" ry="6" style="--delay: 0s"/><ellipse cx="1121" cy="226" rx="9" ry="6" style="--delay: -3.5s"/>
            <ellipse cx="1121" cy="226" rx="9" ry="6" style="--delay: -7s"/><ellipse cx="1121" cy="226" rx="9" ry="6" style="--delay: -10.5s"/>
          </g>
          <g fill="#c07a40" opacity=".4">
            <rect x="962" y="366" width="3" height="4"/><rect x="1046" y="360" width="3" height="4"/><rect x="1154" y="356" width="3" height="4"/>
            <rect x="1226" y="362" width="3" height="4"/><rect x="1352" y="370" width="3" height="4"/><rect x="1240" y="374" width="3" height="4"/>
          </g>
        </g>
        <!-- Mist hanging over the roofs, lit by the town, between one row and the next. -->
        <ellipse class="fog" cx="1190" cy="298" rx="320" ry="16" fill="#6a5440" opacity=".3" filter="url(#ln-blur)"/>
        <!-- Between the far town and the nearer row, two rows of scattered roofs, with gaps left so what is
             behind shows through, to give the town some depth. -->
        <g fill="url(#ro-back)">
          <path d="M948 500 V296 h28 V500Z M954 296 v-10 h6 v10z"/>
          <path d="M1004 500 V304 l24 -16 l24 16 V500Z"/>
          <path d="M1088 500 V300 h52 V500Z M1096 300 v-14 h8 v14z M1116 300 v-10 h7 v10z"/>
          <path d="M1150 500 V306 h30 l24 -20 l24 20 V500Z M1212 500 V282 l18 -26 l18 26 V500Z"/>
          <path d="M1350 500 V300 l20 -14 l20 14 V500Z"/>
        </g>
        <g fill="#c8844a" opacity=".45">
          <rect x="1024" y="308" width="3" height="4"/><rect x="1228" y="304" width="3" height="4"/><rect x="1366" y="306" width="3" height="4"/>
        </g>
        <ellipse class="fog" cx="1190" cy="330" rx="320" ry="12" fill="#6a5440" opacity=".15" filter="url(#ln-blur)"/>
        <g transform="translate(0 14)">
          <g fill="url(#ro-between)">
            <path d="M948 500 V320 h18 l28 -20 l28 20 h6 V500Z M958 320 v-12 h7 v12z"/>
            <path d="M1104 500 V330 l28 -20 l28 20 h8 V316 h48 V500Z M1176 316 v-14 h8 v14z M1196 316 v-10 h7 v10z"/>
            <path d="M1234 500 V324 l34 -18 l34 18 V500Z M1244 318 v-12 h7 v12z"/>
          </g>
          <g fill="#d9a050" opacity=".55">
            <rect x="986" y="334" width="4" height="5"/><rect x="1140" y="344" width="4" height="5"/>
            <rect x="1206" y="330" width="4" height="5"/><rect x="1262" y="340" width="4" height="5"/>
          </g>
        </g>
        <ellipse class="fog" cx="1190" cy="372" rx="320" ry="12" fill="#6a5440" opacity=".18" filter="url(#ln-blur)"/>
        <g transform="translate(0 -20)">
          <!-- Nearer: a row of roofs and chimney stacks, a few windows still lit, and the glow of a street
               lamp coming up from the street between. -->
          <circle cx="1218" cy="470" r="70" fill="url(#ro-halo)" opacity=".6"/>
          <path fill="#151418" d="M948 500 V396 h36 v-24 h8 v-6 h8 v6 h8 v-6 h8 v6 h6 v24 h60 l40 -28 l40 28 h30 V500Z
            M1240 500 V400 h50 l30 -22 l30 22 h22 v-30 h8 v-6 h9 v6 h9 v-6 h8 v6 h6 v30 h20 V500Z
            M1030 500 V300 l32 -30 l32 30 V500Z M1384 500 V318 h48 V500Z M1392 318 v-18 h9 v18z M1412 318 v-13 h9 v13z"/>
          <!-- The warehouse's hoist beam and loading doors, and a lamp in the terrace's top window. -->
          <path fill="#151418" d="M1058 296 h22 v4 h-22z"/>
          <path fill="none" stroke="#151418" stroke-width="1.2" d="M1078 300 V318"/>
          <path fill="#100f13" d="M1054 312 h16 v26 h-16z M1054 352 h16 v26 h-16z"/>
          <g fill="#d9a050" opacity=".7"><rect x="1400" y="330" width="7" height="9"/><rect x="1020" y="404" width="7" height="9"/><rect x="1112" y="394" width="6" height="8"/>
            <rect x="1312" y="410" width="7" height="9"/><rect x="1410" y="408" width="6" height="8"/></g>
        </g>
        <ellipse class="fog" cx="1190" cy="404" rx="320" ry="14" fill="#6a5440" opacity=".22" filter="url(#ln-blur)"/>
        <!-- The nearest roof, its slates shining wet, a chimney stack, and a cat sitting out the rain on the ridge. -->
        <path fill="#0f0f12" d="M948 484 V452 L1190 424 L1432 446 V484Z"/>
        <path fill="none" stroke="#3a3a42" stroke-width="1" opacity=".5" d="M948 462 L1190 434 L1432 456 M948 472 L1190 444 L1432 466"/>
        <path fill="#0b0b0d" d="M1300 440 V210 h56 v230Z M1296 210 h64 v-8 h-64z M1304 202 v-22 h11 v22z M1321 202 v-30 h12 v30z M1339 202 v-20 h11 v20z"/>
        <g class="plume plume-near" fill="url(#ro-puff-near)">
          <ellipse cx="1327" cy="170" rx="9" ry="6" style="--delay: 0s"/><ellipse cx="1327" cy="170" rx="9" ry="6" style="--delay: -0.6s"/>
          <ellipse cx="1327" cy="170" rx="9" ry="6" style="--delay: -1.2s"/><ellipse cx="1327" cy="170" rx="9" ry="6" style="--delay: -1.8s"/>
          <ellipse cx="1327" cy="170" rx="9" ry="6" style="--delay: -2.4s"/><ellipse cx="1327" cy="170" rx="9" ry="6" style="--delay: -3s"/>
          <ellipse cx="1327" cy="170" rx="9" ry="6" style="--delay: -3.6s"/><ellipse cx="1327" cy="170" rx="9" ry="6" style="--delay: -4.2s"/>
        </g>
        <path fill="#060607" transform="translate(64 2)" d="M1146 430 c-2 -8 0 -16 4 -18 l-1 -6 l3 3 h4 l3 -3 l-1 6 c4 2 6 10 4 18z"/>
        <path fill="none" stroke="#060607" stroke-width="2.4" stroke-linecap="round" transform="translate(64 2)" d="M1162 428 q12 2 10 -8 q-1 -4 2 -6"/>
        <!-- The rain falling outside, and on the glass drops sitting and sliding down. -->
        <g class="drizzle drizzle-far" opacity=".14"><rect x="748" y="-400" width="900" height="1300" fill="url(#ro-rain)"/></g>
        <g fill="#b8a888" opacity=".7" data-drops='[{"x": [952, 1428], "y": [62, 478], "n": 110, "seed": 211, "r": [0.8, 2.4]}, {"x": [952, 1428], "y": [252, 260], "n": 22, "seed": 212, "r": [1, 1.8]}]'></g>
        <g data-drips='{"panes": [[948, 58, 1186, 260], [1194, 58, 1432, 260], [948, 284, 1186, 482], [1194, 284, 1432, 482]], "seed": 213, "scale": 1}'></g>
      </g>
      <!-- Sash bars and the meeting rail. -->
      <g fill="#3a2c20">
        <rect x="1186" y="58" width="8" height="424"/><rect x="948" y="260" width="484" height="24"/>
        <rect x="942" y="52" width="496" height="6"/><rect x="942" y="482" width="496" height="6"/>
      </g>
      <rect x="914" y="498" width="552" height="18" fill="#3a2a1c"/><rect x="914" y="516" width="552" height="5" fill="#120c08" opacity=".6"/>
      <!-- A thin curtain, hanging limp at one side. -->
      <path fill="#2c2a1e" d="M874 26 h84 C954 160 962 320 952 528 H868 C876 360 868 200 874 26Z"/>
      <path fill="none" stroke="#1c1a12" stroke-width="3" d="M894 32 C890 180 896 360 886 524 M918 32 C922 180 914 360 922 524 M940 32 C938 200 944 360 938 524"/>
      <rect x="858" y="20" width="620" height="6" rx="3" fill="#4a3a22"/>

      <!-- The table, its back edge against the wall. -->
      <rect y="536" width="1600" height="10" fill="#120b06" opacity=".7"/>
      <rect y="540" width="1600" height="360" fill="url(#ro-table)"/>
      <path fill="none" stroke="#1e130a" stroke-width="2" d="M-20 612 H1620 M-20 712 H1620 M-20 846 H1620"/>
      <path fill="none" stroke="#5a3c20" stroke-width="1" opacity=".5" d="M40 580 q200 -6 400 0 t420 2 M600 652 q180 6 360 0 t380 -4 M80 770 q240 -8 480 0 t500 6 M300 880 q300 8 600 0"/>

      <!-- The waltz, written out by hand for piano: a sheet of manuscript lying at the back of the table. -->
      <g transform="translate(600 552) rotate(-1.5) scale(1.12 .5)">
        <path fill="#000" opacity=".35" filter="url(#ro-shadow)" d="M16 16 H436 V216 H16Z"/>
        <rect width="420" height="200" fill="#cdbd96"/>
        <text x="210" y="30" text-anchor="middle" font-family="Caveat, cursive" font-size="30" fill="${INK}">Valse</text>
        <text x="30" y="38" font-family="Caveat, cursive" font-size="14" fill="${INK}">Lento</text>
        ${music()}
      </g>

      <!-- The candle stub in its enamel chamberstick, and the light it gives. -->
      <ellipse cx="490" cy="664" rx="80" ry="16" fill="#000" opacity=".45" filter="url(#ro-shadow)"/>
      <g transform="translate(470 648)">
        <path fill="#5a6a7a" d="M-66 0 a66 16 0 0 0 132 0 v4 a66 16 0 0 1 -132 0z"/>
        <ellipse rx="66" ry="16" fill="url(#ro-enamel)"/>
        <ellipse rx="56" ry="12" fill="none" stroke="#a89e88" stroke-width="1.2"/>
        <path fill="none" stroke="#4a5a6a" stroke-width="2.5" d="M-66 0 a66 16 0 0 0 132 0"/>
        <path fill="none" stroke="url(#ro-enamel)" stroke-width="6" d="M60 -6 q34 -4 30 14 q-4 14 -30 10"/>
        <ellipse cy="-4" rx="20" ry="6" fill="#bdb4a0"/>
        <rect x="-15" y="-74" width="30" height="70" fill="url(#ro-wax)"/>
        <ellipse cy="-74" rx="15" ry="4.5" fill="#efe0bc"/>
        <path fill="#efe0bc" d="M-15 -72 q-3 18 -1 30 q2 4 3 -2 q0 -14 2 -26z M9 -73 q3 10 2 24 q2 6 4 0 q0 -14 0 -26z M-6 -6 q-12 2 -14 4 h20z"/>
        <path stroke="#1a1208" stroke-width="1.6" d="M0 -74 q1 -6 0 -10"/>
      </g>
      <g class="candle">
        <rect width="1600" height="900" fill="url(#ro-candlelight)"/>
        <circle cx="470" cy="554" r="60" fill="url(#ro-halo)"/>
        <g transform="translate(470 566)"><g class="flame-dip">
          <path class="candle-flame" fill="url(#ro-flame)" d="M0 -40 C7 -26 10 -12 7 -4 C5 2 -5 2 -7 -4 C-10 -12 -7 -26 0 -40Z"/>
        </g></g>
      </g>

      <!-- What is left: pennies, two shillings, a sixpence and a half-crown, beside the empty purse;
           drawn at their own size and brought closer as one. -->
      <g transform="translate(800 760) scale(1.32) translate(-800 -760)">
      <g fill="#000" opacity=".45" filter="url(#ro-shadow)">
        <ellipse cx="826" cy="694" rx="34" ry="8"/><ellipse cx="904" cy="706" rx="24" ry="6"/>
        <ellipse cx="966" cy="680" rx="26" ry="6"/><ellipse cx="1110" cy="712" rx="70" ry="14"/>
      </g>
      ${pile(810, 692, 22, 4, COPPER)}
      ${pile(890, 704, 15, 2, SILVER)}
      ${coin(952, 678, 19, SILVER)}
      ${coin(860, 734, 11, SILVER)}
      ${coin(930, 736, 22, COPPER)}
      ${coin(815, 680, 22, COPPER)}
      <!-- The purse, its brass frame open, empty. -->
      <g transform="translate(1100 700)">
        <path fill="#2a1a10" d="M-58 -6 C-62 14 -40 26 0 26 C40 26 62 14 58 -6 C30 4 -30 4 -58 -6Z"/>
        <path fill="#1a0f08" d="M-54 -8 C-30 -2 30 -2 54 -8 C40 -16 -40 -16 -54 -8Z"/>
        <path fill="none" stroke="#a27a33" stroke-width="3" d="M-56 -7 C-30 0 30 0 56 -7"/>
        <path fill="none" stroke="#a27a33" stroke-width="3" d="M-52 -12 C-34 -40 34 -40 52 -12"/>
        <path fill="#3a2414" d="M-50 -14 C-34 -36 34 -36 50 -14 C30 -22 -30 -22 -50 -14Z"/>
        <g fill="#c49a4a"><circle cx="-6" cy="-36" r="4"/><circle cx="6" cy="-36" r="4"/></g>
      </g>

      <!-- The rent book, and the sum on a scrap of paper. -->
      <g transform="translate(556 708) rotate(-6)">
        <rect x="4" y="6" width="150" height="90" fill="#000" opacity=".35" filter="url(#ro-shadow)"/>
        <path fill="#b8a27a" d="M0 0 H146 L156 84 H8Z"/>
        <path fill="none" stroke="#6a5436" stroke-width="1.2" d="M8 8 H140 L148 76 H14Z"/>
        <text x="78" y="36" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="17" fill="#3a2a18">RENT BOOK</text>
        <text x="80" y="58" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="10" fill="#3a2a18">four shillings weekly</text>
      </g>
      <g transform="translate(712 700) rotate(4)">
        <rect x="3" y="5" width="112" height="92" fill="#000" opacity=".3" filter="url(#ro-shadow)"/>
        <path fill="#d2c39e" d="M0 0 H108 L112 90 H6 L2 66Z"/>
        <g font-family="Caveat, cursive" font-size="15" fill="#3a3448" text-anchor="end">
          <text x="50" y="19">2/6</text><text x="50" y="33">2/–</text><text x="50" y="47">6</text><text x="50" y="61">5</text>
          <text x="50" y="81">5/5</text>
        </g>
        <path stroke="#3a3448" stroke-width="1" d="M20 66 H56"/>
        <text x="60" y="33" font-family="Caveat, cursive" font-size="13" fill="#3a3448">rent 4/–</text>
        <text x="60" y="47" font-family="Caveat, cursive" font-size="13" fill="#3a3448">a week</text>
      </g>
      <path stroke="#5a2a1a" stroke-width="5" stroke-linecap="round" d="M890 792 L1000 768"/>
      <path fill="#d8b888" d="M1000 768 l14 -5 l-12 9z"/><path fill="#1a1410" d="M1012 763.5 l3 -1 l-2 2z"/>
      </g>

      <rect width="1600" height="900" fill="url(#ro-dark)"/>
    </g>
  </svg>`;
};
