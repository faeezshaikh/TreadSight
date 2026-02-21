'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { WeatherMode } from '@/types';
import { Sun, CloudRain, Snowflake } from 'lucide-react';

interface WeatherToggleProps {
    weatherMode: WeatherMode;
    onWeatherChange: (mode: WeatherMode) => void;
}

const modes: { mode: WeatherMode; icon: React.ReactNode; label: string; color: string; description: string }[] = [
    {
        mode: 'dry',
        icon: <Sun className="w-4 h-4" />,
        label: 'Dry',
        color: 'rgb(251, 191, 36)',
        description: 'Standard dry conditions — normal risk assessment.',
    },
    {
        mode: 'wet',
        icon: <CloudRain className="w-4 h-4" />,
        label: 'Wet',
        color: 'rgb(96, 165, 250)',
        description: 'Stopping distances increase ~40% on wet roads.',
    },
    {
        mode: 'snow',
        icon: <Snowflake className="w-4 h-4" />,
        label: 'Snow',
        color: 'rgb(196, 210, 255)',
        description: 'Traction severely reduced. Risk escalates earlier.',
    },
];

export default function WeatherToggle({ weatherMode, onWeatherChange }: WeatherToggleProps) {
    const activeMode = modes.find(m => m.mode === weatherMode)!;

    return (
        <div>
            <p className="text-xs font-medium text-[#555570] uppercase tracking-wider mb-2">
                Weather Mode
            </p>
            <div className="flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 gap-1">
                {modes.map(({ mode, icon, label, color }) => (
                    <button
                        key={mode}
                        onClick={() => onWeatherChange(mode)}
                        className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${weatherMode === mode
                            ? 'text-white'
                            : 'text-[#555570] hover:text-[#8888a0]'
                            }`}
                    >
                        {weatherMode === mode && (
                            <motion.div
                                layoutId="weather-active"
                                className="absolute inset-0 rounded-lg border"
                                style={{
                                    backgroundColor: `${color}15`,
                                    borderColor: `${color}30`,
                                }}
                                transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                            />
                        )}
                        <motion.span
                            className="relative z-10 flex items-center gap-1.5"
                            animate={weatherMode === mode ? {
                                color,
                            } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={`${mode}-${weatherMode === mode}`}
                                    initial={{ scale: 0.8, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
                                >
                                    {icon}
                                </motion.span>
                            </AnimatePresence>
                            {label}
                        </motion.span>
                    </button>
                ))}
            </div>

            {/* Weather context description */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={weatherMode}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.25 }}
                    className="text-xs text-[#8888a0] mt-2.5 pl-1"
                >
                    {activeMode.description}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
