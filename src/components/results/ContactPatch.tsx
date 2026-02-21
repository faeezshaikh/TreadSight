'use client';

import { useMemo } from 'react';

interface ContactPatchProps {
    t: number; // 0 = new, 1 = fully worn
    size: number; // container size in px
}

/**
 * SVG-based contact patch visualization overlay.
 * Shows water channels → pooling → stress zones as wear increases.
 */
export default function ContactPatch({ t, size }: ContactPatchProps) {
    const cx = size / 2;
    const cy = size * 0.65; // Lower portion of tire
    const scale = size / 400;

    const { channels, poolOpacity, poolSize, stressOpacity, stressSize } = useMemo(() => {
        // Channel visibility fades as tire wears
        const channelOpacity = Math.max(0, 1 - t * 2.5);
        const channels: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];

        if (channelOpacity > 0.05) {
            // Vertical grooves
            for (let i = -3; i <= 3; i++) {
                channels.push({
                    x1: cx + i * 18 * scale,
                    y1: cy - 60 * scale,
                    x2: cx + i * 18 * scale,
                    y2: cy + 60 * scale,
                    opacity: channelOpacity * (1 - Math.abs(i) * 0.12),
                });
            }
            // Cross grooves
            for (let j = -2; j <= 2; j++) {
                channels.push({
                    x1: cx - 55 * scale,
                    y1: cy + j * 25 * scale,
                    x2: cx + 55 * scale,
                    y2: cy + j * 25 * scale,
                    opacity: channelOpacity * 0.6,
                });
            }
        }

        // Water pooling appears at moderate wear
        const poolOpacity = t > 0.3 ? Math.min(0.5, (t - 0.3) * 1.2) : 0;
        const poolSize = 30 + t * 70;

        // Stress zone at high wear
        const stressOpacity = t > 0.65 ? Math.min(0.6, (t - 0.65) * 2) : 0;
        const stressSize = 40 + (t - 0.65) * 120;

        return { channels, poolOpacity, poolSize, stressOpacity, stressSize };
    }, [t, cx, cy, scale]);

    if (t < 0.01) return null;

    return (
        <svg
            width={size}
            height={size}
            className="absolute inset-0 pointer-events-none z-[5]"
            style={{ width: '100%', height: '100%' }}
        >
            <defs>
                <filter id="contact-blur">
                    <feGaussianBlur stdDeviation="3" />
                </filter>
                <filter id="pool-blur">
                    <feGaussianBlur stdDeviation="8" />
                </filter>
            </defs>

            {/* Water channels — cyan traced lines */}
            {channels.map((ch, i) => (
                <line
                    key={`ch-${i}`}
                    x1={ch.x1}
                    y1={ch.y1}
                    x2={ch.x2}
                    y2={ch.y2}
                    stroke="rgba(0, 200, 255, 0.6)"
                    strokeWidth={2 * scale}
                    strokeLinecap="round"
                    opacity={ch.opacity}
                    filter="url(#contact-blur)"
                    style={{ transition: 'opacity 0.4s ease' }}
                />
            ))}

            {/* Water pooling — blue translucent blob */}
            {poolOpacity > 0.02 && (
                <ellipse
                    cx={cx}
                    cy={cy}
                    rx={poolSize * scale}
                    ry={poolSize * 0.6 * scale}
                    fill="rgba(59, 130, 246, 0.5)"
                    opacity={poolOpacity}
                    filter="url(#pool-blur)"
                    style={{ transition: 'all 0.5s ease' }}
                />
            )}

            {/* Contact stress zone — red highlight */}
            {stressOpacity > 0.02 && (
                <ellipse
                    cx={cx}
                    cy={cy}
                    rx={stressSize * scale}
                    ry={stressSize * 0.5 * scale}
                    fill="rgba(239, 68, 68, 0.5)"
                    opacity={stressOpacity}
                    filter="url(#pool-blur)"
                    style={{ transition: 'all 0.5s ease' }}
                />
            )}
        </svg>
    );
}
