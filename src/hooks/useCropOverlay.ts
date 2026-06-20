import { useEffect, useRef } from 'react';
import { useCameraStore } from '@/store/useCameraStore';
import { CropBox } from '@/utils/types';

interface UseCropOverlayOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useCropOverlay({ canvasRef }: UseCropOverlayOptions) {
  const currentCrop = useCameraStore((state) => state.currentCrop);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (currentCrop) {
        drawCropBox(ctx, currentCrop, canvas.width, canvas.height);
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasRef, currentCrop]);

  return null;
}

function drawCropBox(
  ctx: CanvasRenderingContext2D,
  crop: CropBox,
  canvasWidth: number,
  canvasHeight: number
) {
  const x = (crop.x / 100) * canvasWidth;
  const y = (crop.y / 100) * canvasHeight;
  const width = (crop.width / 100) * canvasWidth;
  const height = (crop.height / 100) * canvasHeight;

  const time = performance.now() / 1000;
  const pulse = 0.7 + 0.3 * Math.sin(time * 3);

  ctx.save();

  ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * pulse})`;
  ctx.fillRect(0, 0, canvasWidth, y);
  ctx.fillRect(0, y + height, canvasWidth, canvasHeight - y - height);
  ctx.fillRect(0, y, x, height);
  ctx.fillRect(x + width, y, canvasWidth - x - width, height);

  const borderWidth = 4;
  const cornerLength = 40;
  const cornerWidth = 8;

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

  if (crop.status === 'needs_crop') {
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
