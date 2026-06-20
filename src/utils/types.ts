export type CropStatus = 'too_small' | 'perfect' | 'needs_crop';

export interface CropBox {
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
}

export interface CameraState {
  isStreaming: boolean;
  stream: MediaStream | null;
  error: string | null;
  currentCrop: CropBox | null;
  analysis: FrameAnalysis | null;
  windowSize: { width: number; height: number };
  suggestion: string;
  setStream: (stream: MediaStream | null) => void;
  setError: (error: string | null) => void;
  setCrop: (crop: CropBox | null) => void;
  setAnalysis: (analysis: FrameAnalysis | null) => void;
  setWindowSize: (size: { width: number; height: number }) => void;
  setSuggestion: (suggestion: string) => void;
}

export const CROP_COLORS: Record<CropStatus, string> = {
  too_small: '#FF6B35',
  perfect: '#00D26A',
  needs_crop: '#FF3366',
};

export const MIN_WINDOW_WIDTH = 800;
export const MIN_WINDOW_HEIGHT = 600;
export const ANALYSIS_INTERVAL = 500;
export const ANALYSIS_WIDTH = 160;
export const ANALYSIS_HEIGHT = 120;
