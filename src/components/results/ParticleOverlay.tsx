'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { WeatherMode } from '@/types';

interface ParticleOverlayProps {
    weatherMode: WeatherMode;
    width: number;
    height: number;
    intensity?: number; // 0..1
}

interface Particle {
    x: number;
    y: number;
    speed: number;
    size: number;
    opacity: number;
    drift: number; // horizontal wobble
    phase: number; // for oscillation
}

const PARTICLE_COUNT = 35;

/**
 * Canvas-rendered weather particle overlay.
 * Renders rain droplets (wet mode) or snowflakes (snow mode) over the tire image.
 */
export default function ParticleOverlay({
    weatherMode,
    width,
    height,
    intensity = 1,
}: ParticleOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);
    const activeRef = useRef(true);

    const initParticles = useCallback(() => {
        const particles: Particle[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(createParticle(width, height, weatherMode, true));
        }
        particlesRef.current = particles;
    }, [width, height, weatherMode]);

    useEffect(() => {
        if (weatherMode === 'dry' || width === 0 || height === 0) {
            cancelAnimationFrame(rafRef.current);
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, width, height);
            }
            return;
        }

        activeRef.current = true;
        initParticles();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            if (!activeRef.current) return;

            ctx.clearRect(0, 0, width, height);
            const particles = particlesRef.current;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                if (weatherMode === 'wet') {
                    drawRaindrop(ctx, p, intensity);
                } else {
                    drawSnowflake(ctx, p, intensity);
                }

                // Update position
                p.y += p.speed;
                p.x += Math.sin(p.phase) * p.drift;
                p.phase += 0.02;

                // Reset when off screen
                if (p.y > height + 10) {
                    Object.assign(p, createParticle(width, height, weatherMode, false));
                }
            }

            rafRef.current = requestAnimationFrame(render);
        };

        rafRef.current = requestAnimationFrame(render);

        return () => {
            activeRef.current = false;
            cancelAnimationFrame(rafRef.current);
        };
    }, [weatherMode, width, height, intensity, initParticles]);

    if (weatherMode === 'dry') return null;

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute inset-0 pointer-events-none z-10"
            style={{ width: '100%', height: '100%' }}
        />
    );
}

function createParticle(
    w: number,
    h: number,
    mode: WeatherMode,
    randomY: boolean
): Particle {
    const isRain = mode === 'wet';
    return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -10 - Math.random() * 40,
        speed: isRain ? 2.5 + Math.random() * 3 : 0.5 + Math.random() * 1.2,
        size: isRain ? 1 + Math.random() * 1.5 : 2 + Math.random() * 3,
        opacity: 0.15 + Math.random() * 0.35,
        drift: isRain ? 0.2 : 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
    };
}

function drawRaindrop(ctx: CanvasRenderingContext2D, p: Particle, intensity: number) {
    ctx.save();
    ctx.globalAlpha = p.opacity * intensity;
    ctx.strokeStyle = 'rgba(120, 180, 255, 0.8)';
    ctx.lineWidth = p.size * 0.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - 0.5, p.y + p.size * 4);
    ctx.stroke();

    // Small splash glow at drop tip
    ctx.globalAlpha = p.opacity * intensity * 0.3;
    ctx.fillStyle = 'rgba(140, 200, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(p.x, p.y + p.size * 4, p.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawSnowflake(ctx: CanvasRenderingContext2D, p: Particle, intensity: number) {
    ctx.save();
    ctx.globalAlpha = p.opacity * intensity * 0.7;
    ctx.fillStyle = 'rgba(220, 235, 255, 0.9)';

    // Soft circle with glow
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, 'rgba(240, 248, 255, 0.9)');
    gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(180, 210, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    // Tiny cross for snowflake feel
    ctx.globalAlpha = p.opacity * intensity * 0.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 0.5;
    const half = p.size * 0.5;
    ctx.beginPath();
    ctx.moveTo(p.x - half, p.y);
    ctx.lineTo(p.x + half, p.y);
    ctx.moveTo(p.x, p.y - half);
    ctx.lineTo(p.x, p.y + half);
    ctx.stroke();
    ctx.restore();
}
