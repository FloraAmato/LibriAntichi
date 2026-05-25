import { createBookScene } from './book3d.js';
import {
  LOCATIONS,
  damageAt, lifeRemaining, predictions, combineMaterial
} from './degradation.js';
import { MANOSCRITTI, trovaManoscritto } from './manuscripts.js';
import { ensembleMonteCarlo, istogrammaVita } from './scenarios.js';

// ===== Stato applicazione =====
const ui = {
  // Ambiente corrente
  temp: 17, rh: 50, light: 5, pollution: 2, cycle: 0.5,
  pest: false, handling: false,
  // Materiali
  support: 'pergamena',
  binding: 'cuoio',
  ink: 'ferro-gallico',
  age: 870,
  // Tempo
  years: 0,
  location: 'caveau',
  playing: false,
  // Catalogo
  manuscriptId: MANOSCRITTI[0].id,
  exemplarId: MANOSCRITTI[0].esemplari[0].id,
  // Modello stocastico
  ampiezzaIncertezza: 1.0,
  ultimoEnsemble: null,
  phase: 'regole'
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
  canvas: $('bookCanvas'),
  // Catalogo
  selManuscript: $('selManuscript'),
  selExemplar: $('selExemplar'),
  manuCard: $('manuCard'),
  // Fasi
  phaseTabs: document.querySelectorAll('.phase'),
  aiSection: $('aiSection'),
  // Fase 2
  btnRunEnsemble: $('btnRunEnsemble'),
  uncertaintyS: $('uncertaintyS'), uncertaintyOut: $('uncertaintyOut'),
  mMedian: $('mMedian'), mWorst: $('mWorst'), mBest: $('mBest'),
  mLeadTime: $('mLeadTime'), mCritical: $('mCritical'),
  aiVerdict: $('aiVerdict'),
  histogram: $('histogram'),
  scenariosTable: $('scenariosTable')
};

// ===== Scena 3D =====
const book = createBookScene(els.canvas);

// ===== Popolamento del catalogo manoscritti =====
function popolaCatalogoIniziale() {
  els.selManuscript.innerHTML = MANOSCRITTI.map(
    (m) => `<option value="${m.id}">${m.titolo} (${m.secolo})</option>`
  ).join('');
  aggiornaEsemplari();
  applicaManoscrittoSelezionato({ sincronizzaSlider: true });
}

function aggiornaEsemplari() {
  const m = MANOSCRITTI.find((x) => x.id === ui.manuscriptId) ?? MANOSCRITTI[0];
  els.selExemplar.innerHTML = m.esemplari
    .map((e) => `<option value="${e.id}">${e.sigla}</option>`)
    .join('');
  ui.exemplarId = m.esemplari[0].id;
}

function applicaManoscrittoSelezionato({ sincronizzaSlider = true } = {}) {
  const { manoscritto, esemplare } = trovaManoscritto(ui.manuscriptId, ui.exemplarId);
  ui.support = manoscritto.supporto;
  ui.binding = manoscritto.legatura;
  ui.ink = manoscritto.inchiostro;
  ui.age = manoscritto.etaAnni;
  ui.pest = manoscritto.biodeteriogeniAttivi === true;
  ui.handling = manoscritto.consultazioneFrequente === true;
  ui.location = esemplare.condizioneLuogo;

  els.selSupport.value = ui.support;
  els.selBinding.value = ui.binding;
  els.selInk.value = ui.ink;
  els.selAge.value = etaSelectOptionPiuVicina(ui.age);
  els.chkPest.checked = ui.pest;
  els.chkHandling.checked = ui.handling;

  els.locGrid.querySelectorAll('.loc').forEach((b) => {
    b.classList.toggle('on', b.dataset.loc === ui.location);
  });

  if (sincronizzaSlider) {
    const L = LOCATIONS[ui.location];
    impostaSlider(els.tempS, els.tempV, 'temp', L.temp, (v) => v.toFixed(1));
    impostaSlider(els.rhS, els.rhV, 'rh', L.rh, (v) => v.toFixed(0));
    impostaSlider(els.lightS, els.lightV, 'light', L.light, (v) => v.toFixed(0));
    impostaSlider(els.pollS, els.pollV, 'pollution', L.pollution, (v) => v.toFixed(0));
    impostaSlider(els.cycleS, els.cycleV, 'cycle', L.cycle, (v) => v.toFixed(1));
  }

  rendiSchedaManoscritto(manoscritto, esemplare);
  refresh();
}

function etaSelectOptionPiuVicina(eta) {
  const opzioni = [200, 400, 700, 1000];
  let migliore = opzioni[0];
  let diff = Infinity;
  for (const o of opzioni) {
    const d = Math.abs(o - eta);
    if (d < diff) { diff = d; migliore = o; }
  }
  return String(migliore);
}

function rendiSchedaManoscritto(m, e) {
  const composizione = m.composizioneMateriali;
  const restauroRiga = m.restaurato
    ? `<span class="badge ok">Restaurato nel ${m.annoRestauro}</span>`
    : '<span class="badge warn">Non restaurato</span>';
  const muffaRiga = m.muffa
    ? '<span class="badge bad">Muffa rilevata</span>'
    : '<span class="badge ok">Nessuna muffa rilevata</span>';
  const biodet = m.biodeteriogeniAttivi
    ? '<span class="badge bad">Biodeteriogeni attivi</span>'
    : '<span class="badge ok">Nessun biodeteriogene attivo</span>';
  const handling = m.consultazioneFrequente
    ? '<span class="badge warn">Consultazione frequente</span>'
    : '<span class="badge ok">Consultazione rara</span>';

  els.manuCard.innerHTML = `
    <div class="manu-title">${m.titolo} <small>· ${m.secolo} · circa ${m.etaAnni} anni</small></div>
    <div class="manu-grid">
      <div><span class="k">Supporto</span><span class="v">${composizione.supporto}</span></div>
      <div><span class="k">Legatura</span><span class="v">${composizione.legatura}</span></div>
      <div><span class="k">Inchiostro</span><span class="v">${composizione.inchiostro}</span></div>
      <div><span class="k">Decorazioni</span><span class="v">${composizione.decorazioni}</span></div>
    </div>
    <div class="manu-state">
      ${restauroRiga}
      ${muffaRiga}
      ${biodet}
      ${handling}
    </div>
    ${m.restaurato ? `<p class="manu-note"><b>Restauro:</b> ${m.notaRestauro}</p>` : ''}
    ${m.muffa ? `<p class="manu-note bad-note"><b>Muffa:</b> ${m.notaMuffa}</p>` : ''}
    <div class="manu-loc">
      <span class="k">Luogo fisico attuale</span>
      <span class="v">${e.luogoFisico}</span>
    </div>
    <div class="manu-loc">
      <span class="k">Stato di conservazione registrato</span>
      <span class="v">${e.statoConservazione}</span>
    </div>
  `;
}

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

// Selezione luogo fisico
els.locGrid.querySelectorAll('.loc').forEach((btn) => {
  btn.addEventListener('click', () => {
    els.locGrid.querySelectorAll('.loc').forEach((b) => b.classList.remove('on'));
    btn.classList.add('on');
    const key = btn.dataset.loc;
    ui.location = key;
    const L = LOCATIONS[key];
    impostaSlider(els.tempS, els.tempV, 'temp', L.temp, (v) => v.toFixed(1));
    impostaSlider(els.rhS, els.rhV, 'rh', L.rh, (v) => v.toFixed(0));
    impostaSlider(els.lightS, els.lightV, 'light', L.light, (v) => v.toFixed(0));
    impostaSlider(els.pollS, els.pollV, 'pollution', L.pollution, (v) => v.toFixed(0));
    impostaSlider(els.cycleS, els.cycleV, 'cycle', L.cycle, (v) => v.toFixed(1));
    refresh();
  });
});

function impostaSlider(input, display, key, value, formatter = (v) => v) {
  input.value = value;
  ui[key] = value;
  display.textContent = formatter(value);
}

// Catalogo manoscritti
els.selManuscript.addEventListener('change', () => {
  ui.manuscriptId = els.selManuscript.value;
  aggiornaEsemplari();
  applicaManoscrittoSelezionato({ sincronizzaSlider: true });
});
els.selExemplar.addEventListener('change', () => {
  ui.exemplarId = els.selExemplar.value;
  applicaManoscrittoSelezionato({ sincronizzaSlider: true });
});

// Fasi
els.phaseTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    els.phaseTabs.forEach((t) => {
      t.classList.remove('on');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('on');
    tab.setAttribute('aria-selected', 'true');
    ui.phase = tab.dataset.phase;
    if (ui.phase === 'ai') {
      els.aiSection.hidden = false;
      eseguiEnsembleERender();
      els.aiSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      els.aiSection.hidden = true;
    }
  });
});

// Slider incertezza
els.uncertaintyS.addEventListener('input', () => {
  ui.ampiezzaIncertezza = parseFloat(els.uncertaintyS.value);
  els.uncertaintyOut.textContent = `${ui.ampiezzaIncertezza.toFixed(1)}×`;
});
els.btnRunEnsemble.addEventListener('click', eseguiEnsembleERender);

// Play / Ripristina
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

// ===== Aggiornamento principale (Fase 1: regole) =====
function refresh() {
  const mat = combineMaterial(ui.support, ui.binding, ui.ink);
  const env = {
    temp: ui.temp, rh: ui.rh, light: ui.light,
    pollution: ui.pollution, cycle: ui.cycle,
    pest: ui.pest, handling: ui.handling
  };
  const { manoscritto } = trovaManoscritto(ui.manuscriptId, ui.exemplarId);
  const danno0 = dannoPreesistente(manoscritto);

  const d = damageAt(env, mat, ui.years, ui.age, danno0);
  const life = lifeRemaining(env, mat, ui.age, danno0);

  els.kpiDamage.textContent = d.value.toFixed(0);
  els.kpiLife.textContent = life > 999 ? '∞' : Math.round(life);
  els.kpiYear.textContent = ui.years.toFixed(0);

  book.setDamage(d.value / 100);

  let level = 'good'; let label = 'Condizioni ottimali';
  if (d.value > 65 || life < 25) { level = 'bad'; label = 'Degrado severo · intervento conservativo urgente'; }
  else if (d.value > 35 || life < 75) { level = 'warn'; label = 'Degrado moderato · monitorare'; }
  els.statusDot.className = 'dot ' + (level === 'good' ? '' : level);
  els.statusText.textContent = label;

  const preds = predictions(env, mat, ui.age);
  els.predList.innerHTML = preds.map((p) => `
    <li class="${p.level}">
      <span class="ico">${p.level === 'good' ? '✓' : p.level === 'warn' ? '!' : '×'}</span>
      <span><b>${p.title}</b> — ${p.text}</span>
    </li>
  `).join('');

  if (ui.phase === 'ai') eseguiEnsembleERender();
}

function dannoPreesistente(m) {
  let d = Math.min(35, m.etaAnni * 0.02);
  if (m.muffa) d += 12;
  if (!m.restaurato) d += 5;
  return Math.min(60, d);
}

// ===== Fase 2: cento scenari Monte Carlo =====
function eseguiEnsembleERender() {
  const { manoscritto, esemplare } = trovaManoscritto(ui.manuscriptId, ui.exemplarId);
  const risultato = ensembleMonteCarlo({
    manoscritto,
    esemplare,
    ampiezzaIncertezza: ui.ampiezzaIncertezza,
    numeroScenari: 100,
    seed: 1 + (ui.ampiezzaIncertezza * 1000 | 0) + ui.manuscriptId.length * 31 + ui.exemplarId.length
  });
  ui.ultimoEnsemble = risultato;

  const s = risultato.statistiche;
  els.mMedian.textContent = arrotonda(s.mediana);
  els.mWorst.textContent = arrotonda(s.pessimistico);
  els.mBest.textContent = arrotonda(s.ottimistico);
  els.mLeadTime.textContent = arrotonda(s.leadTime);
  els.mCritical.textContent = s.rischio.toFixed(0);

  els.aiVerdict.textContent = generaVerdetto(manoscritto, esemplare, s);

  rendiIstogramma(risultato.scenari);
  rendiTabellaScenari(risultato.scenari);
}

function generaVerdetto(m, e, s) {
  const mediana = Math.round(s.mediana);
  const lead = Math.round(s.leadTime);
  const where = e.luogoFisico;
  let chiusura = '';
  if (s.rischio > 30) {
    chiusura = ' Più di un terzo degli scenari porta il volume sotto i trent\'anni di vita residua: si raccomanda un intervento conservativo prioritario.';
  } else if (s.rischio > 10) {
    chiusura = ' Un numero non trascurabile di scenari conduce a stati critici nel breve periodo: pianificare un intervento entro il tempo di anticipo indicato.';
  } else {
    chiusura = ' La distribuzione è concentrata su valori elevati: condizioni di custodia compatibili con una sopravvivenza prolungata.';
  }
  return `Applicando il modello stocastico al manoscritto «${m.titolo}» nella configurazione «${where}», la vita residua mediana attesa è di circa ${mediana} anni, con un tempo di anticipo per l'intervento pari a ${lead} anni.${chiusura}`;
}

function arrotonda(v) {
  if (v >= 500) return '≥ 500';
  return Math.round(v).toString();
}

function rendiIstogramma(scenari) {
  const bin = istogrammaVita(scenari, 12);
  const max = Math.max(...bin.map((b) => b.conteggio), 1);
  els.histogram.innerHTML = bin.map((b) => {
    const altezza = (b.conteggio / max) * 100;
    const etichetta = `${Math.round(b.estremoInferiore)}–${Math.round(b.estremoSuperiore)} anni`;
    return `
      <div class="bar-wrap" title="${b.conteggio} scenari fra ${etichetta}">
        <div class="bar" style="height:${altezza}%"></div>
        <div class="bar-count">${b.conteggio}</div>
        <div class="bar-label">${etichetta}</div>
      </div>
    `;
  }).join('');
}

function rendiTabellaScenari(scenari) {
  const passo = Math.max(1, Math.floor(scenari.length / 12));
  const campione = scenari.filter((_, i) => i % passo === 0).slice(0, 12);
  els.scenariosTable.innerHTML = `
    <div class="row head">
      <div>Scenario</div>
      <div>Temperatura</div>
      <div>Umidità relativa</div>
      <div>Illuminamento</div>
      <div>Concentrazione di inquinanti</div>
      <div>Variazione giornaliera</div>
      <div>Vita residua attesa</div>
    </div>
    ${campione.map((s) => `
      <div class="row">
        <div>numero ${s.indice}</div>
        <div>${s.ambiente.temperatura.toFixed(1)} gradi Celsius</div>
        <div>${s.ambiente.umiditaRelativa.toFixed(0)} per cento</div>
        <div>${s.ambiente.illuminamento.toFixed(0)} lux</div>
        <div>${s.ambiente.concentrazioneInquinanti.toFixed(0)} microgrammi per metro cubo</div>
        <div>${s.ambiente.cicliGiornalieri.toFixed(1)} per cento</div>
        <div><b>${s.anniVitaResidua >= 500 ? '≥ 500' : Math.round(s.anniVitaResidua)}</b> anni</div>
      </div>
    `).join('')}
  `;
}

// ===== Avvio =====
popolaCatalogoIniziale();
