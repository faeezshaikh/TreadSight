import { calculateWeatherRisk, adjustRemainingMonths } from '../lib/weatherRisk';

describe('Weather Risk', () => {
    describe('calculateWeatherRisk', () => {
        it('should not change risk in dry conditions', () => {
            const result = calculateWeatherRisk(6, 'Safe', 'dry');
            expect(result.adjustedRiskLevel).toBe('Safe');
            expect(result.riskModifier).toBe(1.0);
        });

        it('should increase risk in wet conditions at low depth', () => {
            const result = calculateWeatherRisk(3, 'Plan Soon', 'wet');
            expect(result.adjustedRiskLevel).not.toBe('Safe');
        });

        it('should escalate to Replace Now in wet at critical depth', () => {
            const result = calculateWeatherRisk(2, 'Plan Soon', 'wet');
            expect(result.adjustedRiskLevel).toBe('Replace Now');
        });

        it('should escalate risk in snow conditions earlier', () => {
            const dryResult = calculateWeatherRisk(5, 'Monitor', 'dry');
            const snowResult = calculateWeatherRisk(5, 'Monitor', 'snow');
            // Snow should have higher risk or at least different description
            expect(snowResult.riskModifier).toBeGreaterThan(dryResult.riskModifier);
        });

        it('should include a description', () => {
            const result = calculateWeatherRisk(6, 'Safe', 'wet');
            expect(result.description).toBeTruthy();
            expect(typeof result.description).toBe('string');
        });

        it('should handle critical depth in snow', () => {
            const result = calculateWeatherRisk(3, 'Plan Soon', 'snow');
            expect(result.adjustedRiskLevel).toBe('Replace Now');
        });
    });

    describe('adjustRemainingMonths', () => {
        it('should return same months for dry', () => {
            expect(adjustRemainingMonths(24, 'dry')).toBe(24);
        });

        it('should reduce months for wet conditions', () => {
            const adjusted = adjustRemainingMonths(24, 'wet');
            expect(adjusted).toBeLessThan(24);
        });

        it('should reduce months more for snow', () => {
            const wet = adjustRemainingMonths(24, 'wet');
            const snow = adjustRemainingMonths(24, 'snow');
            expect(snow).toBeLessThan(wet);
        });

        it('should never return negative', () => {
            expect(adjustRemainingMonths(0, 'snow')).toBeGreaterThanOrEqual(0);
        });
    });
});
