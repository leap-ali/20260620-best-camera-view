import { create } from 'zustand';
import { CameraState } from '@/utils/types';

export const useCameraStore = create<CameraState>((set) => ({
  isStreaming: false,
  stream: null,
  error: null,
  cameraCrop: null,
  analysis: null,
  windowSize: { width: window.innerWidth, height: window.innerHeight },
  isWindowTooSmall:
    window.innerWidth < 800 || window.innerHeight < 600,
  suggestion: '',

  setStream: (stream) => set({ stream, isStreaming: !!stream }),
  setError: (error) => set({ error }),
  setCameraCrop: (crop) => set({ cameraCrop: crop }),
  setAnalysis: (analysis) => set({ analysis }),
  setWindowSize: (size) =>
    set({
      windowSize: size,
      isWindowTooSmall: size.width < 800 || size.height < 600,
    }),
  setIsWindowTooSmall: (tooSmall) => set({ isWindowTooSmall: tooSmall }),
  setSuggestion: (suggestion) => set({ suggestion }),
}));
