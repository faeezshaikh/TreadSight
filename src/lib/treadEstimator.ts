import { TreadEstimate, TreadBucket, ImageQuality, DepthRange } from '@/types';
import { TREAD_BUCKETS, IMAGE_QUALITY_MIN } from './constants';

/**
 * Estimate tread depth bucket from an image using canvas-based heuristics.
 * Uses edge density, contrast, and texture frequency as proxies for tread depth.
 *
 * This is a "good enough" demo estimator — not lab-accurate.
 */
export function estimateTreadBucket(imageData: ImageData): TreadEstimate {
    const quality = assessImageQuality(imageData);
    const edgeDensity = calculateEdgeDensity(imageData);
    const textureVar = calculateTextureVariance(imageData);
    const contrastRatio = calculateContrastRatio(imageData);

    // Combine metrics to estimate tread depth
    // Higher edge density + texture variance = deeper grooves = more tread
    const treadSignal = (edgeDensity * 0.45) + (textureVar * 0.35) + (contrastRatio * 0.20);

    // Map signal to bucket
    const bucket = signalToBucket(treadSignal);
    const depthRange = TREAD_BUCKETS[bucket];

    // Confidence based on image quality
    const confidence = calculateConfidence(quality, treadSignal);

    return {
        bucket,
        depthRange32nds: { ...depthRange },
        confidence,
    };
}

/**
 * Assess the quality of the uploaded image
 */
export function assessImageQuality(imageData: ImageData): ImageQuality {
    const { data, width, height } = imageData;
    const totalPixels = width * height;

    // 1. Brightness: average luminance
    let totalLum = 0;
    for (let i = 0; i < data.length; i += 4) {
        totalLum += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    }
    const avgBrightness = totalLum / totalPixels / 255;
    const brightnessScore = avgBrightness > 0.15 && avgBrightness < 0.85
        ? 1.0 - Math.abs(avgBrightness - 0.5) * 1.5
        : 0.3;

    // 2. Contrast: standard deviation of luminance
    let sumSqDiff = 0;
    const avgLum = totalLum / totalPixels;
    for (let i = 0; i < data.length; i += 4) {
        const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        sumSqDiff += (lum - avgLum) ** 2;
    }
    const stdDev = Math.sqrt(sumSqDiff / totalPixels);
    const contrastScore = Math.min(1.0, stdDev / 60);

    // 3. Blur detection: Laplacian variance (simplified)
    const blurVar = calculateLaplacianVariance(imageData);
    const sharpnessScore = Math.min(1.0, blurVar / 500);

    const overall = (brightnessScore * 0.25 + contrastScore * 0.35 + sharpnessScore * 0.40);
    const acceptable = overall >= IMAGE_QUALITY_MIN;

    return {
        blur: sharpnessScore,
        brightness: brightnessScore,
        contrast: contrastScore,
        overall,
        acceptable,
    };
}

// ── Internal Heuristics ──────────────────────────────────────────────

function calculateEdgeDensity(imageData: ImageData): number {
    const { data, width, height } = imageData;
    let edgeCount = 0;
    const threshold = 30;

    // Simple Sobel-like horizontal edge detection on luminance
    for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
            const idx = (y * width + x) * 4;
            const idxLeft = (y * width + (x - 1)) * 4;
            const idxRight = (y * width + (x + 1)) * 4;
            const idxUp = ((y - 1) * width + x) * 4;
            const idxDown = ((y + 1) * width + x) * 4;

            const lumCenter = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
            const lumLeft = data[idxLeft] * 0.299 + data[idxLeft + 1] * 0.587 + data[idxLeft + 2] * 0.114;
            const lumRight = data[idxRight] * 0.299 + data[idxRight + 1] * 0.587 + data[idxRight + 2] * 0.114;
            const lumUp = data[idxUp] * 0.299 + data[idxUp + 1] * 0.587 + data[idxUp + 2] * 0.114;
            const lumDown = data[idxDown] * 0.299 + data[idxDown + 1] * 0.587 + data[idxDown + 2] * 0.114;

            const gx = Math.abs(lumRight - lumLeft);
            const gy = Math.abs(lumDown - lumUp);
            const gradient = Math.sqrt(gx * gx + gy * gy);

            if (gradient > threshold) edgeCount++;
        }
    }

    const sampledPixels = ((height - 2) / 2) * ((width - 2) / 2);
    return Math.min(1.0, edgeCount / sampledPixels * 2.5);
}

function calculateTextureVariance(imageData: ImageData): number {
    const { data, width, height } = imageData;

    // Calculate variance in 8×8 blocks, then average
    const blockSize = 8;
    let totalVariance = 0;
    let blockCount = 0;

    for (let by = 0; by < height - blockSize; by += blockSize * 2) {
        for (let bx = 0; bx < width - blockSize; bx += blockSize * 2) {
            let sum = 0;
            let sumSq = 0;
            const n = blockSize * blockSize;

            for (let dy = 0; dy < blockSize; dy++) {
                for (let dx = 0; dx < blockSize; dx++) {
                    const idx = ((by + dy) * width + (bx + dx)) * 4;
                    const lum = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
                    sum += lum;
                    sumSq += lum * lum;
                }
            }

            const mean = sum / n;
            const variance = sumSq / n - mean * mean;
            totalVariance += variance;
            blockCount++;
        }
    }

    const avgVariance = blockCount > 0 ? totalVariance / blockCount : 0;
    return Math.min(1.0, avgVariance / 1200);
}

function calculateContrastRatio(imageData: ImageData): number {
    const { data } = imageData;
    let min = 255, max = 0;

    // Sample every 4th pixel for speed
    for (let i = 0; i < data.length; i += 16) {
        const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        if (lum < min) min = lum;
        if (lum > max) max = lum;
    }

    return (max - min) / 255;
}

function calculateLaplacianVariance(imageData: ImageData): number {
    const { data, width, height } = imageData;
    let sum = 0;
    let sumSq = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y += 3) {
        for (let x = 1; x < width - 1; x += 3) {
            const idx = (y * width + x) * 4;
            const lum = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;

            const lumUp = data[((y - 1) * width + x) * 4] * 0.299 + data[((y - 1) * width + x) * 4 + 1] * 0.587 + data[((y - 1) * width + x) * 4 + 2] * 0.114;
            const lumDown = data[((y + 1) * width + x) * 4] * 0.299 + data[((y + 1) * width + x) * 4 + 1] * 0.587 + data[((y + 1) * width + x) * 4 + 2] * 0.114;
            const lumLeft = data[(y * width + (x - 1)) * 4] * 0.299 + data[(y * width + (x - 1)) * 4 + 1] * 0.587 + data[(y * width + (x - 1)) * 4 + 2] * 0.114;
            const lumRight = data[(y * width + (x + 1)) * 4] * 0.299 + data[(y * width + (x + 1)) * 4 + 1] * 0.587 + data[(y * width + (x + 1)) * 4 + 2] * 0.114;

            const laplacian = lumUp + lumDown + lumLeft + lumRight - 4 * lum;
            sum += laplacian;
            sumSq += laplacian * laplacian;
            count++;
        }
    }

    if (count === 0) return 0;
    const mean = sum / count;
    return sumSq / count - mean * mean;
}

function signalToBucket(signal: number): TreadBucket {
    if (signal >= 0.7) return 'NEW';
    if (signal >= 0.5) return 'HEALTHY';
    if (signal >= 0.35) return 'MODERATE';
    if (signal >= 0.2) return 'LOW';
    return 'CRITICAL';
}

function calculateConfidence(quality: ImageQuality, signal: number): number {
    // Base confidence from image quality
    let confidence = 0.55 + quality.overall * 0.30;

    // Higher confidence in extreme signals (clearly new or clearly bald)
    const extremity = Math.abs(signal - 0.5) * 2;
    confidence += extremity * 0.05;

    return Math.max(0.55, Math.min(0.90, confidence));
}
