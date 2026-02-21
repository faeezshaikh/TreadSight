import {
    WearPredictionInput,
    WearPrediction,
} from '@/types';
import {
    BASE_WEAR_RATE_PER_1000_MILES,
    WEAR_MODIFIERS,
    WET_TRACTION_DROP_DEPTH,
    LEGAL_MINIMUM_DEPTH,
} from './constants';

/**
 * Predict tire wear timeline based on current depth and driving parameters.
 * Uses a linear wear model with adjustment factors.
 */
export function predictWearTimeline(input: WearPredictionInput): WearPrediction {
    const {
        depthRange,
        milesPerYear,
        climate,
        rotation,
        drivingStyle,
    } = input;

    // Current depth is midpoint of the range
    const currentDepth = (depthRange.min + depthRange.max) / 2;

    // Calculate adjusted wear rate
    const climateModifier = WEAR_MODIFIERS.climate[climate] ?? 1.0;
    const rotationModifier = WEAR_MODIFIERS.rotation[rotation] ?? 1.0;
    const drivingModifier = WEAR_MODIFIERS.driving[drivingStyle] ?? 1.0;

    const adjustedWearRate =
        BASE_WEAR_RATE_PER_1000_MILES * climateModifier * rotationModifier * drivingModifier;

    // Miles per month
    const milesPerMonth = milesPerYear / 12;

    // 32nds lost per month
    const depthLossPerMonth = (milesPerMonth / 1000) * adjustedWearRate;

    // Guard against zero or negative wear rate
    if (depthLossPerMonth <= 0) {
        const farFuture = new Date();
        farFuture.setFullYear(farFuture.getFullYear() + 10);
        return {
            currentDepth32nds: currentDepth,
            wearRatePer1000Miles: adjustedWearRate,
            wetTractionDropDate: farFuture,
            legalMinimumDate: farFuture,
            tireDeadDate: farFuture,
            remainingMonths: 120,
            confidenceBand: 0.20,
        };
    }

    // Calculate months until reaching key thresholds
    const monthsToWetDrop = Math.max(0, (currentDepth - WET_TRACTION_DROP_DEPTH) / depthLossPerMonth);
    const monthsToLegal = Math.max(0, (currentDepth - LEGAL_MINIMUM_DEPTH) / depthLossPerMonth);
    const monthsToDeadRaw = Math.max(0, currentDepth / depthLossPerMonth);
    // Tire is "dead" when it hits legal minimum
    const monthsToDead = monthsToLegal;

    const now = new Date();

    const wetTractionDropDate = addMonths(now, monthsToWetDrop);
    const legalMinimumDate = addMonths(now, monthsToLegal);
    const tireDeadDate = addMonths(now, monthsToDead);

    // Confidence band: wider for less reliable inputs
    const confidenceBand = calculateConfidenceBand(currentDepth, milesPerYear);

    return {
        currentDepth32nds: currentDepth,
        wearRatePer1000Miles: adjustedWearRate,
        wetTractionDropDate,
        legalMinimumDate,
        tireDeadDate,
        remainingMonths: Math.round(monthsToDead),
        confidenceBand,
    };
}

/**
 * Calculate depth at a given time parameter t (0 = today, 1 = tire dead)
 */
export function depthAtTime(
    currentDepth: number,
    t: number,
    totalMonths: number,
    wearRatePerMonth: number
): number {
    const monthsElapsed = t * totalMonths;
    const depth = currentDepth - monthsElapsed * wearRatePerMonth;
    return Math.max(0, Math.round(depth * 100) / 100);
}

/**
 * Calculate date at time parameter t
 */
export function dateAtTime(t: number, totalMonths: number): Date {
    return addMonths(new Date(), t * totalMonths);
}

/**
 * Get monthly wear rate from per-1000-miles rate and miles/year
 */
export function getMonthlyWearRate(
    wearRatePer1000Miles: number,
    milesPerYear: number
): number {
    return (milesPerYear / 12 / 1000) * wearRatePer1000Miles;
}

// ── Helpers ──────────────────────────────────────────────────────────

function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + Math.round(months));
    return result;
}

function calculateConfidenceBand(depth: number, milesPerYear: number): number {
    // More confidence when tread is still deep and driving is average
    let band = 0.175; // base ±17.5%
    if (depth < 3) band += 0.025; // less confidence at low tread
    if (milesPerYear > 18000) band += 0.015; // high mileage adds uncertainty
    if (milesPerYear < 6000) band += 0.01;   // very low mileage too
    return Math.min(0.20, Math.max(0.15, band));
}
