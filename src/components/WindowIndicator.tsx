import { useCameraStore } from '@/store/useCameraStore';
import { Monitor, Camera } from 'lucide-react';

export function WindowIndicator() {
  const windowSize = useCameraStore((state) => state.windowSize);
  const analysis = useCameraStore((state) => state.analysis);

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md text-sm">
        <Monitor className="w-4 h-4 text-white/60" />
        <span className="font-mono text-white/80">
          {windowSize.width} × {windowSize.height}
        </span>
      </div>
      {analysis && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md text-sm">
          <Camera className="w-4 h-4 text-white/60" />
          <span className="font-mono text-white/80">
            {analysis.cameraResolution.width} × {analysis.cameraResolution.height}
          </span>
        </div>
      )}
    </div>
  );
}
