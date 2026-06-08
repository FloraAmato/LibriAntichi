'use strict';

// MANUSCRIPTS è definito in model.js (condiviso fra tutte le pagine).

// ── App state ────────────────────────────────────────────────────────────────
const state = {
  manuscript: 'I-BV 38',
  material:   'parchment',
  location:   'vault',
  weather:    'stable',
  temp:        18,
  rh:          50,
  light:       30,
  pollution:   1,
  years:       30,
  projectionYears: 200,
  score:       0,
  animTimer:   null
};

// ── Init ─────────────────────────────────────────────────────────────────────
function init() {
  // Page identity: 'manoscritti' (real aged codices) | 'simulatore' (fresh
  // simulated book) — drives whether the manuscript age is used as baseline.
  state.page = (document.body && document.body.dataset.page) || 'simulatore';

  const bookContainer = document.getElementById('book-container');
  if (bookContainer) initBookAvatar(bookContainer);
  initChart('degradation-chart');

  populateManuscripts();
  populateManuscriptGrid();
  populateWeatherGrid();
  bindLocationButtons();
  bindSliders();
  bindTimeControls();

  applyManuscript(state.manuscript);
  updateStageAtmosphere();
  update();
}

// On the Manoscritti page the selected real codex carries its own age, so the
// degradation already accumulated over its centuries of life becomes the
// baseline. On the Simulatore page the book is a fresh, hypothetical volume
// (baseline age = 0) that we watch degrade from new.
function getBaselineAge() {
  if (state.page === 'manoscritti') {
    const m = MANUSCRIPTS[state.manuscript];
    return m ? m.ageYears : 0;
  }
  return 0;
}

function getEffectiveYears() {
  return getBaselineAge() + state.years;
}

// ── Manoscritti ──────────────────────────────────────────────────────────────
function populateManuscripts() {
  const sel = document.getElementById('selManuscript');
  if (!sel) return;
  Object.values(MANUSCRIPTS).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.id} — ${m.secolo}`;
    if (m.id === state.manuscript) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', e => applyManuscript(e.target.value));
}

function populateManuscriptGrid() {
  const grid = document.getElementById('manuGrid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.values(MANUSCRIPTS).forEach(m => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `ms-card${m.id === state.manuscript ? ' on' : ''}`;
    card.dataset.id = m.id;
    card.innerHTML = `
      <span class="ms-card-id">${m.id}</span>
      <span class="ms-card-sub">${m.secolo} · ${MATERIALS[m.support].name}</span>
      <span class="ms-card-rows">
        <span class="ms-card-row"><span class="ms-card-k">Identificativo RISM</span><span class="ms-card-v">${m.rism}</span></span>
        <span class="ms-card-row"><span class="ms-card-k">Datazione</span><span class="ms-card-v">${m.secolo}</span></span>
        <span class="ms-card-row"><span class="ms-card-k">Età stimata</span><span class="ms-card-v">${m.ageYears} anni</span></span>
        <span class="ms-card-row"><span class="ms-card-k">Supporto</span><span class="ms-card-v">${MATERIALS[m.support].name}</span></span>
        <span class="ms-card-row"><span class="ms-card-k">Inchiostri</span><span class="ms-card-v">${m.inks}</span></span>
        <span class="ms-card-row"><span class="ms-card-k">Repositorio</span><span class="ms-card-v">${m.repo}</span></span>
      </span>
      <span class="ms-card-note">${m.note}</span>
      <span class="ms-card-cta">Seleziona per la simulazione →</span>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('#manuGrid .ms-card').forEach(c => c.classList.remove('on'));
      card.classList.add('on');
      // Sync the dropdown if present
      const sel = document.getElementById('selManuscript');
      if (sel) sel.value = m.id;
      applyManuscript(m.id);
    });
    grid.appendChild(card);
  });
}

function applyManuscript(id) {
  state.manuscript = id;
  const m = MANUSCRIPTS[id];
  if (!m) return;

  // Auto-set material based on the manuscript's known support
  state.material = m.support;
  rebuildBookAvatar(state.material);

  // Keep grid and dropdown in sync
  document.querySelectorAll('#manuGrid .ms-card').forEach(c => {
    c.classList.toggle('on', c.dataset.id === id);
  });
  const sel = document.getElementById('selManuscript');
  if (sel && sel.value !== id) sel.value = id;

  // Render manuscript card (VoH layout: pairs of label/value with red bullets)
  const card = document.getElementById('manuCard');
  if (!card) { update(); return; }
  card.innerHTML = `
    <div class="manu-row">
      <div>
        <span class="manu-k">Manoscritto</span>
        <span class="manu-v link">${m.id}</span>
      </div>
      <div>
        <span class="manu-k">Identificativo RISM</span>
        <span class="manu-v">${m.rism}</span>
      </div>
      <div>
        <span class="manu-k">Datazione</span>
        <span class="manu-v">${m.secolo}</span>
      </div>
      <div>
        <span class="manu-k">Età stimata</span>
        <span class="manu-v">${m.ageYears} anni</span>
      </div>
      <div>
        <span class="manu-k">Repositorio</span>
        <span class="manu-v">${m.repo}</span>
      </div>
      <div>
        <span class="manu-k">Supporto</span>
        <span class="manu-v">${MATERIALS[m.support].name}</span>
      </div>
    </div>
    <div class="manu-state" id="manuState"></div>
    <p class="manu-note">${m.note}</p>
  `;

  update();
}

// ── Location buttons ─────────────────────────────────────────────────────────
function bindLocationButtons() {
  document.querySelectorAll('#locGrid .loc').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#locGrid .loc').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      state.location = btn.dataset.loc;
      updateStageAtmosphere();
      applyEnvironment();
    });
  });
}

function updateStageAtmosphere() {
  const stage = document.getElementById('stage-canvas');
  const tag   = document.getElementById('stage-tag');
  const loc   = LOCATIONS[state.location];
  if (stage) stage.className = 'stage-canvas loc-' + state.location;
  if (tag)   tag.textContent = `${loc.icon} ${loc.name}`;
  const desc = document.getElementById('loc-desc');
  if (desc) desc.textContent = loc.description;
}

// ── Sliders ──────────────────────────────────────────────────────────────────
function bindSliders() {
  const map = [
    { sid: 'tempS',  vid: 'tempV',  key: 'temp' },
    { sid: 'rhS',    vid: 'rhV',    key: 'rh' },
    { sid: 'lightS', vid: 'lightV', key: 'light' },
    { sid: 'pollS',  vid: 'pollV',  key: 'pollution' }
  ];
  map.forEach(({ sid, vid, key }) => {
    const sl = document.getElementById(sid);
    const v  = document.getElementById(vid);
    sl.value = state[key];
    if (v) v.textContent = Math.round(state[key]);
    sl.addEventListener('input', () => {
      const val = parseFloat(sl.value);
      state[key] = val;
      if (v) v.textContent = Math.round(val);
      update();
    });
  });

  // Time slider
  const ts = document.getElementById('timeSlider');
  const to = document.getElementById('timeOut');
  ts.value = state.years;
  if (to) to.textContent = state.years + ' anni';
  ts.addEventListener('input', () => {
    state.years = parseFloat(ts.value);
    if (to) to.textContent = Math.round(state.years) + ' anni';
    update();
  });
}

// ── Time controls ────────────────────────────────────────────────────────────
function bindTimeControls() {
  const play  = document.getElementById('btnPlay');
  const reset = document.getElementById('btnReset');
  if (play)  play.addEventListener('click', toggleAnimation);
  if (reset) reset.addEventListener('click', resetTime);
}

function setPlayBtn(playing) {
  const btn = document.getElementById('btnPlay');
  if (!btn) return;
  btn.classList.toggle('playing', playing);
  btn.textContent = playing ? '⏸ Pausa' : '▶ Simula nel tempo';
}

function syncTimeWidgets() {
  const ts = document.getElementById('timeSlider');
  const to = document.getElementById('timeOut');
  if (ts) ts.value = state.years;
  if (to) to.textContent = Math.round(state.years) + ' anni';
}

function toggleAnimation() {
  if (state.animTimer) {
    clearInterval(state.animTimer);
    state.animTimer = null;
    setPlayBtn(false);
    return;
  }
  setPlayBtn(true);
  state.years = 0;
  state.animTimer = setInterval(() => {
    state.years += 2;
    if (state.years > 200) {
      clearInterval(state.animTimer);
      state.animTimer = null;
      setPlayBtn(false);
    }
    syncTimeWidgets();
    update();
  }, 90);
}

function resetTime() {
  if (state.animTimer) { clearInterval(state.animTimer); state.animTimer = null; }
  setPlayBtn(false);
  state.years = 0;
  syncTimeWidgets();
  update();
}

// ── Weather ──────────────────────────────────────────────────────────────────
function populateWeatherGrid() {
  const grid = document.getElementById('weather-grid');
  if (!grid) return;
  Object.values(WEATHER).forEach(w => {
    const btn = document.createElement('button');
    btn.className = `weather-btn${w.id === state.weather ? ' active' : ''}`;
    btn.dataset.wid = w.id;
    btn.innerHTML = `<span class="wi">${w.icon}</span><span>${w.name}</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.weather = w.id;
      applyEnvironment();
    });
    grid.appendChild(btn);
  });
}

function applyEnvironment() {
  const loc = LOCATIONS[state.location];
  const wx  = WEATHER[state.weather];
  state.temp      = clamp(loc.defaultTemp      + wx.tempMod, -5, 50);
  state.rh        = clamp(loc.defaultRH        + wx.rhMod,   10, 98);
  state.light     = clamp(Math.round(loc.defaultLight * wx.lightMod), 0, 1000);
  state.pollution = clamp(loc.defaultPollution + wx.pollMod, 0, 10);

  setSlider('tempS',  'tempV',  state.temp);
  setSlider('rhS',    'rhV',    state.rh);
  setSlider('lightS', 'lightV', state.light);
  setSlider('pollS',  'pollV',  state.pollution.toFixed(1));

  update();
}

function setSlider(sid, vid, val) {
  const s = document.getElementById(sid);
  const v = document.getElementById(vid);
  if (s) s.value = val;
  if (v) v.textContent = typeof val === 'number' ? Math.round(val) : val;
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

// ── Main update ──────────────────────────────────────────────────────────────
function update() {
  const conditions = { temp: state.temp, rh: state.rh, light: state.light, pollution: state.pollution };

  // Effective exposure = manuscript age (baseline) + projection horizon.
  // This is what makes the simulation depend on the selected codex.
  const baseAge  = getBaselineAge();
  const effYears = baseAge + state.years;

  const proj = projectDegradation(conditions, state.material, Math.max(effYears, 1));
  state.score = proj[proj.length - 1].score;

  // Update status chip in topbar
  updateStatusChip();

  // Update KPIs
  const kpiDmg  = document.getElementById('kpiDamage');
  const kpiYr   = document.getElementById('kpiYear');
  const kpiLife = document.getElementById('kpiLife');
  if (kpiDmg) kpiDmg.textContent = state.score.toFixed(1);
  if (kpiYr)  kpiYr.textContent  = Math.round(state.page === 'manoscritti' ? effYears : state.years);
  if (kpiLife) {
    const t75      = yearsToThreshold(conditions, state.material, 75);
    const residual = isFinite(t75) ? Math.max(0, t75 - effYears) : Infinity;
    kpiLife.textContent =
      !isFinite(residual) || residual > 9999 ? '> 9999' : residual > 999 ? '> 999' : Math.round(residual);
  }

  // Manuscript label on the simulation card (Manoscritti page)
  const simLbl = document.getElementById('simManuscriptLabel');
  if (simLbl) {
    const m = MANUSCRIPTS[state.manuscript];
    simLbl.textContent = m
      ? `${m.id} · ${m.ageYears} anni · ${MATERIALS[m.support].name}`
      : '';
  }

  // Update manuscript state badges
  updateManuscriptStateBadges();

  // Update book avatar (only on simulator page)
  if (document.getElementById('book-container')) {
    updateBookAvatar(state.score, conditions, state.material);
  }

  // Update chart — span the full life of the volume so the current position
  // (the vertical marker) always sits within the plotted range.
  const chartSpan = baseAge + Math.max(state.projectionYears, state.years + 20);
  const fullProj  = projectDegradation(conditions, state.material, chartSpan);
  drawDegradationChart(fullProj, effYears, state.material);

  // Update material/structural risk factors
  renderChemicalGauge(conditions);
  renderStructuralIndicators(conditions);

  // Update biological risk factors
  renderBiologicalGauges(conditions);

  // Update prediction list
  renderPredictions(conditions);

  // Update thresholds
  renderThresholds(conditions);
}

// ── Risk-factor renderers ─────────────────────────────────────────────────────
const SEV_LABELS = ['Assente', 'Lieve', 'Moderato', 'Grave'];

const STRUCT_CATS = [
  { key: 'deformazioni', label: 'Deformazioni' },
  { key: 'lacerazioni',  label: 'Lacerazioni' },
  { key: 'fori',         label: 'Fori' },
  { key: 'fragilita',    label: 'Fragilità' },
  { key: 'alterazioni',  label: 'Alterazioni cromatiche' }
];

function gaugeLabel(v01) {
  if (v01 < 0.20) return { txt: 'Basso',    lvl: 0 };
  if (v01 < 0.45) return { txt: 'Lieve',    lvl: 1 };
  if (v01 < 0.70) return { txt: 'Moderato', lvl: 2 };
  return                  { txt: 'Grave',    lvl: 3 };
}

const GAUGE_COLORS = ['#5B8A4A', '#B8870F', '#C68A2A', '#C44536'];

function paintGauge(fillEl, labelEl, v01) {
  const lbl = gaugeLabel(v01);
  if (fillEl) {
    fillEl.style.width = (v01 * 100).toFixed(1) + '%';
    fillEl.style.background = GAUGE_COLORS[lbl.lvl];
  }
  if (labelEl) {
    labelEl.textContent = lbl.txt;
    labelEl.className = 'risk-level lvl-' + lbl.lvl;
  }
}

function renderChemicalGauge(conditions) {
  const v = getChemicalDegradationLevel(conditions, state.material, state.score);
  paintGauge(document.getElementById('chemGaugeFill'),
             document.getElementById('chemLevelLabel'),
             v);
}

function renderStructuralIndicators(conditions) {
  const cont = document.getElementById('structuralList');
  if (!cont) return;
  cont.innerHTML = STRUCT_CATS.map(cat => {
    const sev = getStructuralSeverity(cat.key, state.score, conditions, state.material);
    const seg = SEV_LABELS.map((label, i) =>
      `<button class="${i === sev ? `on sev-${sev}` : ''}" type="button">${label}</button>`
    ).join('');
    return `
      <div class="seg-row">
        <span class="seg-label">${cat.label}</span>
        <div class="seg-control">${seg}</div>
      </div>
    `;
  }).join('');
}

function renderBiologicalGauges(conditions) {
  const moldR = calculateMoldRisk(conditions.temp, conditions.rh);
  const insR  = getBrimblecombeInsectRisk(conditions.temp, conditions.rh);
  paintGauge(document.getElementById('moldGaugeFill'),
             document.getElementById('moldLevelLabel'),
             moldR);
  paintGauge(document.getElementById('insectGaugeFill'),
             document.getElementById('insectLevelLabel'),
             insR);
}

function updateStatusChip() {
  const dot  = document.getElementById('statusDot');
  const txt  = document.getElementById('statusText');
  const ds   = getDegradationState(state.score);
  let cls = 'good';
  if (state.score > 45) cls = 'bad';
  else if (state.score > 20) cls = 'warn';

  if (dot) { dot.classList.remove('warn', 'bad'); if (cls !== 'good') dot.classList.add(cls); }
  if (txt) txt.textContent = ds.label;
}

function updateManuscriptStateBadges() {
  const m = MANUSCRIPTS[state.manuscript];
  if (!m) return;
  const cont = document.getElementById('manuState');
  if (!cont) return;

  const moldRisk = calculateMoldRisk(state.temp, state.rh);
  const rrRisk   = calculateRedRotRisk(state.material, state.pollution, state.rh);

  const badges = [];
  // Conservation status badge
  if (state.score < 20) badges.push({ cls: 'ok',   text: '✓ Stato accettabile' });
  else if (state.score < 45) badges.push({ cls: 'warn', text: '⚠ Restauro consigliato' });
  else badges.push({ cls: 'bad', text: '✕ Intervento urgente' });

  // Mold badge
  if (moldRisk > 0.4) badges.push({ cls: 'bad', text: `⚠ Muffe ${Math.round(moldRisk * 100)}%` });
  else if (moldRisk > 0.15) badges.push({ cls: 'warn', text: 'Vigilanza muffe' });

  // Iron-gall ink corrosion (typical of XI-XII century Beneventan manuscripts)
  if (state.rh > 60) badges.push({ cls: 'warn', text: 'Corrosione inchiostro ferro-gallico' });

  cont.innerHTML = badges.map(b => `<span class="badge ${b.cls}">${b.text}</span>`).join('');
}

function renderPredictions(conditions) {
  const list = document.getElementById('predList');
  if (!list) return;

  const risks = getRiskAssessment(conditions, state.material);
  const items = risks.map(r => {
    let cls = 'good';
    if (r.type === 'critical' || r.type === 'high') cls = 'bad';
    else if (r.type === 'medium' || r.type === 'low') cls = 'warn';

    const ico = cls === 'good' ? '✓' : cls === 'warn' ? '!' : '×';
    return `<li class="${cls}"><span class="ico">${ico}</span><span><b>${r.category}</b> — ${r.message}</span></li>`;
  });

  list.innerHTML = items.join('');
}

// Per-level meaning + recommended conservation strategy
const THRESHOLD_INFO = [
  {
    pct: 25, label: 'Degrado minore', color: '#C68A2A',
    meaning: 'Primi segni di invecchiamento: lieve ingiallimento e modeste variazioni cromatiche. Il supporto è ancora flessibile e il testo perfettamente leggibile. Nessun danno strutturale.',
    action: 'Monitoraggio ambientale di routine. Mantenere T 16–18 °C e UR 50 ± 5 %, illuminamento ≤ 50 lux con filtri UV. Custodia in contenitori conservativi a pH neutro, spolveratura controllata. Nessun intervento di restauro necessario.'
  },
  {
    pct: 50, label: 'Degrado moderato', color: '#E0852A',
    meaning: 'Degrado visibile: ingiallimento diffuso, comparsa di foxing, irrigidimento e deformazione (cockling) della pergamena, fragilità ai margini. La leggibilità inizia a essere localmente compromessa.',
    action: 'Intervento conservativo programmato. Stabilizzare con urgenza il microclima e ridurre luce e inquinanti. Far valutare il volume da un conservatore-restauratore e digitalizzarlo per limitarne la manipolazione diretta.'
  },
  {
    pct: 75, label: 'Degrado grave', color: '#C44536',
    meaning: 'Danno strutturale significativo: lacerazioni, perdita di materia, distacco di strati, corrosione del supporto da parte dell\'inchiostro ferro-gallico e alterazioni cromatiche marcate. Leggibilità compromessa in più punti.',
    action: 'Restauro urgente in laboratorio specializzato: deacidificazione e consolidamento del supporto, trattamento dell\'inchiostro ferro-gallico (es. fitato di calcio), eventuale velatura. Conservazione in atmosfera controllata; accesso consentito solo tramite riproduzione digitale.'
  },
  {
    pct: 90, label: 'Perdita quasi totale', color: '#7A2F9E',
    meaning: 'Perdita irreversibile imminente: disgregazione del supporto, ampie lacune, mineralizzazione e testo in gran parte illeggibile. Il manufatto rischia la perdita definitiva.',
    action: 'Misure d\'emergenza. Isolamento in microclima inerte (teca anossica o atmosfera modificata), manipolazione vietata, documentazione fotografica e digitale completa e immediata. Intervento di un\'équipe di restauro d\'urgenza con eventuale incapsulamento dei frammenti.'
  }
];

function renderThresholds(conditions) {
  const cont = document.getElementById('thresholds-container');
  if (!cont) return;
  const effYears = getEffectiveYears();

  cont.innerHTML = THRESHOLD_INFO.map(t => {
    const y         = yearsToThreshold(conditions, state.material, t.pct);
    const reached   = isFinite(y) && effYears >= y;
    const remaining = isFinite(y) ? y - effYears : Infinity;

    let when;
    if (reached) {
      when = 'già raggiunto';
    } else if (!isFinite(remaining) || remaining > 999) {
      when = 'oltre 999 anni';
    } else {
      when = 'tra ~' + Math.round(remaining) + ' anni';
    }

    return `
      <div class="threshold-block${reached ? ' reached' : ''}" style="--lvl:${t.color}">
        <div class="threshold-head">
          <span class="threshold-dot" style="background:${t.color}"></span>
          <span class="threshold-title">${t.label} <span class="threshold-pct">${t.pct}%</span></span>
          <span class="threshold-years">${when}</span>
        </div>
        <div class="threshold-detail">
          <p><span class="td-tag td-mean">Cosa significa</span> ${t.meaning}</p>
          <p><span class="td-tag td-act">Cosa fare</span> ${t.action}</p>
        </div>
      </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', init);
