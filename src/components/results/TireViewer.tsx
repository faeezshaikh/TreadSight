'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { applyDeterioration } from '@/lib/imageDeterioration';
import ParticleOverlay from './ParticleOverlay';
import ContactPatch from './ContactPatch';
import type { WeatherMode } from '@/types';

interface TireViewerProps {
    imageSrc: string;
    t: number;
    unevenWear: boolean;
    riskColor: string;
    glowColor: string;
    weatherMode: WeatherMode;
}

/**
 * Risk aura overlay color based on wear parameter t and weather mode.
 * Creates a cinematic mood shift as the tire degrades.
 */
function getRiskAura(t: number, weatherMode: WeatherMode): { color: string; intensity: number; pulse: boolean } {
    let color: string;
    let intensity: number;
    let pulse = false;

    if (t < 0.25) {
        // Safe — subtle green
        color = 'rgba(16, 185, 129, 0.12)';
        intensity = 0.3 + t * 0.4;
    } else if (t < 0.5) {
        // Monitor — yellow/amber
        const blend = (t - 0.25) / 0.25;
        const r = Math.round(16 + (245 - 16) * blend);
        const g = Math.round(185 + (158 - 185) * blend);
        const b = Math.round(129 + (11 - 129) * blend);
        color = `rgba(${r}, ${g}, ${b}, 0.15)`;
        intensity = 0.4 + blend * 0.2;
    } else if (t < 0.75) {
        // Plan Soon — orange with pulse
        const blend = (t - 0.5) / 0.25;
        const r = Math.round(245 + (249 - 245) * blend);
        const g = Math.round(158 + (115 - 158) * blend);
        const b = Math.round(11 + (22 - 11) * blend);
        color = `rgba(${r}, ${g}, ${b}, 0.18)`;
        intensity = 0.5 + blend * 0.2;
        pulse = blend > 0.5;
    } else {
        // Replace Now — red vignette, pulsing
        const blend = (t - 0.75) / 0.25;
        color = `rgba(239, 68, 68, ${0.15 + blend * 0.12})`;
        intensity = 0.6 + blend * 0.3;
        pulse = true;
    }

    // Weather amplifies risk aura
    if (weatherMode === 'wet') {
        intensity *= 1.15;
    } else if (weatherMode === 'snow') {
        intensity *= 1.25;
    }

    return { color, intensity: Math.min(1, intensity), pulse };
}

export default function TireViewer({
    imageSrc,
    t,
    unevenWear,
    riskColor,
    glowColor,
    weatherMode,
}: TireViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const animFrameRef = useRef<number>(0);
    const [canvasSize, setCanvasSize] = useState(320);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img || !img.complete) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        applyDeterioration(ctx, img, {
            t,
            unevenWear,
            width: canvas.width,
            height: canvas.height,
        });
    }, [t, unevenWear]);

    // Load image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            imageRef.current = img;
            const canvas = canvasRef.current;
            if (canvas) {
                const container = canvas.parentElement;
                const size = container ? Math.min(container.clientWidth, 400) : 320;
                canvas.width = size;
                canvas.height = size;
                setCanvasSize(size);
            }
            render();
        };
        img.src = imageSrc;
    }, [imageSrc, render]);

    // Re-render on parameter changes
    useEffect(() => {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [render]);

    const aura = getRiskAura(t, weatherMode);

    const weatherClass =
        weatherMode === 'wet' ? 'weather-wet' : weatherMode === 'snow' ? 'weather-snow' : '';

    return (
        <div className={`relative rounded-2xl overflow-hidden ${weatherClass}`}>
            {/* Ambient risk aura — full card glow */}
            <div
                className={`absolute inset-0 rounded-2xl transition-all duration-700 ${aura.pulse ? 'animate-risk-pulse' : ''}`}
                style={{
                    boxShadow: `inset 0 0 80px ${glowColor}, 0 0 50px ${glowColor}`,
                }}
            />

            {/* Risk color wash overlay */}
            <div
                className="absolute inset-0 rounded-2xl transition-all duration-500 z-[3] pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse at center, transparent 30%, ${aura.color} 100%)`,
                    opacity: aura.intensity,
                }}
            />

            {/* Canvas — tire image with deterioration */}
            <canvas
                ref={canvasRef}
                className="relative w-full aspect-square rounded-2xl"
                style={{ maxWidth: '400px', margin: '0 auto', display: 'block' }}
            />

            {/* Contact patch visualization */}
            <ContactPatch t={t} size={canvasSize} />

            {/* Weather particles */}
            <ParticleOverlay
                weatherMode={weatherMode}
                width={canvasSize}
                height={canvasSize}
                intensity={0.6 + t * 0.4}
            />

            {/* Vignette overlay at high wear */}
            {t > 0.6 && (
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none z-[4] transition-opacity duration-700"
                    style={{
                        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
                        opacity: (t - 0.6) * 1.5,
                    }}
                />
            )}

            {/* Risk border with glow */}
            <div
                className="absolute inset-0 rounded-2xl border-2 transition-all duration-500 pointer-events-none z-[6]"
                style={{
                    borderColor: `${riskColor}50`,
                    boxShadow: `inset 0 0 1px ${riskColor}30`,
                }}
            />
        </div>
    );
}
