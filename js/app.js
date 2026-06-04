'use strict';

// ── Manoscritti della Biblioteca capitolare di Benevento ──────────────────────
const MANUSCRIPTS = {
  'I-BV 21': {
    id: 'I-BV 21',
    rism: 'I-BV 21',
    secolo: 'XII (1101–1200)',
    centuryNum: 12,
    ageYears: 876, // calcolato su anno 2026, datazione ~1150
    repo: 'Biblioteca Capitolare di Benevento',
    support: 'parchment',
    note: 'Codice beneventano del XII secolo. Pergamena con notazione musicale beneventana; legatura medievale.',
    inks: 'Inchiostro ferro-gallico (acido)'
  },
  'I-BV 34': {
    id: 'I-BV 34',
    rism: 'I-BV 34',
    secolo: 'XII (1101–1200)',
    centuryNum: 12,
    ageYears: 876,
    repo: 'Biblioteca capitolare di Benevento',
    support: 'parchment',
    note: 'Manoscritto liturgico-musicale beneventano del XII secolo. Pergamena di pecora con miniature.',
    inks: 'Ferro-gallico, pigmenti minerali'
  },
  'I-BV 37': {
    id: 'I-BV 37',
    rism: 'I-BV 37',
    secolo: 'XI (1001–1100)',
    centuryNum: 11,
    ageYears: 976,
    repo: 'Biblioteca capitolare di Benevento',
    support: 'parchment',
    note: 'Codice dell\'XI secolo, testimone della tradizione scrittoria beneventana. Pergamena fine.',
    inks: 'Ferro-gallico'
  },
  'I-BV 38': {
    id: 'I-BV 38',
    rism: 'I-BV 38',
    secolo: 'XI (1001–1100)',
    centuryNum: 11,
    ageYears: 976,
    repo: 'Biblioteca capitolare di Benevento',
    support: 'parchment',
    note: 'Antico codice liturgico beneventano dell\'XI secolo. Importante testimone della notazione musicale ante-Guido d\'Arezzo.',
    inks: 'Ferro-gallico, oro per le iniziali'
  },
  'I-BV 39': {
    id: 'I-BV 39',
    rism: 'I-BV 39',
    secolo: 'XI (1001–1100)',
    centuryNum: 11,
    ageYears: 976,
    repo: 'Biblioteca capitolare di Benevento',
    support: 'parchment',
    note: 'Manoscritto musicale dell\'XI secolo della scuola beneventana. Pergamena di pecora, legatura rifatta.',
    inks: 'Ferro-gallico'
  }
};

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
      <span class="ms-card-row"><span class="ms-card-k">Datazione</span><span class="ms-card-v">${m.secolo}</span></span>
      <span class="ms-card-row"><span class="ms-card-k">Età stimata</span><span class="ms-card-v">${m.ageYears} anni</span></span>
      <span class="ms-card-row"><span class="ms-card-k">Supporto</span><span class="ms-card-v">${MATERIALS[m.support].name}</span></span>
      <span class="ms-card-row"><span class="ms-card-k">Repositorio</span><span class="ms-card-v">Bibl. capitolare di Benevento</span></span>
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

  // Compute score at the current simulation year
  const proj = projectDegradation(conditions, state.material, Math.max(state.years, 1));
  state.score = proj[proj.length - 1].score;

  // Update status chip in topbar
  updateStatusChip();

  // Update KPI overlay
  const kpiDmg  = document.getElementById('kpiDamage');
  const kpiYr   = document.getElementById('kpiYear');
  const kpiLife = document.getElementById('kpiLife');
  if (kpiDmg) kpiDmg.textContent = state.score.toFixed(1);
  if (kpiYr)  kpiYr.textContent  = Math.round(state.years);
  if (kpiLife) {
    const life = yearsToThreshold(conditions, state.material, 75);
    kpiLife.textContent =
      !isFinite(life) || life > 9999 ? '> 9999' : life > 999 ? '> 999' : Math.round(life);
  }

  // Update manuscript state badges
  updateManuscriptStateBadges();

  // Update book avatar (only on simulator page)
  if (document.getElementById('book-container')) {
    updateBookAvatar(state.score, conditions, state.material);
  }

  // Update chart
  const fullProj = projectDegradation(conditions, state.material, state.projectionYears);
  drawDegradationChart(fullProj, state.years, state.material);

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

function renderThresholds(conditions) {
  const cont = document.getElementById('thresholds-container');
  if (!cont) return;
  const thresholds = [
    { pct: 25, label: 'Degrado minore',       color: 'var(--warn)' },
    { pct: 50, label: 'Degrado moderato',     color: '#FF9800' },
    { pct: 75, label: 'Degrado grave',        color: 'var(--bad)' },
    { pct: 90, label: 'Perdita quasi totale', color: '#9C27B0' }
  ];
  cont.innerHTML = thresholds.map(t => {
    const y = yearsToThreshold(conditions, state.material, t.pct);
    const txt = !isFinite(y) ? '> 1000' : y > 999 ? '> 999' : y < 1 ? '< 1' : '~' + Math.round(y);
    return `
      <div class="threshold-row">
        <span class="threshold-dot" style="background:${t.color}"></span>
        <span class="threshold-label">${t.label} (${t.pct}%)</span>
        <span class="threshold-years" style="color:${t.color}">${txt} anni</span>
      </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', init);
