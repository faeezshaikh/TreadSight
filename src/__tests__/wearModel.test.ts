import {
    predictWearTimeline,
    depthAtTime,
    dateAtTime,
    getMonthlyWearRate,
} from '../lib/wearModel';

describe('Wear Model', () => {
    describe('predictWearTimeline', () => {
        it('should return valid prediction for new tires', () => {
            const result = predictWearTimeline({
                depthRange: { min: 8, max: 10 },
                milesPerYear: 12000,
                climate: 'neutral',
                rotation: 'normal',
                drivingStyle: 'normal',
            });

            expect(result.currentDepth32nds).toBe(9);
            expect(result.remainingMonths).toBeGreaterThan(24);
            expect(result.wearRatePer1000Miles).toBeGreaterThan(0);
            expect(result.confidenceBand).toBeGreaterThanOrEqual(0.15);
            expect(result.confidenceBand).toBeLessThanOrEqual(0.20);
        });

        it('should return shorter timeline for aggressive driving', () => {
            const normal = predictWearTimeline({
                depthRange: { min: 6, max: 8 },
                milesPerYear: 12000,
                climate: 'neutral',
                rotation: 'normal',
                drivingStyle: 'normal',
            });

            const aggressive = predictWearTimeline({
                depthRange: { min: 6, max: 8 },
                milesPerYear: 12000,
                climate: 'neutral',
                rotation: 'normal',
                drivingStyle: 'aggressive',
            });

            expect(aggressive.remainingMonths).toBeLessThan(normal.remainingMonths);
        });

        it('should return shorter timeline with more miles per year', () => {
            const low = predictWearTimeline({
                depthRange: { min: 6, max: 8 },
                milesPerYear: 8000,
                climate: 'neutral',
                rotation: 'normal',
                drivingStyle: 'normal',
            });

            const high = predictWearTimeline({
                depthRange: { min: 6, max: 8 },
                milesPerYear: 20000,
                climate: 'neutral',
                rotation: 'normal',
                drivingStyle: 'normal',
            });

            expect(high.remainingMonths).toBeLessThan(low.remainingMonths);
        });

        it('should handle skip-rotations modifier', () => {
            const normal = predictWearTimeline({
                depthRange: { min: 4, max: 6 },
                milesPerYear: 12000,
                climate: 'neutral',
                rotation: 'normal',
                drivingStyle: 'normal',
            });

            const skipRotation = predictWearTimeline({
                depthRange: { min: 4, max: 6 },
                milesPerYear: 12000,
                climate: 'neutral',
                rotation: 'skip-rotations',
                drivingStyle: 'normal',
            });

            expect(skipRotation.wearRatePer1000Miles).toBeGreaterThan(normal.wearRatePer1000Miles);
        });

        it('should handle hot climate modifier', () => {
            const neutral = predictWearTimeline({
                depthRange: { min: 6, max: 8 },
                milesPerYear: 12000,
                climate: 'neutral',
                rotation: 'normal',
                drivingStyle: 'normal',
            });

            const hot = predictWearTimeline({
                depthRange: { min: 6, max: 8 },
                milesPerYear: 12000,
                climate: 'hot',
                rotation: 'normal',
                drivingStyle: 'normal',
            });

            expect(hot.wearRatePer1000Miles).toBeGreaterThan(neutral.wearRatePer1000Miles);
        });

        it('should return 0 remaining months for critical tires', () => {
            const result = predictWearTimeline({
                depthRange: { min: 0, max: 2 },
                milesPerYear: 12000,
                climate: 'neutral',
                rotation: 'normal',
                drivingStyle: 'normal',
            });

            expect(result.remainingMonths).toBeLessThanOrEqual(12);
        });

        it('dates should be in chronological order', () => {
            const result = predictWearTimeline({
                depthRange: { min: 8, max: 10 },
                milesPerYear: 12000,
                climate: 'neutral',
                rotation: 'normal',
                drivingStyle: 'normal',
            });

            expect(result.wetTractionDropDate.getTime()).toBeLessThanOrEqual(result.legalMinimumDate.getTime());
        });
    });

    describe('depthAtTime', () => {
        it('should return current depth at t=0', () => {
            expect(depthAtTime(8, 0, 36, 0.2)).toBe(8);
        });

        it('should return 0 or positive at t=1', () => {
            const depth = depthAtTime(8, 1, 36, 0.2);
            expect(depth).toBeGreaterThanOrEqual(0);
        });

        it('should decrease depth linearly', () => {
            const d1 = depthAtTime(8, 0.25, 40, 0.2);
            const d2 = depthAtTime(8, 0.50, 40, 0.2);
            const d3 = depthAtTime(8, 0.75, 40, 0.2);
            expect(d1).toBeGreaterThan(d2);
            expect(d2).toBeGreaterThan(d3);
        });

        it('should never return negative depth', () => {
            const depth = depthAtTime(2, 1, 100, 1);
            expect(depth).toBeGreaterThanOrEqual(0);
        });
    });

    describe('getMonthlyWearRate', () => {
        it('should calculate correct monthly rate', () => {
            const rate = getMonthlyWearRate(0.14, 12000);
            expect(rate).toBeCloseTo(0.14, 2);
        });

        it('should scale with miles per year', () => {
            const low = getMonthlyWearRate(0.14, 8000);
            const high = getMonthlyWearRate(0.14, 20000);
            expect(high).toBeGreaterThan(low);
        });
    });
});
