import { useEffect, useRef } from 'react';
import { useCameraStore } from '@/store/useCameraStore';
import { CameraCropBox, DisplayCropBox, WINDOW_TOO_SMALL_COLOR } from '@/utils/types';
import { cameraCropToDisplayCrop, getFullscreenDisplayCrop } from '@/utils/coordinateMapper';

const IS_MIRRORED = true;

interface UseCropOverlayOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useCropOverlay({ canvasRef }: UseCropOverlayOptions) {
  const cameraCrop = useCameraStore((state) => state.cameraCrop);
  const analysis = useCameraStore((state) => state.analysis);
  const isWindowTooSmall = useCameraStore((state) => state.isWindowTooSmall);

  const cameraCropRef = useRef<CameraCropBox | null>(null);
  const analysisRef = useRef(analysis);
  const isWindowTooSmallRef = useRef(isWindowTooSmall);
  const animationFrameRef = useRef<number | null>(null);

  cameraCropRef.current = cameraCrop;
  analysisRef.current = analysis;
  isWindowTooSmallRef.current = isWindowTooSmall;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let displayCrop: DisplayCropBox | null = null;
      let isWindowWarning = false;

      if (isWindowTooSmallRef.current) {
        displayCrop = getFullscreenDisplayCrop(WINDOW_TOO_SMALL_COLOR);
        isWindowWarning = true;
      } else if (cameraCropRef.current && analysisRef.current) {
        displayCrop = cameraCropToDisplayCrop(
          cameraCropRef.current,
          analysisRef.current.cameraResolution.width,
          analysisRef.current.cameraResolution.height,
          canvas.width,
          canvas.height,
          IS_MIRRORED
        );
      }

      if (displayCrop) {
        drawCropBox(ctx, displayCrop, canvas.width, canvas.height, isWindowWarning);
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [canvasRef]);

  return null;
}

function drawCropBox(
  ctx: CanvasRenderingContext2D,
  crop: DisplayCropBox,
  canvasWidth: number,
  canvasHeight: number,
  isWindowWarning: boolean
) {
  const x = (crop.x / 100) * canvasWidth;
  const y = (crop.y / 100) * canvasHeight;
  const width = (crop.width / 100) * canvasWidth;
  const height = (crop.height / 100) * canvasHeight;

  const time = performance.now() / 1000;
  const pulse = isWindowWarning
    ? 0.6 + 0.4 * Math.sin(time * 4)
    : 0.7 + 0.3 * Math.sin(time * 2);

  ctx.save();

  ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * pulse})`;
  ctx.fillRect(0, 0, canvasWidth, y);
  ctx.fillRect(0, y + height, canvasWidth, canvasHeight - y - height);
  ctx.fillRect(0, y, x, height);
  ctx.fillRect(x + width, y, canvasWidth - x - width, height);

  const borderWidth = isWindowWarning ? 6 : 4;
  const cornerLength = isWindowWarning ? 50 : 40;
  const cornerWidth = isWindowWarning ? 10 : 8;

  ctx.strokeStyle = crop.color;
  ctx.lineWidth = borderWidth;
  ctx.globalAlpha = pulse;
  ctx.strokeRect(x, y, width, height);

  ctx.globalAlpha = 1;
  ctx.lineWidth = cornerWidth;
  ctx.lineCap = 'square';

  ctx.beginPath();
  ctx.moveTo(x, y + cornerLength);
  ctx.lineTo(x, y);
  ctx.lineTo(x + cornerLength, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + width - cornerLength, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + cornerLength);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + height - cornerLength);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x + cornerLength, y + height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + width - cornerLength, y + height);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x + width, y + height - cornerLength);
  ctx.stroke();

  if (crop.status === 'needs_crop' && !isWindowWarning) {
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = -time * 30;
    ctx.lineWidth = 2;
    ctx.strokeStyle = crop.color;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(x + 10, y + 10, width - 20, height - 20);
    ctx.setLineDash([]);
  }

  ctx.restore();
}
