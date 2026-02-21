/**
 * Image Deterioration Pipeline
 *
 * Applies progressive visual wear to a tire image based on parameter `t` (0..1).
 * All processing is done client-side using Canvas for real-time performance.
 *
 * Effects applied:
 * 1. Contrast reduction in tread region
 * 2. Progressive blur/smoothing
 * 3. Groove erosion simulation
 * 4. Micro-crack noise at high wear
 * 5. Optional uneven shoulder wear
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

    // 1. Reduce contrast in tread region
    applyContrastReduction(pixels, treadMask, t, width, height);

    // 2. Apply smoothing/blur effect (flatten texture)
    if (t > 0.15) {
        applySmoothing(pixels, treadMask, t, width, height);
    }

    // 3. Groove erosion (reduce dark groove lines)
    if (t > 0.2) {
        applyGrooveErosion(pixels, treadMask, t, width, height);
    }

    // 4. Micro-crack noise at high wear
    if (t > 0.6) {
        applyMicroCracks(pixels, treadMask, t, width, height);
    }

    // Put processed data back
    ctx.putImageData(imageData, 0, 0);

    // 5. Apply overall darkening/aging overlay
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
            value = value * value; // Soft falloff

            // If uneven wear, increase effect on edges (shoulders)
            if (unevenWear) {
                const edgeFactor = Math.abs(dx) * 0.4;
                value = Math.min(1.0, value + edgeFactor * value);
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
    const strength = t * 0.5; // Up to 50% contrast reduction

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const m = mask[y * width + x] * strength;

            if (m < 0.01) continue;

            // Pull toward mean gray
            const gray = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
            pixels[idx] = Math.round(pixels[idx] + (gray - pixels[idx]) * m);
            pixels[idx + 1] = Math.round(pixels[idx + 1] + (gray - pixels[idx + 1]) * m);
            pixels[idx + 2] = Math.round(pixels[idx + 2] + (gray - pixels[idx + 2]) * m);
        }
    }
}

function applySmoothing(
    pixels: Uint8ClampedArray,
    mask: Float32Array,
    t: number,
    width: number,
    height: number
): void {
    const strength = Math.min(1.0, (t - 0.15) * 1.2);
    const radius = Math.ceil(strength * 2) + 1;

    // Create copy for sampling
    const original = new Uint8ClampedArray(pixels);

    for (let y = radius; y < height - radius; y += 1) {
        for (let x = radius; x < width - radius; x += 1) {
            const m = mask[y * width + x] * strength;
            if (m < 0.05) continue;

            let r = 0, g = 0, b = 0, count = 0;

            for (let dy = -radius; dy <= radius; dy += 2) {
                for (let dx = -radius; dx <= radius; dx += 2) {
                    const si = ((y + dy) * width + (x + dx)) * 4;
                    r += original[si];
                    g += original[si + 1];
                    b += original[si + 2];
                    count++;
                }
            }

            const idx = (y * width + x) * 4;
            pixels[idx] = Math.round(pixels[idx] + (r / count - pixels[idx]) * m);
            pixels[idx + 1] = Math.round(pixels[idx + 1] + (g / count - pixels[idx + 1]) * m);
            pixels[idx + 2] = Math.round(pixels[idx + 2] + (b / count - pixels[idx + 2]) * m);
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
    const strength = Math.min(1.0, (t - 0.2) * 1.5);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const m = mask[y * width + x] * strength;
            if (m < 0.05) continue;

            const lum = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;

            // Only affect dark areas (grooves appear as dark lines)
            if (lum < 100) {
                const lift = m * (100 - lum) * 0.4; // Lighten dark areas to simulate groove fill
                pixels[idx] = Math.min(255, pixels[idx] + lift);
                pixels[idx + 1] = Math.min(255, pixels[idx + 1] + lift);
                pixels[idx + 2] = Math.min(255, pixels[idx + 2] + lift);
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
    const strength = Math.min(1.0, (t - 0.6) * 2.5);
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

            if (nextRand() < 0.03 * strength) {
                // Draw a micro-crack: a short dark line
                const length = Math.floor(nextRand() * 4) + 2;
                const angle = nextRand() * Math.PI;
                const dx = Math.cos(angle);
                const dy = Math.sin(angle);

                for (let s = 0; s < length; s++) {
                    const cx = Math.round(x + dx * s);
                    const cy = Math.round(y + dy * s);
                    if (cx < 0 || cx >= width || cy < 0 || cy >= height) break;

                    const idx = (cy * width + cx) * 4;
                    const darken = m * 40;
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
    // Subtle warm tone overlay that increases with wear
    const alpha = t * 0.08;
    ctx.fillStyle = `rgba(40, 30, 20, ${alpha})`;
    ctx.fillRect(0, 0, width, height);

    // Subtle vignette at high wear
    if (t > 0.5) {
        const vignetteAlpha = (t - 0.5) * 0.15;
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, width * 0.3,
            width / 2, height / 2, width * 0.7
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteAlpha})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
}
