// Slide 5 of the story [R17.1].

// 5. The station from outside: alone on the marsh, the wires running off into the fog.
export const stationScene = () => `
  <svg class="slide" data-scene="station" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" style="--focus: 700px 640px">
    <defs>
      <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#101216"/><stop offset=".4" stop-color="#232327"/>
        <stop offset=".58" stop-color="#4a4036"/><stop offset=".67" stop-color="#7a6146"/>
      </linearGradient>
      <radialGradient id="st-glow" cx="1640" cy="600" r="560" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#b98a52" stop-opacity=".55"/><stop offset="1" stop-color="#b98a52" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="st-marsh" x1="0" y1="600" x2="0" y2="900" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#4c4135"/><stop offset=".2" stop-color="#2c251f"/><stop offset="1" stop-color="#16120f"/>
      </linearGradient>
      <radialGradient id="st-lamp">
        <stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset=".3" stop-color="#e9a64a" stop-opacity=".35"/>
        <stop offset="1" stop-color="#e9a64a" stop-opacity="0"/>
      </radialGradient>
      <filter id="st-cloud" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".0016 .009" numOctaves="4" seed="3"/>
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -.95"/>
        <feComposite in="SourceGraphic" operator="in"/>
      </filter>
      <filter id="st-cloud-lit" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".0022 .012" numOctaves="3" seed="8"/>
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -.9"/>
        <feComposite in="SourceGraphic" operator="in"/>
      </filter>
      <linearGradient id="st-pool" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a3128"/><stop offset=".5" stop-color="#5a4936"/><stop offset="1" stop-color="#2a221b"/>
      </linearGradient>
      <filter id="st-shade" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter>
      <clipPath id="st-window"><rect x="670" y="655" width="21" height="27"/></clipPath>
      <pattern id="st-rain" width="76" height="280" patternUnits="userSpaceOnUse">
        <path stroke="#cbbb98" stroke-width="1" d="M14 20 l-6 22 M52 90 l-6 22 M30 170 l-6 22 M70 220 l-6 22 M40 4 l-6 22 M8 128 l-6 22"/>
      </pattern>
      <pattern id="st-rain-near" href="#st-rain" patternTransform="scale(1.6)"/>
      <filter id="st-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    <g class="camera">
      <rect width="1600" height="900" fill="url(#st-sky)"/>
      <rect width="1600" height="900" fill="url(#st-glow)"/>
      <!-- Low cloud, heavy overhead and thinning toward the horizon; wider than the frame so it can drift. -->
      <g class="clouds">
        <rect x="-200" y="0" width="2000" height="600" fill="#3d352d" filter="url(#st-cloud-lit)" mask="url(#ln-cloud-mask)"/>
        <rect x="-200" y="0" width="2000" height="600" fill="#121316" filter="url(#st-cloud)" mask="url(#ln-cloud-mask)"/>
      </g>
      <!-- The far horizon: a hazy bank, a church spire away to the west, and a windpump draining the marsh. -->
      <path fill="#5f4f3e" d="M-50 606 L-50 600 Q10.3 597 71 597 Q126 597 181 597 Q285 587 390 595 Q450 590 509 598 Q565 597 621 598 Q727 586 832 595 Q929 595 1026 597 Q1112 588 1198 595 Q1300 597 1402 596 Q1491 591 1579 598 Q1655 597 1731 594 L1700 606Z"/>
      <g class="church" fill="#463a2f">
        <path d="M300 602 v-14 h44 l6 6 v8z"/><path d="M342 602 v-38 h14 v38z"/><path d="M341 564 l8 -32 l8 32z"/>
      </g>
      <g class="windpump" fill="#4b3f33">
        <path d="M1226 603 l5 -44 h10 l5 44z"/><path d="M1229 560 q7 -10 14 0z"/>
        <g class="sails" fill="none" stroke="#4b3f33" stroke-width="2.2">
          <path d="M1236 554 l20 -20 M1236 554 l-20 20 M1236 554 l20 20 M1236 554 l-20 -20"/>
          <path stroke-width="5" stroke-dasharray="1.6 1.4" d="M1242 548 l13 -13 M1230 560 l-13 13 M1242 560 l13 13 M1230 548 l-13 -13"/>
        </g>
      </g>
      <path fill="#40362c" d="M110 602 L110 601 Q113 587 116 592 Q120 587 124 593 Q129 583 134 592 Q137 579 140 589 Q146 585 151 592 Q157 580 163 587 Q170 579 176 591 Q181 564 186 581 Q189 568 193 586 Q196 568 200 582 Q203 573 207 586 Q212 574 216 588 Q222 573 229 584 Q232 572 235 582 Q238 580 241 588 Q247 577 253 587 Q259 583 265 591 Q270 585 276 591 L276 602Z M282 602 L282 601 Q289 594 296 598 Q298 585 301 591 Q307 587 312 592 Q318 592 323 596 L323 602Z M920 602 L920 601 Q924 592 927 596 Q932 590 938 596 Q940 585 943 593 Q946 583 950 591 Q956 584 962 591 Q966 580 969 587 Q974 577 978 586 Q981 574 984 585 Q988 581 992 588 Q996 575 1001 583 Q1007 575 1012 587 Q1018 583 1025 589 Q1031 588 1037 595 Q1041 586 1044 593 Q1050 591 1055 595 L1055 602Z M1390 602 L1390 601 Q1394 597 1397 599 Q1400 595 1404 598 Q1410 591 1417 594 Q1420 588 1424 594 Q1427 589 1430 595 Q1437 585 1444 591 Q1450 592 1456 596 Q1461 594 1467 596 L1467 602Z"/>
      <g fill="none" stroke="#40362c" stroke-linecap="round" data-tree='[{"x": 470, "y": 603, "length": 18.4, "seed": 21, "lean": -0.2, "depth": 5, "thin": 0.8}, {"x": 520, "y": 603, "length": 12.0, "seed": 25, "lean": -0.2, "depth": 5, "thin": 0.8}, {"x": 1085, "y": 603, "length": 14.4, "seed": 22, "lean": -0.2, "depth": 5, "thin": 0.8}, {"x": 1170, "y": 603, "length": 10.4, "seed": 23, "lean": -0.2, "depth": 5, "thin": 0.8}, {"x": 1530, "y": 603, "length": 12.0, "seed": 24, "lean": -0.2, "depth": 5, "thin": 0.8}]'></g>
      <ellipse class="fog fog-far" cx="1000" cy="610" rx="1000" ry="18" fill="#a28f72" opacity=".6" filter="url(#ln-blur)"/>
      <path fill="url(#st-marsh)" d="M0 601 C200 603 380 600 600 602 C820 604 1000 601 1200 603 C1380 604 1500 601 1600 602 V900 H0Z"/>
      <!-- Channels of still water, holding the last of the sky. -->
      <g fill="#6d5a43" opacity=".55">
        <path d="M1700 612 C1400 616 1200 622 1000 630 C820 637 760 652 690 666 C600 684 520 690 300 700 L300 703 C540 694 620 690 700 672 C780 657 840 643 1010 634 C1210 626 1420 620 1700 616Z"/>
        <path d="M-20 790 C200 770 420 760 560 742 C640 732 700 730 760 731 L760 735 C700 735 640 738 570 748 C430 768 220 782 -20 800Z"/>
        <path d="M1000 760 C1150 752 1350 748 1620 742 L1620 748 C1350 755 1150 760 1000 765Z"/>
      </g>
      <path fill="url(#st-pool)" opacity=".8" d="M-20 842 C200 818 420 812 640 816 C860 820 1100 808 1300 800 C1440 795 1540 798 1620 796 L1620 905 L-20 905Z"/>
      <g class="reeds reeds-far" fill="#2a231c" data-reeds='[{"x": [-20, 600], "base": 662, "h": [3, 8], "n": 90, "seed": 51, "depth": 40}, {"x": [820, 1620], "base": 662, "h": [3, 8], "n": 110, "seed": 52, "depth": 40}, {"x": [100, 1500], "base": 662, "h": [3, 8], "n": 60, "seed": 53, "depth": 40}]'></g>
      <!-- The lamp in the window, broken up on the water. -->
      <g class="lamp-dim">
        <g class="glimmer" fill="#e9b062">
          <rect x="671" y="732" width="20" height="1.6"/><rect x="675" y="736" width="12" height="1.4"/><rect x="669" y="740" width="24" height="1.4"/>
        </g>
      </g>
      <g class="far-poles" fill="#3e352b">
      <g class="pole far"><path d="M1136 667 L1136 542 L1139 542 L1139 667Z"/><rect x="1116" y="547" width="42" height="1.8"/></g>
      <g class="pole far"><path d="M1327 650 L1327 556 L1329 556 L1329 650Z"/><rect x="1312" y="560" width="32" height="1.3"/></g>
      <g class="pole far"><path d="M1463 638 L1463 567 L1465 567 L1465 638Z"/><rect x="1452" y="570" width="24" height="1.0"/></g>
      <g class="pole far"><path d="M1566 629 L1566 575 L1568 575 L1568 629Z"/><rect x="1558" y="577" width="19" height="1.0"/></g>
      <g class="pole far"><path d="M1645 622 L1645 581 L1647 581 L1647 622Z"/><rect x="1639" y="582" width="14" height="1.0"/></g>
      </g>
      <path class="wires" fill="none" stroke="#2a241e" stroke-width="1.2" d="M24 472 Q267 522 510 505 M70 463 Q307 514 544 499 M116 472 Q347 522 578 505 M858 529 Q988 556 1118 547 M883 524 Q1010 551 1138 543 M909 529 Q1033 556 1157 547 M1118 547 Q1216 567 1314 560 M1138 543 Q1233 563 1328 557 M1157 547 Q1250 567 1342 560 M1314 560 Q1384 574 1453 570 M1328 557 Q1396 572 1464 567 M1342 560 Q1409 574 1475 570 M1453 570 Q1506 580 1559 577 M1464 567 Q1516 578 1567 575 M1475 570 Q1525 580 1576 577 M1559 577 Q1599 585 1639 582 M1567 575 Q1607 584 1646 581 M1576 577 Q1614 585 1652 582 M-20 442 Q2.0 497 24 472 M-20 433 Q25 488 70 463 M-20 442 Q48 497 116 472"/>
      <path class="wire-span" fill="none" stroke="#2a241e" stroke-width="1.2" d="M510 505 Q684 541 858 529 M544 499 Q714 535 883 524 M578 505 Q744 541 909 529"/>
      <ellipse class="fog fog-mid" cx="700" cy="628" rx="1000" ry="20" fill="#9a8a70" opacity=".35" filter="url(#ln-blur)"/>
      <g class="near-poles" fill="#120f0c">
      <g class="pole near"><path d="M66 760 L67 460 L73 460 L74 760Z"/><rect x="19" y="472" width="102" height="4.2"/></g>
      <g class="pole near"><path d="M542 719 L543 496 L546 496 L547 719Z"/><rect x="507" y="505" width="76" height="3.1"/></g>
      <g class="pole near"><path d="M881 689 L882 522 L885 522 L885 689Z"/><rect x="855" y="529" width="57" height="2.3"/></g>
      </g>
      <!-- The station house: the lead-in wire, the chimney, and one lit window. -->
      <path fill="none" stroke="#120f0c" stroke-width="1.2" d="M578 505 Q640 552 690 590"/>
      <g fill="#0f0c0a">
        <path d="M650 712 L650 628 L640 628 L705 566 L770 628 L760 628 L760 712Z"/>
        <path d="M760 712 L760 650 L812 662 L812 712Z"/>
        <rect x="726" y="572" width="12" height="34"/>
        <rect x="723" y="569" width="18" height="5"/>
        <path d="M690 590 l4 -2 v6z"/>
      </g>
      <path fill="none" stroke="#5d4c39" stroke-width="1.4" opacity=".5" d="M641 628 L705 566 L770 628"/>
      <g class="lamp-dim">
        <circle class="lamp-halo" cx="680" cy="668" r="46" fill="url(#st-lamp)"/>
        <rect class="lamp-window" x="670" y="655" width="21" height="27" fill="#f0bb66"/>
      </g>
      <!-- Something inside: a soft, dark shape that drifts up to the glass, and then the lamp goes out. -->
      <g clip-path="url(#st-window)">
        <path class="window-shadow" fill="#140b04" filter="url(#st-shade)" d="M680.5 649 c5 0 8 6 8 13 c0 4 -1 6.5 -2.5 8.5 c4 2 6.5 8 6.5 16 h-24 c0 -8 2.5 -14 6.5 -16 c-1.5 -2 -2.5 -4.5 -2.5 -8.5 c0 -7 3 -13 8 -13z"/>
      </g>
      <path fill="#0f0c0a" d="M679.5 655 h2 v27 h-2z M670 667.5 h21 v2 h-21z"/>
      <rect x="697" y="606" width="14" height="14" fill="#1d1813"/>
      <g class="smoke" fill="#6a5d4e" filter="url(#ln-blur)">
        <ellipse cx="745" cy="548" rx="12" ry="7" opacity=".35"/>
        <ellipse cx="772" cy="530" rx="22" ry="9" opacity=".25"/>
        <ellipse cx="815" cy="516" rx="34" ry="10" opacity=".15"/>
      </g>
      <!-- Two crows on the wire; one takes fright and flies off. -->
      <g class="crows" fill="#0d0b09">
        <path transform="translate(748 526.5) scale(1 1)" d="M-7 -8.5 c1.5 -2.5 4.5 -2.5 5.5 -.5 c3 0 6.5 2 7.5 5 l4.5 4 l-1 .8 l-4.6 -2.6 c-1.6 1.4 -3.8 1.8 -5.5 1.3 l-.3 2.5 h-.8 l.1 -2.8 c-2.4 -1.4 -3.6 -3.6 -3.2 -5.7 l-3.2 -.3z"/>
        <path class="crow-perched" transform="translate(790 526.5) scale(-1 1)" d="M-7 -8.5 c1.5 -2.5 4.5 -2.5 5.5 -.5 c3 0 6.5 2 7.5 5 l4.5 4 l-1 .8 l-4.6 -2.6 c-1.6 1.4 -3.8 1.8 -5.5 1.3 l-.3 2.5 h-.8 l.1 -2.8 c-2.4 -1.4 -3.6 -3.6 -3.2 -5.7 l-3.2 -.3z"/>
        <g transform="translate(788 518)">
          <g class="crow-flight">
            <g class="wings"><path d="M-13 -5 q7 -1 13 5 q6 -6 13 -5 q-7 3 -13 8 q-6 -5 -13 -8z"/></g>
            <ellipse cx="0" cy="1.5" rx="4" ry="2.4"/>
          </g>
        </g>
      </g>
      <g fill="#0f0c0a" data-reeds='{"x": [628, 860], "base": 714, "h": [5, 13], "n": 70, "seed": 41, "depth": 8}'></g>
      <g class="tree" fill="none" stroke="#0f0c0a" stroke-linecap="round" data-tree='{"x": 842, "y": 712, "length": 46, "angle": 1.69, "seed": 11, "lean": -0.35}'></g>
      <g class="reeds reeds-mid" fill="#17130f" data-reeds='[{"x": [380, 1250], "base": 750, "h": [12, 30], "n": 80, "seed": 3, "depth": 34}, {"x": [520, 1100], "base": 750, "h": [12, 30], "n": 60, "seed": 13, "depth": 34}, {"x": [300, 1400], "base": 750, "h": [12, 30], "n": 30, "seed": 23, "depth": 34}]'></g>
      <g class="reeds reeds-near" fill="#110e0b" data-reeds='[{"x": [250, 700], "base": 828, "h": [24, 60], "n": 70, "seed": 61, "depth": 50, "cattail": 0.1}, {"x": [820, 1200], "base": 828, "h": [24, 60], "n": 60, "seed": 62, "depth": 50, "cattail": 0.1}, {"x": [150, 1350], "base": 828, "h": [24, 60], "n": 40, "seed": 63, "depth": 50, "cattail": 0.1}]'></g>
      <g class="reeds reeds-left" fill="#080706" data-reeds='{"x": [-30, 560], "base": 905, "h": [70, 210], "n": 70, "seed": 5, "cattail": 0.2}'></g>
      <g class="reeds reeds-right" fill="#080706" data-reeds='{"x": [1080, 1640], "base": 905, "h": [60, 230], "n": 70, "seed": 6, "cattail": 0.2}'></g>
    </g>
    <!-- A fine drizzle. -->
    <g class="drizzle drizzle-far" opacity=".1"><rect x="-200" y="-400" width="2000" height="1600" fill="url(#st-rain)"/></g>
    <g class="drizzle drizzle-near" opacity=".16"><rect x="-200" y="-500" width="2000" height="1700" fill="url(#st-rain-near)"/></g>
    <!-- Leaves blowing across, outside the camera so they keep their own pace. -->
    <g class="leaves">
      <path class="leaf" fill="#4a3220" style="--y: 250px; --dur: 10.5s; --delay: -0.5s" d="M0 0 c2.4 -3.1 6.1 -2.4 7.3 0 c-1.8 2.4 -5.5 3.1 -7.3 0z"/>
      <path class="leaf" fill="#7a5428" style="--y: 688px; --dur: 7.0s; --delay: -1.0s" d="M0 0 c5.8 -7.3 14.6 -5.8 17.5 0 c-4.4 5.8 -13.1 7.3 -17.5 0z"/>
      <path class="leaf" fill="#4a3220" style="--y: 530px; --dur: 6.4s; --delay: -2.9s" d="M0 0 c5.1 -6.3 12.7 -5.1 15.2 0 c-3.8 5.1 -11.4 6.3 -15.2 0z"/>
      <path class="leaf" fill="#7a5428" style="--y: 164px; --dur: 6.1s; --delay: -5.7s" d="M0 0 c3.9 -4.9 9.7 -3.9 11.7 0 c-2.9 3.9 -8.7 4.9 -11.7 0z"/>
      <path class="leaf" fill="#5c3b1d" style="--y: 428px; --dur: 6.8s; --delay: -4.1s" d="M0 0 c3.9 -4.8 9.6 -3.9 11.6 0 c-2.9 3.9 -8.7 4.8 -11.6 0z"/>
      <path class="leaf" fill="#5c3b1d" style="--y: 621px; --dur: 8.2s; --delay: -0.5s" d="M0 0 c3.3 -4.1 8.2 -3.3 9.9 0 c-2.5 3.3 -7.4 4.1 -9.9 0z"/>
      <path class="leaf" fill="#5c3b1d" style="--y: 295px; --dur: 7.8s; --delay: -6.5s" d="M0 0 c2.6 -3.2 6.5 -2.6 7.8 0 c-1.9 2.6 -5.8 3.2 -7.8 0z"/>
      <path class="leaf" fill="#4a3220" style="--y: 527px; --dur: 6.1s; --delay: -2.7s" d="M0 0 c6.0 -7.5 14.9 -6.0 17.9 0 c-4.5 6.0 -13.4 7.5 -17.9 0z"/>
      <path class="leaf" fill="#5c3b1d" style="--y: 668px; --dur: 10.7s; --delay: -2.1s" d="M0 0 c5.3 -6.6 13.3 -5.3 15.9 0 c-4.0 5.3 -12.0 6.6 -15.9 0z"/>
      <path class="leaf" fill="#5c3b1d" style="--y: 337px; --dur: 8.6s; --delay: -2.5s" d="M0 0 c4.7 -5.9 11.8 -4.7 14.1 0 c-3.5 4.7 -10.6 5.9 -14.1 0z"/>
      <path class="leaf" fill="#3b281a" style="--y: 744px; --dur: 9.7s; --delay: -9.3s" d="M0 0 c4.5 -5.6 11.1 -4.5 13.4 0 c-3.3 4.5 -10.0 5.6 -13.4 0z"/>
      <path class="leaf" fill="#4a3220" style="--y: 367px; --dur: 10.6s; --delay: -1.9s" d="M0 0 c5.9 -7.4 14.8 -5.9 17.7 0 c-4.4 5.9 -13.3 7.4 -17.7 0z"/>
      <path class="leaf" fill="#7a5428" style="--y: 360px; --dur: 10.9s; --delay: -1.9s" d="M0 0 c4.6 -5.8 11.6 -4.6 13.9 0 c-3.5 4.6 -10.5 5.8 -13.9 0z"/>
      <path class="leaf" fill="#7a5428" style="--y: 829px; --dur: 7.9s; --delay: -5.3s" d="M0 0 c2.5 -3.1 6.3 -2.5 7.5 0 c-1.9 2.5 -5.6 3.1 -7.5 0z"/>
    </g>
  </svg>`;
