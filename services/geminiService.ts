
// Custom error for safety-related API blocks
export class SafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafetyError';
  }
}

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');

type BackendError = { error?: string };

const handleResponse = async <T>(response: Response): Promise<T> => {
  let data: T | BackendError;
  try {
    data = await response.json();
  } catch {
    data = {} as BackendError;
  }

  if (!response.ok) {
    const message = (data as BackendError).error || 'Errore inatteso dal server.';
    if (response.status === 403) {
      throw new SafetyError(message);
    }
    throw new Error(message);
  }
  return data as T;
};

const post = async <T>(endpoint: string, body?: Record<string, unknown>): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body ?? {})
    });
    return handleResponse<T>(response);
  } catch (error) {
    console.error(`Request to ${endpoint} failed`, error);
    throw new Error('Impossibile contattare il server. Verifica la connessione e riprova.');
  }
};

type EditImageResponse = { imageBase64: string };
type PromptResponse = { prompt: string };

export const editImageWithGemini = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  const data = await post<EditImageResponse>('/api/edit', {
    imageBase64: base64Image,
    mimeType,
    prompt
  });
  return data.imageBase64;
};

export const generateInspirationPrompt = async (theme: string): Promise<string> => {
  const data = await post<PromptResponse>('/api/inspiration', { theme });
  return data.prompt;
};

export const generateMagicPrompt = async (): Promise<string> => {
  const data = await post<PromptResponse>('/api/magic');
  return data.prompt;
};

export const generateLutInspirationPrompt = async (): Promise<string> => {
  const data = await post<PromptResponse>('/api/lut');
  return data.prompt;
};
