import { create } from 'zustand';
import { CameraState } from '@/utils/types';

export const useCameraStore = create<CameraState>((set) => ({
  isStreaming: false,
  stream: null,
  error: null,
  currentCrop: null,
  analysis: null,
  windowSize: { width: window.innerWidth, height: window.innerHeight },
  suggestion: '',

  setStream: (stream) => set({ stream, isStreaming: !!stream }),
  setError: (error) => set({ error }),
  setCrop: (crop) => set({ currentCrop: crop }),
  setAnalysis: (analysis) => set({ analysis }),
  setWindowSize: (size) => set({ windowSize: size }),
  setSuggestion: (suggestion) => set({ suggestion }),
}));
