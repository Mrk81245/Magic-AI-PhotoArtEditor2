
export interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

export interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  sepia: number;
  hue: number;
  vignette: number;
}
