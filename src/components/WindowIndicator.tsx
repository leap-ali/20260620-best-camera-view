import { useCameraStore } from '@/store/useCameraStore';
import { MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from '@/utils/types';
import { Monitor } from 'lucide-react';

export function WindowIndicator() {
  const windowSize = useCameraStore((state) => state.windowSize);
  const currentCrop = useCameraStore((state) => state.currentCrop);

  const isTooSmall =
    windowSize.width < MIN_WINDOW_WIDTH || windowSize.height < MIN_WINDOW_HEIGHT;

  return (
    <div className="absolute top-4 right-4 z-20">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md text-sm transition-all duration-300 ${
          isTooSmall
            ? 'bg-orange-500/20 border border-orange-500/40'
            : 'bg-black/40 border border-white/10'
        }`}
      >
        <Monitor
          className={`w-4 h-4 ${isTooSmall ? 'text-orange-400' : 'text-white/60'}`}
        />
        <span className={`font-mono ${isTooSmall ? 'text-orange-300' : 'text-white/80'}`}>
          {windowSize.width} × {windowSize.height}
        </span>
        {isTooSmall && (
          <span className="text-orange-400 text-xs">
            (最小: {MIN_WINDOW_WIDTH}×{MIN_WINDOW_HEIGHT})
          </span>
        )}
      </div>
    </div>
  );
}
