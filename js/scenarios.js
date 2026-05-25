// Generatore di scenari Monte Carlo per la fase con modello stocastico.
//
// Per ciascun manoscritto costruiamo 100 possibili traiettorie ambientali
// (variazioni casuali ma plausibili di temperatura, umidità relativa,
// illuminamento, concentrazione di inquinanti, cicli giornalieri) attorno al
// profilo del luogo fisico in cui è custodito l'esemplare. Per ogni scenario
// calcoliamo la vita residua prima del raggiungimento della soglia di
// degrado severo (70 punti su 100), così da ottenere una distribuzione e non
// più una stima puntuale.
//
// Tutte le grandezze restano scritte per esteso: niente sigle.

import { annualRate, combineMaterial, LOCATIONS } from './degradation.js';

// Generatore Gaussiano (Box–Muller) seedabile per ripetibilità degli scenari.
function gaussiana(rng, media, deviazione) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return media + z * deviazione;
}

// PRNG deterministico (mulberry32) — così "ricostruisci scenari" è ripetibile.
function creaPrng(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const limiti = {
  temperatura: [-5, 45],
  umiditaRelativa: [10, 98],
  illuminamento: [0, 1500],
  concentrazioneInquinanti: [0, 200],
  cicliGiornalieri: [0, 35]
};

function entroLimiti(valore, [minimo, massimo]) {
  return Math.max(minimo, Math.min(massimo, valore));
}

// Costruisce un singolo scenario perturbando i valori di base del luogo.
function generaScenario(rng, profiloLuogo, ampiezzaIncertezza = 1) {
  return {
    temperatura: entroLimiti(
      gaussiana(rng, profiloLuogo.temp, 1.8 * ampiezzaIncertezza),
      limiti.temperatura
    ),
    umiditaRelativa: entroLimiti(
      gaussiana(rng, profiloLuogo.rh, 6 * ampiezzaIncertezza),
      limiti.umiditaRelativa
    ),
    illuminamento: entroLimiti(
      gaussiana(rng, profiloLuogo.light, Math.max(8, profiloLuogo.light * 0.35) * ampiezzaIncertezza),
      limiti.illuminamento
    ),
    concentrazioneInquinanti: entroLimiti(
      gaussiana(rng, profiloLuogo.pollution, Math.max(3, profiloLuogo.pollution * 0.4) * ampiezzaIncertezza),
      limiti.concentrazioneInquinanti
    ),
    cicliGiornalieri: entroLimiti(
      gaussiana(rng, profiloLuogo.cycle, Math.max(0.5, profiloLuogo.cycle * 0.5) * ampiezzaIncertezza),
      limiti.cicliGiornalieri
    )
  };
}

// Converte uno scenario nel formato atteso dal motore di degrado.
function ambienteDaScenario(scenario, manoscritto) {
  return {
    temp: scenario.temperatura,
    rh: scenario.umiditaRelativa,
    light: scenario.illuminamento,
    pollution: scenario.concentrazioneInquinanti,
    cycle: scenario.cicliGiornalieri,
    pest: manoscritto.biodeteriogeniAttivi === true,
    handling: manoscritto.consultazioneFrequente === true
  };
}

// Penalità di partenza per manoscritti con muffa o non restaurati.
function offsetDanno(manoscritto) {
  let danno = Math.min(35, manoscritto.etaAnni * 0.02);
  if (manoscritto.muffa) danno += 12;
  if (!manoscritto.restaurato) danno += 5;
  return Math.min(60, danno);
}

// Calcola la vita residua prevista per uno specifico scenario.
function vitaResiduaScenario(scenario, manoscritto, mat) {
  const ambiente = ambienteDaScenario(scenario, manoscritto);
  const tasso = annualRate(ambiente, mat).total * 100; // punti di degrado per anno
  if (tasso <= 0.0001) return 9999;
  const danno0 = offsetDanno(manoscritto);
  return Math.max(0, (70 - danno0) / tasso);
}

// Genera N scenari e restituisce: lista delle traiettorie, distribuzione di
// vita residua e statistiche derivate (mediana, percentili, lead time).
export function ensembleMonteCarlo({
  manoscritto,
  esemplare,
  ampiezzaIncertezza = 1,
  numeroScenari = 100,
  seed = 42
}) {
  const rng = creaPrng(seed);
  const profiloLuogo = LOCATIONS[esemplare.condizioneLuogo];
  const mat = combineMaterial(
    manoscritto.supporto,
    manoscritto.legatura,
    manoscritto.inchiostro
  );

  const scenari = [];
  for (let i = 0; i < numeroScenari; i += 1) {
    const sc = generaScenario(rng, profiloLuogo, ampiezzaIncertezza);
    const anniVitaResidua = vitaResiduaScenario(sc, manoscritto, mat);
    scenari.push({
      indice: i + 1,
      ambiente: sc,
      anniVitaResidua,
      annoSimulato: anniVitaResidua === 9999 ? null : Math.round(anniVitaResidua)
    });
  }

  const valori = scenari
    .map((s) => Math.min(500, s.anniVitaResidua))
    .sort((a, b) => a - b);
  const percentile = (p) => valori[Math.min(valori.length - 1, Math.floor((p / 100) * valori.length))];

  const mediaAritmetica = valori.reduce((acc, v) => acc + v, 0) / valori.length;
  const mediana = percentile(50);
  const ottimistico = percentile(95);
  const pessimistico = percentile(5);

  // Lead time = tempo prima che almeno il 10 % degli scenari raggiunga lo
  // stato di degrado severo (cioè scendano sotto i 70 punti). È il margine
  // utile per programmare un intervento conservativo preventivo.
  const leadTime = percentile(10);

  return {
    scenari,
    statistiche: {
      mediaAritmetica,
      mediana,
      pessimistico,
      ottimistico,
      leadTime,
      rischio: percentualeScenariCritici(valori)
    }
  };
}

function percentualeScenariCritici(valoriOrdinati) {
  const criticità = valoriOrdinati.filter((v) => v < 30).length;
  return (criticità / valoriOrdinati.length) * 100;
}

// Aggrega le distribuzioni in bin (istogramma) per la visualizzazione.
export function istogrammaVita(scenari, numeroBin = 12) {
  const valori = scenari.map((s) => Math.min(500, s.anniVitaResidua));
  const minimo = Math.floor(Math.min(...valori));
  const massimo = Math.ceil(Math.max(...valori));
  const ampiezzaBin = Math.max(1, (massimo - minimo) / numeroBin);
  const bin = Array.from({ length: numeroBin }, (_, i) => ({
    estremoInferiore: minimo + i * ampiezzaBin,
    estremoSuperiore: minimo + (i + 1) * ampiezzaBin,
    conteggio: 0
  }));
  for (const v of valori) {
    let idx = Math.floor((v - minimo) / ampiezzaBin);
    if (idx >= numeroBin) idx = numeroBin - 1;
    if (idx < 0) idx = 0;
    bin[idx].conteggio += 1;
  }
  return bin;
}
