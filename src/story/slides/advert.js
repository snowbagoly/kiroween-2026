// Slide 3 of the story [R17.1].

// 3. Tuesday's paper, folded back at the Situations Vacant, in the grey light of a wet morning. As the
// letter says "I saw it", a pencil rings the advertisement for a night operator (story.css). Further
// down, among the personal notices, the missing operator's wife asks after him; easy to miss.
export const advertScene = () => {
  const INK = '#2a2620';
  const BODY = 'font-family="\'Times New Roman\', Times, serif" font-size="16"';
  const LINE = 20;     // between lines of small print
  const COL = 340;     // a column's width
  const AD_GAP = 14;   // between one advertisement and the next

  // A heading across a column, in capitals between rules.
  const heading = (x, y, text, size = 22) => `
    <text x="${x + COL / 2}" y="${y}" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="${size}" fill="${INK}">${text}</text>
    <path stroke="${INK}" stroke-width=".8" d="M${x + 120} ${y + 9} H${x + COL - 120}"/>`;
  // An advertisement in small print, justified to the column, its first words in bold. The last line is
  // left ragged, as a compositor would.
  const ad = (x, y, lead, lines) => lines.map((line, i) => {
    const last = i === lines.length - 1;
    const words = i === 0 ? `<tspan font-weight="bold">${lead}</tspan> ${line}` : line;
    return `<text x="${x}" y="${y + i * LINE}"${last ? '' : ` textLength="${COL}" lengthAdjust="spacing"`}>${words}</text>`;
  }).join('');
  // Small print too far off or too dim to read: grey bars, in paragraphs, from a seed so they come
  // out the same every time.
  const greek = (x, y, n, seed, w = COL) => {
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    let d = '';
    let run = 0;
    for (let i = 0; i < n; i++) {
      const indent = run === 0 ? 14 : 0;
      const end = run > 3 && rnd() < .25;
      const len = Math.round(end ? w * (.3 + rnd() * .5) : w - indent);
      d += `M${x + indent} ${y + i * LINE - 8}h${len}v7h${-len}z`;
      run = end ? 0 : run + 1;
    }
    return `<path fill="#6a604c" opacity=".34" d="${d}"/>`;
  };

  // The middle column: Situations Vacant, then the personal notices.
  const X = 590;
  // The lines are set to come out close to the column's width, so justifying them hardly stretches them.
  const ads = [
    ['WANTED,', ['a respectable YOUTH as junior clerk in', 'a shipping office; must write a good, clear hand.', 'Apply by letter, Box 41, this office.']],
    ['COOK-GENERAL', ['wanted for a small family; no', 'washing; wages £20. Apply Mrs Harding, 14 Albion', 'Terrace, after six o’clock.']],
    ['WANTED,', ['a NIGHT OPERATOR for a relay station', 'on the Lower Marsh. Lodging found. Instruction', 'given. Apply Marsh & Western Telegraph Co.']],
    ['STRONG LAD', ['wanted for an ironmonger’s; to live', 'in. Apply Pratt & Sons, Market Street.']],
    ['GOVERNESS', ['(daily) for two little girls; English,', 'French and music. Write G., this office.']],
  ];
  const personal = [
    ['MRS M. VANE', ['seeks any news of her husband, late', 'of the Marsh & Western Telegraph Co. Write c/o', 'this office.']],
    ['LOST,', ['on Saturday last, between the Market and', 'St Anne’s Church, a small gold locket with a lock', 'of hair. Reward.']],
  ];
  let y = 178;
  let ringAt = 0;
  let column = '';
  ads.forEach(([lead, lines], i) => {
    if (i === 2) ringAt = y + (lines.length - 1) * LINE / 2 - 5;
    column += ad(X, y, lead, lines);
    y += lines.length * LINE + AD_GAP;
  });
  const personalAt = y + 18;
  y = personalAt + 34;
  for (const [lead, lines] of personal) {
    column += ad(X, y, lead, lines);
    y += lines.length * LINE + AD_GAP;
  }
  const columnEnd = y;

  return `
  <svg class="slide" data-scene="advert" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" style="--focus: 760px ${ringAt}px; --zoom: 1.14">
    <defs>
      <!-- Cheap newsprint, gone a little yellow at the edges. -->
      <radialGradient id="ad-paper" cx="760" cy="360" r="900" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#d4caae"/><stop offset=".6" stop-color="#c8bc9c"/><stop offset="1" stop-color="#a8987a"/>
      </radialGradient>
      <!-- Past the fold the page lifts a little and falls into shade. -->
      <linearGradient id="ad-fold" x1="1342" y1="0" x2="1600" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#3a2e20" stop-opacity=".45"/><stop offset=".08" stop-color="#3a2e20" stop-opacity=".1"/>
        <stop offset="1" stop-color="#3a2e20" stop-opacity=".35"/>
      </linearGradient>
      <!-- Grey daylight from a window up on the left; the sash bars throw soft shadows across the page. -->
      <linearGradient id="ad-day" x1="200" y1="0" x2="1400" y2="900" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#f4f0e6" stop-opacity=".22"/><stop offset=".5" stop-color="#f4f0e6" stop-opacity="0"/>
        <stop offset="1" stop-color="#1a140c" stop-opacity=".3"/>
      </linearGradient>
      <linearGradient id="ad-bar-v" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#2a2218" stop-opacity="0"/><stop offset=".5" stop-color="#2a2218" stop-opacity=".22"/>
        <stop offset="1" stop-color="#2a2218" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="ad-bar-h" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2a2218" stop-opacity="0"/><stop offset=".5" stop-color="#2a2218" stop-opacity=".2"/>
        <stop offset="1" stop-color="#2a2218" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="ad-dark" cx="760" cy="380" r="900" gradientUnits="userSpaceOnUse">
        <stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/>
      </radialGradient>
      <filter id="ad-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <g class="camera">
      <rect width="1600" height="900" fill="#1e150d"/>
      <g transform="rotate(-2.5 760 450)">
        <rect x="-100" y="40" width="1800" height="1000" fill="url(#ad-paper)"/>

        <!-- The running head along the top of the page. -->
        <path stroke="${INK}" stroke-width="1.6" d="M-60 74 H1700 M-60 108 H1700"/>
        <path stroke="${INK}" stroke-width=".6" d="M-60 78 H1700"/>
        <g font-family="IM Fell English SC, serif" font-size="15" fill="${INK}">
          <text x="236" y="98">8</text>
          <text x="760" y="98" text-anchor="middle">TUESDAY, NOVEMBER 3, 1903.</text>
          <text x="1290" y="98" text-anchor="end">SITUATIONS AND SALES.</text>
        </g>
        <!-- Column rules. -->
        <path stroke="${INK}" stroke-width=".7" d="M574 116 V1040 M946 116 V1040 M202 116 V1040"/>

        <!-- Left: the news. -->
        <g fill="${INK}">
          ${heading(218, 160, 'THE GALES.')}
          <text x="${218 + COL / 2}" y="190" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="12">SHIPPING IN DISTRESS OFF THE COAST.</text>
          ${greek(218, 218, 15, 31)}
          ${heading(218, 534, 'BOROUGH POLICE COURT.', 18)}
          ${greek(218, 564, 22, 32)}
        </g>
        ${greek(-150, 132, 47, 33)}

        <!-- The middle: Situations Vacant, and the personal notices. -->
        <g fill="${INK}">
          ${heading(X, 148, 'SITUATIONS VACANT.', 24)}
          <g ${BODY}>${column}</g>
          ${heading(X, personalAt, 'PERSONAL.', 20)}
        </g>
        ${greek(X, columnEnd + 10, 18, 34)}

        <!-- Right: rooms to let, and things for sale (among them a piano). -->
        <g fill="${INK}">
          ${heading(962, 160, 'TO LET.')}
          ${greek(962, 190, 9, 35)}
          ${heading(962, 386, 'MUSICAL INSTRUMENTS.', 18)}
          <g ${BODY}>${ad(962, 418, 'PIANOFORTE,', ['walnut, iron frame, full compass,', 'good tone; the owner going abroad. £18. Apply', '9 Park Row.'])}</g>
          ${greek(962, 498, 6, 36)}
          ${heading(962, 632, 'APARTMENTS.', 18)}
          ${greek(962, 662, 20, 37)}
        </g>
        ${greek(1360, 132, 47, 38, 300)}
        <rect x="1342" y="40" width="300" height="1000" fill="url(#ad-fold)"/>
        <path stroke="#8a7a5a" stroke-width="1" opacity=".6" d="M1342 40 V1040"/>

        <!-- A ring left by a cup. -->
        <g fill="none" stroke="#7a5228">
          <ellipse cx="1186" cy="566" rx="46" ry="42" stroke-width="3" opacity=".16"/>
          <path stroke-width="2" opacity=".12" d="M1150 534 a46 42 0 0 1 80 4"/>
        </g>

        <!-- The ring in pencil, drawn round once and a little past where it began. -->
        <path class="pencil-ring" pathLength="1" fill="none" stroke="#4a4a52" stroke-width="2.6" stroke-linecap="round" opacity=".85"
          transform="translate(760 ${ringAt})"
          d="M-120 -34 C-40 -43 120 -43 182 -31 C207 -23 206 27 160 35 C80 45 -100 45 -170 33 C-200 25 -200 -27 -100 -37 C-60 -41 -20 -41 10 -40"/>

        <!-- The pencil, put down across the corner of the page. -->
        <g transform="translate(1040 760) rotate(-22)">
          <rect x="4" y="6" width="190" height="8" fill="#000" opacity=".3" filter="url(#ad-shadow)"/>
          <rect width="180" height="9" rx="1" fill="#5a2a1a"/><rect y="1.5" width="180" height="2" fill="#7a3e26"/>
          <path fill="#d8b888" d="M180 0 l22 4.5 l-22 4.5z"/><path fill="#2a2a30" d="M196 3.3 l6 1.2 l-6 1.2z"/>
        </g>
      </g>

      <!-- The daylight, coming and going a little as the clouds pass. -->
      <g class="daylight">
        <rect width="1600" height="900" fill="url(#ad-day)"/>
        <rect x="1060" y="-60" width="70" height="1020" fill="url(#ad-bar-v)" transform="skewX(8)"/>
        <rect x="-60" y="600" width="1720" height="60" fill="url(#ad-bar-h)"/>
      </g>
      <rect width="1600" height="900" fill="url(#ad-dark)"/>
    </g>
  </svg>`;
};
