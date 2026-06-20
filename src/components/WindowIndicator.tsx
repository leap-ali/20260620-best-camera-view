import { useCameraStore } from '@/store/useCameraStore';
import { MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from '@/utils/types';
import { Monitor } from 'lucide-react';

export function WindowIndicator() {
  const windowSize = useCameraStore((state) => state.windowSize);
  const isWindowTooSmall = useCameraStore((state) => state.isWindowTooSmall);

  return (
    <div className="absolute top-4 right-4 z-20">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md text-sm transition-all duration-300 ${
          isWindowTooSmall
            ? 'bg-orange-500/20 border border-orange-500/40'
            : 'bg-black/40 border border-white/10'
        }`}
      >
        <Monitor
          className={`w-4 h-4 ${isWindowTooSmall ? 'text-orange-400' : 'text-white/60'}`}
        />
        <span className={`font-mono ${isWindowTooSmall ? 'text-orange-300' : 'text-white/80'}`}>
          {windowSize.width} × {windowSize.height}
        </span>
        {isWindowTooSmall && (
          <span className="text-orange-400 text-xs">
            (最小: {MIN_WINDOW_WIDTH}×{MIN_WINDOW_HEIGHT})
          </span>
        )}
      </div>
    </div>
  );
}
