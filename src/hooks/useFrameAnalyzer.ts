import { useCallback, useEffect, useRef } from 'react';
import { useCameraStore } from '@/store/useCameraStore';
import { analyzeFrame } from '@/utils/analyzer';
import { calculateCropBox } from '@/utils/cropCalculator';
import { ANALYSIS_INTERVAL, ANALYSIS_WIDTH, ANALYSIS_HEIGHT } from '@/utils/types';

export function useFrameAnalyzer(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastAnalysisRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isStreamingRef = useRef(false);
  const windowSizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });
  const initializedRef = useRef(false);

  const isStreaming = useCameraStore((state) => state.isStreaming);
  const windowSize = useCameraStore((state) => state.windowSize);
  const setAnalysis = useCameraStore((state) => state.setAnalysis);
  const setCrop = useCameraStore((state) => state.setCrop);
  const setSuggestion = useCameraStore((state) => state.setSuggestion);

  isStreamingRef.current = isStreaming;
  windowSizeRef.current = windowSize;

  const analyze = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreamingRef.current) {
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
        windowSizeRef.current.width,
        windowSizeRef.current.height,
        analysis
      );
      setCrop(crop);
      setSuggestion(suggestion);
    } catch (err) {
      console.error('Frame analysis error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(analyze);
  }, [videoRef, setAnalysis, setCrop, setSuggestion]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.style.display = 'none';
      document.body.appendChild(canvasRef.current);
    }

    const { crop, suggestion } = calculateCropBox(
      windowSizeRef.current.width,
      windowSizeRef.current.height,
      null
    );
    setCrop(crop);
    setSuggestion(suggestion);

    animationFrameRef.current = requestAnimationFrame(analyze);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [analyze, setCrop, setSuggestion]);

  return {
    analysisCanvas: canvasRef,
  };
}
