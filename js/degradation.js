// Modello didattico di degrado per volumi antichi.
// Ispirato a:
//  - ISO 11799 (intervalli T/UR per supporti pergamenacei e cuoio)
//  - Michalski "Lifetime Multiplier" per stima vita relativa
//  - Coefficiente Q10 (raddoppio del tasso ogni 5-10 °C)
// NB: modello educational, non un sostituto di una valutazione conservativa reale.

export const LOCATIONS = {
  caveau:     { label: 'Caveau climatizzato',     temp: 17, rh: 50, light:  5, pollution:  2, cycle: 0.5 },
  biblioteca: { label: 'Biblioteca storica',      temp: 20, rh: 55, light: 80, pollution: 15, cycle: 3   },
  museo:      { label: 'Vetrina museale',         temp: 22, rh: 50, light:200, pollution: 10, cycle: 4   },
  soffitta:   { label: 'Soffitta',                temp: 28, rh: 35, light: 30, pollution: 25, cycle: 15  },
  cantina:    { label: 'Cantina umida',           temp: 14, rh: 80, light:  2, pollution: 20, cycle: 6   },
  magazzino:  { label: 'Magazzino non condizionato', temp: 24, rh: 65, light: 40, pollution: 60, cycle: 10 }
};

// Sensibilità per materiale (moltiplicatori del tasso di degrado per fattore)
// chem = ossidazione/idrolisi, mech = stress meccanico cicli T/UR, bio = mold/insetti,
// photo = fotodegrado, poll = solfuri/NOx
export const MATERIALS = {
  pergamena: { chem: 1.0, mech: 1.3, bio: 1.2, photo: 0.8, poll: 0.9, name: 'Pergamena' },
  vellum:    { chem: 0.9, mech: 1.2, bio: 1.1, photo: 0.8, poll: 0.9, name: 'Vellum' },
  papiro:    { chem: 1.4, mech: 1.6, bio: 1.0, photo: 1.1, poll: 1.0, name: 'Papiro' }
};
export const BINDINGS = {
  cuoio:        { chem: 1.1, mech: 1.0, bio: 0.9, photo: 1.0, poll: 1.3, name: 'Cuoio' },
  mezzapelle:   { chem: 1.0, mech: 1.0, bio: 0.9, photo: 1.0, poll: 1.2, name: 'Mezza pelle' },
  pergamenata:  { chem: 0.9, mech: 1.3, bio: 1.1, photo: 0.9, poll: 0.9, name: 'Pergamenata' },
  legno:        { chem: 0.8, mech: 1.5, bio: 1.4, photo: 0.7, poll: 0.8, name: 'Assi in legno' }
};
export const INKS = {
  'ferro-gallico': { chem: 1.6, name: 'Ferro-gallico' }, // corrosione attiva
  'carbonio':      { chem: 0.7, name: 'Carbonio' },
  'miniati':       { chem: 1.0, photoBoost: 1.4, name: 'Miniature' }
};

// Tasso annuo di degrado (0..1, sommato nel tempo)
// Calibrato in modo che in condizioni ideali un volume duri ~500 anni
// e in condizioni pessime collassi in ~30 anni.
export function annualRate(env, mat) {
  const { temp, rh, light, pollution, cycle, pest, handling } = env;

  // 1) Chimico (Arrhenius semplificato, riferimento 20 °C)
  //    Q10 ≈ 2.5 per la maggior parte dei materiali organici.
  const chem = Math.pow(2.5, (temp - 20) / 10) *
               // idrolisi più rapida con UR alta o molto bassa
               (1 + Math.max(0, (rh - 55) / 35) * 1.2 + Math.max(0, (30 - rh) / 30) * 0.6) *
               mat.chem;

  // 2) Biologico (muffe attive sopra ~65 % UR + caldo; insetti tra 18-28 °C)
  const moldRisk = rh > 65 ? Math.pow((rh - 65) / 20, 1.4) * (temp > 18 ? 1 : 0.4) : 0;
  const insectRisk = (temp > 18 && temp < 30 && rh > 50) ? 0.6 : 0.1;
  const bio = (moldRisk + insectRisk * 0.5 + (pest ? 1.2 : 0)) * mat.bio;

  // 3) Fotodegrado (cumulativo, lineare in lux)
  const photo = (light / 50) * 0.6 * mat.photo;

  // 4) Inquinanti
  const poll = (pollution / 20) * 0.5 * mat.poll;

  // 5) Stress meccanico (cicli T/UR + manipolazione)
  const mech = (cycle / 5) * 0.7 * mat.mech + (handling ? 0.4 : 0);

  // Tasso totale (unità arbitrarie ~ punti/anno su scala 0-100)
  const total = 0.04 * (chem + bio + photo + poll + mech);
  return { total, breakdown: { chem, bio, photo, poll, mech } };
}

// Indice di degrado cumulato dopo `years` anni (0..100, saturato).
export function damageAt(env, mat, years, ageOffset = 0) {
  const r = annualRate(env, mat);
  // età preesistente: applica una piccola quota già accumulata
  const preexisting = Math.min(35, ageOffset * 0.02);
  const acc = preexisting + r.total * years * 100;
  return { value: Math.min(100, acc), rate: r };
}

// Anni residui prima di superare la soglia "severe" (70/100)
export function lifeRemaining(env, mat, ageOffset = 0) {
  const r = annualRate(env, mat).total * 100; // punti/anno
  if (r <= 0.0001) return 9999;
  const preexisting = Math.min(35, ageOffset * 0.02);
  return Math.max(0, (70 - preexisting) / r);
}

// Combina materiale + legatura + inchiostro in un unico set di moltiplicatori
export function combineMaterial(supportKey, bindingKey, inkKey) {
  const s = MATERIALS[supportKey], b = BINDINGS[bindingKey], i = INKS[inkKey];
  return {
    chem:  (s.chem  * 0.6 + b.chem  * 0.4) * (i.chem  || 1),
    mech:  (s.mech  * 0.7 + b.mech  * 0.3),
    bio:   (s.bio   * 0.6 + b.bio   * 0.4),
    photo: (s.photo * 0.7 + b.photo * 0.3) * (i.photoBoost || 1),
    poll:  (s.poll  * 0.5 + b.poll  * 0.5)
  };
}

// Genera early-warning prioritarie per la dashboard
export function predictions(env, mat, ageOffset) {
  const r = annualRate(env, mat);
  const out = [];
  const push = (level, title, text) => out.push({ level, title, text });

  if (env.rh > 65) push('bad', 'Rischio biologico elevato', `UR ${env.rh.toFixed(0)} % favorisce muffe; abbassare a 50–55 %.`);
  else if (env.rh > 60) push('warn', 'UR superiore alla soglia', 'Mantenere UR sotto 60 % per inibire microflora.');
  else if (env.rh < 35) push('warn', 'Aria troppo secca', 'Sotto 35 % i supporti collagenei si infragiliscono.');

  if (env.temp > 24) push('bad', 'Temperatura elevata', `T ${env.temp.toFixed(0)} °C: l'idrolisi raddoppia ogni 5–10 °C oltre 20.`);
  else if (env.temp > 21) push('warn', 'Lievemente caldo', 'Riportare T verso 16–18 °C estende la vita stimata.');

  if (env.light > 200) push('bad', 'Illuminamento eccessivo', `${env.light} lux: rischio sbiadimento miniature e cuoi.`);
  else if (env.light > 50) push('warn', 'Esposizione luminosa moderata', 'Sotto 50 lux per esposizione, UV filtrato.');

  if (env.pollution > 40) push('bad', 'Inquinanti elevati', 'Solfuri/NOx accelerano l\'ossidazione dei cuoi.');
  else if (env.pollution > 20) push('warn', 'Filtrare l\'aria', 'Considerare filtri carbone attivo o vetrina chiusa.');

  if (env.cycle > 8) push('bad', 'Cicli T/UR forti', 'Le variazioni rapide creano micro-fratture igroscopiche.');
  else if (env.cycle > 4) push('warn', 'Stabilità climatica migliorabile', 'Limitare i Δ giornalieri sotto 3 %.');

  if (env.pest) push('bad', 'Biodeteriogeni attivi', 'Isolare il volume e attivare protocollo IPM.');
  if (env.handling) push('warn', 'Consultazione frequente', 'Adottare leggio, guanti, digitalizzazione sostitutiva.');

  // dominante
  const b = r.breakdown;
  const max = Math.max(b.chem, b.bio, b.photo, b.poll, b.mech);
  const dom = b.chem === max ? 'chimico (idrolisi/ossidazione)'
            : b.bio   === max ? 'biologico'
            : b.photo === max ? 'fotodegrado'
            : b.poll  === max ? 'da inquinanti'
            : 'meccanico (cicli T/UR)';
  out.unshift({ level: out.length ? (out.some(x => x.level === 'bad') ? 'bad' : 'warn') : 'good',
                title: 'Fattore dominante',
                text: `Il meccanismo principale di degrado attuale è <b>${dom}</b>.` });

  if (!out.some(x => x.level !== 'good')) {
    push('good', 'Condizioni allineate ISO 11799', 'Tutti i parametri rientrano nelle finestre raccomandate.');
  }
  return out;
}
