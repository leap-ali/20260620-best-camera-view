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
    displayWidth = containerWidth;
    displayHeight = containerWidth / cameraAspect;
    offsetX = 0;
    offsetY = (containerHeight - displayHeight) / 2;
    scale = displayWidth / cameraWidth;
  } else {
    displayHeight = containerHeight;
    displayWidth = containerHeight * cameraAspect;
    offsetX = (containerWidth - displayWidth) / 2;
    offsetY = 0;
    scale = displayHeight / cameraHeight;
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
  containerHeight: number,
  mirrored: boolean = false
): DisplayCropBox {
  const layout = calculateVideoLayout(
    cameraWidth,
    cameraHeight,
    containerWidth,
    containerHeight
  );

  let camCropX = cameraCrop.x;
  let camCropWidth = cameraCrop.width;

  if (mirrored) {
    camCropX = 100 - cameraCrop.x - cameraCrop.width;
  }

  const camCropXPx = (camCropX / 100) * cameraWidth;
  const camCropYPx = (cameraCrop.y / 100) * cameraHeight;
  const camCropWidthPx = (camCropWidth / 100) * cameraWidth;
  const camCropHeightPx = (cameraCrop.height / 100) * cameraHeight;

  const displayXPx = layout.offsetX + camCropXPx * layout.scale;
  const displayYPx = layout.offsetY + camCropYPx * layout.scale;
  const displayWidthPx = camCropWidthPx * layout.scale;
  const displayHeightPx = camCropHeightPx * layout.scale;

  const clampedX = Math.max(layout.offsetX, Math.min(
    layout.offsetX + layout.displayWidth,
    displayXPx
  ));
  const clampedY = Math.max(layout.offsetY, Math.min(
    layout.offsetY + layout.displayHeight,
    displayYPx
  ));
  const clampedWidth = Math.max(0, Math.min(
    layout.offsetX + layout.displayWidth,
    displayXPx + displayWidthPx
  ) - clampedX);
  const clampedHeight = Math.max(0, Math.min(
    layout.offsetY + layout.displayHeight,
    displayYPx + displayHeightPx
  ) - clampedY);

  return {
    x: (clampedX / containerWidth) * 100,
    y: (clampedY / containerHeight) * 100,
    width: (clampedWidth / containerWidth) * 100,
    height: (clampedHeight / containerHeight) * 100,
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

export function getVideoAreaDisplayCrop(
  color: string,
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

  return {
    x: (layout.offsetX / containerWidth) * 100,
    y: (layout.offsetY / containerHeight) * 100,
    width: (layout.displayWidth / containerWidth) * 100,
    height: (layout.displayHeight / containerHeight) * 100,
    status: 'perfect',
    color,
  };
}
