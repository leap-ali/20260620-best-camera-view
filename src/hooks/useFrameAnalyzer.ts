import { useCallback, useEffect, useRef } from 'react';
import { useCameraStore } from '@/store/useCameraStore';
import { analyzeFrame } from '@/utils/analyzer';
import { calculateCropBox } from '@/utils/cropCalculator';
import { ANALYSIS_INTERVAL, ANALYSIS_WIDTH, ANALYSIS_HEIGHT } from '@/utils/types';

export function useFrameAnalyzer(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastAnalysisRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const isStreaming = useCameraStore((state) => state.isStreaming);
  const windowSize = useCameraStore((state) => state.windowSize);
  const setAnalysis = useCameraStore((state) => state.setAnalysis);
  const setCrop = useCameraStore((state) => state.setCrop);
  const setSuggestion = useCameraStore((state) => state.setSuggestion);

  const analyze = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      animationFrameRef.current = requestAnimationFrame(analyze);
      return;
    }

    const now = performance.now();
    if (now - lastAnalysisRef.current < ANALYSIS_INTERVAL) {
      animationFrameRef.current = requestAnimationFrame(analyze);
      return;
    }
    lastAnalysisRef.current = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(analyze);
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      animationFrameRef.current = requestAnimationFrame(analyze);
      return;
    }

    canvas.width = ANALYSIS_WIDTH;
    canvas.height = ANALYSIS_HEIGHT;

    ctx.drawImage(video, 0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);

    try {
      const imageData = ctx.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
      const analysis = analyzeFrame(imageData);
      setAnalysis(analysis);

      const { crop, suggestion } = calculateCropBox(
        windowSize.width,
        windowSize.height,
        analysis
      );
      setCrop(crop);
      setSuggestion(suggestion);
    } catch (err) {
      console.error('Frame analysis error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(analyze);
  }, [videoRef, isStreaming, windowSize, setAnalysis, setCrop, setSuggestion]);

  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.style.display = 'none';
      document.body.appendChild(canvasRef.current);
    }

    const { crop, suggestion } = calculateCropBox(
      windowSize.width,
      windowSize.height,
      null
    );
    setCrop(crop);
    setSuggestion(suggestion);

    if (isStreaming) {
      animationFrameRef.current = requestAnimationFrame(analyze);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isStreaming, analyze, windowSize, setCrop, setSuggestion]);

  return {
    analysisCanvas: canvasRef,
  };
}
