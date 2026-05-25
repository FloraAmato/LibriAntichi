import { createBookScene } from './book3d.js';
import {
  LOCATIONS, MATERIALS, BINDINGS, INKS,
  damageAt, lifeRemaining, predictions, combineMaterial
} from './degradation.js';

// ===== Stato applicazione =====
const ui = {
  // ambiente
  temp: 18, rh: 50, light: 30, pollution: 5, cycle: 2,
  pest: false, handling: false,
  // materiali
  support: 'pergamena',
  binding: 'cuoio',
  ink: 'ferro-gallico',
  age: 400,
  // tempo
  years: 0,
  location: 'caveau',
  playing: false
};

// ===== Elementi DOM =====
const $ = (id) => document.getElementById(id);
const els = {
  tempS: $('tempS'), tempV: $('tempV'),
  rhS: $('rhS'), rhV: $('rhV'),
  lightS: $('lightS'), lightV: $('lightV'),
  pollS: $('pollS'), pollV: $('pollV'),
  cycleS: $('cycleS'), cycleV: $('cycleV'),
  chkPest: $('chkPest'), chkHandling: $('chkHandling'),
  selSupport: $('selSupport'), selBinding: $('selBinding'),
  selInk: $('selInk'), selAge: $('selAge'),
  timeSlider: $('timeSlider'), timeOut: $('timeOut'),
  locGrid: $('locGrid'),
  kpiDamage: $('kpiDamage'), kpiLife: $('kpiLife'), kpiYear: $('kpiYear'),
  predList: $('predList'),
  statusDot: $('statusDot'), statusText: $('statusText'),
  btnPlay: $('btnPlay'), btnReset: $('btnReset'),
  canvas: $('bookCanvas')
};

// ===== Scena 3D =====
const book = createBookScene(els.canvas);

// ===== Wiring sliders =====
function bindSlider(input, key, display, formatter = (v) => v) {
  input.addEventListener('input', () => {
    ui[key] = parseFloat(input.value);
    display.textContent = formatter(ui[key]);
    refresh();
  });
}
bindSlider(els.tempS, 'temp', els.tempV, (v) => v.toFixed(1));
bindSlider(els.rhS, 'rh', els.rhV, (v) => v.toFixed(0));
bindSlider(els.lightS, 'light', els.lightV, (v) => v.toFixed(0));
bindSlider(els.pollS, 'pollution', els.pollV, (v) => v.toFixed(0));
bindSlider(els.cycleS, 'cycle', els.cycleV, (v) => v.toFixed(1));

els.chkPest.addEventListener('change', () => { ui.pest = els.chkPest.checked; refresh(); });
els.chkHandling.addEventListener('change', () => { ui.handling = els.chkHandling.checked; refresh(); });

els.selSupport.addEventListener('change', () => { ui.support = els.selSupport.value; refresh(); });
els.selBinding.addEventListener('change', () => { ui.binding = els.selBinding.value; refresh(); });
els.selInk.addEventListener('change', () => { ui.ink = els.selInk.value; refresh(); });
els.selAge.addEventListener('change', () => { ui.age = parseInt(els.selAge.value, 10); refresh(); });

els.timeSlider.addEventListener('input', () => {
  ui.years = parseFloat(els.timeSlider.value);
  els.timeOut.textContent = `${ui.years} anni`;
  refresh();
});

// Selezione locazione
els.locGrid.querySelectorAll('.loc').forEach(btn => {
  btn.addEventListener('click', () => {
    els.locGrid.querySelectorAll('.loc').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const key = btn.dataset.loc;
    ui.location = key;
    const L = LOCATIONS[key];
    // sincronizza slider
    setSlider(els.tempS, els.tempV, 'temp', L.temp);
    setSlider(els.rhS, els.rhV, 'rh', L.rh);
    setSlider(els.lightS, els.lightV, 'light', L.light);
    setSlider(els.pollS, els.pollV, 'pollution', L.pollution);
    setSlider(els.cycleS, els.cycleV, 'cycle', L.cycle);
    refresh();
  });
});

function setSlider(input, display, key, value) {
  input.value = value;
  ui[key] = value;
  display.textContent = Number.isInteger(value) ? value : value.toFixed(1);
}

// Play / Reset
els.btnReset.addEventListener('click', () => {
  ui.years = 0; els.timeSlider.value = 0; els.timeOut.textContent = '0 anni';
  ui.playing = false; els.btnPlay.textContent = '▶ Simula nel tempo';
  refresh();
});

els.btnPlay.addEventListener('click', () => {
  ui.playing = !ui.playing;
  els.btnPlay.textContent = ui.playing ? '❚❚ Pausa' : '▶ Simula nel tempo';
  if (ui.playing) tickTime();
});

function tickTime() {
  if (!ui.playing) return;
  ui.years = Math.min(200, ui.years + 0.6);
  els.timeSlider.value = ui.years;
  els.timeOut.textContent = `${ui.years.toFixed(0)} anni`;
  refresh();
  if (ui.years >= 200) { ui.playing = false; els.btnPlay.textContent = '▶ Simula nel tempo'; return; }
  setTimeout(tickTime, 80);
}

// ===== Refresh principale =====
function refresh() {
  const mat = combineMaterial(ui.support, ui.binding, ui.ink);
  const env = {
    temp: ui.temp, rh: ui.rh, light: ui.light,
    pollution: ui.pollution, cycle: ui.cycle,
    pest: ui.pest, handling: ui.handling
  };

  const d = damageAt(env, mat, ui.years, ui.age);
  const life = lifeRemaining(env, mat, ui.age);

  // KPI
  els.kpiDamage.textContent = d.value.toFixed(0);
  els.kpiLife.textContent = life > 999 ? '∞' : Math.round(life);
  els.kpiYear.textContent = ui.years.toFixed(0);

  // Avatar 3D
  book.setDamage(d.value / 100);

  // Stato globale
  let level = 'good', label = 'Condizioni ottimali';
  if (d.value > 65 || life < 25) { level = 'bad';  label = 'Degrado severo · intervento urgente'; }
  else if (d.value > 35 || life < 75) { level = 'warn'; label = 'Degrado moderato · monitorare'; }
  els.statusDot.className = 'dot ' + (level === 'good' ? '' : level);
  els.statusText.textContent = label;

  // Predizioni
  const preds = predictions(env, mat, ui.age);
  els.predList.innerHTML = preds.map(p => `
    <li class="${p.level}">
      <span class="ico">${p.level === 'good' ? '✓' : p.level === 'warn' ? '!' : '×'}</span>
      <span><b>${p.title}</b> — ${p.text}</span>
    </li>
  `).join('');
}

refresh();
