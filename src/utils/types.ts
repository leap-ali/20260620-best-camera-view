export type CropStatus = 'too_small' | 'perfect' | 'needs_crop';

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
  suggestion: string;
  setStream: (stream: MediaStream | null) => void;
  setError: (error: string | null) => void;
  setCameraCrop: (crop: CameraCropBox | null) => void;
  setAnalysis: (analysis: FrameAnalysis | null) => void;
  setWindowSize: (size: { width: number; height: number }) => void;
  setSuggestion: (suggestion: string) => void;
}

export const CROP_COLORS: Record<CropStatus, string> = {
  too_small: '#FF6B35',
  perfect: '#00D26A',
  needs_crop: '#FF3366',
};

export const TOO_SMALL_THRESHOLD = 0.5;
export const PERFECT_THRESHOLD = 0.85;
export const MIN_CAMERA_WIDTH = 640;
export const MIN_CAMERA_HEIGHT = 480;
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
