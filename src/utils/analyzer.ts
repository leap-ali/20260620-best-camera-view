import { FrameAnalysis } from './types';

export function analyzeFrame(imageData: ImageData): FrameAnalysis {
  const { data, width, height } = imageData;
  const pixelCount = width * height;

  let totalBrightness = 0;
  const brightnessValues: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    totalBrightness += brightness;
    brightnessValues.push(brightness);
  }

  const avgBrightness = totalBrightness / pixelCount;

  const mean = avgBrightness;
  let variance = 0;
  for (const val of brightnessValues) {
    variance += (val - mean) ** 2;
  }
  variance /= brightnessValues.length;
  const stdDev = Math.sqrt(variance);
  const contrast = Math.min(100, (stdDev / 128) * 100);

  const edgeGrid = detectEdges(imageData);
  const subjectPos = findSubject(edgeGrid, width, height);

  const { score, ruleOfThirds } = calculateCompositionScore(
    subjectPos,
    avgBrightness,
    contrast,
    width,
    height
  );

  return {
    brightness: avgBrightness,
    contrast,
    subjectPosition: subjectPos,
    compositionScore: score,
    ruleOfThirds,
  };
}

function detectEdges(imageData: ImageData): number[][] {
  const { data, width, height } = imageData;
  const grid: number[][] = [];
  const cellWidth = Math.floor(width / 8);
  const cellHeight = Math.floor(height / 8);

  for (let gy = 0; gy < 8; gy++) {
    grid[gy] = [];
    for (let gx = 0; gx < 8; gx++) {
      let edgeStrength = 0;
      const startX = gx * cellWidth;
      const startY = gy * cellHeight;

      for (let y = startY; y < startY + cellHeight && y < height - 1; y++) {
        for (let x = startX; x < startX + cellWidth && x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          const idxRight = (y * width + x + 1) * 4;
          const idxBottom = ((y + 1) * width + x) * 4;

          const current = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          const right = 0.299 * data[idxRight] + 0.587 * data[idxRight + 1] + 0.114 * data[idxRight + 2];
          const bottom = 0.299 * data[idxBottom] + 0.587 * data[idxBottom + 1] + 0.114 * data[idxBottom + 2];

          const gxVal = right - current;
          const gyVal = bottom - current;
          edgeStrength += Math.sqrt(gxVal * gxVal + gyVal * gyVal);
        }
      }

      grid[gy][gx] = edgeStrength / (cellWidth * cellHeight);
    }
  }

  return grid;
}

function findSubject(
  edgeGrid: number[][],
  width: number,
  height: number
): { x: number; y: number; confidence: number } {
  let maxEdge = 0;
  let maxGx = 3;
  let maxGy = 3;

  for (let gy = 0; gy < 8; gy++) {
    for (let gx = 0; gx < 8; gx++) {
      if (edgeGrid[gy][gx] > maxEdge) {
        maxEdge = edgeGrid[gy][gx];
        maxGx = gx;
        maxGy = gy;
      }
    }
  }

  const totalEdge = edgeGrid.flat().reduce((a, b) => a + b, 0);
  const avgEdge = totalEdge / 64;
  const confidence = maxEdge > 0 ? Math.min(100, (maxEdge / (avgEdge + 1)) * 50) : 0;

  const cellWidth = width / 8;
  const cellHeight = height / 8;

  return {
    x: ((maxGx + 0.5) * cellWidth) / width * 100,
    y: ((maxGy + 0.5) * cellHeight) / height * 100,
    confidence,
  };
}

function calculateCompositionScore(
  subjectPos: { x: number; y: number; confidence: number },
  brightness: number,
  contrast: number,
  width: number,
  height: number
): { score: number; ruleOfThirds: boolean } {
  let score = 50;

  if (brightness >= 80 && brightness <= 180) {
    score += 15;
  } else if (brightness >= 60 && brightness <= 200) {
    score += 8;
  } else {
    score -= 10;
  }

  if (contrast >= 40 && contrast <= 80) {
    score += 15;
  } else if (contrast >= 30 && contrast <= 90) {
    score += 8;
  } else {
    score -= 5;
  }

  const thirdX1 = 100 / 3;
  const thirdX2 = (100 / 3) * 2;
  const thirdY1 = 100 / 3;
  const thirdY2 = (100 / 3) * 2;

  const distanceToIntersection = Math.min(
    Math.hypot(subjectPos.x - thirdX1, subjectPos.y - thirdY1),
    Math.hypot(subjectPos.x - thirdX2, subjectPos.y - thirdY1),
    Math.hypot(subjectPos.x - thirdX1, subjectPos.y - thirdY2),
    Math.hypot(subjectPos.x - thirdX2, subjectPos.y - thirdY2)
  );

  const ruleOfThirds = distanceToIntersection < 15;

  if (ruleOfThirds) {
    score += 20;
  } else if (distanceToIntersection < 25) {
    score += 10;
  }

  const centerX = 50;
  const centerY = 50;
  const distanceToCenter = Math.hypot(subjectPos.x - centerX, subjectPos.y - centerY);

  if (distanceToCenter < 15) {
    score += 10;
  }

  score += (subjectPos.confidence / 100) * 10;

  const aspectRatio = width / height;
  if (aspectRatio >= 1.5 && aspectRatio <= 1.8) {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));

  return { score, ruleOfThirds };
}
