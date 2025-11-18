
import React, { useState, useCallback } from 'react';
import { editImageWithGemini, SafetyError } from './services/geminiService';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import EditorWorkspace from './components/EditorWorkspace';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ImageFile, Adjustments } from './types';

const initialAdjustments: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sharpness: 0,
  sepia: 0,
  hue: 0,
  vignette: 0,
};

const generateAdjustmentPrompt = (adjustments: Adjustments): string => {
    const descriptions: string[] = [];
    const { brightness, contrast, saturation, sharpness, sepia, hue, vignette } = adjustments;

    const getStrength = (value: number, isPercentage: boolean, isCentered: boolean = true): string => {
        const base = isCentered ? 100 : 0;
        const absValue = isPercentage ? Math.abs(value - base) : Math.abs(value);
        if (absValue <= 20) return "a tiny amount";
        if (absValue <= 40) return "slightly";
        if (absValue <= 60) return "moderately";
        if (absValue <= 80) return "significantly";
        return "dramatically";
    }

    if (brightness !== 100) {
        const direction = brightness > 100 ? 'increase' : 'decrease';
        descriptions.push(`${direction} the brightness ${getStrength(brightness, true)}`);
    }
    if (contrast !== 100) {
        const direction = contrast > 100 ? 'increase' : 'decrease';
        descriptions.push(`${direction} the contrast ${getStrength(contrast, true)}`);
    }
    if (saturation !== 100) {
        const direction = saturation > 100 ? 'increase' : 'decrease';
        descriptions.push(`${direction} the color saturation ${getStrength(saturation, true)}`);
    }
    if (sharpness !== 0) {
        const direction = sharpness > 0 ? 'increase' : 'decrease';
        descriptions.push(`${direction} the sharpness ${getStrength(sharpness, false, false)}`);
    }
    if (vignette > 0) {
        descriptions.push(`add a ${getStrength(vignette, false, false)} vignette effect`);
    }
     if (sepia !== 0) {
        descriptions.push(`add a ${getStrength(sepia, false, false)} sepia tone`);
    }
    if (hue !== 0) {
        descriptions.push(`shift the hue of the colors`);
    }
    
    if (descriptions.length === 0) return "";

    return `Apply the following image adjustments: ${descriptions.join(', ')}.`;
};


const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustments>(initialAdjustments);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const updateHistory = (newImageBase64: string) => {
    const newHistory = imageHistory.slice(0, currentImageIndex + 1);
    newHistory.push(newImageBase64);
    setImageHistory(newHistory);
    setCurrentImageIndex(newHistory.length - 1);
    setAdjustments(initialAdjustments);
  };
  
  const executeEdit = useCallback(async (prompt: string) => {
    if (currentImageIndex < 0 || !imageFile) return;

    setIsLoading(true);
    setError(null);
    
    const currentImageBase64 = imageHistory[currentImageIndex];

    try {
      const newImageBase64 = await editImageWithGemini(currentImageBase64, imageFile.mimeType, prompt);
      updateHistory(newImageBase64);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Si è verificato un errore sconosciuto. Riprova.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, imageHistory, currentImageIndex]);

  const handleApplyAdjustments = useCallback(() => {
    const adjustmentPrompt = generateAdjustmentPrompt(adjustments);
    if (adjustmentPrompt) {
        executeEdit(adjustmentPrompt);
    }
  }, [adjustments, executeEdit]);
  
  const handleApplyAIPrompt = useCallback((basePrompt: string) => {
    if (basePrompt) {
        executeEdit(basePrompt);
    }
  }, [executeEdit]);

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setAdjustments(initialAdjustments);
    try {
      const base64 = await fileToBase64(file);
      setImageFile({
        base64,
        mimeType: file.type,
        name: file.name
      });
      setImageHistory([base64]);
      setCurrentImageIndex(0);
    } catch (err) {
      setError('Caricamento immagine non riuscito. Riprova.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadImage = useCallback(() => {
    if (currentImageIndex < 0) return;
    const link = document.createElement('a');
    link.href = imageHistory[currentImageIndex];
    link.download = `edited-${imageFile?.name || 'image.png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentImageIndex, imageHistory, imageFile]);

  const undo = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setAdjustments(initialAdjustments);
    }
  }, [currentImageIndex]);

  const redo = useCallback(() => {
    if (currentImageIndex < imageHistory.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setAdjustments(initialAdjustments);
    }
  }, [currentImageIndex, imageHistory.length]);

  const reset = useCallback(() => {
    if (imageHistory.length > 0) {
      setCurrentImageIndex(0);
      setAdjustments(initialAdjustments);
    }
  }, [imageHistory.length]);
  
  const startNew = useCallback(() => {
    setImageFile(null);
    setImageHistory([]);
    setCurrentImageIndex(-1);
    setError(null);
    setAdjustments(initialAdjustments);
  }, []);

  const currentImage = imageHistory[currentImageIndex] || null;
  const originalImage = imageHistory[0] || null;
  const hasPendingAdjustments = JSON.stringify(adjustments) !== JSON.stringify(initialAdjustments);

  return (
    <div className="min-h-screen h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      {isLoading && <LoadingOverlay />}
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-0 md:p-8 overflow-hidden">
        {error && (
          <div className="absolute top-20 bg-red-500 text-white p-3 rounded-lg shadow-lg z-30" role="alert">
            <p>{error}</p>
          </div>
        )}
        {!currentImage ? (
          <div className="w-full max-w-lg p-4">
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>
        ) : (
          <EditorWorkspace
            imageSrc={currentImage}
            originalImageSrc={originalImage}
            adjustments={adjustments}
            onApplyEdit={handleApplyAIPrompt}
            onApplyAdjustments={handleApplyAdjustments}
            hasPendingAdjustments={hasPendingAdjustments}
            onUndo={undo}
            canUndo={currentImageIndex > 0}
            onRedo={redo}
            canRedo={currentImageIndex < imageHistory.length - 1}
            onReset={reset}
            canReset={currentImageIndex > 0 || hasPendingAdjustments}
            onStartNew={startNew}
            onAdjustmentsChange={setAdjustments}
            onDownload={handleDownloadImage}
          />
        )}
      </main>
    </div>
  );
};

export default App;
