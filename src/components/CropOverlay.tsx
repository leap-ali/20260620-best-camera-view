import { useRef, useEffect } from 'react';
import { useCropOverlay } from '@/hooks/useCropOverlay';

export function CropOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useCropOverlay({ canvasRef });

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        width: '100%',
        height: '100%',
        imageRendering: 'auto',
      }}
    />
  );
}
