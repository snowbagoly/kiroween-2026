// The desk: one inline SVG, 16:9. Colours come from CSS variables [design 8, R3.2, R7.2].
export const DESK_PARTS = ['window', 'paper', 'sounder', 'key', 'galvanometer-slot', 'thought'];

export function getMode(search = '') {
  const m = new URLSearchParams(search).get('mode');
  return m === 'day' ? 'day' : 'night';
}

const stop = (o, v) => `<stop offset="${o}" style="stop-color:var(${v})"/>`;

function planks() {
  let p = '';
  for (let x = 12; x < 160; x += 12) p += `M${x} 0V44`;
  return `<path class="plank" d="${p}"/>`;
}

function rain() {
  let p = '';
  for (let i = 0; i < 18; i++) {
    const x = 11 + ((i * 7.3) % 34);
    const y = 7 + ((i * 11.7) % 30);
    p += `M${x.toFixed(1)} ${y.toFixed(1)}l-1 4`;
  }
  return `<path class="rain" d="${p}"/>`;
}

export function deskSvg() {
  return `<svg class="desk" viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Telegraph desk">
  <defs>
    <linearGradient id="g-wall" x1="0" y1="0" x2="0" y2="1">${stop(0, '--wall2')}${stop(1, '--wall')}</linearGradient>
    <linearGradient id="g-desk" x1="0" y1="0" x2="0" y2="1">${stop(0, '--desk')}${stop(1, '--desk2')}</linearGradient>
    <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">${stop(0, '--sky')}${stop(1, '--sky2')}</linearGradient>
    <linearGradient id="g-brass" x1="0" y1="0" x2="0" y2="1">${stop(0, '--brass')}${stop(1, '--brass2')}</linearGradient>
    <radialGradient id="g-face" cx=".4" cy=".35" r=".7">${stop(0, '--face')}${stop(1, '--paper')}</radialGradient>
    <radialGradient id="g-dark" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-opacity="0"/><stop offset="1" style="stop-color:var(--shade)"/></radialGradient>
    <clipPath id="c-sky"><rect x="11" y="7" width="34" height="34"/></clipPath>
  </defs>

  <rect fill="url(#g-wall)" x="0" y="0" width="160" height="60"/>
  ${planks()}
  <rect class="wainscot" x="0" y="44" width="160" height="16"/>
  <rect class="rail" x="0" y="43" width="160" height="1.6"/>

  <g id="window">
    <rect class="frame" x="9" y="5" width="38" height="38" rx=".6"/>
    <rect fill="url(#g-sky)" x="11" y="7" width="34" height="34"/>
    <g clip-path="url(#c-sky)">
      <path class="hills" d="M11 34q8-5 15-2t19-3V41H11z"/>
      <path class="pole" d="M38 26v10M35.5 27h5"/>
      <path class="wire" d="M11 29q14 3 27-2.5"/>
      ${rain()}
    </g>
    <path class="sash" d="M28 7V41M11 24H45"/>
    <rect class="frame" x="7.5" y="42" width="41" height="2.4" rx=".4"/>
  </g>

  <g id="paper">
    <rect class="shadow" x="62.5" y="9.5" width="34" height="32" transform="rotate(-2 79 25)"/>
    <g transform="rotate(-2 79 25)">
      <rect class="paper" x="61" y="8" width="34" height="32"/>
      <text class="head" x="78" y="13.5" text-anchor="middle">TELEGRAM</text>
      <path class="rule" d="M64 15.5H92"/>
      <path class="line" d="M64 20H92M64 24H92M64 28H88M64 32H82"/>
      <circle class="pin" cx="78" cy="9.5" r=".9"/>
    </g>
  </g>

  <g id="galvanometer-slot">
    <rect class="board" x="115" y="6" width="30" height="34" rx="1"/>
    <circle class="screw" cx="118" cy="9" r=".7"/><circle class="screw" cx="142" cy="9" r=".7"/>
    <circle class="screw" cx="118" cy="37" r=".7"/><circle class="screw" cx="142" cy="37" r=".7"/>
    <circle fill="url(#g-brass)" cx="130" cy="23" r="12.5"/>
    <circle fill="url(#g-face)" cx="130" cy="23" r="10.5"/>
    <path class="glare" d="M123 18a9 9 0 0 1 7-5"/>
  </g>

  <rect fill="url(#g-desk)" x="0" y="60" width="160" height="25"/>
  <path class="grain" d="M0 65q40 -1.5 80 0t80 -.5M0 71q50 1.5 100 0t60 .5M0 78q35 -1 70 0t90 .4"/>
  <path class="cable" d="M28 71q-10 -1 -15 6t-13 5M144 76q7 0 7 -10V41q0 -2 -6 -2"/>

  <g id="key">
    <ellipse class="shadow" cx="47" cy="82" rx="26" ry="2.4"/>
    <rect class="base" x="22" y="72" width="50" height="9" rx="1.2"/>
    <rect class="base-top" x="22" y="72" width="50" height="1.6" rx=".8"/>
    <circle fill="url(#g-brass)" cx="28" cy="72" r="2"/><circle fill="url(#g-brass)" cx="33.5" cy="72" r="2"/>
    <rect fill="url(#g-brass)" x="38" y="67" width="5" height="5.5"/>
    <rect fill="url(#g-brass)" x="51" y="68.5" width="2" height="4"/>
    <g class="lever">
      <rect fill="url(#g-brass)" x="36" y="65" width="31" height="2.4" rx="1"/>
      <ellipse class="knob" cx="64" cy="64" rx="4.6" ry="2.4"/>
      <ellipse class="knob-top" cx="63.2" cy="63.2" rx="2.4" ry=".9"/>
    </g>
  </g>

  <g id="sounder">
    <ellipse class="shadow" cx="124" cy="82" rx="22" ry="2.4"/>
    <rect class="base" x="103" y="72" width="42" height="9" rx="1.2"/>
    <rect class="base-top" x="103" y="72" width="42" height="1.6" rx=".8"/>
    <rect class="coil" x="110" y="62" width="6" height="10" rx="1"/>
    <rect class="coil" x="118" y="62" width="6" height="10" rx="1"/>
    <rect fill="url(#g-brass)" x="109.5" y="61" width="7" height="1.6"/>
    <rect fill="url(#g-brass)" x="117.5" y="61" width="7" height="1.6"/>
    <rect fill="url(#g-brass)" x="134" y="55" width="3" height="17"/>
    <g class="arm"><rect fill="url(#g-brass)" x="107" y="56.6" width="31" height="2.6" rx=".8"/></g>
    <rect fill="url(#g-brass)" x="128" y="51" width="1.6" height="5"/>
  </g>

  <rect class="edge" x="0" y="84" width="160" height="6"/>
  <text id="thought" class="thought" x="80" y="88.4" text-anchor="middle"></text>
  <rect class="vignette" fill="url(#g-dark)" x="0" y="0" width="160" height="90" pointer-events="none"/>
</svg>`;
}

export function mountScene(root, search = '') {
  const mode = getMode(search);
  root.innerHTML = deskSvg();
  if (root.ownerDocument?.documentElement) root.ownerDocument.documentElement.dataset.mode = mode;
  return { mode };
}
