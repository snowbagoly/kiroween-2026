// Slide 1 of the story [R17.1].

// 1. The Excelsior Rooms, shut for the winter: a wet street at night, the doors chained, a bill pasted
// across them, and one last light upstairs, over the shrouded piano, that goes out as the letter
// says "and their piano with them" (see story.css).
export const hallScene = () => `
  <svg class="slide" data-scene="hall" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" style="--focus: 920px 440px">
    <defs>
      <linearGradient id="ha-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0e0f12"/><stop offset=".22" stop-color="#1c1b1d"/><stop offset=".36" stop-color="#3a3029"/>
      </linearGradient>
      <filter id="ha-cloud" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".0018 .01" numOctaves="4" seed="17"/>
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -.95"/>
        <feComposite in="SourceGraphic" operator="in"/>
      </filter>
      <!-- Stucco, gone dark with the rain; the lamp warms it from the left. -->
      <linearGradient id="ha-stucco" x1="0" y1="130" x2="0" y2="730" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#3a3129"/><stop offset=".6" stop-color="#2c251f"/><stop offset="1" stop-color="#1e1915"/>
      </linearGradient>
      <linearGradient id="ha-glass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2a2a2c"/><stop offset=".5" stop-color="#121315"/><stop offset="1" stop-color="#0b0b0c"/>
      </linearGradient>
      <!-- The last light in the building, upstairs in the ballroom. -->
      <linearGradient id="ha-room" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#7a4e24"/><stop offset=".45" stop-color="#d79a52"/><stop offset="1" stop-color="#a86a30"/>
      </linearGradient>
      <radialGradient id="ha-halo">
        <stop offset="0" stop-color="#f0b466" stop-opacity=".45"/><stop offset="1" stop-color="#f0b466" stop-opacity="0"/>
      </radialGradient>
      <!-- The street lamp: a gas flame in a glass lantern. -->
      <radialGradient id="ha-gaslight" cx="232" cy="446" r="620" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffd896" stop-opacity=".55"/><stop offset=".18" stop-color="#e9a95a" stop-opacity=".26"/>
        <stop offset=".6" stop-color="#c88442" stop-opacity=".09"/><stop offset="1" stop-color="#c88442" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="ha-flame">
        <stop offset="0" stop-color="#fff2c8"/><stop offset=".35" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#e9a64a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="ha-streak" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e9b062" stop-opacity=".55"/><stop offset="1" stop-color="#e9b062" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="ha-road" x1="0" y1="800" x2="0" y2="900" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#1d1915"/><stop offset="1" stop-color="#0d0b09"/>
      </linearGradient>
      <!-- Cobbles: rounded setts, wet, catching a little light on their tops. -->
      <pattern id="ha-setts" width="34" height="14" patternUnits="userSpaceOnUse">
        <rect x="1" y="1" width="31" height="11" rx="4" fill="#2a241e" opacity=".55"/>
        <path d="M5 3 h20" stroke="#5a4c3c" stroke-width="1" opacity=".35"/>
      </pattern>
      <pattern id="ha-rusticated" width="1600" height="26" patternUnits="userSpaceOnUse">
        <rect width="1600" height="2" y="24" fill="#16120f" opacity=".7"/>
      </pattern>
      <pattern id="ha-balusters" width="16" height="30" patternUnits="userSpaceOnUse">
        <path fill="#2e2620" d="M5 30 v-4 q-3 -4 0 -9 q-2 -5 0 -9 v-8 h6 v8 q2 4 0 9 q3 5 0 9 v4z"/>
      </pattern>
      <!-- Rain: the same tiles as the station's, so the drizzle animation fits them. -->
      <pattern id="ha-rain" width="76" height="280" patternUnits="userSpaceOnUse">
        <path stroke="#cbbb98" stroke-width="1" d="M14 20 l-6 22 M52 90 l-6 22 M30 170 l-6 22 M70 220 l-6 22 M40 4 l-6 22 M8 128 l-6 22"/>
      </pattern>
      <pattern id="ha-rain-near" href="#ha-rain" patternTransform="scale(1.6)"/>
      <clipPath id="ha-lamp-rain"><circle cx="232" cy="470" r="200"/></clipPath>
      <radialGradient id="ha-contact">
        <stop offset="0" stop-color="#000" stop-opacity=".8"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="ha-dark" cx="820" cy="520" r="980" gradientUnits="userSpaceOnUse">
        <stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".72"/>
      </radialGradient>
      <filter id="ha-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    <g class="camera">
      <rect width="1600" height="900" fill="url(#ha-sky)"/>
      <g class="clouds">
        <rect x="-200" y="0" width="2000" height="600" fill="#0f1013" filter="url(#ha-cloud)" mask="url(#ln-cloud-mask)"/>
      </g>
      <!-- The town behind: roofs and chimney pots, a tower, and a few windows still lit. -->
      <path fill="#221d19" d="M-20 330 V262 h60 v-18 h10 v18 h70 l30 -24 l30 24 h40 v-30 h8 v-8 h14 v8 h8 v30 h60 V330Z
        M1240 330 V250 h40 v-14 h8 v14 h50 l40 -30 l40 30 h30 v-22 h10 v22 h60 v-16 h12 v16 h40 v-40 h18 v-50 l14 -24 l14 24 v50 h18 v40 h50 V330Z"/>
      <g fill="#c89050" opacity=".55"><rect x="96" y="290" width="5" height="7"/><rect x="1352" y="276" width="5" height="7"/><rect x="1512" y="240" width="4" height="6"/></g>
      <g class="smoke" fill="#5a5048" filter="url(#ln-blur)">
        <ellipse cx="212" cy="214" rx="14" ry="8" opacity=".3"/><ellipse cx="240" cy="196" rx="26" ry="10" opacity=".2"/><ellipse cx="290" cy="182" rx="38" ry="11" opacity=".12"/>
      </g>

      <!-- Next door, left and right: plain terraces, dark. -->
      <path fill="#15110e" d="M-20 730 V150 H120 V118 h14 v-10 h40 v10 h14 V150 H336 V730Z"/>
      <g fill="#0c0a08">
        <rect x="40" y="200" width="56" height="88"/><rect x="190" y="200" width="56" height="88"/>
        <rect x="40" y="350" width="56" height="88"/><rect x="190" y="350" width="56" height="88"/>
        <rect x="30" y="540" width="120" height="140"/>
      </g>
      <path fill="#14100d" d="M1264 730 V176 H1440 V150 h12 v-8 h36 v8 h12 V176 H1620 V730Z"/>
      <g fill="#0c0a08">
        <rect x="1330" y="226" width="56" height="86"/><rect x="1490" y="226" width="56" height="86"/>
        <rect x="1330" y="372" width="56" height="86"/><rect x="1490" y="372" width="56" height="86"/>
        <rect x="1310" y="548" width="66" height="182"/><rect x="1440" y="560" width="130" height="120"/>
      </g>

      <!-- The Excelsior Rooms. -->
      <rect x="340" y="160" width="920" height="570" fill="url(#ha-stucco)"/>
      <rect x="340" y="512" width="920" height="218" fill="url(#ha-rusticated)"/>
      <!-- Parapet and pediment, with a lyre in the gable. -->
      <rect x="352" y="128" width="896" height="30" fill="url(#ha-balusters)"/>
      <rect x="346" y="124" width="908" height="7" fill="#3e352c"/>
      <path fill="#352d26" d="M640 128 L800 62 L960 128Z"/>
      <path fill="none" stroke="#4a3f34" stroke-width="5" d="M632 130 L800 58 L968 130"/>
      <g fill="none" stroke="#4e4236" stroke-width="3" stroke-linecap="round">
        <path d="M786 120 C770 108 772 88 786 84 M814 120 C830 108 828 88 814 84 M786 120 H814"/>
        <path stroke-width="1.2" d="M792 118 V92 M800 118 V90 M808 118 V92 M786 92 H814"/>
      </g>
      <!-- Cornice, and the name in the frieze, in raised letters. -->
      <rect x="330" y="158" width="940" height="14" fill="#4a3f34"/>
      <rect x="330" y="172" width="940" height="6" fill="#120e0b" opacity=".7"/>
      <text x="801.5" y="211.5" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="34" letter-spacing="12" fill="#120e0b" opacity=".8">EXCELSIOR ROOMS</text>
      <text x="800" y="210" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="34" letter-spacing="12" fill="#5e5040">EXCELSIOR ROOMS</text>
      <rect x="340" y="226" width="920" height="5" fill="#40362d"/>

      <!-- Pilasters between the ballroom windows. -->
      <g fill="#352c25">
        <rect x="346" y="231" width="18" height="281"/><rect x="514" y="231" width="18" height="281"/><rect x="699" y="231" width="18" height="281"/>
        <rect x="883" y="231" width="18" height="281"/><rect x="1068" y="231" width="18" height="281"/><rect x="1236" y="231" width="18" height="281"/>
      </g>
      <!-- The ballroom's tall arched windows, dark; two with their inside shutters closed. -->
      <g id="ha-arch">
        <path fill="none" stroke="#4a3f34" stroke-width="8" d="M-50 222 V48 A50 50 0 0 1 50 48 V222"/>
        <path fill="url(#ha-glass)" d="M-46 222 V48 A46 46 0 0 1 46 48 V222Z"/>
        <rect x="-56" y="222" width="112" height="9" fill="#40362d"/>
      </g>
      <use href="#ha-arch" x="438" y="248"/><use href="#ha-arch" x="615" y="248"/><use href="#ha-arch" x="800" y="248"/>
      <use href="#ha-arch" x="985" y="248"/><use href="#ha-arch" x="1162" y="248"/>
      <g fill="#2a221b" stroke="#1a1410" stroke-width="2">
        <path d="M398 470 V300 H478 V470Z M438 300 V470"/>
        <path d="M1122 470 V300 H1202 V470Z M1162 300 V470"/>
      </g>
      <g fill="none" stroke="#1a1612" stroke-width="3">
        <path d="M615 254 V470 M569 330 H661 M569 400 H661 M800 254 V470 M754 330 H846 M754 400 H846"/>
      </g>
      <!-- The one still lit: through the glass, the chandelier in its holland bag, and the piano
           under a dust sheet. It goes out with the letter. -->
      <g class="hall-light">
        <circle cx="985" cy="370" r="150" fill="url(#ha-halo)"/>
        <path fill="url(#ha-room)" d="M939 470 V296 A46 46 0 0 1 1031 296 V470Z"/>
        <path fill="#3a2412" d="M985 250 V300 M976 300 q9 -6 18 0 q8 22 -9 40 q-17 -18 -9 -40z"/>
        <path stroke="#3a2412" stroke-width="1.6" d="M985 250 V300"/>
        <!-- The ballroom floor, and the grand piano in profile: its lid propped open on the stick,
             three legs and the pedal lyre, and a dust sheet half drawn over the keyboard end. -->
        <rect x="939" y="462" width="92" height="8" fill="#6a4220"/>
        <g fill="#1e1009">
          <path d="M954 431 L1020 401 L1026 431Z"/>
          <path d="M948 431 H1016 Q1027 431 1027 437 Q1027 444 1016 444 H948Z"/>
          <rect x="953" y="444" width="4.5" height="19"/><rect x="1015" y="444" width="4.5" height="19"/>
          <rect x="986" y="444" width="4" height="19"/>
          <path d="M979 444 h3 v13 h-3z M993 444 h-3 v13 h3z M978 457 h16 v2.5 h-16z"/>
        </g>
        <path stroke="#1e1009" stroke-width="2" d="M1007 431 L1010 409"/>
        <!-- Lamplight caught on the lid's polished underside and the rim of the case. -->
        <path fill="none" stroke="#b07a42" stroke-width="1.4" d="M958 430 L1019 403.5"/>
        <path fill="none" stroke="#8a5a2c" stroke-width="1" d="M950 432.5 H1015 Q1025 432.5 1026 437"/>
        <!-- The keyboard end, and the dust sheet thrown over it, falling to the floor in folds. -->
        <path fill="#d9bf92" d="M941 433 C946 427 962 426 974 430 C977 436 977 442 975 447 L971 445 L967 452 L962 447 L958 458 L952 451 L948 465 L943 463 C940 452 939 440 941 433Z"/>
        <path fill="none" stroke="#a07c4c" stroke-width="1" d="M948 432 C949 442 948 452 946 462 M957 431 C958 440 959 448 958 456 M966 431 C967 437 968 443 967 450"/>
        <path fill="none" stroke="#f0dcb4" stroke-width="1" opacity=".7" d="M943 432 C950 428 962 428 972 431"/>
      </g>
      <path fill="none" stroke="#1a1612" stroke-width="3" d="M985 254 V470 M939 330 H1031 M939 400 H1031"/>

      <!-- String course, then the ground floor. -->
      <rect x="336" y="506" width="928" height="12" fill="#40362d"/>
      <rect x="336" y="518" width="928" height="5" fill="#120e0b" opacity=".6"/>
      <!-- Ground-floor windows, their shutters closed and barred for the season. -->
      <g id="ha-shutter">
        <rect x="-4" y="-4" width="108" height="128" fill="#3a3129"/>
        <rect width="100" height="120" fill="#24170e"/>
        <path stroke="#140d07" stroke-width="2" d="M50 0 V120 M12 0 V120 M25 0 V120 M38 0 V120 M62 0 V120 M75 0 V120 M88 0 V120"/>
        <rect x="-6" y="54" width="112" height="9" fill="#1a110a"/>
      </g>
      <use href="#ha-shutter" x="392" y="562"/><use href="#ha-shutter" x="1108" y="562"/>
      <use href="#ha-shutter" x="948" y="562"/>

      <!-- The bill board by the door: tonight's dancing, with CLOSED pasted across it, and the corner
           torn away where it named the man at the pianoforte. -->
      <g transform="translate(-42 0)">
      <rect x="550" y="548" width="124" height="148" fill="#1a110a"/>
      <g transform="rotate(-1 612 620)">
        <path fill="#b9a988" d="M558 556 H666 V672 L640 688 L628 676 L604 690 H558Z"/>
        <g font-family="IM Fell English SC, serif" fill="#2a2018" text-anchor="middle">
          <text x="612" y="574" font-size="10" textLength="88" lengthAdjust="spacingAndGlyphs">EXCELSIOR ROOMS</text>
          <text x="612" y="598" font-size="19" textLength="84" lengthAdjust="spacingAndGlyphs">DANCING</text>
          <text x="612" y="612" font-size="8" textLength="80" lengthAdjust="spacingAndGlyphs">every evening at eight</text>
          <text x="612" y="638" font-size="8" textLength="62" lengthAdjust="spacingAndGlyphs">at the Pianoforte</text>
        </g>
        <path stroke="#2a2018" stroke-width=".8" d="M576 580 H648 M590 620 H634"/>
        <rect x="584" y="645" width="58" height="6" fill="#2a2018" opacity=".25"/>
      </g>
      <g class="poster-flap">
        <path fill="#a8987a" d="M640 688 L666 672 L670 694 Z"/>
      </g>
      <g transform="rotate(-14 612 620)">
        <rect x="548" y="606" width="128" height="22" fill="#8e3a26"/>
        <text x="612" y="621.5" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="12" textLength="116" lengthAdjust="spacingAndGlyphs" fill="#e2d2b0">CLOSED FOR THE SEASON</text>
      </g>
      </g>

      <!-- The entrance: fanlight, panelled doors chained shut, and a bill pasted across them. -->
      <path fill="#3e352c" d="M712 700 V582 A88 88 0 0 1 888 582 V700 H872 V588 A72 72 0 0 0 728 588 V700Z"/>
      <path fill="#0f0c0a" d="M728 588 A72 72 0 0 1 872 588Z"/>
      <path fill="none" stroke="#3e352c" stroke-width="3" d="M800 588 V518 M800 588 L750 538 M800 588 L850 538 M800 588 L732 568 M800 588 L868 568"/>
      <rect x="728" y="586" width="144" height="6" fill="#3e352c"/>
      <rect x="732" y="592" width="136" height="108" fill="#1c120a"/>
      <g fill="none" stroke="#0e0905" stroke-width="2">
        <path d="M800 592 V700"/>
        <rect x="742" y="604" width="46" height="36"/><rect x="742" y="650" width="46" height="40"/>
        <rect x="812" y="604" width="46" height="36"/><rect x="812" y="650" width="46" height="40"/>
      </g>
      <g fill="#8a6a36"><circle cx="792" cy="646" r="3"/><circle cx="808" cy="646" r="3"/></g>
      <path fill="none" stroke="#6a6258" stroke-width="2.4" stroke-dasharray="5 2" d="M786 640 Q800 656 814 640 M786 652 Q800 666 814 652"/>
      <path fill="#4a443c" d="M794 660 h12 v12 h-12z"/><path fill="none" stroke="#4a443c" stroke-width="2" d="M796 660 v-4 a4 4 0 0 1 8 0 v4"/>
      <g transform="rotate(2 800 626)">
        <rect x="772" y="602" width="56" height="44" fill="#cdbf9c"/>
        <g font-family="IM Fell English SC, serif" fill="#2a2018" text-anchor="middle">
          <text x="800" y="616" font-size="10" textLength="42" lengthAdjust="spacingAndGlyphs">CLOSED</text>
          <text x="800" y="625" font-size="5.5">for the</text>
          <text x="800" y="633" font-size="6.5" textLength="48" lengthAdjust="spacingAndGlyphs">WINTER SEASON</text>
          <text x="800" y="641" font-size="5" textLength="46" lengthAdjust="spacingAndGlyphs">re-opening at Easter</text>
        </g>
      </g>
      <!-- Steps up to the door, wet. -->
      <rect x="716" y="700" width="168" height="10" fill="#3a3129"/><rect x="706" y="710" width="188" height="10" fill="#332b24"/>
      <rect x="696" y="720" width="208" height="10" fill="#2c251f"/>
      <path stroke="#7a6a54" stroke-width="1" opacity=".4" d="M716 700.5 H884 M706 710.5 H894 M696 720.5 H904"/>

      <!-- The canopy over the entrance: iron and glass, its lamp unlit. -->
      <path fill="#1a1612" d="M640 522 H960 V542 H640Z"/>
      <path fill="#1a1612" d="M640 542 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10 l8 10 l8 -10Z"/>
      <path stroke="#4a4038" stroke-width="1.2" opacity=".6" d="M642 523 H958"/>
      <path stroke="#100d0b" stroke-width="2" d="M800 552 V566"/>
      <path fill="#100d0b" d="M790 566 h20 l-3 24 h-14z M788 564 h24 v4 h-24z"/>

      <!-- Area railings along the front. -->
      <g fill="#0d0b09">
        <rect x="344" y="694" width="340" height="4"/><rect x="916" y="694" width="340" height="4"/>
      </g>
      <path stroke="#0d0b09" stroke-width="2.4" d="M350 690 V738 M362 690 V738 M374 690 V738 M386 690 V738 M398 690 V738 M410 690 V738 M422 690 V738 M434 690 V738 M446 690 V738 M458 690 V738 M470 690 V738 M482 690 V738 M494 690 V738 M506 690 V738 M518 690 V738 M530 690 V738 M542 690 V738 M554 690 V738 M566 690 V738 M578 690 V738 M590 690 V738 M602 690 V738 M614 690 V738 M626 690 V738 M638 690 V738 M650 690 V738 M662 690 V738 M674 690 V738
        M922 690 V738 M934 690 V738 M946 690 V738 M958 690 V738 M970 690 V738 M982 690 V738 M994 690 V738 M1006 690 V738 M1018 690 V738 M1030 690 V738 M1042 690 V738 M1054 690 V738 M1066 690 V738 M1078 690 V738 M1090 690 V738 M1102 690 V738 M1114 690 V738 M1126 690 V738 M1138 690 V738 M1150 690 V738 M1162 690 V738 M1174 690 V738 M1186 690 V738 M1198 690 V738 M1210 690 V738 M1222 690 V738 M1234 690 V738 M1246 690 V738"/>

      <!-- The pavement, the kerb and the road, all wet. -->
      <rect x="-20" y="730" width="1640" height="66" fill="#26201b"/>
      <path stroke="#15110e" stroke-width="1.5" d="M-20 752 H1620 M-20 774 H1620 M60 730 V752 M180 730 V752 M300 730 V752 M420 730 V752 M540 730 V752 M660 730 V752 M940 730 V752 M1060 730 V752 M1180 730 V752 M1300 730 V752 M1420 730 V752 M1540 730 V752
        M0 752 V774 M120 752 V774 M240 752 V774 M360 752 V774 M480 752 V774 M600 752 V774 M720 752 V774 M840 752 V774 M960 752 V774 M1080 752 V774 M1200 752 V774 M1320 752 V774 M1440 752 V774 M1560 752 V774
        M60 774 V796 M180 774 V796 M300 774 V796 M420 774 V796 M540 774 V796 M660 774 V796 M780 774 V796 M900 774 V796 M1020 774 V796 M1140 774 V796 M1260 774 V796 M1380 774 V796 M1500 774 V796"/>
      <ellipse cx="800" cy="732" rx="120" ry="6" fill="url(#ha-contact)" opacity=".7"/>
      <!-- A puddle on the flags, holding the lamp. -->
      <ellipse cx="420" cy="772" rx="110" ry="8" fill="#3a3229" opacity=".9"/>
      <rect x="-20" y="796" width="1640" height="8" fill="#4a4034"/>
      <rect x="-20" y="804" width="1640" height="96" fill="url(#ha-road)"/>
      <rect x="-20" y="804" width="1640" height="96" fill="url(#ha-setts)"/>
      <!-- Leaves gathered in the gutter. -->
      <g fill="#5c3b1d">
        <path d="M120 806 c4 -4 10 -3 12 0 c-3 3 -9 4 -12 0z"/><path fill="#7a5428" d="M470 805 c5 -5 12 -4 14 0 c-3 4 -10 5 -14 0z"/>
        <path d="M486 808 c3 -3 8 -3 10 0 c-2 3 -7 3 -10 0z"/><path fill="#4a3220" d="M1010 806 c4 -4 10 -3 12 0 c-3 3 -9 4 -12 0z"/>
        <path fill="#7a5428" d="M1390 805 c5 -5 12 -4 14 0 c-3 4 -10 5 -14 0z"/><path d="M760 724 c3 -3 8 -3 10 0 c-2 3 -7 3 -10 0z"/>
      </g>

      <!-- Reflections in the wet road: the street lamp, and the last window until it goes out. -->
      <g class="glimmer">
        <rect x="216" y="808" width="32" height="92" fill="url(#ha-streak)"/>
        <rect x="380" y="768" width="60" height="2" fill="#e9b062" opacity=".5"/><rect x="396" y="773" width="34" height="1.6" fill="#e9b062" opacity=".35"/>
      </g>
      <g class="hall-light"><rect x="972" y="808" width="26" height="70" fill="url(#ha-streak)" opacity=".5"/></g>

      <!-- The canopy's columns, out at the kerb. -->
      <g fill="#100d0b">
        <rect x="656" y="542" width="7" height="256"/><rect x="937" y="542" width="7" height="256"/>
        <rect x="652" y="790" width="15" height="8"/><rect x="933" y="790" width="15" height="8"/>
        <path d="M663 548 q18 2 26 -6 h-4 q-6 4 -22 2z M937 548 q-18 2 -26 -6 h4 q6 4 22 2z"/>
      </g>

      <!-- The street lamp. -->
      <g fill="#0e0b09">
        <path d="M222 802 L226 770 L228 486 H236 L238 770 L242 802Z"/>
        <rect x="210" y="796" width="44" height="8"/>
        <rect x="206" y="478" width="52" height="4"/>
        <path d="M212 470 L218 420 H246 L252 470Z" opacity=".35"/>
        <path d="M208 472 h48 v6 h-48z M214 420 h36 l-6 -10 h-24z M228 410 l4 -10 l4 10z"/>
        <path fill="none" stroke="#0e0b09" stroke-width="2.2" d="M212 470 L218 420 M252 470 L246 420 M232 420 V470"/>
      </g>
      <g class="gaslight">
        <ellipse cx="232" cy="450" rx="9" ry="14" fill="url(#ha-flame)"/>
        <rect width="1600" height="900" fill="url(#ha-gaslight)"/>
      </g>
      <ellipse cx="232" cy="802" rx="40" ry="5" fill="url(#ha-contact)"/>

      <ellipse class="fog" cx="800" cy="760" rx="1000" ry="26" fill="#6a5c4a" opacity=".22" filter="url(#ln-blur)"/>
      <rect width="1600" height="900" fill="url(#ha-dark)"/>
    </g>
    <!-- Rain, and brighter where it falls through the lamplight. -->
    <g class="drizzle drizzle-far" opacity=".1"><rect x="-200" y="-400" width="2000" height="1600" fill="url(#ha-rain)"/></g>
    <g class="drizzle drizzle-near" opacity=".14"><rect x="-200" y="-500" width="2000" height="1700" fill="url(#ha-rain-near)"/></g>
    <g clip-path="url(#ha-lamp-rain)">
      <g class="drizzle drizzle-near" opacity=".4"><rect x="-200" y="-500" width="2000" height="1700" fill="url(#ha-rain-near)"/></g>
    </g>
    <g class="leaves">
      <path class="leaf" fill="#7a5428" style="--y: 610px; --dur: 8.0s; --delay: -1.5s" d="M0 0 c5.8 -7.3 14.6 -5.8 17.5 0 c-4.4 5.8 -13.1 7.3 -17.5 0z"/>
      <path class="leaf" fill="#5c3b1d" style="--y: 430px; --dur: 9.4s; --delay: -6.0s" d="M0 0 c3.9 -4.8 9.6 -3.9 11.6 0 c-2.9 3.9 -8.7 4.8 -11.6 0z"/>
      <path class="leaf" fill="#4a3220" style="--y: 720px; --dur: 7.2s; --delay: -3.1s" d="M0 0 c5.1 -6.3 12.7 -5.1 15.2 0 c-3.8 5.1 -11.4 6.3 -15.2 0z"/>
      <path class="leaf" fill="#7a5428" style="--y: 300px; --dur: 10.4s; --delay: -8.2s" d="M0 0 c3.3 -4.1 8.2 -3.3 9.9 0 c-2.5 3.3 -7.4 4.1 -9.9 0z"/>
      <path class="leaf" fill="#5c3b1d" style="--y: 780px; --dur: 8.8s; --delay: -4.6s" d="M0 0 c4.6 -5.8 11.6 -4.6 13.9 0 c-3.5 4.6 -10.5 5.8 -13.9 0z"/>
    </g>
  </svg>`;
