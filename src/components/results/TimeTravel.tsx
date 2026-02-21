'use client';

import { useMemo } from 'react';
import type { RiskLevel } from '@/types';
import { RISK_COLORS } from '@/lib/constants';

interface TimeTravelProps {
    t: number;
    onTChange: (t: number) => void;
    totalMonths: number;
    currentDate: Date;
    riskLevel: RiskLevel;
    currentDepth: number;
}

export default function TimeTravel({
    t,
    onTChange,
    totalMonths,
    currentDate,
    riskLevel,
    currentDepth,
}: TimeTravelProps) {
    const riskColor = RISK_COLORS[riskLevel];

    // Threshold positions on the slider
    const wetThresholdT = useMemo(() => {
        // Position where depth crosses 4/32
        return Math.min(1, Math.max(0, 0.6)); // Approximate
    }, []);

    const legalThresholdT = useMemo(() => {
        return Math.min(1, Math.max(0, 0.9)); // Approximate
    }, []);

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

    return (
        <div className="space-y-4">
            {/* Label */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-[#555570] uppercase tracking-wider">
                        Time Travel
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-lg font-bold" style={{ color: riskColor }}>
                            {timeLabel}
                        </span>
                        <span className="text-sm text-[#8888a0]">{formattedDate}</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-[#555570]">Depth</p>
                    <p className="text-lg font-mono font-bold">
                        {currentDepth.toFixed(1)}
                        <span className="text-sm text-[#8888a0]">/32&quot;</span>
                    </p>
                </div>
            </div>

            {/* Slider */}
            <div className="relative">
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.005"
                    value={t}
                    onChange={(e) => onTChange(parseFloat(e.target.value))}
                    className="w-full"
                />

                {/* Threshold markers */}
                <div className="relative h-6 mt-1">
                    {/* Wet traction drop marker */}
                    <div
                        className="absolute top-0 flex flex-col items-center"
                        style={{ left: `${wetThresholdT * 100}%`, transform: 'translateX(-50%)' }}
                    >
                        <div className="w-px h-3 bg-amber-500/50" />
                        <span className="text-[10px] text-amber-400 whitespace-nowrap mt-0.5">4/32&quot;</span>
                    </div>

                    {/* Legal minimum marker */}
                    <div
                        className="absolute top-0 flex flex-col items-center"
                        style={{ left: `${legalThresholdT * 100}%`, transform: 'translateX(-50%)' }}
                    >
                        <div className="w-px h-3 bg-red-500/50" />
                        <span className="text-[10px] text-red-400 whitespace-nowrap mt-0.5">2/32&quot;</span>
                    </div>
                </div>

                {/* Today / End labels */}
                <div className="flex justify-between mt-0">
                    <span className="text-xs text-[#555570]">Today</span>
                    <span className="text-xs text-[#555570]">End of life</span>
                </div>
            </div>
        </div>
    );
}
