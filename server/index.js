import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Modality } from '@google/genai';

class SafetyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SafetyError';
  }
}

if (!process.env.API_KEY) {
  console.error('Missing API_KEY environment variable');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanBase64 = (base64String) => base64String.split(',')[1] || base64String;

const styles = [
  'acquerello', 'fantasy epico', 'minimalista e moderno', 'cyberpunk con neon',
  'fiabesco e incantato', 'arte astratta', 'stile fumetto vintage',
  'fotorealistico e cinematografico', 'surreale e onirico', 'pixel art', 'art deco',
  'steampunk', 'impressionista'
];

const settings = [
  'su una spiaggia tropicale al tramonto', 'in una foresta magica illuminata da lanterne',
  'in una metropoli futuristica', 'su una cima montuosa innevata',
  'dentro un castello medievale', 'in un giardino segreto fiorito',
  'sulla luna con la Terra sullo sfondo', 'in un accogliente caffè parigino',
  "sott'acqua tra coralli luminosi", 'in un vasto campo di girasoli',
  'in una stazione spaziale orbitante', 'in un villaggio pittoresco', 'nel deserto di notte'
];

const moods = [
  'gioioso e celebrativo', 'sereno e pacifico', 'misterioso e intrigante',
  'energico e vibrante', 'nostalgico e sognante', 'accogliente e confortevole',
  'avventuroso ed emozionante', 'elegante e sofisticato', 'spiritoso e divertente',
  'epico e grandioso', 'tranquillo e rilassante'
];

const magicalStyles = [
  'etereo e luminoso', 'oscuro e misterioso', 'incantato e fiabesco',
  'cosmico e celestiale', 'cristallino e iridescente', 'gotico e spettrale',
  'steampunk con ingranaggi luminosi', 'organico e bioluminescente'
];

const magicalElements = [
  'particelle di luce danzanti', "nebbia incantata colorata", "un'aura di energia crepitante",
  'cristalli fluttuanti che rifrangono la luce', 'fiori che sbocciano istantaneamente',
  'scie di energia arcobaleno', 'rune antiche che brillano debolmente', 'polvere di stelle che cade dolcemente'
];

const magicalMoods = [
  'sognante e surreale', 'potente ed epico', 'sereno e tranquillo',
  'giocoso e stravagante', 'antico e solenne', 'malinconico ma bellissimo'
];

const colorPalettes = [
  'toni caldi della terra (ocra, terracotta, marrone)', 'toni freddi e desaturati (blu acciaio, grigio, ciano)',
  'colori pastello sognanti (rosa, lavanda, menta)', 'palette monocromatica con un unico colore accentuato',
  'colori vibranti e al neon (magenta, verde acido, blu elettrico)', 'toni autunnali (ruggine, oro, bordeaux)'
];

const lightingStyles = [
  'luce morbida e diffusa da giorno nuvoloso', 'contrasto forte e drammatico da luce solare diretta',
  'atmosfera cupa e misteriosa con ombre profonde', 'luce calda e dorata del tramonto',
  'illuminazione eterea e retroilluminata', 'look opaco con ombre schiarite (matte look)'
];

const filmStocks = [
  'emulazione di una pellicola cinematografica moderna', 'look vintage di una pellicola sbiadita',
  'bianco e nero ad alto contrasto', 'look pulito e commerciale', 'grana della pellicola sottile e organica'
];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const buildErrorResponse = (error) => {
  if (error instanceof SafetyError) {
    return { status: 403, message: error.message };
  }
  return { status: 500, message: error.message || 'Errore interno' };
};

const editImageWithGemini = async (base64Image, mimeType, prompt) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64(base64Image),
            mimeType
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseModalities: [Modality.IMAGE]
    }
  });

  const candidate = response.candidates?.[0];
  if (!candidate) {
    throw new Error("L'IA non ha restituito una risposta valida.");
  }
  if (candidate.finishReason === 'SAFETY') {
    throw new SafetyError('Richiesta bloccata per motivi di sicurezza.');
  }
  if (candidate.finishReason && candidate.finishReason !== 'STOP') {
    throw new Error(`Elaborazione interrotta, motivo: ${candidate.finishReason}`);
  }
  for (const part of candidate.content?.parts || []) {
    if (part.inlineData) {
      const newBase64 = part.inlineData.data;
      const newMimeType = part.inlineData.mimeType;
      return `data:${newMimeType};base64,${newBase64}`;
    }
  }
  throw new Error("Nessun dato immagine trovato nella risposta dell'API.");
};

const generateInspirationPrompt = async (theme) => {
  const randomStyle = getRandomElement(styles);
  const randomSetting = getRandomElement(settings);
  const randomMood = getRandomElement(moods);

  const prompt = `Sei un generatore di idee estremamente creativo. Il tuo compito è creare un prompt per un'altra IA che genera immagini.
Crea una descrizione breve, originale e VISIVAMENTE d'impatto per un biglietto di auguri.

Regole ferree:
1. La descrizione deve essere sempre diversa e inaspettata.
2. Deve essere in italiano.
3. Massimo 15 parole.
4. Rispondi SOLO con la descrizione, nient'altro.

Ecco gli elementi da combinare in modo creativo:
- Tema principale: "${theme}"
- Stile artistico: "${randomStyle}"
- Ambientazione: "${randomSetting}"
- Atmosfera: "${randomMood}"

Esempio di output: "Un gatto festeggia il compleanno sulla luna in stile acquerello."

Ora tocca a te. Sii audace.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  if (response.candidates?.[0]?.finishReason === 'SAFETY') {
    throw new SafetyError('La generazione del suggerimento è stata bloccata per motivi di sicurezza.');
  }

  const text = response.text?.trim().replace(/["']/g, '');
  if (!text) {
    throw new Error("La risposta dell'API per l'ispirazione era vuota.");
  }
  return text;
};

const generateMagicPrompt = async () => {
  const randomStyle = getRandomElement(magicalStyles);
  const randomElement = getRandomElement(magicalElements);
  const randomMood = getRandomElement(magicalMoods);

  const prompt = `Sei un artigiano di incantesimi visivi per un'IA di fotoritocco. Il tuo compito è creare un prompt breve e descrittivo (massimo 15 parole) per trasformare una foto esistente, applicando un effetto magico unico e sorprendente. Il prompt deve essere un'istruzione diretta e chiara per l'IA che eseguirà la modifica. Sii creativo e visivamente evocativo. Rispondi SOLO con il prompt, nient'altro, e in italiano. Combina in modo originale uno stile '${randomStyle}', elementi come '${randomElement}' e un'atmosfera '${randomMood}'. Esempio di output: Avvolgi il soggetto in un'aura eterea di particelle di luce danzanti.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  if (response.candidates?.[0]?.finishReason === 'SAFETY') {
    throw new SafetyError('La generazione del suggerimento magico è stata bloccata per motivi di sicurezza.');
  }

  const text = response.text?.trim().replace(/["']/g, '');
  if (!text) {
    throw new Error("La risposta dell'API per il suggerimento magico era vuota.");
  }
  return text;
};

const generateLutInspirationPrompt = async () => {
  const palette = getRandomElement(colorPalettes);
  const lighting = getRandomElement(lightingStyles);
  const film = getRandomElement(filmStocks);

  const prompt = `Sei un colorist professionista. Il tuo compito è creare un prompt descrittivo per un'IA che applicherà un color grade (LUT) a un'immagine. Sii evocativo e tecnico.
        
Regole:
1. Massimo 20 parole.
2. Rispondi SOLO con la descrizione, nient'altro.
3. Deve essere in italiano.

Combina in modo creativo questi elementi:
- Palette colori: "${palette}"
- Stile di illuminazione: "${lighting}"
- Ispirazione pellicola: "${film}"

Esempio: Un look cinematografico con toni della terra caldi e ombre fredde e profonde.

Tocca a te.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  if (response.candidates?.[0]?.finishReason === 'SAFETY') {
    throw new SafetyError('La generazione del suggerimento LUT è stata bloccata per motivi di sicurezza.');
  }

  const text = response.text?.trim().replace(/["']/g, '');
  if (!text) {
    throw new Error("La risposta dell'API per l'ispirazione LUT era vuota.");
  }
  return text;
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/edit', async (req, res) => {
  const { imageBase64, mimeType, prompt } = req.body || {};
  if (!imageBase64 || !mimeType || !prompt) {
    return res.status(400).json({ error: 'imageBase64, mimeType e prompt sono obbligatori.' });
  }

  try {
    const editedImage = await editImageWithGemini(imageBase64, mimeType, prompt);
    res.json({ imageBase64: editedImage });
  } catch (error) {
    console.error('Edit error:', error);
    const { status, message } = buildErrorResponse(error);
    res.status(status).json({ error: message });
  }
});

app.post('/api/inspiration', async (req, res) => {
  const { theme = '' } = req.body || {};
  try {
    const prompt = await generateInspirationPrompt(theme);
    res.json({ prompt });
  } catch (error) {
    console.error('Inspiration error:', error);
    const { status, message } = buildErrorResponse(error);
    res.status(status).json({ error: message });
  }
});

app.post('/api/magic', async (_req, res) => {
  try {
    const prompt = await generateMagicPrompt();
    res.json({ prompt });
  } catch (error) {
    console.error('Magic error:', error);
    const { status, message } = buildErrorResponse(error);
    res.status(status).json({ error: message });
  }
});

app.post('/api/lut', async (_req, res) => {
  try {
    const prompt = await generateLutInspirationPrompt();
    res.json({ prompt });
  } catch (error) {
    console.error('LUT error:', error);
    const { status, message } = buildErrorResponse(error);
    res.status(status).json({ error: message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
