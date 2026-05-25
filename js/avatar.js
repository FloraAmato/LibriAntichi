'use strict';

// Material color palettes for the book avatar
const MATERIAL_PALETTES = {
  parchment: {
    coverLight: '#A07548', coverMid: '#7A4E2A', coverDark: '#5A2E10',
    spineLight: '#906838', spineDark: '#4A2008',
    pageColor: '#EDE0C0', pageEdge: '#D4C098',
    goldLight: '#FFD060', goldMid: '#C8901A', goldDark: '#8B5E00'
  },
  vellum: {
    coverLight: '#C4A478', coverMid: '#9A7848', coverDark: '#7A5828',
    spineLight: '#B09468', spineDark: '#6A4818',
    pageColor: '#F5EDD8', pageEdge: '#E0D0B0',
    goldLight: '#FFE080', goldMid: '#DAA520', goldDark: '#9A7000'
  },
  papyrus: {
    coverLight: '#B89060', coverMid: '#8A6030', coverDark: '#5A3010',
    spineLight: '#A08050', spineDark: '#4A2808',
    pageColor: '#E8D098', pageEdge: '#C8B078',
    goldLight: '#E8C040', goldMid: '#B08010', goldDark: '#785000'
  },
  leather: {
    coverLight: '#8A4030', coverMid: '#5A1A0A', coverDark: '#3A0A00',
    spineLight: '#702818', spineDark: '#2A0800',
    pageColor: '#E8DCB8', pageEdge: '#C8BC98',
    goldLight: '#DAA820', goldMid: '#A07810', goldDark: '#705000'
  },
  waxTablet: {
    coverLight: '#9A8860', coverMid: '#6A5838', coverDark: '#4A3818',
    spineLight: '#847250', spineDark: '#382808',
    pageColor: '#D8C890', pageEdge: '#B8A870',
    goldLight: '#B8A028', goldMid: '#887010', goldDark: '#585000'
  }
};

function buildBookSVG(materialId) {
  const pal = MATERIAL_PALETTES[materialId] || MATERIAL_PALETTES.parchment;

  return `<svg id="book-svg" viewBox="0 0 420 540" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:340px;height:auto;">
  <defs>
    <radialGradient id="coverGrad" cx="42%" cy="38%" r="65%">
      <stop offset="0%" stop-color="${pal.coverLight}"/>
      <stop offset="60%" stop-color="${pal.coverMid}"/>
      <stop offset="100%" stop-color="${pal.coverDark}"/>
    </radialGradient>
    <linearGradient id="spineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${pal.spineDark}"/>
      <stop offset="35%" stop-color="${pal.spineLight}"/>
      <stop offset="65%" stop-color="${pal.spineLight}"/>
      <stop offset="100%" stop-color="${pal.spineDark}"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${pal.goldLight}"/>
      <stop offset="45%" stop-color="${pal.goldMid}"/>
      <stop offset="100%" stop-color="${pal.goldDark}"/>
    </linearGradient>
    <linearGradient id="pageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${pal.pageEdge}"/>
      <stop offset="100%" stop-color="${pal.pageColor}"/>
    </linearGradient>
    <filter id="shadowF" x="-10%" y="-5%" width="130%" height="130%">
      <feDropShadow dx="4" dy="6" stdDeviation="8" flood-color="rgba(0,0,0,0.7)"/>
    </filter>
    <filter id="crackF" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <clipPath id="coverClip">
      <rect x="58" y="22" width="278" height="478" rx="4"/>
    </clipPath>
    <clipPath id="pageClip">
      <rect x="130" y="30" width="200" height="462" rx="2"/>
    </clipPath>
  </defs>

  <!-- Drop shadow base -->
  <ellipse cx="230" cy="515" rx="140" ry="14" fill="rgba(0,0,0,0.35)"/>

  <!-- PAGE BLOCK (visible on fore-edge) -->
  <g class="av-pages">
    <rect x="128" y="28" width="206" height="468" rx="3" fill="url(#pageGrad)"/>
    <!-- Individual page lines giving depth -->
    <line x1="130" y1="70"  x2="332" y2="70"  stroke="${pal.pageEdge}" stroke-width="0.6" opacity="0.5"/>
    <line x1="130" y1="108" x2="332" y2="108" stroke="${pal.pageEdge}" stroke-width="0.6" opacity="0.5"/>
    <line x1="130" y1="146" x2="332" y2="146" stroke="${pal.pageEdge}" stroke-width="0.6" opacity="0.5"/>
    <line x1="130" y1="184" x2="332" y2="184" stroke="${pal.pageEdge}" stroke-width="0.6" opacity="0.5"/>
    <line x1="130" y1="222" x2="332" y2="222" stroke="${pal.pageEdge}" stroke-width="0.6" opacity="0.5"/>
    <line x1="130" y1="260" x2="332" y2="260" stroke="${pal.pageEdge}" stroke-width="0.6" opacity="0.5"/>
    <line x1="130" y1="298" x2="332" y2="298" stroke="${pal.pageEdge}" stroke-width="0.6" opacity="0.5"/>
    <line x1="130" y1="336" x2="332" y2="336" stroke="${pal.pageEdge}" stroke-width="0.6" opacity="0.5"/>
    <line x1="130" y1="374" x2="332" y2="374" stroke="${pal.pageEdge}" stroke-width="0.6" opacity="0.5"/>
    <line x1="130" y1="412" x2="332" y2="412" stroke="${pal.pageEdge}" stroke-width="0.6" opacity="0.5"/>
    <line x1="130" y1="450" x2="332" y2="450" stroke="${pal.pageEdge}" stroke-width="0.6" opacity="0.5"/>
  </g>

  <!-- MAIN COVER -->
  <g class="av-cover" filter="url(#shadowF)">
    <rect x="58" y="22" width="278" height="478" rx="4"
          fill="url(#coverGrad)" stroke="${pal.coverDark}" stroke-width="1.5"/>

    <!-- Leather texture lines -->
    <g opacity="0.12" clip-path="url(#coverClip)">
      <line x1="58" y1="80"  x2="336" y2="80"  stroke="${pal.coverDark}" stroke-width="0.5"/>
      <line x1="58" y1="140" x2="336" y2="140" stroke="${pal.coverDark}" stroke-width="0.5"/>
      <line x1="58" y1="200" x2="336" y2="200" stroke="${pal.coverDark}" stroke-width="0.5"/>
      <line x1="58" y1="260" x2="336" y2="260" stroke="${pal.coverDark}" stroke-width="0.5"/>
      <line x1="58" y1="320" x2="336" y2="320" stroke="${pal.coverDark}" stroke-width="0.5"/>
      <line x1="58" y1="380" x2="336" y2="380" stroke="${pal.coverDark}" stroke-width="0.5"/>
      <line x1="58" y1="440" x2="336" y2="440" stroke="${pal.coverDark}" stroke-width="0.5"/>
      <line x1="120" y1="22" x2="120" y2="500" stroke="${pal.coverDark}" stroke-width="0.5"/>
      <line x1="180" y1="22" x2="180" y2="500" stroke="${pal.coverDark}" stroke-width="0.5"/>
      <line x1="240" y1="22" x2="240" y2="500" stroke="${pal.coverDark}" stroke-width="0.5"/>
      <line x1="300" y1="22" x2="300" y2="500" stroke="${pal.coverDark}" stroke-width="0.5"/>
    </g>

    <!-- Outer decorative border -->
    <rect x="70" y="34" width="254" height="454" rx="3"
          fill="none" stroke="url(#goldGrad)" stroke-width="2.5" class="av-gold"/>
    <!-- Inner decorative border -->
    <rect x="80" y="44" width="234" height="434" rx="2"
          fill="none" stroke="url(#goldGrad)" stroke-width="1" opacity="0.7" class="av-gold"/>

    <!-- Corner bosses -->
    <g class="av-boss av-gold">
      <circle cx="82" cy="48"  r="10" fill="url(#goldGrad)" stroke="${pal.goldDark}" stroke-width="1"/>
      <circle cx="82" cy="48"  r="5"  fill="${pal.goldLight}" opacity="0.6"/>
      <circle cx="312" cy="48" r="10" fill="url(#goldGrad)" stroke="${pal.goldDark}" stroke-width="1"/>
      <circle cx="312" cy="48" r="5"  fill="${pal.goldLight}" opacity="0.6"/>
      <circle cx="82" cy="474" r="10" fill="url(#goldGrad)" stroke="${pal.goldDark}" stroke-width="1"/>
      <circle cx="82" cy="474" r="5"  fill="${pal.goldLight}" opacity="0.6"/>
      <circle cx="312" cy="474" r="10" fill="url(#goldGrad)" stroke="${pal.goldDark}" stroke-width="1"/>
      <circle cx="312" cy="474" r="5"  fill="${pal.goldLight}" opacity="0.6"/>
    </g>

    <!-- Title cartouche -->
    <rect x="96" y="90" width="202" height="90" rx="4"
          fill="rgba(0,0,0,0.18)" stroke="url(#goldGrad)" stroke-width="1.5" class="av-gold"/>
    <text x="197" y="128" text-anchor="middle" font-family="Palatino Linotype,Palatino,Georgia,serif"
          font-size="16" font-style="italic" fill="url(#goldGrad)" class="av-gold av-title">CODEX</text>
    <text x="197" y="150" text-anchor="middle" font-family="Palatino Linotype,Palatino,Georgia,serif"
          font-size="11" fill="url(#goldGrad)" class="av-gold av-title">MANUSCRIPTUM</text>

    <!-- Central cross ornament -->
    <g class="av-ornament av-gold" transform="translate(197,300)">
      <!-- Cross arms -->
      <rect x="-36" y="-4" width="72" height="8" rx="2" fill="url(#goldGrad)"/>
      <rect x="-4" y="-36" width="8" height="72" rx="2" fill="url(#goldGrad)"/>
      <!-- Terminal flourishes -->
      <polygon points="-46,0 -36,-7 -26,0 -36,7" fill="url(#goldGrad)"/>
      <polygon points="26,0 36,-7 46,0 36,7"  fill="url(#goldGrad)"/>
      <polygon points="0,-46 7,-36 0,-26 -7,-36" fill="url(#goldGrad)"/>
      <polygon points="0,26 7,36 0,46 -7,36"  fill="url(#goldGrad)"/>
      <!-- Centre medallion -->
      <circle cx="0" cy="0" r="14" fill="url(#goldGrad)"/>
      <circle cx="0" cy="0" r="9" fill="none" stroke="${pal.coverDark}" stroke-width="2"/>
      <circle cx="0" cy="0" r="4" fill="${pal.goldLight}"/>
      <!-- Quarter medallions -->
      <circle cx="-58" cy="-58" r="7" fill="url(#goldGrad)" opacity="0.85"/>
      <circle cx=" 58" cy="-58" r="7" fill="url(#goldGrad)" opacity="0.85"/>
      <circle cx="-58" cy=" 58" r="7" fill="url(#goldGrad)" opacity="0.85"/>
      <circle cx=" 58" cy=" 58" r="7" fill="url(#goldGrad)" opacity="0.85"/>
    </g>

    <!-- Clasp/hasp on fore-edge -->
    <g class="av-clasp">
      <rect x="326" y="228" width="18" height="68" rx="3" fill="${pal.goldMid}" stroke="${pal.goldDark}" stroke-width="1"/>
      <rect x="328" y="232" width="14" height="60" rx="2" fill="${pal.goldLight}" opacity="0.5"/>
      <circle cx="335" cy="262" r="7" fill="${pal.goldMid}" stroke="${pal.goldDark}" stroke-width="1.5"/>
      <circle cx="335" cy="262" r="3" fill="${pal.goldLight}"/>
    </g>

    <!-- Highlight (specular) -->
    <ellipse cx="145" cy="115" rx="65" ry="42" fill="rgba(255,255,255,0.07)"
             transform="rotate(-18,145,115)" id="av-shine"/>
  </g>

  <!-- SPINE -->
  <g class="av-spine">
    <rect x="28" y="22" width="35" height="478" rx="3"
          fill="url(#spineGrad)" stroke="${pal.spineDark}" stroke-width="1"/>
    <!-- Raised bands (typical of medieval sewing on cords) -->
    <rect x="26" y="76"  width="39" height="10" rx="1.5" fill="${pal.spineLight}" stroke="${pal.spineDark}" stroke-width="0.5" class="av-band"/>
    <rect x="26" y="148" width="39" height="10" rx="1.5" fill="${pal.spineLight}" stroke="${pal.spineDark}" stroke-width="0.5" class="av-band"/>
    <rect x="26" y="358" width="39" height="10" rx="1.5" fill="${pal.spineLight}" stroke="${pal.spineDark}" stroke-width="0.5" class="av-band"/>
    <rect x="26" y="430" width="39" height="10" rx="1.5" fill="${pal.spineLight}" stroke="${pal.spineDark}" stroke-width="0.5" class="av-band"/>
    <!-- Spine label between bands -->
    <rect x="30" y="158" width="31" height="190" rx="2"
          fill="${pal.coverDark}" opacity="0.4" class="av-gold"/>
    <text x="45" y="290" text-anchor="middle" font-family="Georgia,serif" font-size="9"
          fill="url(#goldGrad)" transform="rotate(90,45,290)" class="av-gold">CODEX · MANUSCRIPTUM</text>
  </g>

  <!-- ── DAMAGE LAYER (opacity driven by JS) ── -->

  <!-- Yellowing / foxing overlay -->
  <rect id="av-yellowing" x="58" y="22" width="278" height="478" rx="4"
        fill="#7A5510" opacity="0" clip-path="url(#coverClip)"/>

  <!-- Edge darkening (tanning, dirt accumulation) -->
  <rect id="av-edge-dark" x="58" y="22" width="278" height="478" rx="4"
        fill="none" stroke="#100800" stroke-width="28" opacity="0" clip-path="url(#coverClip)"/>

  <!-- Water tide-lines -->
  <g id="av-water" opacity="0" clip-path="url(#coverClip)">
    <ellipse cx="210" cy="155" rx="80" ry="45" fill="none" stroke="#6A4820" stroke-width="1.2" opacity="0.6"/>
    <ellipse cx="160" cy="330" rx="55" ry="35" fill="none" stroke="#5A3810" stroke-width="1.0" opacity="0.5"/>
    <ellipse cx="260" cy="390" rx="40" ry="28" fill="none" stroke="#6A4820" stroke-width="0.8" opacity="0.45"/>
  </g>

  <!-- Mold colonies -->
  <g id="av-mold" opacity="0" clip-path="url(#coverClip)">
    <ellipse cx="160" cy="210" rx="22" ry="16" fill="#2A4A18" opacity="0.65"/>
    <ellipse cx="255" cy="360" rx="28" ry="18" fill="#1E3A12" opacity="0.55"/>
    <circle  cx="190" cy="390" r="16"           fill="#324A1E" opacity="0.50"/>
    <ellipse cx="280" cy="175" rx="20" ry="14" fill="#2A3E16" opacity="0.55"/>
    <circle  cx="120" cy="310" r="18"           fill="#223810" opacity="0.45"/>
    <ellipse cx="220" cy="450" rx="30" ry="12" fill="#1A3010" opacity="0.40"/>
  </g>

  <!-- Cracks on cover -->
  <g id="av-cracks" opacity="0">
    <path d="M 118 105 Q 138 138 122 168 Q 108 196 132 228"
          stroke="#1A0A00" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <path d="M 228 308 Q 248 328 240 360 Q 232 380 256 404"
          stroke="#1A0A00" stroke-width="1.0" fill="none" stroke-linecap="round"/>
    <path d="M 278 152 Q 293 163 286 185 Q 279 200 295 215"
          stroke="#1A0A00" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="M 165 440 Q 175 450 168 465"
          stroke="#1A0A00" stroke-width="0.9" fill="none" stroke-linecap="round"/>
  </g>

  <!-- Tears / missing pieces -->
  <g id="av-tears" opacity="0">
    <polygon points="302,72 334,60 322,98 300,90" fill="#0D0B08" opacity="0.9"/>
    <polygon points="68,418 84,412 80,440 64,432" fill="#0D0B08" opacity="0.85"/>
    <polygon points="200,26 230,22 222,38 196,34" fill="#0D0B08" opacity="0.75"/>
  </g>
</svg>`;
}

function initBookAvatar(container) {
  container.innerHTML = buildBookSVG('parchment');
}

function updateBookAvatar(score, conditions, materialId) {
  const moldRisk = calculateMoldRisk(conditions.temp, conditions.rh);
  const rrRisk   = calculateRedRotRisk(materialId, conditions.pollution, conditions.rh);

  const svg = document.getElementById('book-svg');
  if (!svg) return;

  const s = score / 100; // 0..1

  // Yellowing / foxing — stronger and starts earlier
  const yellowing = document.getElementById('av-yellowing');
  if (yellowing) yellowing.setAttribute('opacity', (s * 0.65).toFixed(3));

  // Edge darkening — accumulated dirt, tanning
  const edgeDark = document.getElementById('av-edge-dark');
  if (edgeDark) edgeDark.setAttribute('opacity', (s * 0.75).toFixed(3));

  // Water stains: triggered by humidity, scaled by score
  const water = document.getElementById('av-water');
  if (water) {
    const humidExcess = Math.max(0, conditions.rh - 55) / 40;
    const waterOp = Math.min(0.95, humidExcess * Math.max(0.15, s * 1.4));
    water.setAttribute('opacity', waterOp.toFixed(3));
  }

  // Mold: visible early in humid conditions
  const mold = document.getElementById('av-mold');
  if (mold) {
    const moldBase = moldRisk * (0.3 + s * 1.5);
    mold.setAttribute('opacity', Math.min(0.95, moldBase).toFixed(3));
  }

  // Cracks: appear from ~15%, full at ~70%
  const cracks = document.getElementById('av-cracks');
  if (cracks) {
    cracks.setAttribute('opacity', Math.max(0, Math.min(1, (score - 12) / 55)).toFixed(3));
  }

  // Tears: appear from ~40%
  const tears = document.getElementById('av-tears');
  if (tears) {
    tears.setAttribute('opacity', Math.max(0, Math.min(1, (score - 38) / 50)).toFixed(3));
  }

  // Specular shine — vanishes quickly
  const shine = document.getElementById('av-shine');
  if (shine) shine.setAttribute('opacity', Math.max(0, (1 - s * 1.8) * 0.10).toFixed(3));

  // Gold decoration fade — more dramatic
  svg.querySelectorAll('.av-gold').forEach(el => {
    el.style.opacity = Math.max(0.05, 1 - s * 1.0).toFixed(2);
  });

  // Red rot tint for leather: cover gets reddish powder layer
  if (materialId === 'leather' && rrRisk > 0.1) {
    const yel = document.getElementById('av-yellowing');
    if (yel) {
      yel.setAttribute('fill', '#7A2008');
      yel.setAttribute('opacity', Math.min(0.85, rrRisk * 0.8 + s * 0.3).toFixed(3));
    }
  } else {
    const yel = document.getElementById('av-yellowing');
    if (yel) yel.setAttribute('fill', '#7A5510');
  }

  // Global aging filter — stronger
  const sepia    = Math.min(95, score * 1.0);
  const bright   = Math.max(60, 100 - score * 0.35);
  const contrast = Math.max(70, 100 - score * 0.20);
  const blur     = score > 75 ? ((score - 75) / 25 * 0.6).toFixed(2) : 0;
  svg.style.filter = `drop-shadow(4px 6px 18px rgba(0,0,0,0.85)) sepia(${sepia}%) brightness(${bright}%) contrast(${contrast}%) blur(${blur}px)`;

  // Warp / collapse at high degradation
  const container = document.getElementById('book-container');
  if (container) {
    if (score > 50) {
      const warp = (score - 50) / 50;        // 0..1
      const rotY = warp * 8;
      const skewX = warp * 1.8;
      const tiltZ = warp * 3;
      const scaleY = 1 - warp * 0.04;
      container.style.transform =
        `perspective(700px) rotateY(${rotY}deg) rotateZ(${tiltZ}deg) skewX(${skewX}deg) scaleY(${scaleY})`;
    } else {
      container.style.transform = '';
    }
  }
}

function rebuildBookAvatar(materialId) {
  const container = document.getElementById('book-container');
  if (!container) return;
  container.innerHTML = buildBookSVG(materialId);
}
