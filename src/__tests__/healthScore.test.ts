import { computeHealthScore, scoreFromDepth, getRiskLevelFromScore } from '../lib/healthScore';

describe('Health Score', () => {
    describe('computeHealthScore', () => {
        it('should return high score for NEW tires', () => {
            const result = computeHealthScore(9, 'NEW');
            expect(result.score).toBeGreaterThanOrEqual(85);
            expect(result.score).toBeLessThanOrEqual(100);
            expect(result.riskLevel).toBe('Safe');
            expect(result.bucket).toBe('NEW');
        });

        it('should return moderate score for HEALTHY tires', () => {
            const result = computeHealthScore(7, 'HEALTHY');
            expect(result.score).toBeGreaterThanOrEqual(70);
            expect(result.score).toBeLessThanOrEqual(85);
            expect(result.riskLevel).toBe('Safe');
        });

        it('should return mid score for MODERATE tires', () => {
            const result = computeHealthScore(5, 'MODERATE');
            expect(result.score).toBeGreaterThanOrEqual(50);
            expect(result.score).toBeLessThanOrEqual(70);
        });

        it('should return low score for LOW tires', () => {
            const result = computeHealthScore(3, 'LOW');
            expect(result.score).toBeGreaterThanOrEqual(25);
            expect(result.score).toBeLessThanOrEqual(50);
        });

        it('should return critical score for CRITICAL tires', () => {
            const result = computeHealthScore(1, 'CRITICAL');
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(25);
            expect(result.riskLevel).toBe('Replace Now');
        });

        it('should factor in uneven wear', () => {
            const even = computeHealthScore(7, 'HEALTHY', undefined, true);
            const uneven = computeHealthScore(7, 'HEALTHY', undefined, false);
            expect(uneven.score).toBeLessThanOrEqual(even.score);
        });

        it('should factor in tire age', () => {
            const young = computeHealthScore(7, 'HEALTHY', 12);
            const old = computeHealthScore(7, 'HEALTHY', 48);
            expect(old.score).toBeLessThanOrEqual(young.score);
        });
    });

    describe('scoreFromDepth', () => {
        it('should return 100 for max depth', () => {
            expect(scoreFromDepth(10)).toBe(100);
        });

        it('should return 0 for zero depth', () => {
            expect(scoreFromDepth(0)).toBe(0);
        });

        it('should clamp to 0-100', () => {
            expect(scoreFromDepth(-5)).toBe(0);
            expect(scoreFromDepth(15)).toBe(100);
        });

        it('should scale linearly', () => {
            const mid = scoreFromDepth(5);
            expect(mid).toBe(50);
        });
    });

    describe('getRiskLevelFromScore', () => {
        it('should return Safe for high scores', () => {
            expect(getRiskLevelFromScore(80)).toBe('Safe');
            expect(getRiskLevelFromScore(70)).toBe('Safe');
        });

        it('should return Monitor for mid scores', () => {
            expect(getRiskLevelFromScore(60)).toBe('Monitor');
        });

        it('should return Plan Soon for low scores', () => {
            expect(getRiskLevelFromScore(35)).toBe('Plan Soon');
        });

        it('should return Replace Now for critical scores', () => {
            expect(getRiskLevelFromScore(10)).toBe('Replace Now');
        });
    });
});
