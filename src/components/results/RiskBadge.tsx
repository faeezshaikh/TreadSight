'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RiskLevel } from '@/types';
import { RISK_COLORS } from '@/lib/constants';
import { Shield, AlertTriangle, Clock, XCircle } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

interface RiskBadgeProps {
    riskLevel: RiskLevel;
    remainingMonths: number;
}

const RISK_ICONS: Record<RiskLevel, React.ReactNode> = {
    'Safe': <Shield className="w-4 h-4" />,
    'Monitor': <Clock className="w-4 h-4" />,
    'Plan Soon': <AlertTriangle className="w-4 h-4" />,
    'Replace Now': <XCircle className="w-4 h-4" />,
};

export default function RiskBadge({ riskLevel, remainingMonths }: RiskBadgeProps) {
    const color = RISK_COLORS[riskLevel];
    const [prevRisk, setPrevRisk] = useState(riskLevel);
    const [shake, setShake] = useState(false);
    const [flash, setFlash] = useState(false);
    const isInitialMount = useRef(true);

    // Haptic shake + color flash when crossing thresholds
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (riskLevel !== prevRisk) {
            setShake(true);
            setFlash(true);
            setPrevRisk(riskLevel);
            const shakeTimer = setTimeout(() => setShake(false), 500);
            const flashTimer = setTimeout(() => setFlash(false), 600);

            // Trigger device vibration if available
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([50, 30, 50]);
            }

            return () => {
                clearTimeout(shakeTimer);
                clearTimeout(flashTimer);
            };
        }
    }, [riskLevel, prevRisk]);

    const glowClass =
        riskLevel === 'Safe'
            ? 'glow-green'
            : riskLevel === 'Monitor'
                ? 'glow-yellow'
                : riskLevel === 'Plan Soon'
                    ? 'glow-orange'
                    : 'glow-red';

    const pulseClass = riskLevel === 'Plan Soon' || riskLevel === 'Replace Now' ? 'animate-pulse-glow' : '';

    return (
        <motion.div
            className={`${shake ? 'haptic-shake' : ''} ${pulseClass}`}
            layout
        >
            <div className="relative overflow-hidden">
                {/* Flash overlay on transition */}
                <AnimatePresence>
                    {flash && (
                        <motion.div
                            initial={{ opacity: 0.7, scale: 0.8 }}
                            animate={{ opacity: 0, scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="absolute inset-0 rounded-2xl z-10 pointer-events-none"
                            style={{ background: `radial-gradient(circle, ${color}40, transparent)` }}
                        />
                    )}
                </AnimatePresence>

                <motion.div
                    className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-sm ${glowClass} transition-all duration-500`}
                    style={{
                        borderColor: `${color}30`,
                        backgroundColor: `${color}10`,
                    }}
                    animate={flash ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={riskLevel}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{ duration: 0.3 }}
                            style={{ color }}
                        >
                            {RISK_ICONS[riskLevel]}
                        </motion.div>
                    </AnimatePresence>

                    <div>
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={riskLevel}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-sm font-bold"
                                style={{ color }}
                            >
                                {riskLevel}
                            </motion.p>
                        </AnimatePresence>
                        <p className="text-xs text-[#8888a0]">
                            ~<AnimatedNumber value={remainingMonths} duration={500} /> month{remainingMonths !== 1 ? 's' : ''} remaining
                        </p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
