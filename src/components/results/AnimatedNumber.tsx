'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
    value: number;
    decimals?: number;
    duration?: number;
    className?: string;
    suffix?: string;
    prefix?: string;
}

/**
 * Smoothly interpolates between number values using requestAnimationFrame
 * with ease-out cubic timing for a premium feel.
 */
export default function AnimatedNumber({
    value,
    decimals = 0,
    duration = 500,
    className = '',
    suffix = '',
    prefix = '',
}: AnimatedNumberProps) {
    const [display, setDisplay] = useState(value);
    const prevRef = useRef(value);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const from = prevRef.current;
        const to = value;
        prevRef.current = value;

        if (Math.abs(from - to) < 0.01) {
            setDisplay(to);
            return;
        }

        let start: number | null = null;

        const animate = (timestamp: number) => {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = from + (to - from) * eased;
            setDisplay(current);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(rafRef.current);
    }, [value, duration]);

    return (
        <span className={`tabular-nums ${className}`}>
            {prefix}
            {display.toFixed(decimals)}
            {suffix}
        </span>
    );
}
