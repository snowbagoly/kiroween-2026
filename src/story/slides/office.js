// Slide 6 of the story [R17.1].
import { drawCalendar, drawClock, drawGalvanometer, drawKey, drawLamp, drawWindow, svgOf } from '../../office/drawings.js';

// 6. The office as he left it: coat on the hook, chair pushed back, tea still warm, a record on the
// phonograph. The camera ends close on the desk and the phonograph. It also stands behind the menu,
// as a second copy, so its ids take a prefix (p).
export const officeScene = (p = 'of') => `
  <svg class="slide" data-scene="office" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" style="--focus: 800px 540px; --zoom: 1.32">
    <defs>
      <pattern id="${p}-paper" width="80" height="80" patternUnits="userSpaceOnUse">
        <rect width="80" height="80" fill="#2a2018"/><rect width="34" height="80" fill="#2e231a"/>
        <path d="M57 18 q6 8 0 16 q-6 -8 0 -16z M57 58 q6 8 0 16 q-6 -8 0 -16z" fill="#33271d"/>
      </pattern>
      <linearGradient id="${p}-floor" x1="0" y1="720" x2="0" y2="900" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#1c130c"/><stop offset="1" stop-color="#0c0806"/>
      </linearGradient>
      <linearGradient id="${p}-brass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e2bd72"/><stop offset=".45" stop-color="#a27a33"/><stop offset="1" stop-color="#3f2c10"/>
      </linearGradient>
      <radialGradient id="${p}-bell" cx=".55" cy=".45" r=".6">
        <stop offset="0" stop-color="#0d0905"/><stop offset=".7" stop-color="#3a2810"/><stop offset="1" stop-color="#a27a33"/>
      </radialGradient>
      <linearGradient id="${p}-wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4a2e18"/><stop offset="1" stop-color="#2a180c"/>
      </linearGradient>
      <!-- The oil lamp on the desk is the only light. -->
      <radialGradient id="${p}-lamplight" cx="752" cy="500" r="1000" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffcf80" stop-opacity=".32"/><stop offset=".45" stop-color="#e8a050" stop-opacity=".12"/>
        <stop offset="1" stop-color="#e8a050" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${p}-dark" cx="780" cy="520" r="1050" gradientUnits="userSpaceOnUse">
        <stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/>
      </radialGradient>
      <!-- Shadows from the lamp, soft-edged, as a small flame casts them. -->
      <filter id="${p}-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
      <filter id="${p}-steam" x="-100%" y="-50%" width="300%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
      <!-- Woven cane for the chair seat. -->
      <pattern id="${p}-cane" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="5" height="5" fill="#6a4626"/><path d="M0 0 H5 M0 2.5 H5 M0 0 V5 M2.5 0 V5" stroke="#3a2414" stroke-width=".8"/>
      </pattern>
      <!-- Contact shadows, the dark that gathers where things meet: plain gradients, no filters. -->
      <linearGradient id="${p}-corner" x1="0" y1="690" x2="0" y2="770" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".38" stop-color="#000" stop-opacity=".55"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="${p}-contact">
        <stop offset="0" stop-color="#000" stop-opacity=".85"/><stop offset=".5" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <filter id="${p}-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <g class="camera">
      <!-- The room: papered wall, panelled below, bare boards. -->
      <rect width="1600" height="720" fill="url(#${p}-paper)"/>
      <rect y="100" width="1600" height="8" fill="#1a110a"/>
      <rect y="520" width="1600" height="200" fill="#1d130c"/>
      <rect y="516" width="1600" height="10" fill="#3a2616"/>
      <g fill="none" stroke="#2e1e12" stroke-width="3">
        <rect x="40" y="545" width="220" height="150"/><rect x="290" y="545" width="220" height="150"/><rect x="1300" y="545" width="260" height="150"/>
      </g>
      <rect y="720" width="1600" height="180" fill="url(#${p}-floor)"/>
      <rect y="690" width="1600" height="80" fill="url(#${p}-corner)"/>
      <path fill="none" stroke="#080504" stroke-width="2" d="M-480 900 L96 720 M-330 900 L178 720 M-180 900 L261 720 M-30 900 L343 720 M120 900 L426 720 M270 900 L508 720 M420 900 L591 720 M570 900 L674 720 M720 900 L756 720 M870 900 L838 720 M1020 900 L921 720 M1170 900 L1004 720 M1320 900 L1086 720 M1470 900 L1168 720 M1620 900 L1251 720 M1770 900 L1334 720 M1920 900 L1416 720 M2070 900 L1498 720"/>

      <!-- The window, as in the room; the lamp beside it is reflected low in the right-hand pane. -->
      ${svgOf(drawWindow({ id: `${p}-window`, reflection: [181, 205] }), 'x="420" y="120" width="300" height="360"')}
      <!-- Its sill, and the line's wires coming in over the frame. -->
      <rect x="406" y="478" width="328" height="16" fill="#2c1b0e"/>
      <path fill="none" stroke="#0a0705" stroke-width="1.6" d="M490 108 Q460 60 410 -20 M670 108 Q660 40 620 -20"/>
      <g fill="#b8ab90"><rect x="485" y="104" width="10" height="9" rx="2"/><rect x="665" y="104" width="10" height="9" rx="2"/></g>

      <!-- A calendar: every day of October crossed off in pencil, until three days ago. -->
      <rect x="800" y="178" width="94" height="124" fill="#000" opacity=".4" filter="url(#${p}-shadow)"/>
      <g transform="rotate(-2 838 240)">
        ${svgOf(drawCalendar({ month: 'October 1903', firstWeekday: 4, days: 31, crossedTo: 27 }), 'x="791" y="162" width="94" height="142"')}
      </g>

      <rect x="920" y="272" width="112" height="86" rx="6" fill="#000" opacity=".4" filter="url(#${p}-shadow)"/>
      <!-- The galvanometer, as in the room: the line is up at 8, the needle trembling with it, and its wires
           running down the wall to the desk. -->
      ${svgOf(drawGalvanometer({ id: `${p}-galvanometer`, needle: .8, wiresTo: 650 }), 'x="904" y="280" width="112" height="86" overflow="visible"')}

      <!-- The wall clock, at one minute to ten (see story.css). -->
      <path fill="#000" opacity=".45" filter="url(#${p}-shadow)" d="M1210 100 L1254 72 L1298 100 V362 H1210Z"/>
      ${svgOf(drawClock({ id: `${p}-clock` }), 'class="clock" x="1182" y="106" width="100" height="290"')}

      <!-- His coat and hat on the hook, as if he'd only stepped out. -->
      <g class="coat">
        <path fill="#000" opacity=".35" filter="url(#${p}-soft)" d="M1412 300 C1400 330 1392 420 1396 700 H1528 C1530 420 1508 330 1496 300Z"/>
        <path fill="#2a1a0e" d="M1426 262 v10 h8 v-10z"/>
        <path fill="#100b08" d="M1394 300 C1408 286 1446 284 1462 298 C1478 330 1484 420 1494 690 C1460 700 1404 700 1372 690 C1378 420 1384 330 1394 300Z"/>
        <path fill="#0b0806" d="M1394 302 C1384 340 1376 420 1372 520 L1386 524 C1390 430 1396 360 1404 318Z M1462 300 C1472 340 1484 420 1490 520 L1476 524 C1470 430 1462 360 1454 318Z"/>
        <path fill="none" stroke="#3a2818" stroke-width="2" opacity=".7" d="M1394 300 C1384 340 1378 430 1372 690"/>
        <path fill="#1a120c" d="M1414 292 L1430 340 L1446 292 Q1430 300 1414 292Z"/>
        <ellipse cx="1430" cy="262" rx="36" ry="7" fill="#0d0907"/>
        <path fill="#0d0907" d="M1404 262 C1404 236 1416 226 1430 226 C1444 226 1456 236 1456 262Z"/>
      </g>

      <!-- The phonograph on its table: cabinet, turntable, record, tone arm and the big brass horn. -->
      <g transform="translate(550 764) scale(.8) translate(-550 -764)">
        <g fill="#000" opacity=".6" filter="url(#${p}-shadow)" transform="translate(-120 -50) scale(1.1)">
          <path d="M470 252 C545 296 588 400 590 497 L604 502 C596 432 524 392 404 410Z"/>
          <ellipse cx="436" cy="330" rx="96" ry="80" transform="rotate(-24 436 330)"/>
          <rect x="470" y="530" width="160" height="60"/>
        </g>
        <rect x="380" y="560" width="230" height="200" fill="#000" opacity=".3" filter="url(#${p}-shadow)"/>
        <rect x="440" y="590" width="220" height="14" fill="url(#${p}-wood)"/>
        <ellipse cx="460" cy="764" rx="22" ry="6" fill="url(#${p}-contact)"/><ellipse cx="640" cy="764" rx="22" ry="6" fill="url(#${p}-contact)"/>
        <rect x="455" y="604" width="10" height="160" fill="#22150b"/><rect x="635" y="604" width="10" height="160" fill="#22150b"/>
        <rect x="470" y="530" width="160" height="60" fill="url(#${p}-wood)"/>
        <rect x="476" y="538" width="148" height="44" fill="none" stroke="#5a3a20" stroke-width="2"/>
        <path stroke="#7a5a30" stroke-width="3" fill="none" d="M630 560 h14 v18"/><rect x="638" y="576" width="12" height="6" rx="2" fill="#2a1a0e"/>
        <ellipse cx="550" cy="529" rx="70" ry="14" fill="#140d08"/>
        <g transform="translate(550 525) scale(1 .2)">
          <g class="record-turn">
            <circle r="64" fill="#0a0807"/>
            <circle r="52" fill="none" stroke="#1f1a16" stroke-width="2"/><circle r="40" fill="none" stroke="#1f1a16" stroke-width="2"/>
            <circle r="18" fill="#7a2a1e"/>
            <circle cy="-11" r="4" fill="#d9c39a"/>
          </g>
        </g>
        <path fill="none" stroke="#cdbf9c" stroke-width="2" opacity=".15" d="M500 526 q40 -6 90 -2"/>
        <path fill="url(#${p}-brass)" d="M470 252 C545 296 588 400 590 497 L604 502 C596 432 524 392 404 410Z"/>
        <ellipse cx="436" cy="330" rx="96" ry="80" transform="rotate(-24 436 330)" fill="url(#${p}-bell)"/>
        <ellipse cx="436" cy="330" rx="96" ry="80" transform="rotate(-24 436 330)" fill="none" stroke="#d9b468" stroke-width="4"/>
        <g class="tone-arm">
          <path stroke="url(#${p}-brass)" stroke-width="5" stroke-linecap="round" fill="none" d="M598 502 Q586 512 566 516"/>
          <circle cx="562" cy="516" r="7" fill="url(#${p}-brass)"/>
        </g>
      </g>

      <!-- The desk. -->
      <path fill="#3a2414" d="M722 556 H1238 L1268 600 H692Z"/>
      <rect x="692" y="600" width="576" height="20" fill="#2a190e"/>
      <ellipse cx="782" cy="800" rx="112" ry="16" fill="url(#${p}-contact)"/><ellipse cx="1178" cy="800" rx="112" ry="16" fill="url(#${p}-contact)"/>
      <rect x="702" y="620" width="160" height="176" fill="#22150b"/><rect x="1098" y="620" width="160" height="176" fill="#22150b"/>
      <rect x="862" y="620" width="236" height="140" fill="#0e0905"/>
      <rect x="862" y="700" width="236" height="96" fill="url(#${p}-contact)"/>
      <g fill="none" stroke="#3a2414" stroke-width="2"><rect x="714" y="634" width="136" height="44"/><rect x="714" y="690" width="136" height="44"/><rect x="714" y="746" width="136" height="40"/><rect x="1110" y="634" width="136" height="70"/><rect x="1110" y="716" width="136" height="70"/></g>
      <g fill="url(#${p}-brass)"><circle cx="782" cy="656" r="4"/><circle cx="782" cy="712" r="4"/><circle cx="782" cy="766" r="4"/><circle cx="1178" cy="668" r="4"/><circle cx="1178" cy="750" r="4"/></g>

      <!-- On the desk: the logbook open with his pen across it, and forms. -->
      <g transform="translate(40 0)">
      <path fill="#cdbf9c" d="M740 584 L838 578 L848 592 L748 598Z"/><path fill="#c2b38e" d="M838 578 L930 584 L926 598 L848 592Z"/>
      <path fill="none" stroke="#5a4a36" stroke-width=".8" opacity=".6" d="M754 586 L830 582 M756 590 L826 586 M852 584 L918 588 M854 588 L900 591"/>
      <path stroke="#0d0907" stroke-width="2.4" stroke-linecap="round" d="M870 596 L928 578"/>
      </g>
      <path fill="#bfb08a" d="M1204 592 L1246 588 L1252 599 L1208 602Z"/><path fill="#cdbf9c" d="M1198 580 L1236 577 L1240 587 L1202 590Z" opacity=".85"/>
      <g fill="#000" opacity=".35" filter="url(#${p}-soft)">
        <ellipse cx="985" cy="592" rx="48" ry="6"/><ellipse cx="1095" cy="598" rx="50" ry="5"/>
        <ellipse cx="1190" cy="588" rx="26" ry="4"/>
      </g>
      <!-- The sounder: two wound coils under a brass lever, which chatters when the line speaks. -->
      <svg x="914" y="530" width="92" height="64" viewBox="0 0 200 140" overflow="visible">
        <rect x="8" y="112" width="184" height="24" rx="4" fill="url(#${p}-wood)"/>
        <rect x="8" y="112" width="184" height="4" rx="2" fill="#8a5d3a" opacity=".5"/>
        <rect x="34" y="104" width="100" height="10" fill="url(#${p}-brass)"/>
        <g>
          <rect x="40" y="56" width="32" height="50" rx="3" fill="#3a1e0e"/>
          <rect x="96" y="56" width="32" height="50" rx="3" fill="#3a1e0e"/>
          <path stroke="#7a4220" stroke-width="1.5" d="M40 64 h32 M40 72 h32 M40 80 h32 M40 88 h32 M40 96 h32 M96 64 h32 M96 72 h32 M96 80 h32 M96 88 h32 M96 96 h32"/>
          <rect x="38" y="52" width="36" height="6" rx="2" fill="url(#${p}-brass)"/><rect x="94" y="52" width="36" height="6" rx="2" fill="url(#${p}-brass)"/>
        </g>
        <rect x="160" y="28" width="12" height="86" fill="url(#${p}-brass)"/>
        <rect x="22" y="22" width="10" height="92" fill="url(#${p}-brass)"/><rect x="18" y="18" width="18" height="8" rx="2" fill="url(#${p}-brass)"/>
        <g class="sounder-arm">
          <rect x="44" y="44" width="80" height="7" fill="#2a2420"/>
          <rect x="26" y="32" width="150" height="10" rx="4" fill="url(#${p}-brass)"/>
          <circle cx="166" cy="37" r="4" fill="#3b2a0c"/>
        </g>
        <g fill="url(#${p}-brass)"><circle cx="20" cy="124" r="5"/><circle cx="180" cy="124" r="5"/></g>
      </svg>
      <!-- The straight key, the same as in the room. -->
      ${svgOf(drawKey(), 'x="1012" y="540" width="112" height="67" overflow="visible"')}
      <!-- His tea, still faintly steaming. -->
      <g transform="translate(52 0)">
        <ellipse cx="1112" cy="584" rx="22" ry="5" fill="#d8cdb4"/>
        <path fill="#e2d8c0" d="M1098 566 h28 l-3 17 q-11 4 -22 0z"/><path fill="none" stroke="#e2d8c0" stroke-width="3" d="M1126 570 q9 2 0 9"/>
        <g fill="none" stroke="#efe4cc" stroke-width="2.6" stroke-linecap="round" filter="url(#${p}-steam)">
          <path class="steam" d="M1106 562 q-7 -12 1 -22 q7 -10 -1 -20"/>
          <path class="steam steam-late" d="M1117 562 q7 -12 -1 -22 q-7 -10 1 -20"/>
        </g>
      </g>
      <!-- The oil lamp, at the left end of the desk beside the window. -->
      ${svgOf(drawLamp({ id: `${p}-lamp` }), 'x="726" y="460" width="52" height="130"')}

      <ellipse cx="1350" cy="880" rx="110" ry="18" fill="#000" opacity=".45" filter="url(#${p}-shadow)"/>
      <!-- The chair, pushed back from the desk and left askew, out on the floor: a bentwood chair, its
           back legs and backrest one bent piece, a caned seat, and a ring of bent wood between the legs. -->
      <g transform="translate(1300 762) rotate(-12)" fill="none" stroke-linecap="round">
        <g fill="url(#${p}-contact)" stroke="none">
          <ellipse cx="-48" cy="130" rx="12" ry="4"/><ellipse cx="47" cy="130" rx="12" ry="4"/>
          <ellipse cx="-36" cy="128" rx="11" ry="3.5"/><ellipse cx="36" cy="128" rx="11" ry="3.5"/>
        </g>
        <g stroke="#3a2416">
          <path stroke-width="6" d="M-36 128 C-34 70 -32 24 -31 -4 C-35 -60 -28 -110 0 -116 C28 -110 35 -60 31 -4 C32 24 34 70 36 128"/>
          <path stroke-width="4" d="M-21 -8 C-24 -56 -18 -90 0 -95 C18 -90 24 -56 21 -8"/>
          <path stroke-width="3" d="M-26 -30 Q0 -40 26 -30"/>
          <ellipse cx="0" cy="72" rx="40" ry="9" stroke-width="3"/>
          <path stroke-width="6" d="M-38 6 L-48 130 M38 6 L47 130"/>
        </g>
        <ellipse cx="0" cy="0" rx="50" ry="13" fill="url(#${p}-cane)"/>
        <ellipse cx="0" cy="0" rx="50" ry="13" stroke="#43291a" stroke-width="5"/>
        <path stroke="#2e1c10" stroke-width="4" d="M-46 6 Q0 20 46 6"/>
        <!-- Lamplight on the edges facing the lamp. -->
        <g stroke="#b07a42" opacity=".8">
          <path stroke-width="1.6" d="M-33 -4 C-37 -60 -29 -108 -2 -114"/>
          <path stroke-width="1.2" d="M-23 -10 C-26 -56 -20 -88 -2 -93"/>
          <path stroke-width="1.4" d="M-50 -1 Q-40 -11 -18 -13"/>
          <path stroke-width="1.4" d="M-40 8 L-50 128 M-38 70 Q-30 64 -16 63"/>
        </g>
      </g>

      <!-- The lamp's warmth, and the dark gathering away from it. -->
      <rect width="1600" height="900" fill="url(#${p}-lamplight)" class="lamp-glow-room"/>
      <rect width="1600" height="900" fill="url(#${p}-dark)"/>
    </g>
  </svg>`;
