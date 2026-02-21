'use client';

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
                    activeColor="amber"
                />
                <ToggleButton
                    active={aggressiveDriving}
                    onClick={onToggleAggressiveDriving}
                    icon={<Flame className="w-4 h-4" />}
                    label="Aggressive Driving"
                    sublabel="+10% wear"
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
    activeColor,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    activeColor: 'amber' | 'orange';
}) {
    const colors = {
        amber: active
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            : 'bg-white/[0.03] border-white/[0.06] text-[#8888a0]',
        orange: active
            ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
            : 'bg-white/[0.03] border-white/[0.06] text-[#8888a0]',
    };

    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-3 rounded-xl border transition-all duration-200 hover:bg-white/[0.05] ${colors[activeColor]}`}
        >
            <div className="flex items-center gap-1.5">
                {icon}
                <span className="text-xs font-medium">{label}</span>
            </div>
            <span className="text-[10px] text-[#555570]">{sublabel}</span>
        </button>
    );
}
