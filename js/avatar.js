'use strict';

// ── 10 stadi di degrado del manoscritto beneventano ───────────────────────────
const MANUSCRIPT_STAGES = [
  { file: 'manoscritto01_perfette_condizioni.png',         label: 'Perfette condizioni'   },
  { file: 'manoscritto02_degrado_minimo.png',              label: 'Degrado minimo'        },
  { file: 'manoscritto03_degrado_leggero.png',             label: 'Degrado leggero'       },
  { file: 'manoscritto04_degrado_lieve.png',               label: 'Degrado lieve'         },
  { file: 'manoscritto05_degrado_moderato.png',            label: 'Degrado moderato'      },
  { file: 'manoscritto06_degrado_medio.png',               label: 'Degrado medio'         },
  { file: 'manoscritto07_degrado_forte.png',               label: 'Degrado forte'         },
  { file: 'manoscritto08_degrado_grave.png',               label: 'Degrado grave'         },
  { file: 'manoscritto09_quasi_totalmente_rovinato.png',   label: 'Quasi totalmente rovinato' },
  { file: 'manoscritto10_completamente_rovinato.png',      label: 'Completamente rovinato' }
];

function initBookAvatar(container) {
  if (!container) return;
  const stack = MANUSCRIPT_STAGES.map((s, i) => `
    <img class="ms-img" data-stage="${i}"
         src="assets/manuscripts/${s.file}"
         alt="${s.label}"
         style="opacity:${i === 0 ? 1 : 0}"
         loading="${i < 2 ? 'eager' : 'lazy'}" />
  `).join('');

  container.innerHTML = `
    <div class="ms-stack">
      ${stack}
      <div class="ms-caption" id="ms-caption">
        <span class="ms-caption-num" id="ms-stage-num">1 / 10</span>
        <span class="ms-caption-label" id="ms-stage-label">Perfette condizioni</span>
      </div>
    </div>
  `;
}

function updateBookAvatar(score, conditions, materialId) {
  // Map score 0–100 to a single stage 0–9 (one image per 10% band, no blending)
  const stageIdx = Math.max(0, Math.min(9, Math.floor(score / 10)));

  const imgs = document.querySelectorAll('#book-container .ms-img');
  imgs.forEach((img, i) => {
    img.style.opacity = (i === stageIdx) ? 1 : 0;
  });

  // Update caption
  const numEl = document.getElementById('ms-stage-num');
  const lblEl = document.getElementById('ms-stage-label');
  if (numEl) numEl.textContent = `${stageIdx + 1} / 10`;
  if (lblEl) lblEl.textContent = MANUSCRIPT_STAGES[stageIdx].label;

  // Slight extra tint based on extreme conditions, applied to the whole stack
  const stackEl = document.querySelector('#book-container .ms-stack');
  if (stackEl) {
    const moldExtra = calculateMoldRisk(conditions.temp, conditions.rh);
    const dryness   = conditions.rh < 35 ? (35 - conditions.rh) / 35 : 0;
    const hue       = -moldExtra * 6;
    const sat       = 1 + dryness * 0.10;
    stackEl.style.filter = `hue-rotate(${hue}deg) saturate(${sat})`;
  }
}

// Material change is a no-op now — the photographs always show the Beneventan
// manuscript. The selected material still influences the degradation model.
function rebuildBookAvatar(_materialId) {
  // intentionally empty
}
