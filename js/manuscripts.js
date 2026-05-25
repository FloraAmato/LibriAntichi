// Catalogo dei manoscritti della collezione su cui applichiamo il modello.
// Ogni voce descrive: età anagrafica, composizione dei materiali, stato di
// conservazione (restauro, presenza di muffa, biodeteriogeni), luogo fisico
// di custodia attuale ed eventuali esemplari/rappresentazioni multiple dello
// stesso testimone (gemelli digitali distinti perché custoditi in luoghi
// diversi).
//
// Le sigle non vengono mai usate: ogni grandezza è scritta per esteso
// ("temperatura", "umidità relativa", "illuminamento", "cicli di temperatura
// e umidità", "concentrazione di inquinanti").

export const MANOSCRITTI = [
  {
    id: 'codex-vergilianus',
    titolo: 'Codex Vergilianus Neapolitanus',
    secolo: 'XII secolo',
    etaAnni: 870,
    supporto: 'pergamena',
    composizioneMateriali: {
      supporto: 'Pergamena ovina conciata in calce',
      legatura: 'Assi in legno di faggio rivestite in cuoio bovino',
      inchiostro: 'Inchiostro ferro-gallico, capolettera in minio',
      decorazioni: 'Borchie e cantonali in lega di rame dorata'
    },
    legatura: 'legno',
    inchiostro: 'ferro-gallico',
    restaurato: true,
    annoRestauro: 2014,
    notaRestauro: 'Disinfestazione anossica, rinforzo della cucitura, integrazione lacune con pergamena giapponese.',
    muffa: false,
    biodeteriogeniAttivi: false,
    consultazioneFrequente: false,
    esemplari: [
      {
        id: 'codex-vergilianus-A',
        sigla: 'Esemplare A — Biblioteca Universitaria',
        luogoFisico: 'Biblioteca Universitaria di Napoli, deposito climatizzato',
        condizioneLuogo: 'caveau',
        statoConservazione: 'Buono dopo restauro 2014'
      },
      {
        id: 'codex-vergilianus-B',
        sigla: 'Esemplare B — Vetrina di studio',
        luogoFisico: 'Sala di esposizione permanente, vetrina con luce diffusa',
        condizioneLuogo: 'museo',
        statoConservazione: 'Stabile, leggero ingiallimento del taglio'
      }
    ]
  },
  {
    id: 'liber-arte-medica',
    titolo: 'Liber de Arte Medica',
    secolo: 'XIV secolo',
    etaAnni: 640,
    supporto: 'vellum',
    composizioneMateriali: {
      supporto: 'Vellum di vitello non nato (uterino)',
      legatura: 'Mezza pelle di capra su cartoni rivestiti in carta marmorizzata',
      inchiostro: 'Inchiostro ferro-gallico con tracce di lampblack',
      decorazioni: 'Iniziali miniate con lapislazzuli e foglia oro'
    },
    legatura: 'mezzapelle',
    inchiostro: 'miniati',
    restaurato: false,
    muffa: true,
    notaMuffa: 'Colonie di Aspergillus rilevate sul margine inferiore di 14 carte.',
    biodeteriogeniAttivi: true,
    consultazioneFrequente: false,
    esemplari: [
      {
        id: 'liber-arte-medica-A',
        sigla: 'Esemplare unico',
        luogoFisico: 'Magazzino del Fondo Antico, scaffalatura aperta',
        condizioneLuogo: 'magazzino',
        statoConservazione: 'Critico — biodeteriogeni attivi e umidità non controllata'
      }
    ]
  },
  {
    id: 'statuta-civitatis',
    titolo: 'Statuta Civitatis Neapolis',
    secolo: 'XVI secolo',
    etaAnni: 470,
    supporto: 'pergamena',
    composizioneMateriali: {
      supporto: 'Pergamena bovina di media grammatura',
      legatura: 'Cuoio pieno bruno su assi in legno di quercia, fermagli in ottone',
      inchiostro: 'Inchiostro carbonio (nero fumo) per il testo, minio per le rubriche',
      decorazioni: 'Stemma civico inciso e dorato sul piatto anteriore'
    },
    legatura: 'cuoio',
    inchiostro: 'carbonio',
    restaurato: true,
    annoRestauro: 2002,
    notaRestauro: 'Sostituzione di un fermaglio, pulitura del cuoio con grasso lanolinico.',
    muffa: false,
    biodeteriogeniAttivi: false,
    consultazioneFrequente: true,
    esemplari: [
      {
        id: 'statuta-civitatis-A',
        sigla: 'Esemplare principale',
        luogoFisico: 'Sala di lettura dei rari, leggio dedicato',
        condizioneLuogo: 'biblioteca',
        statoConservazione: 'Discreto — manipolazione frequente'
      },
      {
        id: 'statuta-civitatis-B',
        sigla: 'Copia di servizio rilegata',
        luogoFisico: 'Magazzino non condizionato, scaffalatura chiusa',
        condizioneLuogo: 'magazzino',
        statoConservazione: 'Sufficiente — cicli stagionali marcati'
      },
      {
        id: 'statuta-civitatis-C',
        sigla: 'Esemplare in deposito profondo',
        luogoFisico: 'Caveau climatizzato del polo bibliotecario',
        condizioneLuogo: 'caveau',
        statoConservazione: 'Ottimo'
      }
    ]
  },
  {
    id: 'evangeliarium',
    titolo: 'Evangeliarium Beneventanum',
    secolo: 'XI secolo',
    etaAnni: 980,
    supporto: 'pergamena',
    composizioneMateriali: {
      supporto: 'Pergamena ovina molto sottile, scrittura beneventana',
      legatura: 'Cuoio pieno su assi in legno con costola a cinque nervature',
      inchiostro: 'Inchiostro ferro-gallico, capolettera figurate',
      decorazioni: 'Piatto in argento sbalzato con cabochon (oggi assente)'
    },
    legatura: 'legno',
    inchiostro: 'miniati',
    restaurato: true,
    annoRestauro: 1998,
    notaRestauro: 'Risarcimento della cucitura originale, consolidamento dei capitelli.',
    muffa: false,
    biodeteriogeniAttivi: false,
    consultazioneFrequente: false,
    esemplari: [
      {
        id: 'evangeliarium-A',
        sigla: 'Esemplare unico',
        luogoFisico: 'Caveau climatizzato della Biblioteca Capitolare',
        condizioneLuogo: 'caveau',
        statoConservazione: 'Ottimo'
      }
    ]
  },
  {
    id: 'compendium',
    titolo: 'Compendium Naturalis Historiae',
    secolo: 'XVII secolo',
    etaAnni: 340,
    supporto: 'vellum',
    composizioneMateriali: {
      supporto: 'Vellum bovino sottile',
      legatura: 'Pergamenata floscia, lacci in pelle allumata',
      inchiostro: 'Inchiostro ferro-gallico ad alta corrosività',
      decorazioni: 'Tavole acquerellate con pigmenti vegetali'
    },
    legatura: 'pergamenata',
    inchiostro: 'ferro-gallico',
    restaurato: false,
    muffa: false,
    biodeteriogeniAttivi: false,
    consultazioneFrequente: true,
    esemplari: [
      {
        id: 'compendium-A',
        sigla: 'Esemplare di consultazione',
        luogoFisico: 'Soffitta dell\'archivio storico — ambiente non condizionato',
        condizioneLuogo: 'soffitta',
        statoConservazione: 'Mediocre — escursioni termiche estive importanti'
      },
      {
        id: 'compendium-B',
        sigla: 'Esemplare di riserva',
        luogoFisico: 'Cantina dell\'archivio storico',
        condizioneLuogo: 'cantina',
        statoConservazione: 'A rischio — umidità elevata persistente'
      }
    ]
  },
  {
    id: 'cronaca-re',
    titolo: 'Cronaca dei Re di Napoli',
    secolo: 'XV secolo',
    etaAnni: 575,
    supporto: 'pergamena',
    composizioneMateriali: {
      supporto: 'Pergamena ovina di buona qualità',
      legatura: 'Cuoio pieno marrone su cartoni, dorature ai compartimenti',
      inchiostro: 'Inchiostro ferro-gallico con minio',
      decorazioni: 'Fregi in oro a foglia, ritratti acquerellati'
    },
    legatura: 'cuoio',
    inchiostro: 'miniati',
    restaurato: true,
    annoRestauro: 2021,
    notaRestauro: 'Disacidificazione delle carte di guardia, rinforzo del dorso.',
    muffa: false,
    biodeteriogeniAttivi: false,
    consultazioneFrequente: false,
    esemplari: [
      {
        id: 'cronaca-re-A',
        sigla: 'Esemplare miniato',
        luogoFisico: 'Vetrina permanente del museo del libro',
        condizioneLuogo: 'museo',
        statoConservazione: 'Buono — illuminamento controllato'
      },
      {
        id: 'cronaca-re-B',
        sigla: 'Copia coeva non miniata',
        luogoFisico: 'Biblioteca storica, scaffalatura aperta',
        condizioneLuogo: 'biblioteca',
        statoConservazione: 'Discreto'
      }
    ]
  }
];

// Ritorna il manoscritto e l'esemplare correntemente selezionati a partire
// dagli identificativi memorizzati nello stato dell'applicazione.
export function trovaManoscritto(idManoscritto, idEsemplare) {
  const m = MANOSCRITTI.find((x) => x.id === idManoscritto) ?? MANOSCRITTI[0];
  const e = m.esemplari.find((x) => x.id === idEsemplare) ?? m.esemplari[0];
  return { manoscritto: m, esemplare: e };
}
