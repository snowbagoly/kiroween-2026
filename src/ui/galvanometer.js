// Galvanometer: the lives dial on the wall [design 8, R5.1 to R5.3, R5.7, R5.8].
// Full lives: needle points straight up. Each lost life swings it one step clockwise.
// One life: lowest step. Zero lives: the needle falls into the red zone.
const CX = 130;
const CY = 23;
const SWEEP = 135; // degrees from the top step to the lowest step
const DEAD_ANGLE = 158;

export function needleAngle(lives, max) {
  if (lives <= 0) return DEAD_ANGLE;
  if (max <= 1) return 0;
  return ((max - Math.min(lives, max)) * SWEEP) / (max - 1);
}

// Degrees of shake: none in the upper part, more and more near the red zone.
export function trembleFor(lives, max) {
  if (max <= 1) return 0;
  const near = 1 - (Math.max(1, Math.min(lives, max)) - 1) / (max - 1); // 0 at full, 1 at one life
  if (near < 0.4) return 0;
  const shake = Math.round(Math.min(1, (near - 0.4) / 0.6) ** 2 * 30) / 10;
  return lives <= 0 ? shake + 1 : shake;
}

export const livesLabel = (lives, max) => `${lives} of ${max} lives`;

const pt = (a, r) => {
  const rad = (a * Math.PI) / 180;
  return [(CX + r * Math.sin(rad)).toFixed(2), (CY - r * Math.cos(rad)).toFixed(2)];
};

export function dialSvg(max) {
  let ticks = '';
  for (let l = max; l >= 1; l--) {
    const a = needleAngle(l, max);
    const [x1, y1] = pt(a, 8);
    const [x2, y2] = pt(a, 9.8);
    ticks += `M${x1} ${y1}L${x2} ${y2}`;
  }
  const [rx1, ry1] = pt(SWEEP + 6, 9);
  const [rx2, ry2] = pt(172, 9);
  const [nx, ny] = pt(0, 8.6);
  const [tx, ty] = pt(180, 2.2);
  return `<path class="g-ticks" d="${ticks}"/>
    <path class="g-red" d="M${rx1} ${ry1}A9 9 0 0 1 ${rx2} ${ry2}"/>
    <g class="needle"><g class="tremble">
      <path class="g-needle" d="M${tx} ${ty}L${nx} ${ny}"/>
    </g></g>
    <circle class="g-pivot" cx="${CX}" cy="${CY}" r="1.1"/>
    <text class="lives-num" x="${CX}" y="39" text-anchor="middle"></text>`;
}

// Draws the dial into the desk's galvanometer slot and returns a controller.
export function mountGalvanometer(sceneRoot, { max = 10, lives = max, showNumber = false } = {}) {
  const slot = sceneRoot.querySelector('#galvanometer-slot');
  const layer = slot.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
  layer.setAttribute('class', 'dial');
  slot.append(layer);
  slot.setAttribute('role', 'img');
  let cur = { max, lives };

  function draw() {
    layer.querySelector('.needle').style.setProperty('--a', `${needleAngle(cur.lives, cur.max)}deg`);
    slot.style.setProperty('--t', `${trembleFor(cur.lives, cur.max)}deg`);
    slot.setAttribute('aria-label', livesLabel(cur.lives, cur.max));
    layer.querySelector('.lives-num').textContent = `${cur.lives} / ${cur.max}`;
  }

  const api = {
    set(lives) { cur.lives = lives; draw(); },
    setMax(m, lives = m) { cur = { max: m, lives }; layer.innerHTML = dialSvg(m); draw(); },
    showNumber(on) { slot.classList.toggle('show-num', !!on); },
    get state() { return { ...cur }; },
  };
  api.setMax(max, lives);
  api.showNumber(showNumber);
  return api;
}
