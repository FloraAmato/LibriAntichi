'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Real Time Monitoring — dashboard di sensori simulati che derivano dal profilo
// ambientale della locazione corrente, con drift gaussiano e occasionali
// "incidenti" per testare gli allarmi.
// ─────────────────────────────────────────────────────────────────────────────

const monState = {
  manuscript: 'I-BV 38',
  location:   'vault',
  // Letture correnti (simulate) dei sensori
  sensors: {
    temp:      18,
    rh:        50,
    light:     30,
    so2:       0.5,
    nox:       1.2,
    o3:        0.8,
    co2:       420,
    pm25:      6
  },
  // Storico ultimi N campioni per il mini-grafico
  history: { temp: [], rh: [], deg: [] },
  alerts:   [],
  // Statistiche all'avvio
  startedAt: Date.now(),
  samples:   0,
  tickMs:    2500
};

// Soglie ISO 11799 / AICCM
const THRESHOLDS = {
  temp:  { min: 14, max: 22,  warnLow: 12, warnHigh: 24 },
  rh:    { min: 45, max: 55,  warnLow: 30, warnHigh: 65 },
  light: { max: 50,           warnMax: 200 },
  so2:   { max: 1.0,          warnMax: 3.0 },
  nox:   { max: 2.0,          warnMax: 5.0 },
  o3:    { max: 2.0,          warnMax: 5.0 },
  co2:   { max: 1000,         warnMax: 1500 },
  pm25:  { max: 15,           warnMax: 35 }
};

// Sensor configuration (label, unit, decimals, setpoint key, thresholds)
const SENSORS = [
  { id: 'temp',  label: 'Temperatura',          unit: '°C',    dec: 1, range: [-5, 45]  },
  { id: 'rh',    label: 'Umidità relativa',     unit: '%',     dec: 0, range: [0, 100]  },
  { id: 'light', label: 'Illuminamento',        unit: 'lux',   dec: 0, range: [0, 800]  },
  { id: 'so2',   label: 'SO₂ — Anidride solforosa', unit: 'µg/m³', dec: 1, range: [0, 15]   },
  { id: 'nox',   label: 'NOₓ — Ossidi di azoto',    unit: 'µg/m³', dec: 1, range: [0, 20]   },
  { id: 'o3',    label: 'O₃ — Ozono',           unit: 'µg/m³', dec: 1, range: [0, 20]   },
  { id: 'co2',   label: 'CO₂ — Anidride carbonica', unit: 'ppm', dec: 0, range: [350, 2500] },
  { id: 'pm25',  label: 'PM2.5 — Particolato',  unit: 'µg/m³', dec: 1, range: [0, 60]   }
];

// ── Init ─────────────────────────────────────────────────────────────────────
function initMonitoring() {
  populateLocationSelect();
  populateManuscriptSelect();
  buildSensorCards();
  bindControls();
  resetBaselines();
  startLiveLoop();
}

function populateLocationSelect() {
  const sel = document.getElementById('monLocation');
  if (!sel) return;
  Object.values(LOCATIONS).forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc.id;
    opt.textContent = `${loc.icon} ${loc.name}`;
    if (loc.id === monState.location) opt.selected = true;
    sel.appendChild(opt);
  });
}

function populateManuscriptSelect() {
  const sel = document.getElementById('monManuscript');
  if (!sel) return;
  Object.values(MANUSCRIPTS).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.id} — ${m.secolo}`;
    if (m.id === monState.manuscript) opt.selected = true;
    sel.appendChild(opt);
  });
}

function bindControls() {
  const locSel = document.getElementById('monLocation');
  const msSel  = document.getElementById('monManuscript');
  const incBtn = document.getElementById('btnIncident');
  if (locSel) locSel.addEventListener('change', e => { monState.location = e.target.value; resetBaselines(); });
  if (msSel)  msSel.addEventListener('change',  e => { monState.manuscript = e.target.value; updateMonitoringView(); });
  if (incBtn) incBtn.addEventListener('click', triggerIncident);
}

function resetBaselines() {
  const loc = LOCATIONS[monState.location];
  // Set sensor baselines from the location's defaults; gas levels scale with pollution
  monState.sensors.temp  = loc.defaultTemp;
  monState.sensors.rh    = loc.defaultRH;
  monState.sensors.light = loc.defaultLight;
  const p = loc.defaultPollution;
  monState.sensors.so2  = 0.3 + p * 0.4;
  monState.sensors.nox  = 0.5 + p * 0.8;
  monState.sensors.o3   = 0.4 + p * 0.7;
  monState.sensors.co2  = 420 + p * 40;
  monState.sensors.pm25 = 3 + p * 3;

  // Document the current location on the page
  const locName = document.getElementById('locDisplayName');
  const locDesc = document.getElementById('locDisplayDesc');
  if (locName) locName.textContent = loc.name;
  if (locDesc) locDesc.textContent = loc.description;
}

// ── Sensor cards ─────────────────────────────────────────────────────────────
function buildSensorCards() {
  const grid = document.getElementById('sensorGrid');
  if (!grid) return;
  grid.innerHTML = SENSORS.map(s => `
    <div class="sensor-card" data-sensor="${s.id}">
      <div class="sensor-head">
        <span class="sensor-label">${s.label}</span>
        <span class="sensor-status" id="status-${s.id}">OK</span>
      </div>
      <div class="sensor-value">
        <span id="val-${s.id}">—</span>
        <small>${s.unit}</small>
      </div>
      <div class="sensor-bar">
        <div class="sensor-bar-fill" id="bar-${s.id}"></div>
      </div>
      <div class="sensor-trend">
        <span id="trend-${s.id}" class="trend-arrow">·</span>
        <span id="delta-${s.id}" class="trend-delta">—</span>
      </div>
    </div>
  `).join('');
}

// ── Live loop ────────────────────────────────────────────────────────────────
let liveTimer = null;
let lastSensors = null;

function startLiveLoop() {
  if (liveTimer) clearInterval(liveTimer);
  liveTimer = setInterval(tick, monState.tickMs);
  tick(); // run once immediately
}

function tick() {
  lastSensors = { ...monState.sensors };
  applyDrift();
  updateMonitoringView();
  monState.samples += 1;
}

// Gaussian drift around the location's profile
function applyDrift() {
  const loc = LOCATIONS[monState.location];
  function drift(curr, base, sigma, vari) {
    // Random walk that gently regresses toward the baseline
    const target = base + (Math.random() - 0.5) * vari;
    const next   = curr * 0.85 + target * 0.15 + (Math.random() - 0.5) * sigma;
    return next;
  }
  monState.sensors.temp  = drift(monState.sensors.temp,  loc.defaultTemp,  0.2, loc.tempVariation || 1);
  monState.sensors.rh    = drift(monState.sensors.rh,    loc.defaultRH,    0.6, loc.rhVariation || 2);
  monState.sensors.light = Math.max(0, drift(monState.sensors.light, loc.defaultLight, 1.5, loc.defaultLight * 0.15));
  const p = loc.defaultPollution;
  monState.sensors.so2  = Math.max(0, drift(monState.sensors.so2,  0.3 + p * 0.4, 0.05, 0.2));
  monState.sensors.nox  = Math.max(0, drift(monState.sensors.nox,  0.5 + p * 0.8, 0.1,  0.3));
  monState.sensors.o3   = Math.max(0, drift(monState.sensors.o3,   0.4 + p * 0.7, 0.1,  0.3));
  monState.sensors.co2  = Math.max(380, drift(monState.sensors.co2, 420 + p * 40, 10, 30));
  monState.sensors.pm25 = Math.max(0, drift(monState.sensors.pm25, 3 + p * 3,   0.6, 2));
}

function triggerIncident() {
  // Pick a random sensor and push it well beyond its warning threshold
  const choices = ['temp', 'rh', 'light', 'so2', 'pm25'];
  const which = choices[Math.floor(Math.random() * choices.length)];
  switch (which) {
    case 'temp':  monState.sensors.temp  += (Math.random() < 0.5 ? -1 : 1) * 8; break;
    case 'rh':    monState.sensors.rh    = Math.min(98, monState.sensors.rh + 25); break;
    case 'light': monState.sensors.light = 350 + Math.random() * 300; break;
    case 'so2':   monState.sensors.so2   = 4 + Math.random() * 4; break;
    case 'pm25':  monState.sensors.pm25  = 30 + Math.random() * 20; break;
  }
  logAlert(`Incidente simulato: spike di ${SENSORS.find(s => s.id === which).label.toLowerCase()}`);
  updateMonitoringView();
}

// ── Status / threshold logic ─────────────────────────────────────────────────
function statusOf(id, value) {
  const t = THRESHOLDS[id];
  if (!t) return 'ok';
  if (id === 'temp' || id === 'rh') {
    if (value < t.warnLow || value > t.warnHigh) return 'bad';
    if (value < t.min     || value > t.max)      return 'warn';
    return 'ok';
  }
  if (value > t.warnMax) return 'bad';
  if (value > t.max)     return 'warn';
  return 'ok';
}

const STATUS_LABEL = { ok: 'OK', warn: 'ALLERTA', bad: 'CRITICO' };

function updateMonitoringView() {
  let okCount = 0, warnCount = 0, badCount = 0;

  SENSORS.forEach(s => {
    const v   = monState.sensors[s.id];
    const lvl = statusOf(s.id, v);
    if (lvl === 'ok') okCount++;
    else if (lvl === 'warn') { warnCount++; logAlertIfNew(s, lvl); }
    else { badCount++; logAlertIfNew(s, lvl); }

    const valEl    = document.getElementById('val-'    + s.id);
    const barEl    = document.getElementById('bar-'    + s.id);
    const statusEl = document.getElementById('status-' + s.id);
    const trendEl  = document.getElementById('trend-'  + s.id);
    const deltaEl  = document.getElementById('delta-'  + s.id);

    if (valEl) valEl.textContent = v.toFixed(s.dec);
    if (barEl) {
      const [lo, hi] = s.range;
      const pct = Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
      barEl.style.width = pct.toFixed(1) + '%';
      barEl.className = 'sensor-bar-fill bar-' + lvl;
    }
    if (statusEl) {
      statusEl.textContent = STATUS_LABEL[lvl];
      statusEl.className = 'sensor-status status-' + lvl;
    }
    if (lastSensors && trendEl && deltaEl) {
      const prev = lastSensors[s.id];
      const dv = v - prev;
      const arrow = dv > 0.01 ? '▲' : dv < -0.01 ? '▼' : '·';
      trendEl.textContent = arrow;
      trendEl.className = 'trend-arrow trend-' + (dv > 0.01 ? 'up' : dv < -0.01 ? 'down' : 'flat');
      const sign = dv > 0 ? '+' : '';
      deltaEl.textContent = sign + dv.toFixed(s.dec);
    }
  });

  // Global status banner
  const overallEl = document.getElementById('overallStatus');
  if (overallEl) {
    let cls = 'ok';
    if (badCount > 0)  cls = 'bad';
    else if (warnCount > 0) cls = 'warn';
    overallEl.className = 'mon-status status-' + cls;
    overallEl.textContent = (
      cls === 'ok'   ? `Tutti i ${okCount} sensori entro i limiti ISO 11799` :
      cls === 'warn' ? `${warnCount} sensore/i in allerta · ${badCount} critici` :
                       `${badCount} sensore/i critici · intervento richiesto`
    );
  }

  // Live degradation rate
  const cond = {
    temp:      monState.sensors.temp,
    rh:        monState.sensors.rh,
    light:     monState.sensors.light,
    pollution: pollutionFromGases()
  };
  const m = MANUSCRIPTS[monState.manuscript];
  const material = m ? m.support : 'parchment';
  const rate = calculateDegradationRate(cond, material);
  const annualRate = MATERIALS[material].baseYearlyRate * rate;
  const rateEl = document.getElementById('degRateValue');
  if (rateEl) rateEl.textContent = annualRate.toFixed(3);
  const multEl = document.getElementById('degRateMult');
  if (multEl) multEl.textContent = rate.toFixed(2) + '×';

  // Push to history (cap length)
  monState.history.temp.push(cond.temp);
  monState.history.rh.push(cond.rh);
  monState.history.deg.push(annualRate);
  if (monState.history.temp.length > 60) {
    monState.history.temp.shift();
    monState.history.rh.shift();
    monState.history.deg.shift();
  }
  drawLiveChart();

  // Last reading timestamp + uptime
  const tsEl = document.getElementById('lastReading');
  if (tsEl) tsEl.textContent = new Date().toLocaleTimeString('it-IT');
  const upEl = document.getElementById('uptimeSamples');
  if (upEl) upEl.textContent = monState.samples + ' campioni';
}

function pollutionFromGases() {
  // Normalize gas readings to the 0–10 pollution scale used by the model
  const s = monState.sensors;
  return Math.min(10,
    (s.so2 / 1.5) * 2 +
    (s.nox / 3.0) * 2 +
    (s.o3  / 3.0) * 1.5 +
    (s.pm25 / 15) * 2 +
    (s.co2 > 1000 ? (s.co2 - 1000) / 500 : 0)
  );
}

// ── Alerts log ──────────────────────────────────────────────────────────────
function logAlertIfNew(sensor, lvl) {
  // Avoid log spam: only log when the sensor *enters* the warn/bad state
  if (!lastSensors) return;
  const prevLvl = statusOf(sensor.id, lastSensors[sensor.id]);
  if (prevLvl !== lvl) {
    const v = monState.sensors[sensor.id];
    logAlert(`${sensor.label}: ${v.toFixed(sensor.dec)} ${sensor.unit} — ${STATUS_LABEL[lvl]}`, lvl);
  }
}

function logAlert(msg, lvl) {
  const time = new Date().toLocaleTimeString('it-IT');
  monState.alerts.unshift({ time, msg, lvl: lvl || 'warn' });
  if (monState.alerts.length > 12) monState.alerts.length = 12;
  const list = document.getElementById('alertList');
  if (!list) return;
  list.innerHTML = monState.alerts.map(a => `
    <li class="alert-${a.lvl}">
      <span class="alert-time">${a.time}</span>
      <span class="alert-msg">${a.msg}</span>
    </li>
  `).join('') || '<li class="alert-ok"><span class="alert-msg">Nessun evento registrato.</span></li>';
}

// ── Live mini-chart ──────────────────────────────────────────────────────────
let liveChartCtx = null;
function drawLiveChart() {
  const cvs = document.getElementById('liveChart');
  if (!cvs) return;
  if (!liveChartCtx) {
    const dpr = window.devicePixelRatio || 1;
    cvs.width  = cvs.clientWidth  * dpr;
    cvs.height = cvs.clientHeight * dpr;
    liveChartCtx = cvs.getContext('2d');
    liveChartCtx.scale(dpr, dpr);
  }
  const ctx = liveChartCtx;
  const W = cvs.clientWidth, H = cvs.clientHeight;
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#F8F6F4';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(168,37,62,0.08)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const y = (H / 4) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  drawSeries(ctx, monState.history.temp, '#A8253E', -5, 40, W, H, 2.4);
  drawSeries(ctx, monState.history.rh,   '#3B73B8', 0, 100, W, H, 2.0);

  // Legend
  ctx.fillStyle = '#A8253E'; ctx.fillRect(12, 12, 10, 4);
  ctx.fillStyle = '#1F1F1F'; ctx.font = '500 11px Inter, sans-serif';
  ctx.fillText('T (°C)', 28, 17);
  ctx.fillStyle = '#3B73B8'; ctx.fillRect(86, 12, 10, 4);
  ctx.fillStyle = '#1F1F1F';
  ctx.fillText('UR (%)', 102, 17);
}

function drawSeries(ctx, arr, color, lo, hi, W, H, lw) {
  if (arr.length < 2) return;
  ctx.beginPath();
  arr.forEach((v, i) => {
    const x = (i / 59) * W;
    const norm = (v - lo) / (hi - lo);
    const y = H - norm * (H - 6) - 3;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth   = lw;
  ctx.lineJoin    = 'round';
  ctx.stroke();
}

document.addEventListener('DOMContentLoaded', initMonitoring);
