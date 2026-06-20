import { useEffect, useRef } from 'react';
import { useCameraStore } from '@/store/useCameraStore';
import { CameraCropBox, DisplayCropBox } from '@/utils/types';
import { cameraCropToDisplayCrop, getVideoAreaDisplayCrop } from '@/utils/coordinateMapper';

const IS_MIRRORED = true;

interface UseCropOverlayOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useCropOverlay({ canvasRef }: UseCropOverlayOptions) {
  const cameraCrop = useCameraStore((state) => state.cameraCrop);
  const analysis = useCameraStore((state) => state.analysis);

  const cameraCropRef = useRef<CameraCropBox | null>(null);
  const analysisRef = useRef(analysis);
  const animationFrameRef = useRef<number | null>(null);

  cameraCropRef.current = cameraCrop;
  analysisRef.current = analysis;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let displayCrop: DisplayCropBox | null = null;

      if (cameraCropRef.current && analysisRef.current) {
        const camW = analysisRef.current.cameraResolution.width;
        const camH = analysisRef.current.cameraResolution.height;

        if (cameraCropRef.current.status === 'too_small' || cameraCropRef.current.status === 'perfect') {
          displayCrop = getVideoAreaDisplayCrop(
            cameraCropRef.current.color,
            camW,
            camH,
            canvas.width,
            canvas.height
          );
          displayCrop.status = cameraCropRef.current.status;
        } else {
          displayCrop = cameraCropToDisplayCrop(
            cameraCropRef.current,
            camW,
            camH,
            canvas.width,
            canvas.height,
            IS_MIRRORED
          );
        }
      }

      if (displayCrop) {
        const isWarning = displayCrop.status === 'too_small';
        drawCropBox(ctx, displayCrop, canvas.width, canvas.height, isWarning);
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
  isWarning: boolean
) {
  const x = (crop.x / 100) * canvasWidth;
  const y = (crop.y / 100) * canvasHeight;
  const width = (crop.width / 100) * canvasWidth;
  const height = (crop.height / 100) * canvasHeight;

  const time = performance.now() / 1000;
  const pulse = isWarning
    ? 0.6 + 0.4 * Math.sin(time * 4)
    : 0.7 + 0.3 * Math.sin(time * 2);

  ctx.save();

  ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * pulse})`;
  ctx.fillRect(0, 0, canvasWidth, y);
  ctx.fillRect(0, y + height, canvasWidth, canvasHeight - y - height);
  ctx.fillRect(0, y, x, height);
  ctx.fillRect(x + width, y, canvasWidth - x - width, height);

  const borderWidth = isWarning ? 6 : 4;
  const cornerLength = isWarning ? 50 : 40;
  const cornerWidth = isWarning ? 10 : 8;

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

  if (crop.status === 'needs_crop' && !isWarning) {
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
