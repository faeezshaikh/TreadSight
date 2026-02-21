'use client';

import { motion } from 'framer-motion';
import type { WeatherMode } from '@/types';
import { Sun, CloudRain, Snowflake } from 'lucide-react';

interface WeatherToggleProps {
    weatherMode: WeatherMode;
    onWeatherChange: (mode: WeatherMode) => void;
}

const modes: { mode: WeatherMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'dry', icon: <Sun className="w-4 h-4" />, label: 'Dry' },
    { mode: 'wet', icon: <CloudRain className="w-4 h-4" />, label: 'Wet' },
    { mode: 'snow', icon: <Snowflake className="w-4 h-4" />, label: 'Snow' },
];

export default function WeatherToggle({ weatherMode, onWeatherChange }: WeatherToggleProps) {
    return (
        <div>
            <p className="text-xs font-medium text-[#555570] uppercase tracking-wider mb-2">
                Weather Mode
            </p>
            <div className="flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 gap-1">
                {modes.map(({ mode, icon, label }) => (
                    <button
                        key={mode}
                        onClick={() => onWeatherChange(mode)}
                        className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors duration-200 ${weatherMode === mode
                                ? 'text-white'
                                : 'text-[#555570] hover:text-[#8888a0]'
                            }`}
                    >
                        {weatherMode === mode && (
                            <motion.div
                                layoutId="weather-active"
                                className="absolute inset-0 rounded-lg bg-white/10 border border-white/10"
                                transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                            {icon}
                            {label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
