import { WeatherMode, RiskLevel, WeatherRiskResult } from '@/types';
import { WEATHER_RISK_MULTIPLIERS, WEATHER_DEPTH_THRESHOLDS } from './constants';

/**
 * Calculate weather-adjusted risk level for a given tread depth.
 *
 * In wet conditions, tires lose traction sooner.
 * In snow, risk escalates much earlier.
 */
export function calculateWeatherRisk(
    depth32nds: number,
    baseRiskLevel: RiskLevel,
    weatherMode: WeatherMode
): WeatherRiskResult {
    const multiplier = WEATHER_RISK_MULTIPLIERS[weatherMode];
    const thresholds = WEATHER_DEPTH_THRESHOLDS[weatherMode];

    let adjustedRisk: RiskLevel = baseRiskLevel;
    let description = '';

    if (weatherMode === 'dry') {
        description = 'Standard dry conditions — normal risk assessment.';
        return { adjustedRiskLevel: baseRiskLevel, riskModifier: multiplier, description };
    }

    // Adjust risk based on weather-specific depth thresholds
    if (depth32nds <= thresholds.critical) {
        adjustedRisk = 'Replace Now';
        description = weatherMode === 'wet'
            ? 'Dangerously low tread for wet conditions. Hydroplaning risk is high.'
            : 'Critically insufficient tread for snow. Loss of control likely on ice or packed snow.';
    } else if (depth32nds <= thresholds.warning) {
        adjustedRisk = escalateRisk(baseRiskLevel, 1);
        description = weatherMode === 'wet'
            ? 'Reduced wet traction. Stopping distances increase significantly.'
            : 'Snow traction severely compromised. Consider winter tires or replacement.';
    } else if (depth32nds <= thresholds.warning + 1) {
        adjustedRisk = escalateRisk(baseRiskLevel, 0);
        description = weatherMode === 'wet'
            ? 'Wet performance starting to decline. Monitor closely.'
            : 'Approaching snow safety limits. Plan for replacement soon.';
    } else {
        description = weatherMode === 'wet'
            ? 'Good tread depth for wet conditions.'
            : 'Adequate tread for light snow. Deep snow may require dedicated winter tires.';
    }

    return { adjustedRiskLevel: adjustedRisk, riskModifier: multiplier, description };
}

/**
 * Get the effective remaining months adjusted for weather risk
 */
export function adjustRemainingMonths(
    baseMonths: number,
    weatherMode: WeatherMode
): number {
    const multiplier = WEATHER_RISK_MULTIPLIERS[weatherMode];
    // Inverse: higher risk means fewer effective months
    return Math.max(0, Math.round(baseMonths / multiplier));
}

// ── Helpers ──────────────────────────────────────────────────────────

const RISK_ORDER: RiskLevel[] = ['Safe', 'Monitor', 'Plan Soon', 'Replace Now'];

function escalateRisk(current: RiskLevel, steps: number): RiskLevel {
    const idx = RISK_ORDER.indexOf(current);
    const newIdx = Math.min(RISK_ORDER.length - 1, idx + steps + 1);
    return RISK_ORDER[newIdx];
}
