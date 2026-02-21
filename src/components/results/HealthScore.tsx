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
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percent = displayScore / 100;
    const offset = circumference * (1 - percent);

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    {/* Background ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={strokeWidth}
                    />
                    {/* Score ring */}
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{
                            filter: `drop-shadow(0 0 8px ${color}60)`,
                            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
                        }}
                    />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className="text-4xl font-extrabold font-mono tabular-nums"
                        style={{ color }}
                    >
                        {displayScore}
                    </span>
                    <span className="text-xs text-[#8888a0] mt-0.5">/ 100</span>
                </div>
            </div>

            {/* Label */}
            <p className="text-xs text-[#555570] mt-3 uppercase tracking-wider font-medium">
                Health Score
            </p>
        </div>
    );
}
