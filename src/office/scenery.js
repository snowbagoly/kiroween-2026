// Grass, reeds, bare trees and raindrops for the pictures [design 8]. Drawing hundreds of blades by hand
// would bury the markup in numbers, so a picture only describes them and they're grown here, from a seed,
// so they come out the same every time.

const SVG_NS = 'http://www.w3.org/2000/svg';

// A small seeded random number generator (mulberry32): the same seed gives the same picture.
function sceneryRandom(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.between = (lo, hi) => lo + next() * (hi - lo);
  return next;
}

const num = (v) => (Math.abs(v) >= 20 ? Math.round(v) : Math.round(v * 10) / 10);

// A band of reeds: n blades between x[0] and x[1], growing from base, h[0] to h[1] tall.
// depth spreads them that far front to back (nearer ones a little taller); cattail is the share
// that carry a bulrush head. Returns the blades' path and the heads' path.
function reedsPaths({ x, base, h, n, seed, depth = 0, cattail = 0 }) {
  const rand = sceneryRandom(seed);
  const blades = [];
  const heads = [];
  for (let i = 0; i < n; i++) {
    const bx = rand.between(x[0], x[1]);
    const near = rand();
    const b = base + (near - .5) * depth;
    const height = rand.between(h[0], h[1]) * (.75 + near * .5);
    const bend = rand.between(-.25, .35) * height;
    const tx = bx + bend;
    const ty = b - height;
    const my = b - height * .6;
    blades.push(`M${num(bx - 1.2)} ${num(b)}Q${num(bx + bend * .2)} ${num(my)} ${num(tx)} ${num(ty)}`
      + `Q${num(bx + bend * .25 + 1)} ${num(my)} ${num(bx + 1.2)} ${num(b)}Z`);
    if (rand() < cattail) {
      const ry = num(height * .06);
      heads.push(`M${num(tx - 2.4)} ${num(ty + height * .12)}a2.4 ${ry} 0 1 0 4.8 0a2.4 ${ry} 0 1 0 -4.8 0`);
    }
  }
  return [blades.join(''), heads.join('')];
}

// A bare, windswept tree from (x, y): branches split and bend away from the wind (lean).
// Returns a path per stroke width, thickest first.
function treePaths({ x, y, length, angle = Math.PI / 2, seed, lean = -.25, depth = 6, thin = 1 }) {
  const rand = sceneryRandom(seed);
  const byWidth = new Map();
  const branch = (x1, y1, len, dir, width, d) => {
    const a = dir + lean * .3 + rand.between(-.25, .25);
    const x2 = x1 + Math.cos(a) * len;
    const y2 = y1 - Math.sin(a) * len;
    const cx = (x1 + x2) / 2 + rand.between(-.15, .15) * len;
    const key = num(width * thin);
    byWidth.set(key, (byWidth.get(key) ?? '') + `M${num(x1)} ${num(y1)}Q${num(cx)} ${num((y1 + y2) / 2)} ${num(x2)} ${num(y2)}`);
    if (d === 0) return;
    const forks = d > 2 ? 2 : (rand() < .5 ? 2 : 3);
    for (let i = 0; i < forks; i++) {
      const spread = rand.between(.3, .7) * (i % 2 === 0 ? 1 : -1);
      branch(x2, y2, len * rand.between(.6, .78), a + spread + lean * .2, Math.max(width * .62, .6), d - 1);
    }
  };
  branch(x, y, length, angle, length * .09, depth);
  return [...byWidth].sort((p, q) => q[0] - p[0]);
}

// Raindrops sitting on a window pane: n beads between x[0]..x[1] and y[0]..y[1], r[0] to r[1] across.
// Returns the beads, and the small bright glint each one catches.
function dropsPaths({ x, y, n, seed, r }) {
  const rand = sceneryRandom(seed);
  const beads = [];
  const glints = [];
  for (let i = 0; i < n; i++) {
    const cx = rand.between(x[0], x[1]);
    const cy = rand.between(y[0], y[1]);
    const rx = rand.between(r[0], r[1]);
    const ry = rx * rand.between(1, 1.3); // they sag a little
    beads.push(`M${num(cx - rx)} ${num(cy)}a${num(rx)} ${num(ry)} 0 1 0 ${num(rx * 2)} 0a${num(rx)} ${num(ry)} 0 1 0 ${num(-rx * 2)} 0`);
    const g = rx * .28;
    glints.push(`M${num(cx - rx * .3 - g)} ${num(cy - ry * .35)}a${num(g)} ${num(g)} 0 1 0 ${num(g * 2)} 0a${num(g)} ${num(g)} 0 1 0 ${num(-g * 2)} 0`);
  }
  return [beads.join(''), glints.join('')];
}

// Drops sliding down a window, two to a pane: panes are [x0, y0, x1, y1] (the bottom is the bar or
// the frame they run down to), scale sizes the drops. Each drop forms near the top of its pane and
// slides to the bottom in fits and starts on one of two paths (drip-a, drip-b in office.css).
const DRIP_PATHS = {
  a: [[0, 0], [1, 18], [1, 22], [-2, 50], [-2, 54], [1, 100], [1, 104], [0, 140]],
  b: [[0, 0], [-1, 30], [-1, 34], [2, 70], [2, 74], [0, 110], [0, 113], [-1, 140]],
};
function dripsMarkup({ panes, seed, scale = 1 }) {
  const rand = sceneryRandom(seed);
  let out = '';
  for (const [x0, y0, x1, y1] of panes) {
    for (let i = 0; i < 2; i++) {
      const x = num(x0 + (x1 - x0) * (i + rand.between(.2, .8)) / 2);
      const y = num(y0 + rand.between(.1, .3) * (y1 - y0));
      const fall = y1 - y - 4 * scale;
      const path = rand() < .5 ? 'a' : 'b';
      const dur = rand.between(7, 11);
      const trail = DRIP_PATHS[path].map(([dx, dy]) => `${num(x + dx * scale)} ${num(y + dy / 140 * fall - 3 * scale)}`).join(' L');
      out += `<g class="drip drip-${path}" style="--dur: ${dur.toFixed(1)}s; --delay: ${(-rand() * dur).toFixed(1)}s; --fall: ${num(fall / scale)}px">`
        + `<path class="trail" pathLength="100" fill="none" stroke="#cfc3a6" stroke-width="${num(1.5 * scale)}" stroke-linecap="round" opacity=".2" d="M${trail}"/>`
        + `<g transform="translate(${x} ${y}) scale(${scale})"><g class="drop">${DROP_SHAPE}</g></g></g>`;
    }
  }
  return out;
}

// One drop on the glass, about 7 by 12 around its middle: a darker lens, its lit lower rim and a glint.
const DROP_SHAPE = '<path fill="#040507" opacity=".55" d="M0 -5 C2.4 -2 3.4 1 3.4 3 C3.4 5.4 1.8 7 0 7 C-1.8 7 -3.4 5.4 -3.4 3 C-3.4 1 -2.4 -2 0 -5Z"/>'
  + '<path fill="none" stroke="#f2e2b8" stroke-width=".9" opacity=".55" d="M-2.4 4.2 Q0 7.4 2.4 4.2"/>'
  + '<circle cx="-1" cy="1" r=".9" fill="#fff6dc" opacity=".85"/>';
const DROP_BOX = [-3.4, -5, 6.8, 12];

const CLING_PER_PANE = 3;
const CLING_SECONDS = [18, 40]; // one drop's whole life: forming, clinging, running down, its streak drying

// Drops clinging to a window: they form slowly, cling for a long while, then gather and run down to the
// bar or the frame in one go, leaving a wet streak that dries; then a new one forms (cling in
// office.css). panes are [x0, y0, x1, y1] (the bottom is the bar or the frame they run down to);
// scale sizes the drops. Each drop's path is a box as wide as the drop and as tall as its fall, which the
// drop moves down by 100% of, so one set of keyframes fits every drop.
function clingDrops({ panes, seed, scale = 1 }) {
  const rand = sceneryRandom(seed);
  const drops = [];
  for (const [x0, y0, x1, y1] of panes) {
    for (let i = 0; i < CLING_PER_PANE; i++) {
      const size = scale * rand.between(.75, 1.15);
      const width = DROP_BOX[2] * size;
      const height = DROP_BOX[3] * size;
      const x = x0 + (x1 - x0) * (i + rand.between(.2, .8)) / CLING_PER_PANE;
      const y = y0 + rand.between(.05, .45) * (y1 - y0);
      const fall = y1 - y - height; // how far the drop's top runs
      const dur = rand.between(...CLING_SECONDS);
      const style = `--dur: ${dur.toFixed(1)}s; --delay: ${(-rand() * dur).toFixed(1)}s; --middle: ${(height * .6 / fall * 100).toFixed(2)}%`;
      drops.push({ x, y, fall, size, width, streak: .8 * scale, style });
    }
  }
  return drops;
}

// The drops as an HTML layer over a picture of size [w, h] (laid there by growScenery). A drop moving
// inside an SVG repaints the picture every frame, while one on its own layer is only moved by the
// graphics card; so the office window, which is otherwise still, has them this way.
function clingLayerMarkup(options, [w, h]) {
  const pct = (v, of) => `${(v / of * 100).toFixed(2)}%`;
  return clingDrops(options).map(({ x, y, fall, width, streak, style }) =>
    `<div class="cling" style="left: ${pct(x - width / 2, w)}; top: ${pct(y, h)}; width: ${pct(width, w)}; height: ${pct(fall, h)}; ${style}">`
    + `<i class="cling-trail" style="left: ${pct((width - streak) / 2, width)}; width: ${pct(streak, width)}"></i>`
    + `<div class="cling-drop"><svg viewBox="${DROP_BOX.join(' ')}">${DROP_SHAPE}</svg></div></div>`).join('');
}

// The same drops drawn inside the picture, for pictures that move as a whole (a slow camera),
// which an HTML layer couldn't follow; there they cost little, as the picture is repainted anyway.
// Each part carries an invisible box the size of its path, so its own box measures the moves as above.
function clingSvgMarkup({ id, ...options }) {
  const streak = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">`
    + '<stop offset="0" stop-color="#cfc3a6" stop-opacity="0"/><stop offset=".7" stop-color="#cfc3a6" stop-opacity=".14"/>'
    + '</linearGradient></defs>';
  return streak + clingDrops(options).map(({ x, y, fall, size, width, streak: sw, style }) =>
    `<g class="cling" style="${style}">`
    + `<rect class="cling-trail" x="${num(x - sw / 2)}" y="${num(y)}" width="${sw.toFixed(2)}" height="${num(fall)}" rx=".4" fill="url(#${id})"/>`
    + `<g class="cling-drop"><rect x="${num(x - width / 2)}" y="${num(y)}" width="${width.toFixed(2)}" height="${num(fall)}" fill="none"/>`
    + `<g transform="translate(${num(x)} ${num(y - DROP_BOX[1] * size)}) scale(${size.toFixed(3)})">${DROP_SHAPE}</g></g></g>`).join('');
}

// Grows everything described in a picture: elements with data-reeds (one band or a list of bands)
// get the blades as paths, elements with data-tree (one tree or a list) get the branches, and
// elements with data-drops (one patch or a list) get raindrops, elements with data-drips get
// drops sliding down a window, and elements with data-cling get drops clinging to it.
export function growScenery(rootEl) {
  const add = (parent, d, attrs = {}) => {
    if (!d) return;
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    for (const [k, v] of Object.entries(attrs)) path.setAttribute(k, v);
    parent.append(path);
  };
  const list = (json) => [JSON.parse(json)].flat();
  for (const el of rootEl.querySelectorAll('[data-reeds]')) {
    for (const band of list(el.dataset.reeds)) {
      const [blades, heads] = reedsPaths(band);
      add(el, blades);
      add(el, heads);
    }
  }
  for (const el of rootEl.querySelectorAll('[data-tree]')) {
    for (const tree of list(el.dataset.tree)) {
      for (const [width, d] of treePaths(tree)) add(el, d, { 'stroke-width': width });
    }
  }
  for (const el of rootEl.querySelectorAll('[data-drips]')) {
    el.innerHTML = dripsMarkup(JSON.parse(el.dataset.drips));
  }
  // Clinging drops are drawn in place, or with "layer" go in a layer of their own laid over the picture
  // (its parent must be positioned and the picture's size), so they move without repainting it.
  for (const el of rootEl.querySelectorAll('[data-cling]')) {
    const { layer, ...options } = JSON.parse(el.dataset.cling);
    if (!layer) {
      el.innerHTML = clingSvgMarkup(options);
      continue;
    }
    const svg = el.ownerSVGElement;
    const [, , w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
    const layerEl = document.createElement('div');
    layerEl.className = 'cling-layer';
    layerEl.setAttribute('aria-hidden', 'true');
    layerEl.innerHTML = clingLayerMarkup(options, [w, h]);
    svg.after(layerEl);
    el.remove();
  }
  for (const el of rootEl.querySelectorAll('[data-drops]')) {
    for (const patch of list(el.dataset.drops)) {
      const [beads, glints] = dropsPaths(patch);
      // A drop on dark glass reads as a darker lens with one bright point, not as a light dot.
      add(el, beads, { opacity: .3, fill: '#0c0a08' });
      add(el, glints, { opacity: .4 });
    }
  }
}
