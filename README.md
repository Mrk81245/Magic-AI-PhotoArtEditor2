<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

Questa repository ora contiene sia il frontend (Vite + React) sia un backend Express che protegge la chiave Gemini.

## Struttura

- `/` → frontend Vite.
- `/server` → backend Express che invia le richieste a Gemini.

## Variabili d'ambiente

- Frontend: crea/aggiorna `.env.local` con `VITE_API_BASE_URL=http://localhost:3000` (o l'URL del backend in produzione).
- Backend: definisci `API_KEY=la_tua_chiave_Gemini`.

## Avvio in locale (passo-passo)

1. Installa le dipendenze del frontend  
   ```bash
   npm install
   ```
2. Installa le dipendenze del backend  
   ```bash
   cd server
   npm install
   ```
3. Avvia il backend (da `/server`)  
   ```bash
   API_KEY=INSERISCI_LA_TUA_CHIAVE npm start
   ```
   Lascia questa finestra aperta: il server ascolta su `http://localhost:3000`.
4. In un nuovo terminale (nella cartella principale) avvia il frontend  
   ```bash
   npm run dev
   ```
5. Apri `http://localhost:5173` nel browser e prova l'app. Il frontend chiamerà automaticamente il backend.

## Deploy backend su Render (spiega passo passo)

1. Carica questa repository su GitHub.
2. Su [render.com](https://render.com) crea un nuovo **Web Service** collegando il repo. Quando richiesta, seleziona la cartella `server`.
3. Configura:
   - **Runtime**: Node.
   - **Build Command**: `npm install`.
   - **Start Command**: `npm start`.
   - **Environment Variables**: aggiungi `API_KEY` con la tua chiave Gemini.
4. Al termine del deploy Render ti fornirà un URL tipo `https://nome-service.onrender.com`. Copialo: ti servirà per il frontend.

## Deploy frontend (Render Static, Vercel o Netlify)

1. Sempre dallo stesso repo crea un nuovo **Static Site** (Render) oppure un progetto su Vercel/Netlify.
2. Configura la build:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Aggiungi la variabile `VITE_API_BASE_URL` con l'URL del backend ottenuto da Render (`https://nome-service.onrender.com`).
4. Una volta pubblicato, apri l'URL del frontend e verifica caricando un'immagine: tutte le richieste passeranno in modo sicuro dal backend su Render.

Se vuoi aggiungere autenticazione o limiti d'uso, puoi inserire middleware aggiuntivi nel server Express (per esempio `express-rate-limit` oppure controlli sull'origine) prima di fare il deploy.
