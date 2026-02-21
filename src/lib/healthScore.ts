import { TreadBucket, HealthScoreResult, RiskLevel } from '@/types';
import { SCORE_RANGES } from './constants';

/**
 * Compute a tire health score from 0–100 based on tread depth and other factors.
 *
 * @param depth32nds   Current tread depth in 32nds of an inch
 * @param bucket       The tread bucket classification
 * @param ageMonths    Tire age in months (optional; ignored if not available)
 * @param evenWear     Whether wear is even (true) or uneven (false)
 */
export function computeHealthScore(
    depth32nds: number,
    bucket: TreadBucket,
    ageMonths?: number,
    evenWear: boolean = true
): HealthScoreResult {
    // 1. Depth factor (dominant — 80% weight)
    const depthScore = calculateDepthScore(depth32nds);

    // 2. Age factor (10% weight — if available)
    const ageScore = ageMonths != null ? calculateAgeScore(ageMonths) : 100;

    // 3. Wear pattern factor (10% weight)
    const wearPatternScore = evenWear ? 100 : 65;

    // Weighted combination
    const rawScore = depthScore * 0.80 + ageScore * 0.10 + wearPatternScore * 0.10;

    // Clamp to bucket range for consistency
    const range = SCORE_RANGES[bucket];
    const clampedScore = Math.max(range.min, Math.min(range.max, Math.round(rawScore)));

    const riskLevel = getRiskLevel(clampedScore);

    return {
        score: clampedScore,
        riskLevel,
        bucket,
    };
}

/**
 * Compute score from depth only (for time travel updates)
 */
export function scoreFromDepth(depth32nds: number): number {
    return Math.max(0, Math.min(100, Math.round(calculateDepthScore(depth32nds))));
}

/**
 * Get risk level from score
 */
export function getRiskLevelFromScore(score: number): RiskLevel {
    return getRiskLevel(score);
}

// ── Internal ─────────────────────────────────────────────────────────

function calculateDepthScore(depth32nds: number): number {
    // Linear mapping: 10/32 = 100, 0/32 = 0
    // With slight curve to feel more natural
    const normalized = Math.max(0, Math.min(10, depth32nds)) / 10;
    return normalized * 100;
}

function calculateAgeScore(ageMonths: number): number {
    // Tires degrade over time regardless of tread
    // 0-24 months: 100, 24-60 months: linear decline, 60+ months: floor at 40
    if (ageMonths <= 24) return 100;
    if (ageMonths >= 60) return 40;
    return 100 - ((ageMonths - 24) / 36) * 60;
}

function getRiskLevel(score: number): RiskLevel {
    if (score >= 70) return 'Safe';
    if (score >= 50) return 'Monitor';
    if (score > 25) return 'Plan Soon';
    return 'Replace Now';
}
