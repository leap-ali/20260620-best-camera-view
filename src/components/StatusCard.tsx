import { useCameraStore } from '@/store/useCameraStore';
import { getStatusLabel } from '@/utils/cropCalculator';
import { AlertTriangle, CheckCircle2, Scissors, Minimize2 } from 'lucide-react';

export function StatusCard() {
  const cameraCrop = useCameraStore((state) => state.cameraCrop);
  const analysis = useCameraStore((state) => state.analysis);
  const suggestion = useCameraStore((state) => state.suggestion);
  const error = useCameraStore((state) => state.error);

  if (error) {
    return (
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4">
        <div className="bg-black/70 backdrop-blur-md rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <span className="text-red-400 font-semibold text-lg">摄像头访问失败</span>
          </div>
          <p className="text-white/80 text-sm">{error}</p>
          <p className="text-white/60 text-xs mt-2">请检查浏览器权限设置，允许访问摄像头</p>
        </div>
      </div>
    );
  }

  if (!cameraCrop) return null;

  const StatusIcon =
    cameraCrop.status === 'too_small'
      ? Minimize2
      : cameraCrop.status === 'perfect'
      ? CheckCircle2
      : Scissors;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4">
      <div
        className="bg-black/70 backdrop-blur-md rounded-2xl p-5 border transition-all duration-300"
        style={{ borderColor: `${cameraCrop.color}40` }}
      >
        <div className="flex items-start gap-4">
          <div
            className="p-3 rounded-xl flex-shrink-0"
            style={{ backgroundColor: `${cameraCrop.color}20` }}
          >
            <StatusIcon className="w-6 h-6" style={{ color: cameraCrop.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="font-semibold text-lg"
                style={{ color: cameraCrop.color }}
              >
                {getStatusLabel(cameraCrop.status)}
              </span>
              {analysis && (
                <span className="text-white/50 text-sm">
                  构图得分：{Math.round(analysis.compositionScore)}分
                </span>
              )}
            </div>
            <p className="text-white/80 text-sm leading-relaxed">{suggestion}</p>
            {analysis && (
              <div className="flex gap-4 mt-3 text-xs text-white/50 flex-wrap">
                <span>亮度：{Math.round(analysis.brightness)}</span>
                <span>对比度：{Math.round(analysis.contrast)}</span>
                <span>主体置信度：{Math.round(analysis.subjectPosition.confidence)}%</span>
                <span>
                  摄像头：{analysis.cameraResolution.width}×{analysis.cameraResolution.height}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
