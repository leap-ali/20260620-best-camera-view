import { CameraCropBox, CropStatus, FrameAnalysis, CROP_COLORS } from './types';

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

  if (analysis.compositionScore >= 80 && analysis.ruleOfThirds) {
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

  const optimalCrop = calculateOptimalCrop(analysis);
  const suggestion = getImprovementSuggestion(analysis);

  return {
    crop: {
      ...optimalCrop,
      status: 'needs_crop',
      color: CROP_COLORS.needs_crop,
    },
    suggestion,
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
    cropHeightPercent = 60 + (confidence / 100) * 30;
    cropWidthPercent = cropHeightPercent * targetAspectRatio / cameraAspect;
  } else {
    cropWidthPercent = 60 + (confidence / 100) * 30;
    cropHeightPercent = cropWidthPercent * cameraAspect / targetAspectRatio;
  }

  cropWidthPercent = Math.min(90, Math.max(50, cropWidthPercent));
  cropHeightPercent = Math.min(90, Math.max(50, cropHeightPercent));

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

  return suggestions.join('，');
}

function getImprovementSuggestion(analysis: FrameAnalysis): string {
  const suggestions: string[] = [];

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

  if (analysis.compositionScore < 60) {
    suggestions.push('整体构图需要优化');
  }

  if (suggestions.length === 0) {
    suggestions.push('请参考红色裁剪框调整构图');
  }

  suggestions.push(`构图得分：${Math.round(analysis.compositionScore)}分`);

  return suggestions.join('；');
}

export function getStatusLabel(status: CropStatus): string {
  const labels: Record<CropStatus, string> = {
    perfect: '构图完美',
    needs_crop: '需要调整',
  };
  return labels[status];
}
