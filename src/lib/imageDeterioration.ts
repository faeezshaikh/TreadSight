/**
 * Image Deterioration Pipeline — Enhanced
 *
 * Applies progressive visual wear to a tire image based on parameter `t` (0..1).
 * All processing is done client-side using Canvas for real-time performance.
 *
 * Effects applied:
 * 1. Contrast reduction in tread region (smooth weighted blend)
 * 2. Progressive Gaussian-weighted smoothing (flatten texture)
 * 3. Groove erosion with local variance detection
 * 4. Micro-crack noise that follows surface texture
 * 5. Edge softening for natural wear look
 * 6. Optional uneven shoulder wear (exaggerated outer 20%)
 * 7. Aging overlay with cinematic vignette
 */

export interface DeteriorationOptions {
    t: number;               // 0 = original, 1 = fully worn
    unevenWear: boolean;     // Apply shoulder-heavy wear
    width: number;
    height: number;
}

/**
 * Apply deterioration effects to an image on a canvas context.
 * Operates directly on the canvas for maximum performance.
 */
export function applyDeterioration(
    ctx: CanvasRenderingContext2D,
    originalImage: HTMLImageElement,
    options: DeteriorationOptions
): void {
    const { t, unevenWear, width, height } = options;

    // Draw original image
    ctx.drawImage(originalImage, 0, 0, width, height);

    if (t <= 0.01) return; // No deterioration needed

    // Get image data for pixel manipulation
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    // Create tread region mask (center 70% of image, vertically centered)
    const treadMask = createTreadMask(width, height, unevenWear);

    // 1. Reduce contrast in tread region (smooth weighted blend)
    applyContrastReduction(pixels, treadMask, t, width, height);

    // 2. Apply Gaussian-weighted smoothing (flatten texture)
    if (t > 0.12) {
        applyGaussianSmoothing(pixels, treadMask, t, width, height);
    }

    // 3. Groove erosion with local variance detection
    if (t > 0.18) {
        applyGrooveErosion(pixels, treadMask, t, width, height);
    }

    // 4. Edge softening for natural wear look
    if (t > 0.25) {
        applyEdgeSoftening(pixels, treadMask, t, width, height);
    }

    // 5. Micro-crack noise at high wear
    if (t > 0.55) {
        applyMicroCracks(pixels, treadMask, t, width, height);
    }

    // Put processed data back
    ctx.putImageData(imageData, 0, 0);

    // 6. Apply overall darkening/aging overlay
    applyAgingOverlay(ctx, t, width, height);
}

// ── Mask Generation ──────────────────────────────────────────────────

function createTreadMask(
    width: number,
    height: number,
    unevenWear: boolean
): Float32Array {
    const mask = new Float32Array(width * height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width * 0.35;
    const radiusY = height * 0.40;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = (x - centerX) / radiusX;
            const dy = (y - centerY) / radiusY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let value = Math.max(0, 1.0 - dist);
            // Smoother falloff using smoothstep
            value = value * value * (3 - 2 * value);

            // If uneven wear, exaggerate outer 20% shoulders
            if (unevenWear) {
                const edgeFactor = Math.abs(dx);
                if (edgeFactor > 0.5) {
                    const shoulderBoost = (edgeFactor - 0.5) * 1.2;
                    value = Math.min(1.0, value + shoulderBoost * value);
                } else {
                    value = Math.min(1.0, value + edgeFactor * 0.3 * value);
                }
            }

            mask[y * width + x] = value;
        }
    }

    return mask;
}

// ── Effect Implementations ───────────────────────────────────────────

function applyContrastReduction(
    pixels: Uint8ClampedArray,
    mask: Float32Array,
    t: number,
    width: number,
    height: number
): void {
    const strength = t * 0.45; // Up to 45% contrast reduction

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const m = mask[y * width + x] * strength;

            if (m < 0.01) continue;

            // Pull toward local mean with warm rubber tone
            const gray = (pixels[idx] * 0.3 + pixels[idx + 1] * 0.59 + pixels[idx + 2] * 0.11); // luminance-weighted
            const warmGray = gray + 2; // Slight warm shift
            pixels[idx] = Math.round(pixels[idx] + (warmGray - pixels[idx]) * m);
            pixels[idx + 1] = Math.round(pixels[idx + 1] + (warmGray - 1 - pixels[idx + 1]) * m);
            pixels[idx + 2] = Math.round(pixels[idx + 2] + (warmGray - 3 - pixels[idx + 2]) * m);
        }
    }
}

function applyGaussianSmoothing(
    pixels: Uint8ClampedArray,
    mask: Float32Array,
    t: number,
    width: number,
    height: number
): void {
    const strength = Math.min(1.0, (t - 0.12) * 1.3);
    const radius = Math.ceil(strength * 2) + 1;

    // Gaussian-like weights (pre-computed for performance)
    const weights: number[] = [];
    let weightSum = 0;
    for (let dy = -radius; dy <= radius; dy += 2) {
        for (let dx = -radius; dx <= radius; dx += 2) {
            const d = Math.sqrt(dx * dx + dy * dy);
            const w = Math.exp(-d * d / (2 * radius * radius));
            weights.push(w);
            weightSum += w;
        }
    }
    // Normalize
    for (let i = 0; i < weights.length; i++) {
        weights[i] /= weightSum;
    }

    // Create copy for sampling
    const original = new Uint8ClampedArray(pixels);

    for (let y = radius; y < height - radius; y += 1) {
        for (let x = radius; x < width - radius; x += 1) {
            const m = mask[y * width + x] * strength;
            if (m < 0.05) continue;

            let r = 0, g = 0, b = 0;
            let wi = 0;

            for (let dy = -radius; dy <= radius; dy += 2) {
                for (let dx = -radius; dx <= radius; dx += 2) {
                    const si = ((y + dy) * width + (x + dx)) * 4;
                    const w = weights[wi++];
                    r += original[si] * w;
                    g += original[si + 1] * w;
                    b += original[si + 2] * w;
                }
            }

            const idx = (y * width + x) * 4;
            pixels[idx] = Math.round(pixels[idx] + (r - pixels[idx]) * m);
            pixels[idx + 1] = Math.round(pixels[idx + 1] + (g - pixels[idx + 1]) * m);
            pixels[idx + 2] = Math.round(pixels[idx + 2] + (b - pixels[idx + 2]) * m);
        }
    }
}

function applyGrooveErosion(
    pixels: Uint8ClampedArray,
    mask: Float32Array,
    t: number,
    width: number,
    height: number
): void {
    const strength = Math.min(1.0, (t - 0.18) * 1.4);

    // Create a copy for local variance detection
    const original = new Uint8ClampedArray(pixels);

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const m = mask[y * width + x] * strength;
            if (m < 0.05) continue;

            const lum = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;

            // Calculate local variance to detect groove edges
            let sumDiff = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const ni = ((y + dy) * width + (x + dx)) * 4;
                    const nLum = (original[ni] + original[ni + 1] + original[ni + 2]) / 3;
                    sumDiff += Math.abs(lum - nLum);
                }
            }
            const avgDiff = sumDiff / 8;

            // Affect dark areas (grooves) and high-variance areas (edges)
            if (lum < 110 || avgDiff > 15) {
                const isGroove = lum < 100;
                const isEdge = avgDiff > 15;
                const liftFactor = isGroove ? 0.4 : isEdge ? 0.2 : 0;
                const lift = m * (130 - Math.min(lum, 130)) * liftFactor;
                pixels[idx] = Math.min(255, pixels[idx] + lift);
                pixels[idx + 1] = Math.min(255, pixels[idx + 1] + lift);
                pixels[idx + 2] = Math.min(255, pixels[idx + 2] + lift);
            }
        }
    }
}

function applyEdgeSoftening(
    pixels: Uint8ClampedArray,
    mask: Float32Array,
    t: number,
    width: number,
    height: number
): void {
    const strength = Math.min(1.0, (t - 0.25) * 1.5);
    const original = new Uint8ClampedArray(pixels);

    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const m = mask[y * width + x] * strength;
            if (m < 0.08) continue;

            const idx = (y * width + x) * 4;
            const lum = (original[idx] + original[idx + 1] + original[idx + 2]) / 3;

            // Detect edges via gradient magnitude
            const rightIdx = (y * width + (x + 1)) * 4;
            const belowIdx = ((y + 1) * width + x) * 4;
            const rightLum = (original[rightIdx] + original[rightIdx + 1] + original[rightIdx + 2]) / 3;
            const belowLum = (original[belowIdx] + original[belowIdx + 1] + original[belowIdx + 2]) / 3;
            const gradient = Math.abs(lum - rightLum) + Math.abs(lum - belowLum);

            // Soften edges by blending with neighbors
            if (gradient > 10) {
                const blendStrength = m * Math.min(1, gradient / 50) * 0.3;
                const avgR = (original[idx] + original[rightIdx] + original[belowIdx]) / 3;
                const avgG = (original[idx + 1] + original[rightIdx + 1] + original[belowIdx + 1]) / 3;
                const avgB = (original[idx + 2] + original[rightIdx + 2] + original[belowIdx + 2]) / 3;
                pixels[idx] = Math.round(pixels[idx] + (avgR - pixels[idx]) * blendStrength);
                pixels[idx + 1] = Math.round(pixels[idx + 1] + (avgG - pixels[idx + 1]) * blendStrength);
                pixels[idx + 2] = Math.round(pixels[idx + 2] + (avgB - pixels[idx + 2]) * blendStrength);
            }
        }
    }
}

function applyMicroCracks(
    pixels: Uint8ClampedArray,
    mask: Float32Array,
    t: number,
    width: number,
    height: number
): void {
    const strength = Math.min(1.0, (t - 0.55) * 2.2);
    const seed = 42;

    // Deterministic pseudo-random for consistent crack patterns
    let rng = seed;
    const nextRand = () => {
        rng = (rng * 1103515245 + 12345) & 0x7fffffff;
        return rng / 0x7fffffff;
    };

    for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
            const m = mask[y * width + x] * strength;
            if (m < 0.1) continue;

            if (nextRand() < 0.035 * strength) {
                // Draw a micro-crack: a short dark line
                const length = Math.floor(nextRand() * 5) + 2;

                // Cracks tend to follow local texture direction
                const localLum = y > 0 && x > 0
                    ? (pixels[((y - 1) * width + x) * 4] - pixels[(y * width + (x - 1)) * 4])
                    : 0;
                const baseAngle = Math.abs(localLum) > 20
                    ? Math.atan2(localLum, 30) // Follow gradient
                    : nextRand() * Math.PI; // Random

                const angle = baseAngle + (nextRand() - 0.5) * 0.5; // Add slight randomness
                const dx = Math.cos(angle);
                const dy = Math.sin(angle);

                for (let s = 0; s < length; s++) {
                    const cx = Math.round(x + dx * s);
                    const cy = Math.round(y + dy * s);
                    if (cx < 0 || cx >= width || cy < 0 || cy >= height) break;

                    const idx = (cy * width + cx) * 4;
                    const darken = m * (35 + nextRand() * 15); // Variable darkening
                    pixels[idx] = Math.max(0, pixels[idx] - darken);
                    pixels[idx + 1] = Math.max(0, pixels[idx + 1] - darken);
                    pixels[idx + 2] = Math.max(0, pixels[idx + 2] - darken);
                }
            }
        }
    }
}

function applyAgingOverlay(
    ctx: CanvasRenderingContext2D,
    t: number,
    width: number,
    height: number
): void {
    // Subtle warm rubber tone overlay that increases with wear
    const alpha = t * 0.06;
    ctx.fillStyle = `rgba(45, 35, 25, ${alpha})`;
    ctx.fillRect(0, 0, width, height);

    // Cinematic vignette that intensifies with wear
    if (t > 0.3) {
        const vignetteAlpha = (t - 0.3) * 0.12;
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, width * 0.25,
            width / 2, height / 2, width * 0.65
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, `rgba(0, 0, 0, ${vignetteAlpha * 0.3})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteAlpha})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    // Slight color temperature shift toward brown at high wear
    if (t > 0.6) {
        const tintAlpha = (t - 0.6) * 0.08;
        ctx.fillStyle = `rgba(60, 40, 20, ${tintAlpha})`;
        ctx.fillRect(0, 0, width, height);
    }
}
