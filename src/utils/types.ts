export type CropStatus = 'perfect' | 'needs_crop';

export interface CameraCropBox {
  x: number;
  y: number;
  width: number;
  height: number;
  status: CropStatus;
  color: string;
}

export interface DisplayCropBox {
  x: number;
  y: number;
  width: number;
  height: number;
  status: CropStatus;
  color: string;
}

export interface FrameAnalysis {
  brightness: number;
  contrast: number;
  subjectPosition: {
    x: number;
    y: number;
    confidence: number;
  };
  compositionScore: number;
  ruleOfThirds: boolean;
  cameraResolution: {
    width: number;
    height: number;
  };
}

export interface CameraState {
  isStreaming: boolean;
  stream: MediaStream | null;
  error: string | null;
  cameraCrop: CameraCropBox | null;
  analysis: FrameAnalysis | null;
  windowSize: { width: number; height: number };
  isWindowTooSmall: boolean;
  suggestion: string;
  setStream: (stream: MediaStream | null) => void;
  setError: (error: string | null) => void;
  setCameraCrop: (crop: CameraCropBox | null) => void;
  setAnalysis: (analysis: FrameAnalysis | null) => void;
  setWindowSize: (size: { width: number; height: number }) => void;
  setIsWindowTooSmall: (tooSmall: boolean) => void;
  setSuggestion: (suggestion: string) => void;
}

export const CROP_COLORS: Record<CropStatus, string> = {
  perfect: '#00D26A',
  needs_crop: '#FF3366',
};

export const WINDOW_TOO_SMALL_COLOR = '#FF6B35';
export const MIN_WINDOW_WIDTH = 800;
export const MIN_WINDOW_HEIGHT = 600;
export const ANALYSIS_INTERVAL = 500;
export const ANALYSIS_WIDTH = 160;
export const ANALYSIS_HEIGHT = 120;

export interface VideoLayout {
  offsetX: number;
  offsetY: number;
  scale: number;
  displayWidth: number;
  displayHeight: number;
}
