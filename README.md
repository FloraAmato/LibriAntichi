# LibriAntichi · Digital twin del manoscritto antico

Web app statica che simula il degrado di un manoscritto antico in funzione del
materiale, della legatura, dell'inchiostro, dello stato di conservazione e
del luogo fisico in cui è custodito. Fornisce un avatar tridimensionale che
evolve nel tempo e una **previsione preventiva** dei fattori di rischio.

Il progetto è organizzato in **due fasi**:

1. **Approccio a regole** — modello deterministico ispirato alla norma
   ISO 11799, al fattore di accelerazione termica e al moltiplicatore di vita
   di Michalski.
2. **Modello stocastico applicato ai nostri manoscritti** — per ogni
   esemplare costruiamo **cento scenari ambientali** plausibili attorno al
   profilo del luogo di custodia e calcoliamo la distribuzione della vita
   residua, il tempo di anticipo per l'intervento conservativo e la frazione
   di scenari che porta a stati critici.

## Catalogo dei manoscritti

L'applicazione non lavora su un campione astratto: il modello viene
applicato ai manoscritti effettivamente custoditi nella nostra collezione.
Per ciascun testimone sono descritti:

- **Età anagrafica** (secolo e anni).
- **Composizione dei materiali**: supporto, legatura, inchiostro,
  decorazioni.
- **Stato di conservazione**: se è stato **restaurato** (anno e tipo di
  intervento), se presenta **muffa** o altri biodeteriogeni attivi, se è
  oggetto di consultazione frequente.
- **Esemplari multipli**: lo stesso manoscritto può essere rappresentato da
  più copie/esemplari, ciascuno custodito in un **luogo fisico** diverso
  (caveau, biblioteca, museo, soffitta, cantina, magazzino).

## Modello a regole (Fase 1)

I cinque meccanismi modellati sono: **chimico** (idrolisi e ossidazione, in
funzione di temperatura e umidità relativa), **biologico** (muffe sopra il
65 per cento di umidità relativa in ambiente caldo, insetti fra 18 e 30
gradi Celsius), **fotodegrado** (illuminamento cumulativo in lux),
**inquinanti** (solfuri, ossidi di azoto, ozono) e **meccanico** (cicli
giornalieri di temperatura e umidità relativa, manipolazione).

Le grandezze sono sempre scritte per esteso, senza sigle.

## Modello stocastico (Fase 2)

Per ciascun esemplare selezionato vengono generate cento traiettorie
ambientali con perturbazioni gaussiane attorno al profilo del luogo di
custodia. La distribuzione risultante di vita residua è caratterizzata da:

- **Mediana** (cinquantesimo percentile).
- **Scenario pessimistico** (quinto percentile).
- **Scenario ottimistico** (novantacinquesimo percentile).
- **Tempo di anticipo per l'intervento conservativo** (decimo percentile):
  margine utile per programmare un'azione prima che il dieci per cento degli
  scenari raggiunga lo stato di degrado severo.
- **Frazione di scenari critici** (vita residua inferiore a trent'anni).

I risultati vengono mostrati come istogramma della distribuzione della vita
residua e come tabella di esempi dei singoli scenari.

## Pubblicazione

1. Push del branch su GitHub.
2. In **Settings → Pages** scegli "GitHub Actions" come source. Il workflow
   `.github/workflows/pages.yml` pubblica il sito a ogni push.

## Sviluppo locale

```bash
python3 -m http.server 8000
# poi visita http://localhost:8000
```

## Struttura

```
.
├── index.html               # markup, due fasi, dashboard
├── styles.css               # tema "libro antico"
├── js/
│   ├── main.js              # binding dashboard, fasi e modello stocastico
│   ├── book3d.js            # avatar tridimensionale (Three.js)
│   ├── degradation.js       # modello a regole
│   ├── manuscripts.js       # catalogo dei manoscritti
│   └── scenarios.js         # cento scenari Monte Carlo
└── .github/workflows/pages.yml
```

> Modello didattico, non sostituisce una diagnosi conservativa professionale.
