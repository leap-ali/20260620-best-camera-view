import { useCallback, useEffect, useRef } from 'react';
import { useCameraStore } from '@/store/useCameraStore';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const setStream = useCameraStore((state) => state.setStream);
  const setError = useCameraStore((state) => state.setError);
  const stream = useCameraStore((state) => state.stream);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user',
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '无法访问摄像头';
      setError(errorMessage);
      console.error('Camera error:', err);
    }
  }, [setStream, setError]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream, setStream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return {
    videoRef,
    startCamera,
    stopCamera,
  };
}
