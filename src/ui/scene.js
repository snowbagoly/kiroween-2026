// The desk: one inline SVG, 16:9. Colours come from CSS variables [design 8, R3.2, R7.2].
export const DESK_PARTS = ['window', 'paper', 'sounder', 'key', 'galvanometer-slot', 'thought'];

export function getMode(search = '') {
  const m = new URLSearchParams(search).get('mode');
  return m === 'day' ? 'day' : 'night';
}

export function deskSvg() {
  return `<svg class="desk" viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Telegraph desk">
  <rect class="wall" x="0" y="0" width="160" height="62"/>
  <g id="window">
    <rect class="frame" x="8" y="6" width="40" height="34" rx="1"/>
    <rect class="sky" x="10" y="8" width="36" height="30"/>
    <path class="bar" d="M28 8V38M10 23H46"/>
  </g>
  <g id="galvanometer-slot">
    <circle class="frame" cx="130" cy="26" r="16"/>
    <circle class="slot" cx="130" cy="26" r="13"/>
  </g>
  <rect class="desktop" x="0" y="62" width="160" height="28"/>
  <g id="paper">
    <rect class="paper" x="62" y="14" width="40" height="46" transform="rotate(-2 82 37)"/>
    <path class="line" d="M67 24H97M67 31H97M67 38H90"/>
  </g>
  <g id="sounder">
    <rect class="metal" x="108" y="66" width="30" height="6" rx="1"/>
    <rect class="arm" x="112" y="60" width="22" height="3"/>
    <rect class="metal" x="114" y="63" width="3" height="3"/>
  </g>
  <g id="key">
    <rect class="wood" x="30" y="74" width="40" height="10" rx="1"/>
    <rect class="metal" x="36" y="68" width="6" height="6"/>
    <g class="lever"><rect class="metal" x="38" y="64" width="28" height="3" rx="1"/><circle class="knob" cx="62" cy="62" r="4"/></g>
  </g>
  <text id="thought" class="thought" x="80" y="87" text-anchor="middle"></text>
</svg>`;
}

export function mountScene(root, search = '') {
  const mode = getMode(search);
  root.innerHTML = deskSvg();
  if (root.ownerDocument?.documentElement) root.ownerDocument.documentElement.dataset.mode = mode;
  return { mode };
}
