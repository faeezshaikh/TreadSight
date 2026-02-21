'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { RiskLevel } from '@/types';
import { RISK_COLORS } from '@/lib/constants';

interface HealthScoreProps {
    score: number;
    riskLevel: RiskLevel;
    animated?: boolean;
}

export default function HealthScore({ score, riskLevel, animated = true }: HealthScoreProps) {
    const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
    const color = RISK_COLORS[riskLevel];

    // Smooth score animation
    useEffect(() => {
        if (!animated) {
            setDisplayScore(score);
            return;
        }

        let start: number | null = null;
        const startValue = displayScore;
        const duration = 600; // ms

        const animate = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setDisplayScore(Math.round(startValue + (score - startValue) * eased));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [score, animated]);

    // SVG ring parameters
    const size = 160;
    const strokeWidth = 8;
    const tickStrokeWidth = 1;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percent = displayScore / 100;
    const offset = circumference * (1 - percent);

    // Decorative tick marks
    const tickCount = 40;
    const tickRadius = radius + 6;

    // Determine if score is in danger zone for pulse
    const shouldPulse = displayScore < 35;

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size + 16, height: size + 16 }}>
                <svg width={size + 16} height={size + 16} className="-rotate-90">
                    {/* Decorative tick marks */}
                    {Array.from({ length: tickCount }).map((_, i) => {
                        const angle = (i / tickCount) * Math.PI * 2;
                        const x1 = (size + 16) / 2 + Math.cos(angle) * (tickRadius - 3);
                        const y1 = (size + 16) / 2 + Math.sin(angle) * (tickRadius - 3);
                        const x2 = (size + 16) / 2 + Math.cos(angle) * (tickRadius + 1);
                        const y2 = (size + 16) / 2 + Math.sin(angle) * (tickRadius + 1);
                        const isActive = i / tickCount <= percent;
                        return (
                            <line
                                key={i}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={isActive ? `${color}60` : 'rgba(255,255,255,0.06)'}
                                strokeWidth={tickStrokeWidth}
                                style={{
                                    transition: 'stroke 0.4s ease',
                                }}
                            />
                        );
                    })}

                    {/* Background ring */}
                    <circle
                        cx={(size + 16) / 2}
                        cy={(size + 16) / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={strokeWidth}
                    />

                    {/* Score ring with glow trail */}
                    <motion.circle
                        cx={(size + 16) / 2}
                        cy={(size + 16) / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className={shouldPulse ? 'animate-ring-pulse' : ''}
                        style={{
                            filter: `drop-shadow(0 0 10px ${color}80) drop-shadow(0 0 20px ${color}40)`,
                            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
                        }}
                    />

                    {/* Glow trail — secondary ring */}
                    <circle
                        cx={(size + 16) / 2}
                        cy={(size + 16) / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth + 6}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        opacity={0.1}
                        style={{
                            filter: `blur(4px)`,
                            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
                        }}
                    />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        className="text-4xl font-extrabold font-mono tabular-nums"
                        style={{ color }}
                        animate={{
                            textShadow: shouldPulse
                                ? [`0 0 20px ${color}60`, `0 0 10px ${color}30`]
                                : `0 0 10px ${color}30`,
                        }}
                        transition={{ duration: 1.5, repeat: shouldPulse ? Infinity : 0, repeatType: 'reverse' }}
                    >
                        {displayScore}
                    </motion.span>
                    <span className="text-xs text-[#8888a0] mt-0.5">/ 100</span>
                </div>
            </div>

            {/* Label */}
            <p className="text-xs text-[#555570] mt-2 uppercase tracking-wider font-medium">
                Health Score
            </p>
        </div>
    );
}
