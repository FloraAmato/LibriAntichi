'use strict';

const state = {
  material: 'parchment',
  location: 'museum',
  weather:  'stable',
  temp:      18,
  rh:        50,
  light:     50,
  pollution: 0.8,
  years:     0,
  projectionYears: 200,
  score:     0
};

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  initBookAvatar(document.getElementById('book-container'));
  initChart('degradation-chart');

  populateSelect('location-select', LOCATIONS);
  populateMaterialSelect();
  populateWeatherGrid();
  initSliders();
  bindLocationChange();
  bindMaterialChange();

  // Set initial location description
  document.getElementById('location-desc').textContent = LOCATIONS[state.location].description;

  update();
}

function populateSelect(id, dataObj) {
  const sel = document.getElementById(id);
  if (!sel) return;
  Object.values(dataObj).forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `${item.icon || ''} ${item.name}`.trim();
    if (item.id === state[id === 'location-select' ? 'location' : 'material']) opt.selected = true;
    sel.appendChild(opt);
  });
}

function populateMaterialSelect() {
  const sel = document.getElementById('material-select');
  if (!sel) return;
  Object.values(MATERIALS).forEach(mat => {
    const opt = document.createElement('option');
    opt.value = mat.id;
    opt.textContent = mat.name;
    if (mat.id === state.material) opt.selected = true;
    sel.appendChild(opt);
  });
}

function populateWeatherGrid() {
  const grid = document.getElementById('weather-grid');
  if (!grid) return;
  Object.values(WEATHER).forEach(w => {
    const btn = document.createElement('button');
    btn.className = `weather-btn${w.id === state.weather ? ' active' : ''}`;
    btn.dataset.wid = w.id;
    btn.innerHTML = `<span class="wi">${w.icon}</span><span class="wn">${w.name}</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.weather = w.id;
      applyEnvironment();
    });
    grid.appendChild(btn);
  });
}

function initSliders() {
  // Bind each slider to state
  [
    ['temp-slider',      'temp-val',  'temp',      v => v + '°C'],
    ['rh-slider',        'rh-val',    'rh',        v => v + '%'],
    ['light-slider',     'light-val', 'light',     v => v + ' lux'],
    ['pollution-slider', 'poll-val',  'pollution', v => pollLabel(v)],
    ['time-slider',      'time-val',  'years',     v => v + ' anni']
  ].forEach(([sid, vid, key, fmt]) => {
    const slider = document.getElementById(sid);
    const display = document.getElementById(vid);
    if (!slider) return;
    slider.value = state[key];
    if (display) display.textContent = fmt(Math.round(state[key]));
    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      state[key] = val;
      if (display) display.textContent = fmt(Math.round(val));
      update();
    });
  });
}

function bindLocationChange() {
  const sel = document.getElementById('location-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    state.location = sel.value;
    document.getElementById('location-desc').textContent = LOCATIONS[state.location].description;
    applyEnvironment();
  });
}

function bindMaterialChange() {
  const sel = document.getElementById('material-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    state.material = sel.value;
    const mat = MATERIALS[state.material];
    document.getElementById('material-name-display').textContent = mat.nameIT;
    document.getElementById('material-desc-display').textContent = mat.description;
    document.getElementById('opt-temp').textContent = `${mat.optimalTemp - 2}–${mat.optimalTemp + 2}°C`;
    document.getElementById('opt-rh').textContent   = `${mat.rhMin}–${mat.rhMax}%`;
    // Rebuild avatar for new material
    rebuildBookAvatar(state.material);
    update();
  });
}

// ── Environment helpers ────────────────────────────────────────────────────────
function applyEnvironment() {
  const loc = LOCATIONS[state.location];
  const wx  = WEATHER[state.weather];

  state.temp      = clamp(loc.defaultTemp      + wx.tempMod, -5, 50);
  state.rh        = clamp(loc.defaultRH        + wx.rhMod,   10, 98);
  state.light     = clamp(Math.round(loc.defaultLight * wx.lightMod), 0, 1000);
  state.pollution = clamp(loc.defaultPollution + wx.pollMod, 0, 10);

  setSlider('temp-slider',      'temp-val',  state.temp,       v => v + '°C');
  setSlider('rh-slider',        'rh-val',    state.rh,         v => v + '%');
  setSlider('light-slider',     'light-val', state.light,      v => v + ' lux');
  setSlider('pollution-slider', 'poll-val',  state.pollution,  v => pollLabel(v));

  update();
}

function setSlider(sid, vid, val, fmt) {
  const s = document.getElementById(sid);
  const d = document.getElementById(vid);
  if (s) s.value = Math.round(val);
  if (d) d.textContent = fmt(Math.round(val));
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function pollLabel(v) {
  const labels = ['Purissima','Eccellente','Buona','Moderata','Elevata',
                  'Alta','Molto Alta','Grave','Pericolosa','Critica','Estrema'];
  return labels[Math.min(10, Math.round(v))] || v.toFixed(1);
}

// ── Main update ───────────────────────────────────────────────────────────────
function update() {
  const conditions = { temp: state.temp, rh: state.rh, light: state.light, pollution: state.pollution };

  // Calculate score at current year
  const proj = projectDegradation(conditions, state.material, Math.max(state.years, 1));
  state.score = proj[proj.length - 1].score;

  // Header badge
  const ds = getDegradationState(state.score);
  const badge = document.getElementById('degradation-badge');
  if (badge) {
    badge.style.borderColor = ds.color + '88';
    badge.style.color       = ds.color;
  }
  setText('badge-label',  ds.label);
  setText('badge-score',  state.score.toFixed(1) + '%');
  setText('badge-desc',   ds.description);

  // Condition bars
  setBar('bar-structural',  Math.max(0, 100 - state.score * 0.90));
  setBar('bar-legibility',  Math.max(0, 100 - state.score * 1.10));
  setBar('bar-decoration',  Math.max(0, 100 - state.score * 1.25));

  // Avatar
  updateBookAvatar(state.score, conditions, state.material);

  // Chart
  const fullProj = projectDegradation(conditions, state.material, state.projectionYears);
  drawDegradationChart(fullProj, state.years, state.material);

  // Risk assessment
  renderRisks(getRiskAssessment(conditions, state.material));

  // Time-to-threshold table
  renderThresholds(conditions);

  // Time display text
  if (state.years > 0) {
    const ds = getDegradationState(state.score);
    setText('time-display', `Dopo ${state.years} anni: stato "${ds.label}" — degrado ${state.score.toFixed(1)}%`);
  } else {
    setText('time-display', 'Anno zero — stato attuale del libro');
  }

  // Live environment readout
  updateEnvReadout(conditions);
}

function setText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

function setBar(id, pct) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width = pct.toFixed(1) + '%';
  el.style.backgroundColor = pct > 60 ? '#4CAF50' : pct > 30 ? '#FFC107' : '#F44336';
  const pctId = id.replace('bar-', 'pct-');
  const pctEl = document.getElementById(pctId);
  if (pctEl) pctEl.textContent = pct.toFixed(0) + '%';
}

function renderRisks(risks) {
  const container = document.getElementById('risk-container');
  if (!container) return;
  container.innerHTML = risks.map(r => `
    <div class="risk-card risk-${r.type}">
      <div class="risk-header">
        <span class="risk-dot"></span>
        <strong>${r.category}</strong>
      </div>
      <p>${r.message}</p>
    </div>
  `).join('');
}

function renderThresholds(conditions) {
  const container = document.getElementById('thresholds-container');
  if (!container) return;
  const thresholds = [
    { pct: 25, label: 'Degrado minore',     color: '#FFC107' },
    { pct: 50, label: 'Degrado moderato',   color: '#FF9800' },
    { pct: 75, label: 'Degrado grave',      color: '#F44336' },
    { pct: 90, label: 'Perdita quasi totale', color: '#9C27B0' }
  ];
  container.innerHTML = thresholds.map(t => {
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

function updateEnvReadout(c) {
  const moldRisk = calculateMoldRisk(c.temp, c.rh);
  const rrRisk   = calculateRedRotRisk(state.material, c.pollution, c.rh);
  const insRisk  = calculateInsectRisk(c.temp, c.rh);
  const rate     = calculateDegradationRate(c, state.material);
  const mat      = MATERIALS[state.material];
  const annRate  = (mat.baseYearlyRate * rate).toFixed(3);

  setText('readout-rate',  annRate + '%/anno');
  setText('readout-mold',  (moldRisk * 100).toFixed(0) + '%');
  setText('readout-rr',    (rrRisk   * 100).toFixed(0) + '%');
  setText('readout-ins',   (insRisk  * 100).toFixed(0) + '%');
  setText('readout-mult',  rate.toFixed(1) + '×');
}

document.addEventListener('DOMContentLoaded', init);
