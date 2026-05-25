# LibriAntichi · Digital twin del libro antico

Web app statica che simula il degrado di un volume antico in funzione del
materiale, della legatura, dell'inchiostro e delle condizioni di conservazione.
Fornisce un avatar 3D che evolve nel tempo e una **early prediction** dei
fattori di rischio.

## Caratteristiche

- Avatar 3D del volume (Three.js) con copertina in cuoio, borchie e dorature
  che si appannano, pagine che ingialliscono, macchie di foxing che emergono e
  micro-deformazioni man mano che il danno aumenta.
- Dashboard per impostare:
  - **Materiale**: pergamena, vellum, papiro (no carta — è un libro antico).
  - **Legatura**: cuoio pieno, mezza pelle, pergamenata, assi in legno.
  - **Inchiostri**: ferro-gallico (corrosione attiva), carbonio, miniati.
  - **Età stimata** del volume (200 → 1000 anni).
- Sei **locazioni** preset (caveau, biblioteca, museo, soffitta, cantina,
  magazzino) con T/UR/lux/inquinanti/cicli precaricati.
- Slider per **temperatura, umidità relativa, illuminamento, inquinanti,
  cicli T/UR**, presenza di biodeteriogeni, consultazione frequente.
- Slider temporale 0–200 anni e simulazione "play".
- KPI in tempo reale: **indice di degrado 0–100**, **aspettativa residua**,
  anno simulato.
- Lista di **early prediction** con il fattore dominante (chimico, biologico,
  fotodegrado, inquinanti, meccanico) e raccomandazioni operative.

## Modello

Il calcolo è didattico e prende spunto da:

- **ISO 11799** — intervalli raccomandati T/UR per supporti pergamenacei.
- **Q10 ≈ 2.5** — raddoppio del tasso di idrolisi/ossidazione ogni ~5–10 °C
  oltre i 20 °C.
- **Michalski Lifetime Multiplier** — combinazione moltiplicativa dei fattori
  ambientali sulla vita relativa di un materiale.

I cinque meccanismi modellati: **chimico** (T, UR), **biologico** (UR>65 %,
T 18–30 °C, presenza biodeteriogeni), **fotodegrado** (lux cumulati),
**inquinanti** (PM2.5/NOx/solfuri), **meccanico** (cicli T/UR, manipolazione).

> Modello educational, non sostituisce una diagnosi conservativa professionale.

## Come pubblicarla sul web

1. Pusha il branch su GitHub.
2. Nelle **Settings → Pages** del repository scegli "GitHub Actions" come
   source. Il workflow `.github/workflows/pages.yml` pubblica il sito a ogni
   push.
3. L'URL pubblico appare in **Actions → Deploy to GitHub Pages → page_url**.

## Sviluppo locale

Apri `index.html` con qualsiasi server statico (Three.js è caricato via CDN):

```bash
python3 -m http.server 8000
# poi visita http://localhost:8000
```

## Struttura

```
.
├── index.html            # markup + import map Three.js
├── styles.css            # tema "libro antico"
├── js/
│   ├── main.js           # binding dashboard + KPI
│   ├── book3d.js         # avatar 3D Three.js + texture procedurali
│   └── degradation.js    # modello tasso annuo, vita residua, prediction
└── .github/workflows/pages.yml   # deploy automatico
```
