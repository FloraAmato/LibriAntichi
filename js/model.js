'use strict';

const MATERIALS = {
  parchment: {
    id: 'parchment',
    name: 'Pergamena',
    nameIT: 'Pergamena (pelle di pecora/capra)',
    description: 'Supporto scrittorio ottenuto dalla pelle animale essiccata e raschiata (non conciata). Altamente igroscopico, reagisce drammaticamente alle variazioni di umidità con cockling e deformazioni.',
    optimalTemp: 18,
    optimalRH: 50,
    rhMin: 45,
    rhMax: 55,
    moldThresholdRH: 65,
    lightSensitivity: 0.7,
    pollutionSensitivity: 0.5,
    baseYearlyRate: 0.08,
    activationEnergy: 100000,
    inkRisk: 'iron-gall',
    color: '#8B4513'
  },
  vellum: {
    id: 'vellum',
    name: 'Vellum',
    nameIT: 'Vellum (pelle di vitello/agnello)',
    description: 'Forma più pregiata della pergamena, ottenuta da vitelli o agnelli neonati. Superficie liscia e translucida, usata per manoscritti di lusso e miniature. Struttura collagenica molto fine.',
    optimalTemp: 17,
    optimalRH: 50,
    rhMin: 44,
    rhMax: 54,
    moldThresholdRH: 63,
    lightSensitivity: 0.85,
    pollutionSensitivity: 0.6,
    baseYearlyRate: 0.06,
    activationEnergy: 105000,
    inkRisk: 'iron-gall',
    color: '#D2B48C'
  },
  papyrus: {
    id: 'papyrus',
    name: 'Papiro',
    nameIT: 'Papiro (Cyperus papyrus)',
    description: 'Antichissimo supporto scrittorio egizio. Ottenuto dal midollo del papiro, laminato in strati incrociati. Molto fragile e sensibile all\'umidità; diventa croccante in ambienti secchi e si decompone in ambienti umidi.',
    optimalTemp: 20,
    optimalRH: 45,
    rhMin: 40,
    rhMax: 55,
    moldThresholdRH: 60,
    lightSensitivity: 0.95,
    pollutionSensitivity: 0.4,
    baseYearlyRate: 0.15,
    activationEnergy: 88000,
    inkRisk: 'carbon',
    color: '#C8A96E'
  },
  leather: {
    id: 'leather',
    name: 'Cuoio',
    nameIT: 'Legatura in cuoio conciato (alume/tannino)',
    description: 'Pelle animale trattata con tannini vegetali (quercia, sommacco) o con allume. Materiale tipico delle legature medievali. Soggetto al "red rot" (polverizzazione per azione dell\'SO₂ atmosferico). Diverso dalla pergamena per il processo di concia.',
    optimalTemp: 18,
    optimalRH: 50,
    rhMin: 45,
    rhMax: 55,
    moldThresholdRH: 65,
    lightSensitivity: 0.5,
    pollutionSensitivity: 0.95,
    baseYearlyRate: 0.12,
    activationEnergy: 95000,
    inkRisk: 'none',
    color: '#6B3A2A'
  },
  waxTablet: {
    id: 'waxTablet',
    name: 'Tavola Cerata',
    nameIT: 'Tavoletta cerata (tabula cerata)',
    description: 'Supporto usato nell\'antichità classica. Asse di legno (abete, faggio) incavata e rivestita di cera miscelata a resina e nerofumo. La scrittura era incisa con stilo e poteva essere cancellata scaldando. Usate in dittici e polittici legati con cuoio.',
    optimalTemp: 15,
    optimalRH: 45,
    rhMin: 40,
    rhMax: 55,
    moldThresholdRH: 70,
    lightSensitivity: 0.3,
    pollutionSensitivity: 0.3,
    baseYearlyRate: 0.20,
    activationEnergy: 75000,
    inkRisk: 'none',
    color: '#8B7355'
  }
};

const LOCATIONS = {
  museum: {
    id: 'museum', icon: '🏛️', name: 'Museo Controllato',
    description: 'Conservazione professionale con controllo climatico attivo 24/7. Standard ISO 11799 e BS 4971.',
    defaultTemp: 18, defaultRH: 50, defaultLight: 50, defaultPollution: 0.8,
    tempVariation: 0.5, rhVariation: 2
  },
  library: {
    id: 'library', icon: '📚', name: 'Biblioteca Storica',
    description: 'Biblioteca con ventilazione naturale ma senza clima controllato. Fluttuazioni stagionali moderate.',
    defaultTemp: 20, defaultRH: 55, defaultLight: 200, defaultPollution: 2,
    tempVariation: 5, rhVariation: 12
  },
  monastery: {
    id: 'monastery', icon: '⛪', name: 'Archivio Monastico',
    description: 'Edificio storico in pietra. Ambienti freschi e stabili ma potenzialmente umidi. Tipico degli scriptoria medievali.',
    defaultTemp: 14, defaultRH: 72, defaultLight: 60, defaultPollution: 1.2,
    tempVariation: 8, rhVariation: 18
  },
  private: {
    id: 'private', icon: '🏠', name: 'Collezione Privata',
    description: 'Abitazione privata non climatizzata. Condizioni variabili, scarso controllo ambientale.',
    defaultTemp: 22, defaultRH: 62, defaultLight: 400, defaultPollution: 3,
    tempVariation: 8, rhVariation: 15
  },
  basement: {
    id: 'basement', icon: '🔒', name: 'Cantina/Deposito',
    description: 'Ambiente sotterraneo. Temperatura relativamente stabile ma alta umidità e rischio alluvioni.',
    defaultTemp: 14, defaultRH: 82, defaultLight: 10, defaultPollution: 2,
    tempVariation: 3, rhVariation: 20
  },
  attic: {
    id: 'attic', icon: '🏚️', name: 'Soffitta',
    description: 'Condizioni estreme: estate torrida, inverno gelido, escursioni termiche severe, alta radiazione UV.',
    defaultTemp: 28, defaultRH: 48, defaultLight: 600, defaultPollution: 2,
    tempVariation: 25, rhVariation: 30
  },
  vault: {
    id: 'vault', icon: '🏦', name: 'Cassaforte/Caveau',
    description: 'Ambiente sigillato con acciaio. Temperatura stabile ma rischio umidità relativa critica per condensa.',
    defaultTemp: 16, defaultRH: 58, defaultLight: 5, defaultPollution: 0.5,
    tempVariation: 1, rhVariation: 8
  },
  excavation: {
    id: 'excavation', icon: '⛏️', name: 'Sito Archeologico',
    description: 'Ritrovamento recente in corso di scavo. Condizioni di transizione critiche dal sottosuolo all\'aria aperta.',
    defaultTemp: 20, defaultRH: 78, defaultLight: 300, defaultPollution: 2,
    tempVariation: 15, rhVariation: 30
  }
};

const WEATHER = {
  stable:  { id: 'stable',  name: 'Stabile',      icon: '⛅', tempMod: 0,   rhMod: 0,   pollMod: 0,   lightMod: 1.0 },
  rainy:   { id: 'rainy',   name: 'Piovoso',       icon: '🌧️', tempMod: -3,  rhMod: +22, pollMod: -1,  lightMod: 0.3 },
  hot:     { id: 'hot',     name: 'Caldo Secco',   icon: '☀️', tempMod: +10, rhMod: -15, pollMod: +1,  lightMod: 1.5 },
  humid:   { id: 'humid',   name: 'Afoso',         icon: '🌫️', tempMod: +4,  rhMod: +25, pollMod: 0,   lightMod: 0.6 },
  frost:   { id: 'frost',   name: 'Gelo',          icon: '❄️', tempMod: -18, rhMod: -12, pollMod: 0,   lightMod: 0.8 },
  flood:   { id: 'flood',   name: 'Alluvione',     icon: '🌊', tempMod: 0,   rhMod: +45, pollMod: +6,  lightMod: 0.2 },
  storm:   { id: 'storm',   name: 'Temporale',     icon: '⛈️', tempMod: -5,  rhMod: +30, pollMod: +2,  lightMod: 0.1 },
  smog:    { id: 'smog',    name: 'Smog Urbano',   icon: '🏭', tempMod: +3,  rhMod: 0,   pollMod: +8,  lightMod: 0.7 },
  sirocco: { id: 'sirocco', name: 'Scirocco',      icon: '🌬️', tempMod: +8,  rhMod: +18, pollMod: +3,  lightMod: 0.9 },
  drought: { id: 'drought', name: 'Siccità',       icon: '🏜️', tempMod: +12, rhMod: -25, pollMod: +2,  lightMod: 1.4 }
};

// Gas constant J/(mol·K)
const R_GAS = 8.314;
// Reference temperature: 20°C = 293.15 K
const T_REF_K = 293.15;

function calculateDegradationRate(conditions, materialId) {
  const mat = MATERIALS[materialId];
  if (!mat) return 1.0;
  const { temp, rh, light, pollution } = conditions;

  // Arrhenius temperature factor
  const Tk = Math.max(temp + 273.15, 240);
  const tempFactor = Math.exp(mat.activationEnergy / R_GAS * (1 / T_REF_K - 1 / Tk));

  // RH factor: exponential outside optimal band
  let rhFactor = 1.0;
  if (rh > mat.rhMax) {
    rhFactor = 1 + Math.pow((rh - mat.rhMax) / 10, 2);
    if (rh > mat.moldThresholdRH) {
      rhFactor *= 1 + (rh - mat.moldThresholdRH) / 8;
    }
  } else if (rh < mat.rhMin) {
    rhFactor = 1 + Math.pow((mat.rhMin - rh) / 12, 1.5);
  }

  // Light damage (photochemical degradation)
  const lightFactor = 1 + (light / 50) * mat.lightSensitivity * 0.5;

  // Pollution (SO₂ → H₂SO₄ in presence of moisture)
  const effectivePollution = pollution * (1 + (rh - 40) / 100);
  const pollFactor = 1 + Math.max(0, effectivePollution - 0.5) * mat.pollutionSensitivity * 0.25;

  return tempFactor * rhFactor * lightFactor * pollFactor;
}

function calculateMoldRisk(temp, rh) {
  if (rh < 65 || temp < 4) return 0;
  const tempFactor = Math.min(1, (temp - 4) / 30);
  const rhFactor = Math.pow(Math.max(0, rh - 65) / 30, 0.8);
  return Math.min(1, tempFactor * rhFactor * 1.2);
}

function calculateRedRotRisk(materialId, pollution, rh) {
  if (materialId !== 'leather') return 0;
  if (pollution < 2) return 0;
  return Math.min(1, ((pollution - 2) / 8) * (rh / 70));
}

function calculateInsectRisk(temp, rh) {
  if (temp < 16 || temp > 35 || rh < 45) return 0;
  const tFactor = 1 - Math.abs(temp - 25) / 10;
  const hFactor = Math.min(1, (rh - 45) / 25);
  return Math.min(1, tFactor * hFactor);
}

function projectDegradation(conditions, materialId, years) {
  const mat = MATERIALS[materialId];
  const rate = calculateDegradationRate(conditions, materialId);
  const annualRate = mat.baseYearlyRate * rate;
  const numPoints = Math.min(201, years + 1);
  const step = years / Math.max(1, numPoints - 1);
  const points = [];

  for (let i = 0; i < numPoints; i++) {
    const y = i * step;
    // Non-linear: accelerates as damage accumulates
    const score = Math.min(100, 100 * (1 - Math.exp(-annualRate * y / 100)));
    points.push({
      year: Math.round(y),
      score: parseFloat(score.toFixed(2)),
      structural:  Math.max(0, parseFloat((100 - score * 0.90).toFixed(2))),
      legibility:  Math.max(0, parseFloat((100 - score * 1.10).toFixed(2))),
      decoration:  Math.max(0, parseFloat((100 - score * 1.25).toFixed(2)))
    });
  }
  return points;
}

function yearsToThreshold(conditions, materialId, threshold) {
  const mat = MATERIALS[materialId];
  const rate = calculateDegradationRate(conditions, materialId);
  const annualRate = mat.baseYearlyRate * rate;
  if (annualRate <= 0 || threshold >= 100) return Infinity;
  return Math.max(0, -100 / annualRate * Math.log(1 - threshold / 100));
}

function getRiskAssessment(conditions, materialId) {
  const mat = MATERIALS[materialId];
  const { temp, rh, light, pollution } = conditions;
  const risks = [];

  // Temperature
  if (temp > mat.optimalTemp + 15) {
    risks.push({ type: 'critical', category: 'Temperatura', message: `Temperatura critica (${temp}°C): l'idrolisi del collagene è massimamente accelerata. Danni permanenti alla struttura molecolare.` });
  } else if (temp > mat.optimalTemp + 7) {
    risks.push({ type: 'high', category: 'Temperatura', message: `Temperatura elevata (${temp}°C): degradazione accelerata di 2-4×. Ottimale per ${mat.name}: ${mat.optimalTemp}°C.` });
  } else if (temp > mat.optimalTemp + 2) {
    risks.push({ type: 'medium', category: 'Temperatura', message: `Temperatura superiore all'ottimale (${temp}°C). Monitorare e correggere.` });
  } else if (temp < 3) {
    risks.push({ type: 'high', category: 'Temperatura', message: `Temperatura critica (${temp}°C): rischio di condensa, cristallizzazione e danni meccanici da gelo.` });
  } else if (temp < mat.optimalTemp - 5) {
    risks.push({ type: 'low', category: 'Temperatura', message: `Temperatura bassa (${temp}°C). Non critica per la conservazione chimica, ma rischio di condensa.` });
  }

  // Humidity
  if (rh > 85) {
    risks.push({ type: 'critical', category: 'Umidità', message: `Umidità critica (${rh}%): crescita fungina attiva, deformazione grave, solubilizzazione degli inchiostri.` });
  } else if (rh > mat.moldThresholdRH) {
    risks.push({ type: 'high', category: 'Umidità', message: `Alta umidità (${rh}%): alto rischio muffe e ${materialId === 'parchment' || materialId === 'vellum' ? 'cockling della ' + mat.name.toLowerCase() : 'degrado fisico'}.` });
  } else if (rh > mat.rhMax) {
    risks.push({ type: 'medium', category: 'Umidità', message: `Umidità sopra il range ottimale (${rh}%). Zona di allerta: range sicuro ${mat.rhMin}-${mat.rhMax}%.` });
  } else if (rh < mat.rhMin - 12) {
    risks.push({ type: 'high', category: 'Umidità', message: `Umidità troppo bassa (${rh}%): essiccazione, fragilità e rischio di distacco degli strati.` });
  } else if (rh < mat.rhMin) {
    risks.push({ type: 'medium', category: 'Umidità', message: `Umidità sotto il range ottimale (${rh}%). Ottimale: ${mat.rhMin}-${mat.rhMax}%.` });
  }

  // Mold risk
  const moldRisk = calculateMoldRisk(temp, rh);
  if (moldRisk > 0.75) {
    risks.push({ type: 'critical', category: 'Muffe', message: 'Condizioni ideali per crescita fungina attiva. Intervento immediato: deumidificazione e ispezione.' });
  } else if (moldRisk > 0.45) {
    risks.push({ type: 'high', category: 'Muffe', message: `Rischio muffe elevato (${Math.round(moldRisk * 100)}%). Deumidificazione urgente.` });
  } else if (moldRisk > 0.2) {
    risks.push({ type: 'medium', category: 'Muffe', message: `Rischio muffe moderato (${Math.round(moldRisk * 100)}%). Monitoraggio bisettimanale.` });
  }

  // Light
  if (light > 500) {
    risks.push({ type: 'critical', category: 'Luce', message: `Esposizione luminosa eccessiva (${light} lux): danni fotochimici irreversibili a inchiostri, pigmenti e supporto.` });
  } else if (light > 200) {
    risks.push({ type: 'high', category: 'Luce', message: `Alta esposizione (${light} lux): sbiadimento accelerato. Standard AICCM: max 50 lux per manoscritti illuminati.` });
  } else if (light > 100) {
    risks.push({ type: 'medium', category: 'Luce', message: `Illuminazione moderata (${light} lux). Raccomandati filtri UV e riduzione del tempo di esposizione.` });
  }

  // Pollution
  if (materialId === 'leather') {
    const rrRisk = calculateRedRotRisk(materialId, pollution, rh);
    if (rrRisk > 0.5) {
      risks.push({ type: 'critical', category: 'Red Rot', message: `Rischio critico di red rot (${Math.round(rrRisk * 100)}%): l'SO₂ converte il cuoio in polvere rossa. Trattamento con Cellugel + consolidante urgente.` });
    } else if (rrRisk > 0.2) {
      risks.push({ type: 'high', category: 'Red Rot', message: `Rischio red rot (${Math.round(rrRisk * 100)}%): applicare British Museum Leather Dressing o equivalente.` });
    }
  }
  if (pollution > 7) {
    risks.push({ type: 'critical', category: 'Inquinamento', message: `Inquinamento critico (livello ${pollution.toFixed(1)}): SO₂, NOₓ, ozono e acidi causano acidificazione rapida dei materiali.` });
  } else if (pollution > 4) {
    risks.push({ type: 'high', category: 'Inquinamento', message: `Inquinamento elevato (livello ${pollution.toFixed(1)}): installare filtri a carbone attivo e zeoliti.` });
  }

  // Insects
  const insRisk = calculateInsectRisk(temp, rh);
  if (insRisk > 0.6) {
    risks.push({ type: 'high', category: 'Insetti', message: `Condizioni ideali per tarli del libro (Anobium, Lasioderma) e pesciolini d'argento. Controllo IPM necessario.` });
  }

  // Combo risks
  if (temp > 22 && rh > 60) {
    risks.push({ type: 'critical', category: 'Sinergismo T+RH', message: 'La combinazione temperatura alta + umidità alta crea condizioni ottimali per degradazione biologica E chimica simultanea.' });
  }

  if (materialId === 'waxTablet' && temp > 25) {
    risks.push({ type: 'critical', category: 'Fusione Cera', message: `La cera inizia a rammollire a ${temp}°C: rischio di perdita del testo. Punto di fusione della cera d'api: ~63°C; ammorbidimento da ~25°C.` });
  }

  if (risks.length === 0) {
    risks.push({ type: 'good', category: 'Condizioni Ottimali', message: `Le condizioni attuali rientrano nei parametri ideali per la conservazione di ${mat.name}. Mantenere il monitoraggio di routine.` });
  }

  return risks;
}

function getDegradationState(score) {
  if (score < 8)  return { label: 'Eccellente', color: '#4CAF50', emoji: '🟢', description: 'Conservazione ottimale' };
  if (score < 20) return { label: 'Buono',      color: '#8BC34A', emoji: '🟡', description: 'Lievi segni di invecchiamento' };
  if (score < 38) return { label: 'Discreto',   color: '#FFC107', emoji: '🟠', description: 'Degrado visibile, restauro consigliato' };
  if (score < 58) return { label: 'Deteriorato',color: '#FF9800', emoji: '🔴', description: 'Intervento di conservazione urgente' };
  if (score < 78) return { label: 'Grave',       color: '#F44336', emoji: '🔴', description: 'Danno strutturale significativo' };
  return              { label: 'Critico',        color: '#9C27B0', emoji: '⚫', description: 'Perdita irreversibile imminente' };
}
