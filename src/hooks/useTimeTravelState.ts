'use client';

import { useState, useCallback, useMemo } from 'react';
import type { TimeTravelState, WeatherMode, RiskLevel, AnalysisResult } from '@/types';
import { scoreFromDepth, getRiskLevelFromScore } from '@/lib/healthScore';
import { calculateWeatherRisk, adjustRemainingMonths } from '@/lib/weatherRisk';
import { getMonthlyWearRate, depthAtTime, dateAtTime } from '@/lib/wearModel';
import { WEAR_MODIFIERS } from '@/lib/constants';

interface UseTimeTravelOptions {
    analysis: AnalysisResult | null;
}

export function useTimeTravelState({ analysis }: UseTimeTravelOptions) {
    const [t, setT] = useState(0);
    const [weatherMode, setWeatherMode] = useState<WeatherMode>('dry');
    const [skipRotations, setSkipRotations] = useState(false);
    const [aggressiveDriving, setAggressiveDriving] = useState(false);

    // Calculate adjusted wear rate based on toggles
    const adjustedWearRate = useMemo(() => {
        if (!analysis) return 0;
        let rate = analysis.wearPrediction.wearRatePer1000Miles;
        if (skipRotations) rate *= WEAR_MODIFIERS.rotation['skip-rotations'];
        if (aggressiveDriving) rate *= WEAR_MODIFIERS.driving.aggressive;
        return rate;
    }, [analysis, skipRotations, aggressiveDriving]);

    // Calculate total remaining months with adjustments
    const totalMonths = useMemo(() => {
        if (!analysis) return 0;
        const baseMonths = analysis.wearPrediction.remainingMonths;
        const adjustedForDriving = skipRotations || aggressiveDriving
            ? Math.round(baseMonths / (
                (skipRotations ? WEAR_MODIFIERS.rotation['skip-rotations'] : 1) *
                (aggressiveDriving ? WEAR_MODIFIERS.driving.aggressive : 1)
            ))
            : baseMonths;
        return adjustRemainingMonths(adjustedForDriving, weatherMode);
    }, [analysis, skipRotations, aggressiveDriving, weatherMode]);

    const monthlyWearRate = useMemo(() => {
        if (!analysis) return 0;
        return getMonthlyWearRate(adjustedWearRate, 12000);
    }, [analysis, adjustedWearRate]);

    // Current state at time t
    const state: TimeTravelState = useMemo(() => {
        if (!analysis) {
            return {
                t: 0,
                currentDate: new Date(),
                currentDepth: 0,
                currentScore: 0,
                currentRisk: 'Safe' as RiskLevel,
                weatherMode: 'dry' as WeatherMode,
                skipRotations: false,
                aggressiveDriving: false,
            };
        }

        const currentDepth = depthAtTime(
            analysis.wearPrediction.currentDepth32nds,
            t,
            totalMonths,
            monthlyWearRate
        );

        const currentScore = scoreFromDepth(currentDepth);
        const baseRisk = getRiskLevelFromScore(currentScore);
        const weatherResult = calculateWeatherRisk(currentDepth, baseRisk, weatherMode);
        const currentDate = dateAtTime(t, totalMonths);

        return {
            t,
            currentDate,
            currentDepth,
            currentScore,
            currentRisk: weatherResult.adjustedRiskLevel,
            weatherMode,
            skipRotations,
            aggressiveDriving,
        };
    }, [analysis, t, totalMonths, monthlyWearRate, weatherMode, skipRotations, aggressiveDriving]);

    const handleSliderChange = useCallback((newT: number) => {
        setT(Math.max(0, Math.min(1, newT)));
    }, []);

    const toggleSkipRotations = useCallback(() => {
        setSkipRotations(prev => !prev);
    }, []);

    const toggleAggressiveDriving = useCallback(() => {
        setAggressiveDriving(prev => !prev);
    }, []);

    return {
        state,
        totalMonths,
        setT: handleSliderChange,
        weatherMode,
        setWeatherMode,
        skipRotations,
        toggleSkipRotations,
        aggressiveDriving,
        toggleAggressiveDriving,
    };
}
