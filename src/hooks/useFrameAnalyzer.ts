import { useCallback, useEffect, useRef } from 'react';
import { useCameraStore } from '@/store/useCameraStore';
import { analyzeFrame } from '@/utils/analyzer';
import { calculateCameraCropBox } from '@/utils/cropCalculator';
import { ANALYSIS_INTERVAL, ANALYSIS_WIDTH, ANALYSIS_HEIGHT } from '@/utils/types';

export function useFrameAnalyzer(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastAnalysisRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isStreamingRef = useRef(false);
  const initializedRef = useRef(false);

  const isStreaming = useCameraStore((state) => state.isStreaming);
  const setAnalysis = useCameraStore((state) => state.setAnalysis);
  const setCameraCrop = useCameraStore((state) => state.setCameraCrop);
  const setSuggestion = useCameraStore((state) => state.setSuggestion);

  isStreamingRef.current = isStreaming;

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

    const cameraWidth = video.videoWidth;
    const cameraHeight = video.videoHeight;

    canvas.width = ANALYSIS_WIDTH;
    canvas.height = ANALYSIS_HEIGHT;

    ctx.drawImage(video, 0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);

    try {
      const imageData = ctx.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
      const analysis = analyzeFrame(imageData, cameraWidth, cameraHeight);
      setAnalysis(analysis);

      const { crop, suggestion } = calculateCameraCropBox(analysis);
      setCameraCrop(crop);
      setSuggestion(suggestion);
    } catch (err) {
      console.error('Frame analysis error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(analyze);
  }, [videoRef, setAnalysis, setCameraCrop, setSuggestion]);

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

    const { crop, suggestion } = calculateCameraCropBox(null);
    setCameraCrop(crop);
    setSuggestion(suggestion);

    animationFrameRef.current = requestAnimationFrame(analyze);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [analyze, setCameraCrop, setSuggestion]);

  return {
    analysisCanvas: canvasRef,
  };
}
