import {
  CameraCropBox,
  CropStatus,
  FrameAnalysis,
  CROP_COLORS,
  TOO_SMALL_THRESHOLD,
  PERFECT_THRESHOLD,
  MIN_CAMERA_WIDTH,
  MIN_CAMERA_HEIGHT,
} from './types';

export function calculateCameraCropBox(
  analysis: FrameAnalysis | null
): { crop: CameraCropBox; suggestion: string } {
  if (!analysis) {
    return {
      crop: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        status: 'perfect',
        color: CROP_COLORS.perfect,
      },
      suggestion: '正在分析画面...',
    };
  }

  const camWidth = analysis.cameraResolution.width;
  const camHeight = analysis.cameraResolution.height;

  if (camWidth < MIN_CAMERA_WIDTH || camHeight < MIN_CAMERA_HEIGHT) {
    return {
      crop: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        status: 'too_small',
        color: CROP_COLORS.too_small,
      },
      suggestion: `摄像头分辨率过低（${camWidth}×${camHeight}），请使用更高分辨率的摄像头（建议≥${MIN_CAMERA_WIDTH}×${MIN_CAMERA_HEIGHT}）`,
    };
  }

  const optimalCrop = calculateOptimalCrop(analysis);
  const cropCoverage = (optimalCrop.width * optimalCrop.height) / 10000;

  if (cropCoverage < TOO_SMALL_THRESHOLD) {
    return {
      crop: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        status: 'too_small',
        color: CROP_COLORS.too_small,
      },
      suggestion: getTooSmallSuggestion(analysis, optimalCrop, cropCoverage),
    };
  }

  if (
    analysis.compositionScore >= 80 &&
    analysis.ruleOfThirds &&
    cropCoverage >= PERFECT_THRESHOLD
  ) {
    return {
      crop: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        status: 'perfect',
        color: CROP_COLORS.perfect,
      },
      suggestion: getPerfectSuggestion(analysis),
    };
  }

  return {
    crop: {
      ...optimalCrop,
      status: 'needs_crop',
      color: CROP_COLORS.needs_crop,
    },
    suggestion: getImprovementSuggestion(analysis, optimalCrop, cropCoverage),
  };
}

function calculateOptimalCrop(analysis: FrameAnalysis): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const { x: subjectX, y: subjectY, confidence } = analysis.subjectPosition;
  const cameraAspect =
    analysis.cameraResolution.width / analysis.cameraResolution.height;

  if (confidence < 30) {
    const margin = 10;
    return {
      x: margin,
      y: margin,
      width: 100 - margin * 2,
      height: 100 - margin * 2,
    };
  }

  const targetAspectRatio = 16 / 9;
  let cropWidthPercent: number;
  let cropHeightPercent: number;

  if (cameraAspect >= targetAspectRatio) {
    cropHeightPercent = 50 + (confidence / 100) * 40;
    cropWidthPercent = (cropHeightPercent * targetAspectRatio) / cameraAspect;
  } else {
    cropWidthPercent = 50 + (confidence / 100) * 40;
    cropHeightPercent = (cropWidthPercent * cameraAspect) / targetAspectRatio;
  }

  cropWidthPercent = Math.min(95, Math.max(30, cropWidthPercent));
  cropHeightPercent = Math.min(95, Math.max(30, cropHeightPercent));

  const thirdX1 = 100 / 3;
  const thirdX2 = (100 / 3) * 2;
  const thirdY1 = 100 / 3;
  const thirdY2 = (100 / 3) * 2;

  const intersections = [
    { x: thirdX1, y: thirdY1 },
    { x: thirdX2, y: thirdY1 },
    { x: thirdX1, y: thirdY2 },
    { x: thirdX2, y: thirdY2 },
  ];

  let nearestIntersection = intersections[0];
  let minDist = Infinity;

  for (const pt of intersections) {
    const dist = Math.hypot(subjectX - pt.x, subjectY - pt.y);
    if (dist < minDist) {
      minDist = dist;
      nearestIntersection = pt;
    }
  }

  let cropX = nearestIntersection.x - cropWidthPercent / 2;
  let cropY = nearestIntersection.y - cropHeightPercent / 2;

  cropX = Math.max(1, Math.min(100 - cropWidthPercent - 1, cropX));
  cropY = Math.max(1, Math.min(100 - cropHeightPercent - 1, cropY));

  return {
    x: cropX,
    y: cropY,
    width: cropWidthPercent,
    height: cropHeightPercent,
  };
}

function getTooSmallSuggestion(
  analysis: FrameAnalysis,
  crop: { width: number; height: number },
  coverage: number
): string {
  const suggestions: string[] = [];
  const camW = analysis.cameraResolution.width;
  const camH = analysis.cameraResolution.height;
  const cropPixelW = Math.round((crop.width / 100) * camW);
  const cropPixelH = Math.round((crop.height / 100) * camH);

  suggestions.push(
    `推荐拍摄区域过小（约 ${cropPixelW}×${cropPixelH}，仅占画面 ${Math.round(coverage * 100)}%）`
  );
  suggestions.push('请靠近拍摄主体，使主体占据更大的画面比例');

  if (analysis.subjectPosition.confidence < 50) {
    suggestions.push('未检测到明显主体，请调整画面内容');
  }

  if (analysis.brightness < 80) {
    suggestions.push('画面偏暗，请增加光照');
  } else if (analysis.brightness > 180) {
    suggestions.push('画面过亮，请减少强光');
  }

  return suggestions.join('；');
}

function getPerfectSuggestion(analysis: FrameAnalysis): string {
  const suggestions: string[] = [];
  suggestions.push('构图完美！保持当前位置和角度');

  if (analysis.ruleOfThirds) {
    suggestions.push('主体位于黄金分割点');
  }

  if (analysis.brightness >= 80 && analysis.brightness <= 180) {
    suggestions.push('光线适中');
  }

  if (analysis.contrast >= 40 && analysis.contrast <= 80) {
    suggestions.push('对比度良好');
  }

  const camW = analysis.cameraResolution.width;
  const camH = analysis.cameraResolution.height;
  suggestions.push(`摄像头：${camW}×${camH}`);

  return suggestions.join('，');
}

function getImprovementSuggestion(
  analysis: FrameAnalysis,
  crop: { width: number; height: number },
  coverage: number
): string {
  const suggestions: string[] = [];
  const camW = analysis.cameraResolution.width;
  const camH = analysis.cameraResolution.height;
  const cropPixelW = Math.round((crop.width / 100) * camW);
  const cropPixelH = Math.round((crop.height / 100) * camH);

  suggestions.push(
    `推荐裁剪区域：${cropPixelW}×${cropPixelH}（占画面 ${Math.round(coverage * 100)}%）`
  );

  if (analysis.brightness < 80) {
    suggestions.push('画面偏暗，请增加光照');
  } else if (analysis.brightness > 180) {
    suggestions.push('画面过亮，请减少强光');
  }

  if (analysis.contrast < 40) {
    suggestions.push('对比度偏低，建议调整拍摄环境');
  }

  if (!analysis.ruleOfThirds) {
    suggestions.push('请移动位置使主体靠近黄金分割点');
  }

  if (analysis.subjectPosition.confidence < 40) {
    suggestions.push('未检测到明显主体，请调整画面内容');
  }

  suggestions.push(`构图得分：${Math.round(analysis.compositionScore)}分`);
  suggestions.push(`摄像头：${camW}×${camH}`);

  return suggestions.join('；');
}

export function getStatusLabel(status: CropStatus): string {
  const labels: Record<CropStatus, string> = {
    too_small: '拍摄区域过小',
    perfect: '构图完美',
    needs_crop: '需要调整',
  };
  return labels[status];
}
