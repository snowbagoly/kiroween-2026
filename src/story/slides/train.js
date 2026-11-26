// Slide 4 of the story [R17.1].

// 4. On the train: looking out of the compartment window at the marsh going by, rain on the glass.
export const trainScene = () => `
  <svg class="slide" data-scene="train" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" style="--focus: 800px 430px">
    <defs>
      <clipPath id="tr-glass"><rect x="330" y="150" width="940" height="560" rx="34"/></clipPath>
      <linearGradient id="tr-sky" x1="0" y1="150" x2="0" y2="470" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#16161b"/><stop offset=".55" stop-color="#3a3230"/><stop offset="1" stop-color="#8e6644"/>
      </linearGradient>
      <!-- The last of the sunset, low in the west, behind the train. -->
      <radialGradient id="tr-glow" cx="380" cy="470" r="520" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#d0925a" stop-opacity=".75"/><stop offset=".5" stop-color="#a06a3c" stop-opacity=".2"/>
        <stop offset="1" stop-color="#a06a3c" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="tr-marsh" x1="0" y1="470" x2="0" y2="720" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#4a3e32"/><stop offset=".3" stop-color="#2a231d"/><stop offset="1" stop-color="#16120e"/>
      </linearGradient>
      <filter id="tr-cloud" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".0018 .01" numOctaves="4" seed="17"/>
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.5 0 0 0 -.9"/>
        <feComposite in="SourceGraphic" operator="in"/>
      </filter>
      <linearGradient id="tr-cloud-fade" x1="0" y1="150" x2="0" y2="470" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <mask id="tr-cloud-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="480">
        <rect width="1600" height="480" fill="url(#tr-cloud-fade)"/>
      </mask>
      <!-- Speed: things close to the line are smeared sideways. -->
      <filter id="tr-rush" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation="9 0"/></filter>
      <filter id="tr-rush-fast" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation="22 0"/></filter>
      <linearGradient id="tr-wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2c1a10"/><stop offset=".5" stop-color="#22140b"/><stop offset="1" stop-color="#140b06"/>
      </linearGradient>
      <linearGradient id="tr-brass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#d9b26a"/><stop offset=".5" stop-color="#8f6a2c"/><stop offset="1" stop-color="#3f2c10"/>
      </linearGradient>
      <linearGradient id="tr-leather" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#2a150b"/><stop offset=".45" stop-color="#5a3119"/><stop offset="1" stop-color="#26130a"/>
      </linearGradient>
      <!-- The compartment lamp, overhead and behind: warm on the woodwork, reflected in the glass. -->
      <radialGradient id="tr-lamplight" cx="1150" cy="40" r="900" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffcf80" stop-opacity=".22"/><stop offset="1" stop-color="#ffcf80" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="tr-lamp-reflection">
        <stop offset="0" stop-color="#ffd890" stop-opacity=".35"/><stop offset=".25" stop-color="#e8a858" stop-opacity=".12"/>
        <stop offset="1" stop-color="#e8a858" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="tr-mist" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#cfc2a6" stop-opacity="0"/><stop offset="1" stop-color="#cfc2a6" stop-opacity=".14"/>
      </linearGradient>
      <pattern id="tr-net" width="14" height="14" patternUnits="userSpaceOnUse">
        <path d="M0 0 L14 14 M14 0 L0 14" stroke="#3a2a1a" stroke-width="1"/>
      </pattern>
    </defs>
    <g class="camera">
      <!-- Outside, seen through the glass. -->
      <g clip-path="url(#tr-glass)">
        <g class="outside">
          <rect x="300" y="120" width="1000" height="360" fill="url(#tr-sky)"/>
          <rect x="300" y="120" width="1000" height="360" fill="url(#tr-glow)"/>
          <rect class="clouds" x="0" y="120" width="1600" height="360" fill="#141418" filter="url(#tr-cloud)" mask="url(#tr-cloud-mask)"/>
          <!-- Far off: the horizon, and the last town slipping away behind. -->
          <g class="pass-far">
            <path fill="#4e4134" d="M200 472 Q300 462 420 468 Q560 474 700 464 Q840 458 980 468 Q1120 474 1260 466 Q1400 460 1700 470 V476 H200Z"/>
            <g fill="#3c3128">
              <path d="M380 470 V456 h12 l8 -8 l8 8 v-4 h16 v-10 l9 -7 l9 7 v12 h12 v-16 h5 v-6 h5 v6 h2 v16 h22 l8 -8 l8 8 v-4 h18 v14 h14 l10 -6 l10 6 V470Z"/>
              <path d="M520 466 V426 h11 V466Z"/><path d="M519 426 l6.5 -26 l6.5 26z"/>
              <path d="M800 470 q14 -16 30 -12 q12 -10 26 0 q14 -4 20 12z"/><path d="M1180 470 q10 -12 22 -8 q10 -8 20 2 q8 0 10 6z"/>
            </g>
            <g fill="#e2a85a"><rect x="402" y="460" width="2.5" height="3"/><rect x="450" y="458" width="2.5" height="3"/><rect x="500" y="462" width="2" height="3"/></g>
          </g>
          <rect x="300" y="470" width="1000" height="260" fill="url(#tr-marsh)"/>
          <!-- The marsh going by: pools holding the sky, bare trees, reeds. Drawn once and repeated. -->
          <g class="pass-mid">
            <g id="tr-mid">
              <!-- Pools holding the sky: thinner toward the horizon, none crossing the edges of the repeat. -->
              <g fill="#6e5640" opacity=".7">
                <path d="M60 500 C120 496 260 495 380 497 C450 498 520 501 540 503 C470 505 330 504 200 505 C130 505 80 503 60 500Z"/>
                <path d="M760 506 C820 502 920 501 1010 503 C1060 504 1092 506 1082 509 C1000 511 880 510 790 509 C770 508 758 507 760 506Z"/>
                <path d="M1240 500 C1290 497 1380 497 1440 499 C1470 500 1470 503 1440 503 C1380 504 1290 504 1250 503 C1236 502 1234 501 1240 500Z"/>
                <path d="M680 538 C760 528 900 527 1040 530 C1150 532 1260 529 1320 533 C1350 535 1340 540 1300 542 C1180 546 1050 543 930 548 C830 552 720 550 690 545 C675 542 672 540 680 538Z"/>
                <path d="M300 548 C340 543 400 543 430 547 C440 550 420 553 390 553 C350 553 310 553 300 548Z"/>
                <path d="M140 590 C220 578 360 576 470 581 C560 585 640 580 660 587 C672 592 650 598 600 600 C500 604 420 600 330 606 C250 611 170 606 145 598 C135 595 135 592 140 590Z"/>
                <path d="M1000 618 C1080 606 1220 604 1340 609 C1440 613 1520 608 1560 614 C1580 618 1560 625 1510 627 C1400 632 1290 628 1180 634 C1100 638 1030 634 1005 626 C996 622 995 620 1000 618Z"/>
                <path d="M760 640 C800 634 870 634 900 640 C910 645 880 649 840 649 C800 649 762 647 760 640Z"/>
              </g>
              <g fill="none" stroke="#1e1915" stroke-linecap="round" data-tree='[{"x": 260, "y": 532, "length": 22, "seed": 101, "lean": -0.3, "depth": 5, "thin": 0.9}, {"x": 300, "y": 535, "length": 14, "seed": 102, "lean": -0.3, "depth": 5, "thin": 0.9}, {"x": 1050, "y": 528, "length": 30, "seed": 103, "lean": -0.35, "depth": 6, "thin": 0.9}, {"x": 1420, "y": 534, "length": 18, "seed": 104, "lean": -0.3, "depth": 5, "thin": 0.9}]'></g>
              <g fill="#1b1612" data-reeds='[{"x": [0, 1600], "base": 560, "h": [6, 16], "n": 260, "seed": 105, "depth": 30}, {"x": [0, 1600], "base": 610, "h": [10, 26], "n": 200, "seed": 106, "depth": 40}]'></g>
            </g>
            <use href="#tr-mid" x="1600"/>
          </g>
          <!-- The telegraph poles beside the line, whipping past, the wires dipping and rising between them. -->
          <g class="pass-poles" filter="url(#tr-rush)">
            <g fill="#0b0908">
              <path d="M-11 740 L-8 120 h16 L11 740Z"/><rect x="-48" y="196" width="96" height="7"/><rect x="-44" y="188" width="5" height="9"/><rect x="-3" y="186" width="6" height="11"/><rect x="39" y="188" width="5" height="9"/><path d="M689 740 L692 120 h16 L711 740Z"/><rect x="652" y="196" width="96" height="7"/><rect x="656" y="188" width="5" height="9"/><rect x="697" y="186" width="6" height="11"/><rect x="739" y="188" width="5" height="9"/><path d="M1389 740 L1392 120 h16 L1411 740Z"/><rect x="1352" y="196" width="96" height="7"/><rect x="1356" y="188" width="5" height="9"/><rect x="1397" y="186" width="6" height="11"/><rect x="1439" y="188" width="5" height="9"/><path d="M2089 740 L2092 120 h16 L2111 740Z"/><rect x="2052" y="196" width="96" height="7"/><rect x="2056" y="188" width="5" height="9"/><rect x="2097" y="186" width="6" height="11"/><rect x="2139" y="188" width="5" height="9"/>
            </g>
            <path fill="none" stroke="#0b0908" stroke-width="2.4" d="M-42 190 Q308 260 658 190 M0 188 Q350 258 700 188 M42 190 Q392 260 742 190 M658 190 Q1008 260 1358 190 M700 188 Q1050 258 1400 188 M742 190 Q1092 260 1442 190 M1358 190 Q1708 260 2058 190 M1400 188 Q1750 258 2100 188 M1442 190 Q1792 260 2142 190"/>
          </g>
          <!-- The grass right beside the track, a blur. -->
          <g class="pass-near" filter="url(#tr-rush-fast)">
            <g id="tr-near" fill="#0a0807" data-reeds='{"x": [0, 800], "base": 735, "h": [40, 110], "n": 140, "seed": 107, "depth": 30}'><rect x="0" y="700" width="800" height="40"/></g>
            <use href="#tr-near" x="800"/>
            <use href="#tr-near" x="1600"/>
          </g>
        </g>
        <!-- On the glass: the lamp and the empty seat behind, reflected; mist at the bottom; rain. -->
        <circle cx="1190" cy="215" r="120" fill="url(#tr-lamp-reflection)"/>
        <path fill="#f3d39a" opacity=".22" d="M1172 206 q18 -22 36 0 q-4 10 -18 10 q-14 0 -18 -10z"/>
        <rect x="1188" y="160" width="4" height="26" fill="#f3d39a" opacity=".12"/>
        <g class="empty-seat" opacity=".14">
          <path fill="#8a4430" d="M860 710 V470 q0 -36 36 -36 h268 q36 0 36 36 V710Z"/>
          <path fill="#8a4430" d="M840 470 q0 -50 60 -54 h260 q60 4 60 54 v14 h-380z"/>
          <g fill="#e0b080">
            <circle cx="920" cy="500" r="3"/><circle cx="1000" cy="500" r="3"/><circle cx="1080" cy="500" r="3"/><circle cx="1140" cy="500" r="3"/>
            <circle cx="960" cy="570" r="3"/><circle cx="1040" cy="570" r="3"/><circle cx="1120" cy="570" r="3"/>
            <circle cx="920" cy="640" r="3"/><circle cx="1000" cy="640" r="3"/><circle cx="1080" cy="640" r="3"/><circle cx="1140" cy="640" r="3"/>
          </g>
        </g>
        <rect x="330" y="560" width="940" height="150" fill="url(#tr-mist)"/>
        <g fill="#e6d7b4" data-drops='[{"x": [340, 1260], "y": [160, 700], "n": 160, "seed": 111, "r": [1.2, 3.6]}, {"x": [340, 1260], "y": [560, 700], "n": 60, "seed": 112, "r": [2.5, 5.5]}]'></g>
        <g class="running">
          <g class="run" style="--dur: 2.9s; --delay: -2.7s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M971 482 l70 -30"/><ellipse cx="968" cy="484" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="967" cy="482" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 1.6s; --delay: -0.8s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M1074 563 l70 -30"/><ellipse cx="1071" cy="565" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="1070" cy="564" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 3.0s; --delay: -0.3s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M1253 440 l70 -30"/><ellipse cx="1250" cy="442" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="1249" cy="441" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 2.5s; --delay: -1.4s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M836 259 l70 -30"/><ellipse cx="833" cy="261" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="832" cy="259" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 2.0s; --delay: -1.9s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M435 246 l70 -30"/><ellipse cx="432" cy="248" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="431" cy="246" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 2.9s; --delay: -0.4s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M1097 220 l70 -30"/><ellipse cx="1094" cy="222" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="1093" cy="220" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 1.6s; --delay: -1.4s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M966 205 l70 -30"/><ellipse cx="963" cy="207" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="962" cy="206" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 3.2s; --delay: -2.8s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M607 245 l70 -30"/><ellipse cx="604" cy="247" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="603" cy="245" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 2.5s; --delay: -1.7s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M678 581 l70 -30"/><ellipse cx="675" cy="583" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="674" cy="581" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 2.7s; --delay: -2.6s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M603 571 l70 -30"/><ellipse cx="600" cy="573" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="599" cy="572" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 2.2s; --delay: -0.4s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M1209 282 l70 -30"/><ellipse cx="1206" cy="284" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="1205" cy="283" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 2.1s; --delay: -1.3s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M551 177 l70 -30"/><ellipse cx="548" cy="179" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="547" cy="178" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 2.1s; --delay: -0.7s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M426 453 l70 -30"/><ellipse cx="423" cy="455" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="422" cy="454" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 2.1s; --delay: -1.0s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M1143 364 l70 -30"/><ellipse cx="1140" cy="366" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="1139" cy="365" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 3.2s; --delay: -0.1s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M1043 174 l70 -30"/><ellipse cx="1040" cy="176" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="1039" cy="174" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
          <g class="run" style="--dur: 1.6s; --delay: -1.3s"><path fill="none" stroke="#d9c9a4" stroke-width="1.6" stroke-opacity=".35" d="M1083 528 l70 -30"/><ellipse cx="1080" cy="530" rx="3.2" ry="4" fill="#0c0a08" opacity=".45"/><circle cx="1079" cy="529" r="1.1" fill="#f0e2c0" opacity=".8"/></g>
        </g>
      </g>
      <!-- The compartment: panelled wall around the window, the window's frame, the luggage rack above,
           and the leather strap for letting the window down. -->
      <path fill="url(#tr-wood)" fill-rule="evenodd" d="M-20 -20 H1620 V920 H-20Z M364 150 H1236 A34 34 0 0 1 1270 184 V676 A34 34 0 0 1 1236 710 H364 A34 34 0 0 1 330 676 V184 A34 34 0 0 1 364 150Z"/>
      <rect x="330" y="150" width="940" height="560" rx="34" fill="none" stroke="#1a0e07" stroke-width="26"/>
      <rect x="314" y="134" width="972" height="592" rx="46" fill="none" stroke="#4a2c18" stroke-width="3" opacity=".7"/>
      <rect x="342" y="162" width="916" height="536" rx="26" fill="none" stroke="#000" stroke-width="3" opacity=".5"/>
      <g fill="none" stroke="#3a2212" stroke-width="3" opacity=".8">
        <rect x="120" y="150" width="140" height="560" rx="6"/><rect x="1340" y="150" width="140" height="560" rx="6"/>
        <rect x="120" y="770" width="1360" height="160" rx="6"/>
      </g>
      <rect x="60" y="0" width="1480" height="70" fill="url(#tr-net)" opacity=".8"/>
      <rect x="40" y="66" width="1520" height="7" rx="3" fill="url(#tr-brass)"/>
      <g fill="url(#tr-brass)"><path d="M290 72 l10 0 l-20 46 h-8z"/><path d="M1300 72 l10 0 l18 46 h-8z"/><rect x="796" y="72" width="8" height="40"/></g>
      <rect x="782" y="712" width="36" height="200" rx="4" fill="url(#tr-leather)"/>
      <g fill="#140904"><circle cx="800" cy="770" r="3.5"/><circle cx="800" cy="802" r="3.5"/><circle cx="800" cy="834" r="3.5"/><circle cx="800" cy="866" r="3.5"/></g>
      <circle cx="800" cy="726" r="7" fill="url(#tr-brass)"/>
      <rect x="-20" y="-20" width="1640" height="940" fill="url(#tr-lamplight)"/>
    </g>
  </svg>`;
