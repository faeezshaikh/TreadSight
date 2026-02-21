'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Flame } from 'lucide-react';

interface AccelerationModeProps {
    skipRotations: boolean;
    aggressiveDriving: boolean;
    onToggleSkipRotations: () => void;
    onToggleAggressiveDriving: () => void;
}

export default function AccelerationMode({
    skipRotations,
    aggressiveDriving,
    onToggleSkipRotations,
    onToggleAggressiveDriving,
}: AccelerationModeProps) {
    return (
        <div>
            <p className="text-xs font-medium text-[#555570] uppercase tracking-wider mb-2">
                Simulation Modes
            </p>
            <div className="flex gap-2">
                <ToggleButton
                    active={skipRotations}
                    onClick={onToggleSkipRotations}
                    icon={<RotateCcw className="w-4 h-4" />}
                    label="Skip Rotations"
                    sublabel="+15% wear"
                    impactLabel="−4 months"
                    activeColor="amber"
                />
                <ToggleButton
                    active={aggressiveDriving}
                    onClick={onToggleAggressiveDriving}
                    icon={<Flame className="w-4 h-4" />}
                    label="Aggressive Driving"
                    sublabel="+10% wear"
                    impactLabel="−3 months"
                    activeColor="orange"
                />
            </div>
        </div>
    );
}

function ToggleButton({
    active,
    onClick,
    icon,
    label,
    sublabel,
    impactLabel,
    activeColor,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    impactLabel: string;
    activeColor: 'amber' | 'orange';
}) {
    const [showImpact, setShowImpact] = useState(false);

    const handleClick = () => {
        onClick();
        if (!active) {
            // Show impact animation when activating
            setShowImpact(true);
            setTimeout(() => setShowImpact(false), 1500);
        }
    };

    const colors = {
        amber: active
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            : 'bg-white/[0.03] border-white/[0.06] text-[#8888a0]',
        orange: active
            ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
            : 'bg-white/[0.03] border-white/[0.06] text-[#8888a0]',
    };

    const pulseColor = activeColor === 'amber' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(249, 115, 22, 0.3)';

    return (
        <motion.button
            onClick={handleClick}
            className={`relative flex-1 flex flex-col items-center gap-1 py-3 px-3 rounded-xl border transition-all duration-200 overflow-hidden hover:bg-white/[0.05] ${colors[activeColor]}`}
            whileTap={{ scale: 0.97 }}
            animate={active ? {
                boxShadow: `0 0 20px ${pulseColor}`,
            } : {
                boxShadow: '0 0 0px transparent',
            }}
            transition={{ duration: 0.3 }}
        >
            {/* Impact pulse flash */}
            <AnimatePresence>
                {showImpact && (
                    <motion.div
                        initial={{ opacity: 0.6, scale: 0.5 }}
                        animate={{ opacity: 0, scale: 2 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-xl"
                        style={{ background: `radial-gradient(circle, ${pulseColor}, transparent)` }}
                    />
                )}
            </AnimatePresence>

            <div className="flex items-center gap-1.5 relative z-10">
                <motion.span
                    animate={active ? { rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                >
                    {icon}
                </motion.span>
                <span className="text-xs font-medium">{label}</span>
            </div>
            <span className="text-[10px] text-[#555570] relative z-10">{sublabel}</span>

            {/* Impact label animation */}
            <AnimatePresence>
                {showImpact && (
                    <motion.span
                        initial={{ opacity: 0, y: 5, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className={`absolute -top-1 right-1 text-[10px] font-bold z-20 ${activeColor === 'amber' ? 'text-amber-400' : 'text-orange-400'
                            }`}
                    >
                        {impactLabel}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
}
