// Modello didattico di degrado per volumi antichi.
// Ispirato a:
//  - ISO 11799 (intervalli di temperatura e umidità relativa per supporti
//    pergamenacei e in cuoio)
//  - Michalski "Lifetime Multiplier" per stima della vita relativa
//  - Coefficiente di accelerazione termica (raddoppio del tasso ogni 5-10
//    gradi Celsius oltre i 20 gradi Celsius)
// Le grandezze sono sempre nominate per esteso, senza sigle.

export const LOCATIONS = {
  caveau:     { label: 'Caveau climatizzato',           temp: 17, rh: 50, light:  5, pollution:  2, cycle: 0.5 },
  biblioteca: { label: 'Biblioteca storica',            temp: 20, rh: 55, light: 80, pollution: 15, cycle: 3   },
  museo:      { label: 'Vetrina museale',               temp: 22, rh: 50, light:200, pollution: 10, cycle: 4   },
  soffitta:   { label: 'Soffitta',                      temp: 28, rh: 35, light: 30, pollution: 25, cycle: 15  },
  cantina:    { label: 'Cantina umida',                 temp: 14, rh: 80, light:  2, pollution: 20, cycle: 6   },
  magazzino:  { label: 'Magazzino non condizionato',    temp: 24, rh: 65, light: 40, pollution: 60, cycle: 10  }
};

// Sensibilità per materiale (moltiplicatori del tasso di degrado per
// meccanismo): "chem" = idrolisi/ossidazione, "mech" = stress meccanico da
// cicli di temperatura e umidità relativa, "bio" = muffe/insetti,
// "photo" = fotodegrado, "poll" = solfuri/ossidi di azoto/ozono.
export const MATERIALS = {
  pergamena: { chem: 1.0, mech: 1.3, bio: 1.2, photo: 0.8, poll: 0.9, name: 'Pergamena' },
  vellum:    { chem: 0.9, mech: 1.2, bio: 1.1, photo: 0.8, poll: 0.9, name: 'Vellum' },
  papiro:    { chem: 1.4, mech: 1.6, bio: 1.0, photo: 1.1, poll: 1.0, name: 'Papiro' }
};
export const BINDINGS = {
  cuoio:        { chem: 1.1, mech: 1.0, bio: 0.9, photo: 1.0, poll: 1.3, name: 'Cuoio pieno' },
  mezzapelle:   { chem: 1.0, mech: 1.0, bio: 0.9, photo: 1.0, poll: 1.2, name: 'Mezza pelle' },
  pergamenata:  { chem: 0.9, mech: 1.3, bio: 1.1, photo: 0.9, poll: 0.9, name: 'Pergamenata floscia' },
  legno:        { chem: 0.8, mech: 1.5, bio: 1.4, photo: 0.7, poll: 0.8, name: 'Assi in legno' }
};
export const INKS = {
  'ferro-gallico': { chem: 1.6, name: 'Inchiostro ferro-gallico' },
  'carbonio':      { chem: 0.7, name: 'Inchiostro al carbonio' },
  'miniati':       { chem: 1.0, photoBoost: 1.4, name: 'Miniature e pigmenti' }
};

// Tasso annuo di degrado in punti su 100 anni.
// Calibrato in modo che in condizioni ideali un volume duri circa 500 anni e
// in condizioni pessime collassi in circa 30 anni.
export function annualRate(env, mat) {
  const { temp, rh, light, pollution, cycle, pest, handling } = env;

  // 1) Componente chimica (Arrhenius semplificato, riferimento 20 gradi
  //    Celsius). Fattore di accelerazione termica pari a circa 2.5 per la
  //    maggior parte dei materiali organici.
  const chem = Math.pow(2.5, (temp - 20) / 10) *
               // Idrolisi più rapida con umidità relativa alta o molto bassa
               (1 + Math.max(0, (rh - 55) / 35) * 1.2 + Math.max(0, (30 - rh) / 30) * 0.6) *
               mat.chem;

  // 2) Componente biologica (muffe attive sopra il 65 % di umidità relativa
  //    in ambiente caldo; insetti fra 18 e 28 gradi Celsius).
  const moldRisk = rh > 65 ? Math.pow((rh - 65) / 20, 1.4) * (temp > 18 ? 1 : 0.4) : 0;
  const insectRisk = (temp > 18 && temp < 30 && rh > 50) ? 0.6 : 0.1;
  const bio = (moldRisk + insectRisk * 0.5 + (pest ? 1.2 : 0)) * mat.bio;

  // 3) Fotodegrado (cumulativo, lineare nell'illuminamento espresso in lux).
  const photo = (light / 50) * 0.6 * mat.photo;

  // 4) Inquinanti (solfuri, ossidi di azoto, ozono).
  const poll = (pollution / 20) * 0.5 * mat.poll;

  // 5) Stress meccanico (cicli di temperatura e umidità relativa,
  //    consultazione frequente del volume).
  const mech = (cycle / 5) * 0.7 * mat.mech + (handling ? 0.4 : 0);

  const total = 0.04 * (chem + bio + photo + poll + mech);
  return { total, breakdown: { chem, bio, photo, poll, mech } };
}

// Indice di degrado cumulato dopo "years" anni (scala 0-100, saturato).
export function damageAt(env, mat, years, ageOffset = 0, danno0 = null) {
  const r = annualRate(env, mat);
  const preesistente = danno0 ?? Math.min(35, ageOffset * 0.02);
  const accumulo = preesistente + r.total * years * 100;
  return { value: Math.min(100, accumulo), rate: r };
}

// Anni residui prima di superare la soglia di degrado severo (70 punti su 100).
export function lifeRemaining(env, mat, ageOffset = 0, danno0 = null) {
  const r = annualRate(env, mat).total * 100;
  if (r <= 0.0001) return 9999;
  const preesistente = danno0 ?? Math.min(35, ageOffset * 0.02);
  return Math.max(0, (70 - preesistente) / r);
}

// Combina materiale del supporto, legatura e inchiostro in un unico set di
// moltiplicatori di sensibilità.
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

// Genera la lista di indicazioni preventive a partire dalla fotografia
// ambientale corrente, scrivendo per esteso tutte le grandezze.
export function predictions(env, mat, ageOffset) {
  const r = annualRate(env, mat);
  const out = [];
  const push = (level, title, text) => out.push({ level, title, text });

  if (env.rh > 65) push('bad', 'Rischio biologico elevato', `Umidità relativa di ${env.rh.toFixed(0)} per cento: favorisce la crescita di muffe; riportarla nell'intervallo 50–55 per cento.`);
  else if (env.rh > 60) push('warn', 'Umidità relativa oltre la soglia raccomandata', 'Mantenere l\'umidità relativa al di sotto del 60 per cento per inibire la microflora fungina.');
  else if (env.rh < 35) push('warn', 'Aria troppo secca', 'Al di sotto del 35 per cento di umidità relativa i supporti collagenei tendono a infragilirsi.');

  if (env.temp > 24) push('bad', 'Temperatura troppo elevata', `Temperatura di ${env.temp.toFixed(0)} gradi Celsius: il tasso di idrolisi raddoppia ogni 5–10 gradi oltre i 20.`);
  else if (env.temp > 21) push('warn', 'Temperatura lievemente alta', 'Riportare la temperatura nell\'intervallo 16–18 gradi Celsius estende la vita stimata.');

  if (env.light > 200) push('bad', 'Illuminamento eccessivo', `Illuminamento di ${env.light.toFixed(0)} lux: rischio di sbiadimento delle miniature e dei cuoi.`);
  else if (env.light > 50) push('warn', 'Esposizione luminosa moderata', 'Mantenere l\'illuminamento al di sotto di 50 lux durante l\'esposizione, con filtri per la radiazione ultravioletta.');

  if (env.pollution > 40) push('bad', 'Concentrazione di inquinanti elevata', 'Solfuri e ossidi di azoto accelerano l\'ossidazione dei cuoi e dei pigmenti.');
  else if (env.pollution > 20) push('warn', 'Filtrare l\'aria in ingresso', 'Adottare filtri a carbone attivo o vetrina sigillata.');

  if (env.cycle > 8) push('bad', 'Cicli giornalieri di temperatura e umidità accentuati', 'Le variazioni rapide producono micro-fratture nei materiali igroscopici.');
  else if (env.cycle > 4) push('warn', 'Stabilità climatica migliorabile', 'Limitare la variazione giornaliera al di sotto del 3 per cento.');

  if (env.pest) push('bad', 'Biodeteriogeni attivi', 'Isolare il volume e attivare un protocollo di lotta integrata contro insetti e muffe.');
  if (env.handling) push('warn', 'Consultazione frequente', 'Adottare leggio dedicato, guanti puliti, digitalizzazione sostitutiva.');

  // Meccanismo dominante
  const b = r.breakdown;
  const max = Math.max(b.chem, b.bio, b.photo, b.poll, b.mech);
  const dom = b.chem === max ? 'chimico (idrolisi e ossidazione)'
            : b.bio   === max ? 'biologico (muffe e insetti)'
            : b.photo === max ? 'fotodegrado'
            : b.poll  === max ? 'da inquinanti atmosferici'
            : 'meccanico (cicli di temperatura e umidità relativa)';
  out.unshift({
    level: out.length ? (out.some((x) => x.level === 'bad') ? 'bad' : 'warn') : 'good',
    title: 'Meccanismo di degrado dominante',
    text: `Il meccanismo principale attualmente attivo è <b>${dom}</b>.`
  });

  if (!out.some((x) => x.level !== 'good')) {
    push('good', 'Condizioni allineate alla norma ISO 11799', 'Tutti i parametri rientrano negli intervalli raccomandati.');
  }
  return out;
}
