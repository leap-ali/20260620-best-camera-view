import { CameraCropBox, DisplayCropBox, VideoLayout } from './types';

export function calculateVideoLayout(
  cameraWidth: number,
  cameraHeight: number,
  containerWidth: number,
  containerHeight: number
): VideoLayout {
  if (cameraWidth === 0 || cameraHeight === 0) {
    return {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      displayWidth: containerWidth,
      displayHeight: containerHeight,
    };
  }

  const cameraAspect = cameraWidth / cameraHeight;
  const containerAspect = containerWidth / containerHeight;

  let displayWidth: number;
  let displayHeight: number;
  let offsetX: number;
  let offsetY: number;
  let scale: number;

  if (cameraAspect > containerAspect) {
    displayHeight = containerHeight;
    displayWidth = containerHeight * cameraAspect;
    offsetX = (containerWidth - displayWidth) / 2;
    offsetY = 0;
    scale = displayHeight / cameraHeight;
  } else {
    displayWidth = containerWidth;
    displayHeight = containerWidth / cameraAspect;
    offsetX = 0;
    offsetY = (containerHeight - displayHeight) / 2;
    scale = displayWidth / cameraWidth;
  }

  return {
    offsetX,
    offsetY,
    scale,
    displayWidth,
    displayHeight,
  };
}

export function cameraCropToDisplayCrop(
  cameraCrop: CameraCropBox,
  cameraWidth: number,
  cameraHeight: number,
  containerWidth: number,
  containerHeight: number
): DisplayCropBox {
  const layout = calculateVideoLayout(
    cameraWidth,
    cameraHeight,
    containerWidth,
    containerHeight
  );

  const camCropXPx = (cameraCrop.x / 100) * cameraWidth;
  const camCropYPx = (cameraCrop.y / 100) * cameraHeight;
  const camCropWidthPx = (cameraCrop.width / 100) * cameraWidth;
  const camCropHeightPx = (cameraCrop.height / 100) * cameraHeight;

  const displayXPx = layout.offsetX + camCropXPx * layout.scale;
  const displayYPx = layout.offsetY + camCropYPx * layout.scale;
  const displayWidthPx = camCropWidthPx * layout.scale;
  const displayHeightPx = camCropHeightPx * layout.scale;

  const clampedX = Math.max(0, displayXPx);
  const clampedY = Math.max(0, displayYPx);
  const clampedWidth =
    Math.min(containerWidth, displayXPx + displayWidthPx) - clampedX;
  const clampedHeight =
    Math.min(containerHeight, displayYPx + displayHeightPx) - clampedY;

  return {
    x: (clampedX / containerWidth) * 100,
    y: (clampedY / containerHeight) * 100,
    width: Math.max(0, (clampedWidth / containerWidth) * 100),
    height: Math.max(0, (clampedHeight / containerHeight) * 100),
    status: cameraCrop.status,
    color: cameraCrop.color,
  };
}

export function getFullscreenDisplayCrop(
  color: string
): DisplayCropBox {
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    status: 'perfect',
    color,
  };
}
