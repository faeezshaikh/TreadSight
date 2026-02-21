'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';
import type { RiskLevel } from '@/types';
import { RISK_COLORS, WET_TRACTION_DROP_DEPTH, LEGAL_MINIMUM_DEPTH } from '@/lib/constants';

interface TimeTravelProps {
    t: number;
    onTChange: (t: number) => void;
    totalMonths: number;
    currentDate: Date;
    riskLevel: RiskLevel;
    currentDepth: number;
    initialDepth?: number;
    monthlyWearRate?: number;
}

export default function TimeTravel({
    t,
    onTChange,
    totalMonths,
    currentDate,
    riskLevel,
    currentDepth,
    initialDepth = 8,
    monthlyWearRate = 0.14,
}: TimeTravelProps) {
    const riskColor = RISK_COLORS[riskLevel];

    // Compute real threshold positions from wear data
    const wetThresholdT = useMemo(() => {
        if (monthlyWearRate <= 0 || totalMonths <= 0) return 0.6;
        const monthsToWet = Math.max(0, (initialDepth - WET_TRACTION_DROP_DEPTH) / monthlyWearRate);
        return Math.min(1, Math.max(0, monthsToWet / totalMonths));
    }, [initialDepth, monthlyWearRate, totalMonths]);

    const legalThresholdT = useMemo(() => {
        if (monthlyWearRate <= 0 || totalMonths <= 0) return 0.9;
        const monthsToLegal = Math.max(0, (initialDepth - LEGAL_MINIMUM_DEPTH) / monthlyWearRate);
        return Math.min(1, Math.max(0, monthsToLegal / totalMonths));
    }, [initialDepth, monthlyWearRate, totalMonths]);

    // Determine if we've crossed thresholds
    const pastWetThreshold = t >= wetThresholdT;
    const pastLegalThreshold = t >= legalThresholdT;

    const formattedDate = useMemo(() => {
        return currentDate.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
        });
    }, [currentDate]);

    const timeLabel = useMemo(() => {
        if (t < 0.01) return 'Today';
        const months = Math.round(t * totalMonths);
        if (months < 1) return 'Today';
        if (months === 1) return '+1 month';
        if (months < 12) return `+${months} months`;
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (remainingMonths === 0) return `+${years} year${years > 1 ? 's' : ''}`;
        return `+${years}y ${remainingMonths}m`;
    }, [t, totalMonths]);

    // Use CSS custom property to set slider progress color
    const sliderStyle = {
        '--slider-progress': `${t * 100}%`,
        '--slider-color': riskColor,
    } as React.CSSProperties;

    return (
        <div className="space-y-4">
            {/* Label */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-[#555570] uppercase tracking-wider">
                        Time Travel
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-lg font-bold transition-colors duration-300" style={{ color: riskColor }}>
                            {timeLabel}
                        </span>
                        <span className="text-sm text-[#8888a0]">{formattedDate}</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-[#555570]">Depth</p>
                    <p className="text-lg font-mono font-bold">
                        <AnimatedNumber
                            value={currentDepth}
                            decimals={1}
                            duration={400}
                            className="transition-colors duration-300"
                        />
                        <span className="text-sm text-[#8888a0]">/32&quot;</span>
                    </p>
                </div>
            </div>

            {/* Slider */}
            <div className="relative" style={sliderStyle}>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.005"
                    value={t}
                    onChange={(e) => onTChange(parseFloat(e.target.value))}
                    className="w-full time-travel-slider"
                />

                {/* Threshold markers */}
                <div className="relative h-auto mt-2">
                    {/* Wet traction drop marker */}
                    <div
                        className="absolute top-0 flex flex-col items-center transition-all duration-500"
                        style={{ left: `${wetThresholdT * 100}%`, transform: 'translateX(-50%)' }}
                    >
                        <div className={`w-0.5 h-4 transition-colors duration-300 ${pastWetThreshold ? 'bg-amber-400' : 'bg-amber-500/40'}`} />
                        <span className={`text-[10px] whitespace-nowrap mt-0.5 transition-all duration-300 ${pastWetThreshold ? 'text-amber-300 font-semibold' : 'text-amber-400/60'}`}>
                            4/32&quot;
                        </span>
                    </div>

                    {/* Legal minimum marker */}
                    <div
                        className="absolute top-0 flex flex-col items-center transition-all duration-500"
                        style={{ left: `${legalThresholdT * 100}%`, transform: 'translateX(-50%)' }}
                    >
                        <div className={`w-0.5 h-4 transition-colors duration-300 ${pastLegalThreshold ? 'bg-red-400' : 'bg-red-500/40'}`} />
                        <span className={`text-[10px] whitespace-nowrap mt-0.5 transition-all duration-300 ${pastLegalThreshold ? 'text-red-300 font-semibold' : 'text-red-400/60'}`}>
                            2/32&quot;
                        </span>
                    </div>
                </div>

                {/* Today / End labels */}
                <div className="flex justify-between mt-5">
                    <span className="text-xs text-[#555570]">Today</span>
                    <span className="text-xs text-[#555570]">End of life</span>
                </div>
            </div>

            {/* Hydroplaning threshold warning */}
            <AnimatePresence>
                {pastWetThreshold && !pastLegalThreshold && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -5 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -5 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                        <span className="text-sm">⚠️</span>
                        <p className="text-xs text-amber-300">
                            Wet traction drops significantly. Hydroplaning risk increases.
                        </p>
                    </motion.div>
                )}
                {pastLegalThreshold && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -5 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -5 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
                    >
                        <span className="text-sm">🚨</span>
                        <p className="text-xs text-red-300">
                            Legal minimum reached. Tire replacement is critical for safety.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
