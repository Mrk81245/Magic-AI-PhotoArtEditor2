import React, { useState, useCallback, useEffect, useRef } from 'react';
import IconButton from './IconButton';
import { EnhanceIcon, GrayscaleIcon, MagicWandIcon, RedoIcon, ResetIcon, TrashIcon, UndoIcon, NewFileIcon, BrightnessIcon, ContrastIcon, SaturationIcon, SharpnessIcon, SepiaIcon, HueIcon, VignetteIcon, CloseIcon, DayToNightIcon, GoldenHourIcon, ColorSplashIcon, SketchIcon, DownloadIcon, BirthdayIcon, HolidayIcon, ThankYouIcon, LoveIcon, CongratulationsIcon, FriendshipIcon, SpinnerIcon, MicrophoneIcon, LutIcon, CinemaClapperIcon, VintageCameraIcon, PaletteIcon, CircleHalfIcon } from './icons';
import { Adjustments } from '../types';
import { generateInspirationPrompt, generateMagicPrompt, generateLutInspirationPrompt } from '../services/geminiService';

// Fix: Add SpeechRecognition interface and update window declaration to fix type errors.
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onerror: (event: any) => void;
  onresult: (event: any) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const useSpeechRecognition = (options: { onResult: (transcript: string) => void }) => {
  const { onResult } = options;
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("La funzionalità di riconoscimento vocale non è supportata da questo browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'it-IT';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error('Errore nel riconoscimento vocale:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResultRef.current(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);
  
  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return { isListening, startListening, stopListening, isSupported };
};

interface ControlPanelProps {
  adjustments: Adjustments;
  onAdjustmentsChange: (adjustments: Adjustments) => void;
  onApplyEdit: (prompt: string) => void;
  onApplyAdjustments: () => void;
  hasPendingAdjustments: boolean;
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  onReset: () => void;
  canReset: boolean;
  onStartNew: () => void;
  onDownload: () => void;
  activePanel?: 'adjustments' | 'actions' | 'custom' | 'card' | 'lut' | null;
  onClosePanel?: () => void;
}

type Adjustment = keyof Adjustments;

interface AdjustmentSliderProps {
    label: string;
    icon: React.ReactNode;
    value: number;
    onValueChange: (type: Adjustment, value: number) => void;
    type: Adjustment;
    min: string;
    max: string;
    isAiOnly?: boolean;
}

const AdjustmentSlider: React.FC<AdjustmentSliderProps> = React.memo(({ label, icon, value, onValueChange, type, min, max, isAiOnly=false }) => {
    const handleChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
        onValueChange(type, parseInt(e.currentTarget.value, 10));
    }, [onValueChange, type]);

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <span className="w-5 h-5">{icon}</span>
                    {label}
                    {isAiOnly && <span className="text-xs font-bold text-indigo-400 bg-indigo-900/50 px-1.5 py-0.5 rounded-full">AI</span>}
                </label>
                <span className="text-sm font-mono px-2 py-0.5 bg-gray-900 rounded-md">{value}</span>
            </div>
            <input 
                type="range"
                min={min}
                max={max}
                value={value}
                onInput={handleChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
        </div>
    );
});

// Define icons as constants outside components to ensure stable references for memoization
const brightnessIcon = <BrightnessIcon />;
const contrastIcon = <ContrastIcon />;
const saturationIcon = <SaturationIcon />;
const sepiaIcon = <SepiaIcon />;
const hueIcon = <HueIcon />;
const sharpnessIcon = <SharpnessIcon />;
const vignetteIcon = <VignetteIcon />;
const enhanceIcon = <EnhanceIcon />;
const magicWandIcon = <MagicWandIcon />;
const grayscaleIcon = <GrayscaleIcon />;
const trashIcon = <TrashIcon />;
const dayToNightIcon = <DayToNightIcon />;
const goldenHourIcon = <GoldenHourIcon />;
const colorSplashIcon = <ColorSplashIcon />;
const sketchIcon = <SketchIcon />;

const AdjustmentsPanel = React.memo(({ adjustments, onAdjustmentChange, onApply, canApply }: { 
    adjustments: Adjustments; 
    onAdjustmentChange: (type: Adjustment, value: number) => void; 
    onApply: () => void;
    canApply: boolean;
}) => (
    <div>
        <h2 className="text-xl font-semibold mb-3 text-indigo-300">Regolazioni</h2>
        <div className="space-y-4">
            <AdjustmentSlider label="Luminosità" icon={brightnessIcon} value={adjustments.brightness} onValueChange={onAdjustmentChange} type="brightness" min="0" max="200" />
            <AdjustmentSlider label="Contrasto" icon={contrastIcon} value={adjustments.contrast} onValueChange={onAdjustmentChange} type="contrast" min="0" max="200" />
            <AdjustmentSlider label="Saturazione" icon={saturationIcon} value={adjustments.saturation} onValueChange={onAdjustmentChange} type="saturation" min="0" max="200" />
            <AdjustmentSlider label="Seppia" icon={sepiaIcon} value={adjustments.sepia} onValueChange={onAdjustmentChange} type="sepia" min="0" max="100" />
            <AdjustmentSlider label="Tonalità" icon={hueIcon} value={adjustments.hue} onValueChange={onAdjustmentChange} type="hue" min="0" max="360" />
            <AdjustmentSlider label="Nitidezza" icon={sharpnessIcon} value={adjustments.sharpness} onValueChange={onAdjustmentChange} type="sharpness" min="-100" max="100" isAiOnly />
            <AdjustmentSlider label="Vignettatura" icon={vignetteIcon} value={adjustments.vignette} onValueChange={onAdjustmentChange} type="vignette" min="0" max="100" isAiOnly />
        </div>
        <button
            onClick={onApply}
            disabled={!canApply}
            className="mt-4 w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
            Applica Regolazioni AI
        </button>
    </div>
));

const QuickActionsPanel = React.memo(({ onPresetClick }: { onPresetClick: (prompt: string) => void; }) => {
    const [isMagicLoading, setIsMagicLoading] = useState(false);

    const handleMagicClick = useCallback(async () => {
        setIsMagicLoading(true);
        try {
            const magicPrompt = await generateMagicPrompt();
            onPresetClick(magicPrompt);
        } catch (error) {
            console.error("Failed to generate magic prompt:", error);
            // Fallback prompt in case of an unexpected error during generation
            onPresetClick('Applica un effetto magico, quasi fantasy, a questa immagine.');
        } finally {
            setIsMagicLoading(false);
        }
    }, [onPresetClick]);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-3 text-indigo-300">Azioni Rapide</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
                <QuickActionButton icon={enhanceIcon} label="Migliora" onClick={() => onPresetClick(`Sei un tecnico esperto di fotoritocco e restauro digitale. Il tuo unico obiettivo è la perfezione tecnica e il realismo, non l'interpretazione artistica.

**DIRETTIVA FONDAMENTALE E ASSOLUTA:**
È SEVERAMENTE VIETATO scurire l'immagine complessiva o applicare qualsiasi tipo di "velo" o filtro scuro, a meno che l'immagine non sia palesemente e gravemente sovraesposta (aree "bruciate" senza dettagli). Se un'immagine è scura, il tuo unico compito è renderla più luminosa e chiara in modo naturale. Scurire un'immagine già bilanciata o scura è considerato l'errore più grave.

**PROCESSO OPERATIVO OBBLIGATORIO:**

**Fase 1: Analisi Tecnica Avanzata (NON agire prima di aver completato questa fase).**
Valuta l'immagine basandoti su dati tecnici, come se stessi guardando un istogramma e un vectorscopio:
1.  **Esposizione e Contrasto:** L'istogramma è spostato a sinistra (sottoesposta, ombre chiuse), a destra (sovraesposta, alte luci bruciate) o ben distribuito? I neri sono davvero neri (punto del nero) e i bianchi sono davvero bianchi (punto del bianco)? C'è un contrasto piatto (mancanza di dinamica)?
2.  **Bilanciamento del Bianco e Dominanti di Colore:** C'è una dominante di colore innaturale (gialla, blu, magenta, verde)? I toni neutri (grigi, bianchi) sono davvero neutri?
3.  **Saturazione e Vividezza:** I colori sono spenti, sbiaditi e desaturati? O sono già corretti? Evita di aumentare la saturazione se è già adeguata.
4.  **Nitidezza e Dettaglio:** L'immagine è morbida, leggermente sfocata o manca di micro-contrasto e dettaglio?

**Fase 2: Correzione Chirurgica e Mirata.**
Applica una modifica *SOLO SE* hai identificato un problema specifico nella Fase 1. Se un parametro è già corretto, NON TOCCARLO.
- **Se Sottoesposta:** Aumenta l'esposizione, concentrandoti sui mezzitoni. Apri le ombre per recuperare i dettagli senza creare rumore. Non toccare le alte luci se sono corrette.
- **Se Sovraesposta:** Riduci *solo* le alte luci per recuperare i dettagli persi. Non scurire l'intera immagine.
- **Se il Contrasto è Piatto:** Aumenta il contrasto in modo sottile per dare profondità, assicurandoti di non chiudere le ombre o bruciare le alte luci.
- **Se c'è una Dominante di Colore:** Neutralizzala completamente. Se è troppo calda (gialla), aggiungi blu/freddo fino a raggiungere un bilanciamento naturale.
- **Se i Colori sono Spenti:** Aumenta la vividezza (che protegge i toni della pelle) invece della saturazione grezza. L'aumento deve essere lieve e realistico.
- **Se è Morbida:** Applica una nitidezza (sharpening) precisa e sottile per esaltare i dettagli esistenti, senza creare aloni o artefatti.

**Obiettivo Finale:** Il risultato deve essere un'immagine pulita, chiara, bilanciata e realistica, come se fosse stata scattata in condizioni di luce perfette con attrezzatura professionale. Non deve sembrare "modificata" o "filtrata".`)} />
                <QuickActionButton icon={magicWandIcon} label="Magia" onClick={handleMagicClick} isLoading={isMagicLoading} />
                <QuickActionButton icon={grayscaleIcon} label="Bianco e Nero" onClick={() => onPresetClick('Converti questa immagine in un bianco e nero ad alto contrasto.')} />
                <QuickActionButton icon={trashIcon} label="Rimuovi Sfondo" onClick={() => onPresetClick('Rimuovi perfettamente lo sfondo da questa immagine, lasciando solo il soggetto principale. Rendi lo sfondo trasparente.')} />
                <QuickActionButton icon={dayToNightIcon} label="Giorno > Notte" onClick={() => onPresetClick('Trasforma questa foto da giorno a notte. Aggiungi un realistico chiaro di luna, ombre e magari qualche stella nel cielo.')} />
                <QuickActionButton icon={goldenHourIcon} label="Ora d'oro" onClick={() => onPresetClick("Immergi questa immagine nella luce calda, morbida e radente dell'ora d'oro, poco prima del tramonto. Esalta i toni caldi e crea ombre lunghe e morbide.")} />
                <QuickActionButton icon={colorSplashIcon} label="Splash Colore" onClick={() => onPresetClick('Converti questa immagine in bianco e nero, ma mantieni il soggetto principale nei suoi colori originali e vivaci.')} />
                <QuickActionButton icon={sketchIcon} label="Bozzetto" onClick={() => onPresetClick('Trasforma questa foto in un bozzetto a matita dettagliato. Dovrebbe sembrare disegnato a mano con linee chiare e ombreggiature, su una texture simile alla carta.')} />
            </div>
        </div>
    );
});


const CustomEditPanel = React.memo(({ onCustomSubmit }: { onCustomSubmit: (prompt: string) => void; }) => {
    const [prompt, setPrompt] = useState('');

    const handleTranscript = useCallback((transcript: string) => {
        setPrompt(prev => (prev.trim() ? prev.trim() + ' ' : '') + transcript);
    }, []);

    const { isListening, startListening, stopListening, isSupported } = useSpeechRecognition({ onResult: handleTranscript });


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onCustomSubmit(prompt);
            setPrompt('');
        }
    };
    
    return (
        <div>
            <h2 className="text-xl font-semibold mb-3 text-indigo-300">Modifica AI Personalizzata</h2>
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="es. 'Aggiungi un tramonto sullo sfondo'"
                        className="w-full h-24 p-2 pr-12 bg-gray-900 border-2 border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    {isSupported && (
                        <button
                            type="button"
                            onClick={isListening ? stopListening : startListening}
                            title={isListening ? 'Ferma dettatura' : 'Avvia dettatura'}
                            aria-label={isListening ? 'Ferma dettatura' : 'Avvia dettatura'}
                            className={`absolute bottom-2.5 right-2.5 p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 ${
                                isListening
                                ? 'bg-red-600 text-white animate-pulse'
                                : 'bg-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white'
                            }`}
                        >
                            <MicrophoneIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="mt-3 w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    Applica con AI
                </button>
            </form>
        </div>
    );
});


const InspirationButton = ({ icon, label, onClick, isLoading }: { icon: React.ReactNode; label: string; onClick: () => void; isLoading?: boolean; }) => (
    <button onClick={onClick} disabled={isLoading} className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg hover:bg-indigo-600 transition-colors group w-full text-left disabled:bg-gray-600 disabled:cursor-wait">
        <div className="w-6 h-6 text-gray-300 group-hover:text-white flex items-center justify-center">
            {isLoading ? <SpinnerIcon className="animate-spin"/> : icon}
        </div>
        <span className="text-sm font-medium text-gray-300 group-hover:text-white">{label}</span>
    </button>
);


type InspirationCategory = 'birthday' | 'holiday' | 'thankYou' | 'romantic' | 'congratulations' | 'friendship';


const GreetingCardPanel = React.memo(({ onCardSubmit }: { onCardSubmit: (prompt: string) => void; }) => {
    const [prompt, setPrompt] = useState('');
    const [inspiritingCategory, setInspiritingCategory] = useState<InspirationCategory | null>(null);

    const handleTranscript = useCallback((transcript: string) => {
        setPrompt(prev => (prev.trim() ? prev.trim() + ' ' : '') + transcript);
    }, []);

    const { isListening, startListening, stopListening, isSupported } = useSpeechRecognition({ onResult: handleTranscript });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            const finalPrompt = `Utilizzando il soggetto principale (persona, animale domestico, ecc.) dell'immagine fornita, crea un bellissimo e moderno biglietto di auguri. Il tema è: "${prompt}". Integra il soggetto senza soluzione di continuità nella nuova scena. Il biglietto deve essere visivamente sbalorditivo e ben composto.`;
            onCardSubmit(finalPrompt);
            setPrompt('');
        }
    };
    
    const handleInspirationClick = async (category: InspirationCategory, theme: string) => {
        setInspiritingCategory(category);
        try {
            const newPrompt = await generateInspirationPrompt(theme);
            setPrompt(newPrompt);
        } catch (error) {
            console.error("Failed to generate inspiration:", error);
            setPrompt(`Un errore ha impedito di generare un'ispirazione. Prova con: una scena a tema ${theme}.`);
        } finally {
            setInspiritingCategory(null);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-3 text-indigo-300">Biglietto con IA</h2>
            <p className="text-sm text-gray-400 mb-3">Descrivi un tema e l'IA inserirà il soggetto della tua foto in un biglietto di auguri personalizzato!</p>
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="es. 'Una festa di compleanno con palloncini e una torta'"
                        className="w-full h-24 p-2 pr-12 bg-gray-900 border-2 border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    {isSupported && (
                        <button
                            type="button"
                            onClick={isListening ? stopListening : startListening}
                            title={isListening ? 'Ferma dettatura' : 'Avvia dettatura'}
                            aria-label={isListening ? 'Ferma dettatura' : 'Avvia dettatura'}
                            className={`absolute bottom-2.5 right-2.5 p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 ${
                                isListening
                                ? 'bg-red-600 text-white animate-pulse'
                                : 'bg-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white'
                            }`}
                        >
                            <MicrophoneIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                 <button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="mt-3 w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    Genera Biglietto
                </button>
            </form>
            <div className="mt-4">
                 <h3 className="text-lg font-semibold mb-2 text-gray-300">Lasciati Ispirare</h3>
                 <div className="grid grid-cols-2 gap-2">
                    <InspirationButton icon={<BirthdayIcon />} label="Compleanno" onClick={() => handleInspirationClick('birthday', 'Compleanno')} isLoading={inspiritingCategory === 'birthday'} />
                    <InspirationButton icon={<HolidayIcon />} label="Feste" onClick={() => handleInspirationClick('holiday', 'Feste')} isLoading={inspiritingCategory === 'holiday'} />
                    <InspirationButton icon={<ThankYouIcon />} label="Ringraziamenti" onClick={() => handleInspirationClick('thankYou', 'Ringraziamento')} isLoading={inspiritingCategory === 'thankYou'} />
                    <InspirationButton icon={<LoveIcon />} label="Romantico" onClick={() => handleInspirationClick('romantic', 'Romantico')} isLoading={inspiritingCategory === 'romantic'} />
                    <InspirationButton icon={<CongratulationsIcon />} label="Congratulazioni" onClick={() => handleInspirationClick('congratulations', 'Congratulazioni')} isLoading={inspiritingCategory === 'congratulations'} />
                    <InspirationButton icon={<FriendshipIcon />} label="Amicizia" onClick={() => handleInspirationClick('friendship', 'Amicizia')} isLoading={inspiritingCategory === 'friendship'} />
                 </div>
            </div>
        </div>
    );
});

const lutCategories = [
  {
    name: 'Cinematografici',
    icon: <CinemaClapperIcon />,
    luts: [
      { name: 'Teal & Orange', prompt: "Applica un color grade cinematografico 'Teal and Orange'. Sposta le ombre e i toni freddi verso il ciano/verde acqua, e i toni della pelle e le alte luci verso l'arancione/giallo per creare un look vibrante e contrastato." },
      { name: 'Gotham (The Batman)', prompt: "Crea un look scuro, grintoso e desaturato ispirato a 'The Batman'. Dominante di colori freddi, blu e grigi, con neri profondi e un contrasto elevato. Le uniche fonti di colore caldo, come le esplosioni, devono essere vivide." },
      { name: 'Blade Runner 2049', prompt: "Applica un'estetica cyberpunk da 'Blade Runner 2049'. Scegli una dominante forte e suggestiva: o l'arancione polveroso delle scene desertiche o il blu/magenta al neon delle scene cittadine. Contrasto elevato e ombre cupe." },
      { name: 'Stile Wes Anderson', prompt: "Emula lo stile di Wes Anderson. Applica una palette di colori pastello, con gialli, rosa e azzurri dominanti. Aumenta leggermente la saturazione e mantieni un contrasto bilanciato per un look simmetrico e pulito." },
      { name: 'Mad Max: Fury Road', prompt: "Crea il look post-apocalittico di 'Mad Max: Fury Road'. Aumenta drasticamente il contrasto e la nitidezza. Applica una forte dominante arancione/gialla al deserto e ciano/blu al cielo. I colori devono essere estremamente saturi." },
      { name: 'Amélie', prompt: "Applica l'atmosfera sognante di 'Amélie'. Esalta i toni caldi, specialmente i rossi e i verdi, rendendoli ricchi e saturi. Aggiungi un leggero 'glow' o effetto flou per un'atmosfera magica e romantica." },
      { name: 'Matrix', prompt: "Crea il look iconico di 'Matrix'. Applica una dominante verde su tutta l'immagine, specialmente nelle ombre e nei mezzitoni. Aumenta il contrasto e desatura leggermente gli altri colori per un aspetto freddo e tecnologico." },
      { name: 'Salvate il Soldato Ryan', prompt: "Applica il look da film di guerra di 'Salvate il Soldato Ryan'. Desatura quasi completamente i colori, aumenta il contrasto e la grana per un aspetto crudo, realistico e documentaristico. Usa la tecnica 'bleach bypass'." },
      { name: 'Joker', prompt: "Crea l'atmosfera cupa e realistica di 'Joker'. Applica una palette di colori sporchi e desaturati, con dominanti di giallo, verde e marrone. Il look deve essere grintoso, con ombre profonde e un'aria di decadenza." },
      { name: 'Dune', prompt: "Emula l'estetica epica di 'Dune'. Applica una palette di colori quasi monocromatica con toni sabbia, ocra e grigio. Desatura i colori, mantieni un contrasto morbido e un'atmosfera vasta e maestosa." },
      { name: 'O Brother, Where Art Thou?', prompt: "Applica un viraggio seppia completo, come nel film 'O Brother, Where Art Thou?'. Desatura i colori e applica una dominante calda e gialla per un look da Sud America degli anni '30." },
      { name: 'Sin City', prompt: "Crea lo stile grafico di 'Sin City'. Trasforma l'immagine in un bianco e nero ad altissimo contrasto, con neri assoluti e bianchi puri. Isola e mantieni un singolo colore vivido (es. rosso, giallo) per un effetto 'color splash'." },
      { name: 'Grand Budapest Hotel', prompt: "Applica la palette di 'Grand Budapest Hotel'. Utilizza colori pastello come rosa, viola e rosso, con un'alta saturazione e un look pulito e simmetrico. L'atmosfera deve essere eccentrica e nostalgica." },
      { name: 'Fight Club', prompt: "Crea l'estetica underground di 'Fight Club'. Applica una dominante verde/gialla sporca, desatura i colori, aumenta il contrasto e la grana per un look grintoso, industriale e inquietante." },
      { name: 'Il Padrino', prompt: "Emula l'atmosfera de 'Il Padrino'. Applica toni caldi e dorati, con ombre profonde e scure che nascondono i dettagli. Il look deve essere ricco, classico e malinconico, con un basso contrasto generale." },
      { name: 'Drive', prompt: "Applica un look notturno e stilizzato ispirato a 'Drive'. Usa una palette di colori al neon, con rosa, blu elettrico e arancione che dominano la scena. Le ombre devono essere profonde e i contrasti netti." },
      { name: 'La La Land', prompt: "Crea l'aspetto vibrante di 'La La Land'. Emula il look del Technicolor, aumentando la saturazione di tutti i colori, specialmente i primari (blu, rosso, giallo). L'immagine deve apparire sognante, vivida e piena di energia." },
      { name: 'Il Signore degli Anelli', prompt: "Applica un'estetica fantasy epica. Per scene luminose, esalta i verdi e i blu naturali. Per scene cupe (es. Mordor), desatura i colori e applica una dominante fredda o color cenere. Il look deve essere grandioso." },
      { name: 'Tarantino Kill Bill', prompt: "Applica lo stile di Tarantino. Aumenta la saturazione, specialmente dei rossi e dei gialli. Aggiungi un leggero contrasto e una tonalità calda per un look retrò, ispirato ai film di kung-fu anni '70." },
      { name: 'Blockbuster Moderno', prompt: "Crea un look da blockbuster moderno. Aumenta il contrasto, desatura leggermente i colori tranne i primari (rosso, blu), e aggiungi una vignettatura sottile per concentrare l'attenzione. Le ombre devono essere profonde con una leggera dominante fredda." },
      { name: 'Fantascienza Fredda', prompt: "Crea un'atmosfera da film di fantascienza. Desatura i colori, applica una forte dominante ciano e blu, specialmente nelle ombre e nei mezzitoni. Aumenta la nitidezza per un look tecnologico e pulito." },
      { name: 'Avventura Epica', prompt: "Dai un look da film d'avventura. Esalta i colori naturali (verdi, blu del cielo, toni della terra), aumenta leggermente la saturazione e il contrasto per dare profondità e un senso di grandiosità alla scena." },
    ]
  },
  {
    name: 'Vintage e Pellicola',
    icon: <VintageCameraIcon />,
    luts: [
      { name: 'Kodachrome \'70s', prompt: "Applica un look da pellicola vintage anni '70, stile Kodachrome. Esalta i toni caldi (gialli, rossi), desatura leggermente i blu, aumenta leggermente il contrasto e aggiungi una grana della pellicola molto sottile." },
      { name: 'Polaroid Sbiadita', prompt: "Crea l'effetto di una vecchia foto Polaroid. Abbassa il contrasto (neri lattiginosi), applica una dominante calda (gialla/magenta), e desatura leggermente i colori per un look nostalgico e sbiadito dal tempo." },
      { name: 'Technicolor Anni \'50', prompt: "Emula il glorioso Technicolor degli anni '50. Aumenta drasticamente la saturazione dei colori, rendendo i rossi, i blu e i gialli estremamente vividi e quasi surreali. Contrasto medio-alto per un look da musical classico." },
      { name: 'Verdi Fuji', prompt: "Emula una pellicola Fuji. Rendi i verdi profondi e lussureggianti, i blu leggermente ciano, e i toni della pelle morbidi e naturali. Mantieni un contrasto bilanciato e una saturazione realistica." },
      { name: 'Blu Agfa', prompt: "Crea il look tipico delle pellicole Agfa. Esalta i toni blu rendendoli profondi e leggermente desaturati, mentre i rossi devono essere vibranti. Aggiungi una leggera grana per un tocco analogico." },
      { name: 'Pellicola Scaduta', prompt: "Simula una pellicola scaduta. Introduci dominanti di colore inaspettate (magenta nelle ombre, verde nelle alte luci), aumenta la grana, e riduci leggermente la nitidezza. L'effetto deve essere imprevedibile." },
      { name: 'Lomografia', prompt: "Applica un effetto Lomo. Aumenta la saturazione e il contrasto, crea una forte vignettatura scura ai bordi e introduci una leggera dominante di colore (es. ciano o magenta) per un look artistico e imperfetto." },
      { name: 'Daguerrotipo', prompt: "Crea l'aspetto di un antico dagherrotipo. Converti in bianco e nero, aumenta il contrasto e la nitidezza, e applica una leggerissima dominante blu/fredda per simulare l'effetto metallico della lastra d'argento." },
      { name: 'Autochrome Lumière', prompt: "Simula una foto Autochrome. Riduci la saturazione, applica un effetto 'glow' morbido, e aggiungi una texture puntinista molto sottile per un look sognante e pittorico, tipico delle prime foto a colori." },
      { name: 'Cartolina Sbiadita', prompt: "Crea un look da vecchia cartolina. Desatura i colori, applica una dominante gialla/marrone per simulare l'invecchiamento della carta, e riduci leggermente il contrasto per un aspetto piatto e nostalgico." },
      { name: 'Film 8mm', prompt: "Emula un vecchio filmato 8mm. Aumenta la grana, applica una dominante calda (ambra/gialla), e riduci la nitidezza. Aggiungi una vignettatura sottile e un leggero tremolio se possibile." },
      { name: 'Bleach Bypass', prompt: "Applica la tecnica 'bleach bypass'. Aumenta drasticamente il contrasto, desatura quasi completamente i colori, e aumenta la grana. Il risultato è un look crudo, metallico e ad alto impatto." },
      { name: 'Cross Processing (X-Pro)', prompt: "Simula il cross-processing. Aumenta il contrasto, sposta i colori in modo imprevedibile (es. ombre blu/verdi, alte luci gialle/rosse) e aumenta la saturazione per un look stilizzato e unico." },
      { name: 'Pellicola Portra 400', prompt: "Emula la pellicola Kodak Portra 400. Mantieni i toni della pelle estremamente naturali e piacevoli, con colori caldi, grana fine e un contrasto morbido. Ideale per ritratti." },
      { name: 'Pellicola Ektar 100', prompt: "Crea il look della pellicola Kodak Ektar 100. Aumenta la saturazione, specialmente dei rossi e dei blu, mantieni una grana quasi invisibile e un'alta nitidezza. Perfetto per paesaggi." },
      { name: 'Cianotipia', prompt: "Applica l'effetto della cianotipia. Converti l'immagine in una tonalità monocromatica blu di Prussia profonda. Il contrasto dovrebbe essere elevato per un look da stampa antica." },
      { name: 'Sepia Classico', prompt: "Applica un viraggio seppia classico ed elegante. Converti l'immagine in monocromatico e poi colorala con una tonalità marrone calda e ricca. Mantieni un buon range di contrasto." },
      { name: 'Infrarosso a Colori (Aerochrome)', prompt: "Simula la pellicola a infrarossi a colori. Trasforma i verdi (fogliame) in rosso o magenta brillante, il cielo in blu scuro e mantieni i toni della pelle pallidi per un look surreale e psichedelico." },
      { name: 'Pellicola Cinestill 800T', prompt: "Emula la pellicola Cinestill 800T per scene notturne. Aggiungi un alone rosso ('halation') intorno alle fonti di luce intensa, mantieni i neri profondi con una dominante verde/ciano e una grana piacevole." },
      { name: 'Look da Diapositiva', prompt: "Crea l'aspetto di una diapositiva proiettata. Aumenta leggermente la saturazione e il contrasto, e applica una leggerissima dominante magenta per simulare la luce del proiettore." },
      { name: 'Fotocamera a Soffietto', prompt: "Simula una foto scattata con una vecchia fotocamera a soffietto. Applica un viraggio seppia o monocromatico, aggiungi una forte vignettatura e riduci la nitidezza ai bordi, mantenendola al centro." },
      { name: 'Stampa al Platino', prompt: "Emula una stampa al platino/palladio. Crea un bianco e nero con una gamma tonale molto ampia, neri non completamente chiusi, un contrasto morbido e una leggera tonalità calda. L'aspetto deve essere lussuoso e artistico." },
    ]
  },
  {
    name: 'Moderni e d\'Atmosfera',
    icon: <PaletteIcon />,
    luts: [
        { name: 'Foresta Umida', prompt: "Crea un'atmosfera 'moody forest'. Desatura i colori, specialmente i gialli e i rossi. Esalta i verdi e i blu, rendendoli più scuri e profondi. Aggiungi un leggero contrasto e una sensazione di umidità e mistero." },
        { name: 'Urbano Freddo', prompt: "Applica un look urbano e freddo. Desatura l'immagine, aumenta il contrasto e la nitidezza per esaltare le texture del cemento e del metallo. Aggiungi una dominante di colore blu/grigia nelle ombre." },
        { name: 'Sogno Californiano', prompt: "Crea un'atmosfera sognante e calda, tipica della California. Aumenta l'esposizione, applica una dominante dorata/arancione, schiarisci le ombre e riduci leggermente la nitidezza per un effetto morbido e luminoso." },
        { name: 'Pastello Delicato', prompt: "Applica un look pastello. Riduci il contrasto (effetto 'matte' sulle ombre), schiarisci l'immagine, e sposta i colori verso tonalità pastello morbide e luminose come rosa, celeste e menta." },
        { name: 'Alta Moda', prompt: "Crea un look da rivista di alta moda. Desatura leggermente i colori, aumenta il contrasto per un look pulito e deciso, e assicurati che i toni della pelle siano naturali ma impeccabili. L'immagine deve apparire sofisticata." },
        { name: 'Dark & Moody', prompt: "Applica un look 'Dark and Moody'. Scurisci l'esposizione generale, aumenta il contrasto per creare ombre profonde, e desatura i colori tranne uno o due toni chiave (es. verdi o arancioni). Aggiungi una vignettatura." },
        { name: 'Light & Airy', prompt: "Crea un look 'Light and Airy'. Aumenta notevolmente l'esposizione, schiarisci le ombre per ridurre il contrasto, e applica una leggera dominante pastello (rosa o pesca). L'immagine deve sembrare luminosa e fresca." },
        { name: 'Cyberpunk Neon', prompt: "Infonde l'immagine con un'atmosfera cyberpunk. Aumenta il contrasto, rendi i neri profondi e aggiungi riflessi al neon di colore magenta, ciano e blu elettrico nelle aree scure e illuminate." },
        { name: 'Cottagecore', prompt: "Applica un'estetica 'Cottagecore'. Esalta i toni caldi e terrosi (verdi, marroni), aggiungi una luce morbida e dorata, e riduci leggermente il contrasto per un'atmosfera nostalgica, rurale e accogliente." },
        { name: 'Minimalista', prompt: "Crea un look pulito e minimalista. Desatura i colori, aumenta la luminosità e il contrasto per enfatizzare le linee e le forme. L'immagine deve apparire semplice, ordinata e moderna." },
        { name: 'Ora Blu', prompt: "Emula l'atmosfera dell'ora blu. Applica una profonda dominante di colore blu/indaco su tutta l'immagine, mantieni un contrasto morbido e una luce soffusa. Le luci artificiali calde devono risaltare." },
        { name: 'Tropicale Vibrante', prompt: "Esplodi i colori per un look tropicale. Satura al massimo i verdi e i ciano, aumenta la luminosità e mantieni un contrasto elevato per un'atmosfera solare, energetica e vacanziera." },
        { name: 'Grintoso Urbano Notturno', prompt: "Crea un look da strada notturno. Aumenta il contrasto, applica una dominante fredda nelle ombre, ed esalta le luci artificiali (arancioni, gialle). Aggiungi nitidezza per enfatizzare le texture della città." },
        { name: 'Sogno Infrarosso', prompt: "Simula l'effetto della fotografia a infrarossi. Trasforma il fogliame e i verdi in tonalità di bianco, rosa o magenta, e rendi il cielo di un blu profondo o quasi nero per un paesaggio surreale e alieno." },
        { name: 'Gotico Romantico', prompt: "Applica un'atmosfera gotica. Desatura i colori, ma rendi i rossi e i viola profondi e ricchi. Aumenta il contrasto per creare ombre drammatiche e un'atmosfera misteriosa e passionale." },
        { name: 'Look da Drone', prompt: "Ottimizza per foto aeree. Aumenta la chiarezza e il contrasto per definire i dettagli, satura leggermente i colori per renderli vividi dall'alto, e applica una leggera dominante calda per un aspetto più invitante." },
        { name: 'Atmosfera Cinerea', prompt: "Crea un look desaturato e cinereo. Rimuovi quasi tutto il colore, lasciando solo una traccia di tonalità fredde. Aumenta il contrasto per un aspetto desolato, post-apocalittico o minimalista." },
        { name: 'Colori Analogici Caldi', prompt: "Applica una palette di colori caldi e nostalgici, tipica della fotografia analogica. Esalta arancioni, gialli e marroni, schiarisci leggermente i neri (effetto matte) e aggiungi una grana sottile." },
        { name: 'Split Toning Freddo/Caldo', prompt: "Applica uno 'split toning' classico. Infonde le ombre con una tonalità fredda (blu o ciano) e le alte luci con una tonalità calda (giallo o arancione) per creare profondità e un look cinematografico." },
        { name: 'Atmosfera da Thriller', prompt: "Crea tensione con un color grade da thriller. Applica una dominante verde/ciano desaturata, aumenta il contrasto per creare ombre minacciose e sottoesponi leggermente l'immagine." },
        { name: 'Food Blogger Luminoso', prompt: "Crea un look ideale per la fotografia di cibo. Aumenta l'esposizione e la luminosità, satura leggermente i colori per rendere il cibo appetitoso e mantieni un contrasto pulito e nitido." },
        { name: 'Paesaggio Autunnale', prompt: "Esplosione di colori autunnali. Esalta i toni caldi come rosso, arancione e giallo, aumenta la saturazione e aggiungi un contrasto morbido per un'atmosfera accogliente e vibrante." },
    ]
  },
  {
    name: 'Bianco e Nero',
    icon: <CircleHalfIcon />,
    luts: [
        { name: 'Noir Intenso', prompt: "Converti in un bianco e nero drammatico ad alto contrasto (film noir). Assicurati che i neri siano profondi e le alte luci siano brillanti, ma non bruciate. Aumenta la nitidezza per esaltare i dettagli e le texture." },
        { name: 'Ritratto Morbido', prompt: "Crea un bianco e nero morbido e lusinghiero per i ritratti. Riduci leggermente il contrasto, mantieni una vasta gamma di toni di grigio e assicurati che i passaggi tonali sulla pelle siano graduali e delicati." },
        { name: 'Look Opaco (Matte)', prompt: "Applica un effetto 'matte' al bianco e nero. Solleva il punto del nero in modo che i neri più profondi diventino grigio scuro, creando un look moderno, cinematografico e leggermente sbiadito." },
        { name: 'Argento Classico', prompt: "Emula l'aspetto di una stampa alla gelatina d'argento. Crea un bianco e nero con un contrasto ricco, neri profondi, bianchi brillanti e una gamma tonale completa. Aggiungi una grana della pellicola molto fine e realistica." },
        { name: 'Infrarosso Surreale', prompt: "Simula la fotografia a infrarossi in bianco e nero. Rendi il fogliame (verdi) quasi bianco, il cielo (blu) molto scuro e aumenta il contrasto per un look etereo e surreale." },
        { name: 'Ansel Adams (Zone System)', prompt: "Crea un bianco e nero ispirato ad Ansel Adams. Massimizza la gamma dinamica, con neri profondi ma dettagliati, bianchi brillanti ma non bruciati, e una ricca scala di grigi intermedi. Aumenta la nitidezza." },
        { name: 'High Key', prompt: "Applica un look 'high key'. Rendi l'immagine molto luminosa, con la maggior parte dei toni nelle alte luci e nei mezzitoni chiari. Le ombre devono essere minime, creando un'atmosfera eterea, pulita e ottimista." },
        { name: 'Low Key', prompt: "Applica un look 'low key'. Rendi l'immagine molto scura, con la maggior parte dei toni nelle ombre e nei mezzitoni scuri. Usa la luce per scolpire il soggetto, creando un'atmosfera drammatica, intima e misteriosa." },
        { name: 'Street Photography Grintosa', prompt: "Crea un bianco e nero grintoso per la street photography. Aumenta il contrasto e la grana in modo significativo per un look crudo, immediato e senza fronzoli. I neri possono essere schiacciati." },
        { name: 'Architettura Grafica', prompt: "Ottimizza per l'architettura. Aumenta il contrasto al massimo per enfatizzare linee, forme e texture. Il cielo dovrebbe essere quasi nero per far risaltare gli edifici. L'immagine deve essere nitida e pulita." },
        { name: 'Filtro Rosso Intenso', prompt: "Simula l'uso di un filtro rosso su pellicola B&N. Aumenta drasticamente il contrasto, rende il cielo blu quasi nero e schiarisce i toni della pelle e i colori rossi. Effetto molto drammatico." },
        { name: 'Filtro Verde Naturale', prompt: "Simula l'uso di un filtro verde. Schiarisce il fogliame e i toni verdi, e offre una separazione tonale naturale e piacevole, specialmente nei ritratti all'aperto." },
        { name: 'Viraggio al Selenio', prompt: "Emula una stampa virata al selenio. Applica al bianco e nero una leggerissima dominante viola/melanzana nelle ombre più profonde, aggiungendo profondità e ricchezza tonale." },
        { name: 'Viraggio Blu Freddo', prompt: "Applica un viraggio blu al bianco e nero. Infonde l'intera immagine con una tonalità fredda e bluastra, creando un'atmosfera malinconica, notturna o invernale." },
        { name: 'Grana Grossa (Pushed Film)', prompt: "Simula una pellicola B&N 'spinta' in fase di sviluppo. Aumenta notevolmente il contrasto e aggiungi una grana della pellicola grossa e molto visibile per un look crudo e reportagistico." },
        { name: 'Effetto Orton Morbido', prompt: "Applica un 'effetto Orton' al bianco e nero. Sovrapponi una versione sfocata e una nitida dell'immagine, creando un look sognante e luminoso con dettagli nitidi che emergono da una luce diffusa." },
        { name: 'Solarizzazione (Effetto Sabattier)', prompt: "Crea l'effetto della solarizzazione. Inverti parzialmente i toni dell'immagine, specialmente lungo i bordi ad alto contrasto, creando un alone scuro intorno agli oggetti chiari per un look surreale e artistico." },
        { name: 'Wet Plate Collodion', prompt: "Emula l'aspetto di una vecchia foto al collodio umido. Crea un bianco e nero con un contrasto elevato, aggiungi imperfezioni come macchie e graffi, e una vignettatura marcata. L'immagine deve sembrare un artefatto storico." },
        { name: 'Look Metallico', prompt: "Crea un bianco e nero con un aspetto freddo e metallico. Aumenta la chiarezza e il microcontrasto, e applica una leggera dominante blu/neutra. Ideale per macchinari, architettura e ritratti maschili intensi." },
        { name: 'Contrasto Morbido da Ritratto', prompt: "Crea un B&N con contrasto molto basso e una gamma tonale ampia. I neri sono grigio scuro e i bianchi sono grigio chiaro. Ideale per ritratti delicati e scene contemplative." },
        { name: 'Stampa Sbiadita', prompt: "Simula una vecchia stampa B&N sbiadita dal tempo. Riduci il contrasto, solleva i neri a un grigio medio, e applica una leggera dominante gialla o marrone per un look usurato e nostalgico." },
        { name: 'Infrarosso Drammatico', prompt: "Simula la fotografia a infrarossi in bianco e nero. Rendi il fogliame (verdi) quasi bianco, il cielo (blu) molto scuro e aumenta il contrasto per un look etereo e surreale." },
    ]
  },
];

const LutPanel = React.memo(({ onApplyEdit }: { onApplyEdit: (prompt: string) => void; }) => {
    const [customPrompt, setCustomPrompt] = useState('');
    const [isLoadingInspiration, setIsLoadingInspiration] = useState(false);
    const [openCategory, setOpenCategory] = useState<string | null>('Cinematografici');

    const handlePresetClick = (prompt: string) => {
        const finalPrompt = `Sei un colorist professionista. Applica un color grading (LUT) all'immagine basato sulla seguente descrizione: "${prompt}". Concentrati sulla modifica dei colori, del contrasto e dell'atmosfera generale per raggiungere questo look, mantenendo i dettagli dell'immagine originale.`;
        onApplyEdit(finalPrompt);
    };
    
    const handleToggleCategory = (categoryName: string) => {
        setOpenCategory(prev => prev === categoryName ? null : categoryName);
    };

    const handleInspirationClick = async () => {
        setIsLoadingInspiration(true);
        try {
            const inspiration = await generateLutInspirationPrompt();
            setCustomPrompt(inspiration);
        } catch (error) {
            console.error("Failed to generate LUT inspiration:", error);
            setCustomPrompt("Atmosfera cinematografica con colori caldi e ombre profonde.");
        } finally {
            setIsLoadingInspiration(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customPrompt.trim()) {
            handlePresetClick(customPrompt);
            setCustomPrompt('');
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-3 text-indigo-300">LUT e Colore</h2>
            <div className="space-y-2 mb-6">
                {lutCategories.map(category => (
                    <div key={category.name}>
                        <button
                            onClick={() => handleToggleCategory(category.name)}
                            className="w-full flex items-center justify-between p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-5 h-5 text-indigo-300">{category.icon}</span>
                                <span className="font-semibold text-gray-200">{category.name}</span>
                            </div>
                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${openCategory === category.name ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {openCategory === category.name && (
                            <div className="pt-2 pl-2 pr-1">
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-2">
                                    {category.luts.map(lut => (
                                        <button 
                                            key={lut.name}
                                            onClick={() => handlePresetClick(lut.prompt)}
                                            className="text-left text-sm p-2 bg-gray-900/50 rounded-md hover:bg-indigo-600 hover:text-white transition-colors text-gray-300"
                                        >
                                            {lut.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

             <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-300">Crea Stile Personale</h3>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Descrivi un'atmosfera o un look..."
                        className="w-full h-20 p-2 bg-gray-900 border-2 border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            type="button"
                            onClick={handleInspirationClick}
                            disabled={isLoadingInspiration}
                            className="flex-1 bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-700 disabled:bg-gray-500 transition-colors flex items-center justify-center gap-2"
                        >
                           {isLoadingInspiration ? <SpinnerIcon className="animate-spin w-5 h-5"/> : <MagicWandIcon className="w-5 h-5"/>}
                            Ispirami
                        </button>
                        <button
                            type="submit"
                            disabled={!customPrompt.trim()}
                            className="flex-1 bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            Applica Stile
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});


const HistoryControls = React.memo(({ onUndo, canUndo, onRedo, canRedo, onReset, canReset, onStartNew, onDownload }: {
    onUndo: () => void; canUndo: boolean; onRedo: () => void; canRedo: boolean; onReset: () => void; canReset: boolean; onStartNew: () => void; onDownload: () => void;
}) => (
    <div>
        <h2 className="text-xl font-semibold mb-3 text-indigo-300">Cronologia e Azioni</h2>
        <div className="flex items-center justify-between gap-2">
            <IconButton onClick={onUndo} disabled={!canUndo} tooltip="Annulla"><UndoIcon /></IconButton>
            <IconButton onClick={onRedo} disabled={!canRedo} tooltip="Ripeti"><RedoIcon /></IconButton>
            <IconButton onClick={onReset} disabled={!canReset} tooltip="Ripristina Originale"><ResetIcon /></IconButton>
            <IconButton onClick={onDownload} tooltip="Scarica Immagine"><DownloadIcon /></IconButton>
            <IconButton onClick={onStartNew} tooltip="Nuovo Progetto"><NewFileIcon /></IconButton>
        </div>
    </div>
));


const ControlPanel: React.FC<ControlPanelProps> = ({ 
    adjustments,
    onAdjustmentsChange,
    onApplyEdit,
    onApplyAdjustments,
    hasPendingAdjustments,
    onUndo,
    canUndo,
    onRedo,
    canRedo,
    onReset,
    canReset,
    onStartNew,
    onDownload,
    activePanel,
    onClosePanel
}) => {

  const handleApplyEdit = useCallback((prompt: string) => {
    onApplyEdit(prompt);
    if(onClosePanel) onClosePanel();
  }, [onApplyEdit, onClosePanel]);

  const handleApplyAdjustments = useCallback(() => {
    onApplyAdjustments();
    if(onClosePanel) onClosePanel();
  }, [onApplyAdjustments, onClosePanel]);
  
  const handleAdjustmentChange = useCallback((type: Adjustment, value: number) => {
    onAdjustmentsChange({ ...adjustments, [type]: value });
  }, [onAdjustmentsChange, adjustments]);

  const panelContent = {
      adjustments: <AdjustmentsPanel adjustments={adjustments} onAdjustmentChange={handleAdjustmentChange} onApply={handleApplyAdjustments} canApply={hasPendingAdjustments} />,
      actions: <QuickActionsPanel onPresetClick={handleApplyEdit} />,
      custom: <CustomEditPanel onCustomSubmit={handleApplyEdit} />,
      card: <GreetingCardPanel onCardSubmit={handleApplyEdit} />,
      lut: <LutPanel onApplyEdit={handleApplyEdit} />
  };

  return (
    <>
      {/* --- Desktop Sidebar --- */}
      <div className="hidden lg:flex w-full lg:w-1/3 p-4 bg-gray-800/60 rounded-xl shadow-lg flex-col gap-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
        <HistoryControls onUndo={onUndo} canUndo={canUndo} onRedo={onRedo} canRedo={canRedo} onReset={onReset} canReset={canReset} onStartNew={onStartNew} onDownload={onDownload} />
        <LutPanel onApplyEdit={handleApplyEdit} />
        <QuickActionsPanel onPresetClick={handleApplyEdit} />
        <GreetingCardPanel onCardSubmit={handleApplyEdit} />
        <AdjustmentsPanel adjustments={adjustments} onAdjustmentChange={handleAdjustmentChange} onApply={handleApplyAdjustments} canApply={hasPendingAdjustments} />
        <CustomEditPanel onCustomSubmit={handleApplyEdit} />
      </div>

      {/* --- Mobile Drawer --- */}
      <div className={`fixed bottom-0 left-0 right-0 z-20 lg:hidden bg-gray-800/80 backdrop-blur-lg rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.3)]
        transition-transform duration-300 ease-in-out ${activePanel ? 'translate-y-0' : 'translate-y-full'}`} style={{height: '45vh'}}>
        
        <button onClick={onClosePanel} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white">
            <CloseIcon className="w-6 h-6"/>
        </button>

        <div className="h-full overflow-y-auto p-4 pt-6">
            {activePanel && panelContent[activePanel]}
        </div>
      </div>
    </>
  );
};

interface QuickActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isLoading?: boolean;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = React.memo(({ icon, label, onClick, isLoading = false }) => (
    <button onClick={onClick} disabled={isLoading} className="flex flex-col items-center justify-center p-3 bg-gray-700 rounded-lg hover:bg-indigo-600 transition-colors group disabled:bg-gray-600 disabled:cursor-wait">
        <div className="w-8 h-8 text-gray-300 group-hover:text-white flex items-center justify-center">
            {isLoading ? <SpinnerIcon className="animate-spin" /> : icon}
        </div>
        <span className="mt-1 text-xs font-medium text-gray-300 group-hover:text-white">{label}</span>
    </button>
));

export default React.memo(ControlPanel);