import { CropBox, CropStatus, FrameAnalysis, CROP_COLORS, MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from './types';

export function calculateCropBox(
  windowWidth: number,
  windowHeight: number,
  analysis: FrameAnalysis | null
): { crop: CropBox; suggestion: string } {
  if (windowWidth < MIN_WINDOW_WIDTH || windowHeight < MIN_WINDOW_HEIGHT) {
    return {
      crop: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        status: 'too_small',
        color: CROP_COLORS.too_small,
      },
      suggestion: `窗口过小，请放大窗口至至少 ${MIN_WINDOW_WIDTH}×${MIN_WINDOW_HEIGHT}px`,
    };
  }

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

  if (confidence < 30) {
    const margin = 15;
    return {
      x: margin,
      y: margin,
      width: 100 - margin * 2,
      height: 100 - margin * 2,
    };
  }

  const targetAspectRatio = 16 / 9;
  let cropWidth: number;
  let cropHeight: number;

  if (targetAspectRatio > 1) {
    cropWidth = 60 + (confidence / 100) * 25;
    cropHeight = cropWidth / targetAspectRatio;
  } else {
    cropHeight = 60 + (confidence / 100) * 25;
    cropWidth = cropHeight * targetAspectRatio;
  }

  cropWidth = Math.min(85, Math.max(50, cropWidth));
  cropHeight = Math.min(85, Math.max(50, cropHeight));

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

  let cropX = nearestIntersection.x - cropWidth / 2;
  let cropY = nearestIntersection.y - cropHeight / 2;

  cropX = Math.max(2, Math.min(100 - cropWidth - 2, cropX));
  cropY = Math.max(2, Math.min(100 - cropHeight - 2, cropY));

  return {
    x: cropX,
    y: cropY,
    width: cropWidth,
    height: cropHeight,
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
    too_small: '窗口过小',
    perfect: '构图完美',
    needs_crop: '需要调整',
  };
  return labels[status];
}
