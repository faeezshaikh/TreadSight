'use client';

import { useRef, useEffect, useCallback } from 'react';
import { applyDeterioration } from '@/lib/imageDeterioration';
import type { WeatherMode } from '@/types';

interface TireViewerProps {
    imageSrc: string;
    t: number;
    unevenWear: boolean;
    riskColor: string;
    glowColor: string;
    weatherMode: WeatherMode;
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
                // Set canvas size based on container
                const container = canvas.parentElement;
                const size = container ? Math.min(container.clientWidth, 400) : 320;
                canvas.width = size;
                canvas.height = size;
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

    const weatherClass =
        weatherMode === 'wet' ? 'weather-wet' : weatherMode === 'snow' ? 'weather-snow' : '';

    return (
        <div className={`relative rounded-2xl overflow-hidden ${weatherClass}`}>
            {/* Risk aura glow */}
            <div
                className="absolute inset-0 rounded-2xl transition-all duration-700"
                style={{
                    boxShadow: `inset 0 0 60px ${glowColor}, 0 0 40px ${glowColor}`,
                }}
            />

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="relative w-full aspect-square rounded-2xl"
                style={{ maxWidth: '400px', margin: '0 auto', display: 'block' }}
            />

            {/* Risk border */}
            <div
                className="absolute inset-0 rounded-2xl border-2 transition-colors duration-500 pointer-events-none"
                style={{ borderColor: `${riskColor}40` }}
            />
        </div>
    );
}
