import { useEffect, useRef } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useFrameAnalyzer } from '@/hooks/useFrameAnalyzer';
import { useWindowMonitor } from '@/hooks/useWindowMonitor';
import { CropOverlay } from './CropOverlay';
import { StatusCard } from './StatusCard';
import { WindowIndicator } from './WindowIndicator';
import { useCameraStore } from '@/store/useCameraStore';
import { Camera, CameraOff } from 'lucide-react';

export function CameraView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { videoRef, startCamera } = useCamera();
  const { analysisCanvas } = useFrameAnalyzer(videoRef);
  useWindowMonitor();

  const isStreaming = useCameraStore((state) => state.isStreaming);
  const error = useCameraStore((state) => state.error);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (containerRef.current) {
          containerRef.current.requestFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-black overflow-hidden"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
        style={{
          transform: 'scaleX(-1)',
          backfaceVisibility: 'hidden',
          perspective: 1000,
        }}
      />

      <CropOverlay />

      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            isStreaming ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}
        >
          {isStreaming ? (
            <Camera className="w-5 h-5 text-green-400" />
          ) : (
            <CameraOff className="w-5 h-5 text-red-400" />
          )}
        </div>
        <div>
          <h1 className="text-white font-semibold text-lg">最佳拍摄视角</h1>
          <p className="text-white/50 text-xs">按 F 切换全屏</p>
        </div>
      </div>

      <WindowIndicator />

      <StatusCard />

      {!isStreaming && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/80">正在请求摄像头权限...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="text-center">
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20"
            >
              重新尝试访问摄像头
            </button>
          </div>
        </div>
      )}

      <canvas
        ref={analysisCanvas}
        className="hidden"
      />
    </div>
  );
}
