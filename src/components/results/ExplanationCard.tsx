'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LLMExplanation } from '@/types';
import { Crosshair, AlertCircle, Lightbulb, Cpu, ScanLine } from 'lucide-react';

interface ExplanationCardProps {
    explanation: LLMExplanation | null;
    loading: boolean;
}

/**
 * Typewriter effect hook — types out text character by character.
 */
function useTypewriter(text: string, speed: number = 20, enabled: boolean = true) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    const indexRef = useRef(0);

    useEffect(() => {
        if (!enabled || !text) {
            setDisplayed(text || '');
            setDone(true);
            return;
        }

        setDisplayed('');
        setDone(false);
        indexRef.current = 0;

        const interval = setInterval(() => {
            indexRef.current++;
            if (indexRef.current >= text.length) {
                setDisplayed(text);
                setDone(true);
                clearInterval(interval);
            } else {
                setDisplayed(text.slice(0, indexRef.current));
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed, enabled]);

    return { displayed, done };
}

export default function ExplanationCard({ explanation, loading }: ExplanationCardProps) {
    const [bootPhase, setBootPhase] = useState(0); // 0=off, 1=boot, 2=scanning, 3=analyzing, 4=done
    const [showInsights, setShowInsights] = useState(false);
    const [visibleInsights, setVisibleInsights] = useState(0);
    const hasAnimated = useRef(false);

    // Terminator HUD boot sequence
    useEffect(() => {
        if (loading && !hasAnimated.current) {
            setBootPhase(1);
            const t1 = setTimeout(() => setBootPhase(2), 600);
            const t2 = setTimeout(() => setBootPhase(3), 1400);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
    }, [loading]);

    useEffect(() => {
        if (explanation && !hasAnimated.current) {
            hasAnimated.current = true;
            setBootPhase(4);
        }
    }, [explanation]);

    // Typewriter for narrative
    const { displayed: narrativeText, done: narrativeDone } = useTypewriter(
        explanation?.narrative || '',
        15,
        bootPhase === 4
    );

    // Sequentially reveal insights after narrative
    useEffect(() => {
        if (narrativeDone && explanation?.keyInsights?.length) {
            setShowInsights(true);
            let count = 0;
            const interval = setInterval(() => {
                count++;
                setVisibleInsights(count);
                if (count >= explanation.keyInsights.length) {
                    clearInterval(interval);
                }
            }, 400);
            return () => clearInterval(interval);
        }
    }, [narrativeDone, explanation?.keyInsights?.length]);

    // Typewriter for recommended action
    const { displayed: actionText } = useTypewriter(
        explanation?.recommendedAction || '',
        12,
        showInsights && visibleInsights >= (explanation?.keyInsights?.length || 0)
    );

    // Timestamp display
    const timestamp = useMemo(() => {
        const now = new Date();
        return now.toISOString().replace('T', ' ').slice(0, 19);
    }, []);

    if (loading || (bootPhase > 0 && bootPhase < 4)) {
        return (
            <div className="terminator-card rounded-2xl border border-red-500/20 bg-black/80 p-5 relative overflow-hidden">
                {/* Scanline overlay */}
                <div className="terminator-scanlines" />

                {/* Corner HUD brackets */}
                <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-red-500/50" />
                <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-red-500/50" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-red-500/50" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-red-500/50" />

                {/* Header */}
                <div className="flex items-center gap-2 mb-4 relative z-10">
                    <Cpu className="w-4 h-4 text-red-400 animate-pulse" />
                    <span className="text-sm font-mono font-bold text-red-400 tracking-wider">
                        CYBERDYNE SYSTEMS AI
                    </span>
                </div>

                {/* Boot sequence text */}
                <div className="font-mono text-xs space-y-1.5 relative z-10">
                    <AnimatePresence>
                        {bootPhase >= 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-red-400/80"
                            >
                                <span className="text-red-500">&gt;</span> INITIALIZING NEURAL NET PROCESSOR...
                                {bootPhase > 1 && <span className="text-green-400 ml-1">OK</span>}
                            </motion.div>
                        )}
                        {bootPhase >= 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-red-400/80"
                            >
                                <span className="text-red-500">&gt;</span> SCANNING TREAD PATTERN...
                                {bootPhase > 2 && <span className="text-green-400 ml-1">OK</span>}
                            </motion.div>
                        )}
                        {bootPhase >= 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-red-400/80"
                            >
                                <span className="text-red-500">&gt;</span> ANALYZING WEAR VECTORS...
                                <span className="terminator-blink ml-1">█</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Loading bar */}
                    <div className="mt-3 h-1 rounded-full bg-red-500/10 overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-red-500 to-red-400"
                            initial={{ width: '0%' }}
                            animate={{ width: '85%' }}
                            transition={{ duration: 2, ease: 'easeInOut' }}
                        />
                    </div>
                </div>

                {/* Timestamp */}
                <div className="absolute bottom-3 right-4 text-[9px] font-mono text-red-500/40 z-10">
                    SYS.TIME {timestamp}
                </div>
            </div>
        );
    }

    if (!explanation) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="terminator-card rounded-2xl border border-red-500/20 bg-black/80 p-5 relative overflow-hidden"
        >
            {/* Scanline overlay */}
            <div className="terminator-scanlines" />

            {/* Corner HUD brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-red-500/30" />
            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-red-500/30" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-red-500/30" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-red-500/30" />

            {/* Header */}
            <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-mono font-bold text-red-400 tracking-wider">
                        AI THREAT ANALYSIS
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <ScanLine className="w-3 h-3 text-red-400/50" />
                    <span className="text-[9px] font-mono text-red-400/50">
                        COMPLETE
                    </span>
                </div>
            </div>

            {/* HUD crosshair animated line */}
            <motion.div
                className="h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent mb-3"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5 }}
            />

            {/* Narrative — typewriter */}
            <div className="relative z-10 mb-4">
                <p className="text-sm font-mono text-red-100/80 leading-relaxed">
                    {narrativeText}
                    {!narrativeDone && <span className="terminator-blink text-red-400">█</span>}
                </p>
            </div>

            {/* Key Insights — sequential reveal */}
            <div className="space-y-2 mb-4 relative z-10">
                {explanation.keyInsights.map((insight, i) => (
                    <AnimatePresence key={i}>
                        {showInsights && i < visibleInsights && (
                            <motion.div
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-start gap-2"
                            >
                                <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                                <p className="text-xs font-mono text-red-100/60">{insight}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                ))}
            </div>

            {/* Recommended Action — HUD style */}
            {actionText && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 rounded-lg bg-red-500/5 border border-red-500/15 relative z-10"
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-mono text-red-400/60 uppercase tracking-widest">
                            ▸ Recommended Action
                        </span>
                    </div>
                    <p className="text-xs font-mono font-medium text-red-300">
                        {actionText}
                        {actionText.length < (explanation?.recommendedAction?.length || 0) && (
                            <span className="terminator-blink text-red-400">█</span>
                        )}
                    </p>
                </motion.div>
            )}

            {/* Disclaimer */}
            <div className="flex items-start gap-2 mt-4 pt-3 border-t border-red-500/10 relative z-10">
                <AlertCircle className="w-3.5 h-3.5 text-red-500/30 mt-0.5 shrink-0" />
                <p className="text-[10px] font-mono text-red-500/30 leading-relaxed">{explanation.disclaimer}</p>
            </div>

            {/* Timestamp */}
            <div className="absolute bottom-3 right-4 text-[9px] font-mono text-red-500/30 z-10">
                SYS.TIME {timestamp}
            </div>
        </motion.div>
    );
}
