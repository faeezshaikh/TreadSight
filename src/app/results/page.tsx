'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Gauge } from 'lucide-react';

import TireViewer from '@/components/results/TireViewer';
import TimeTravel from '@/components/results/TimeTravel';
import HealthScore from '@/components/results/HealthScore';
import RiskBadge from '@/components/results/RiskBadge';
import WeatherToggle from '@/components/results/WeatherToggle';
import AccelerationMode from '@/components/results/AccelerationMode';
import CTAPanel from '@/components/results/CTAPanel';
import ConfidenceSection from '@/components/results/ConfidenceSection';
import ExplanationCard from '@/components/results/ExplanationCard';
import { useTimeTravelState } from '@/hooks/useTimeTravelState';
import { getMonthlyWearRate } from '@/lib/wearModel';
import { RISK_COLORS, RISK_GLOW_COLORS } from '@/lib/constants';
import type { AnalysisResult, LLMExplanation } from '@/types';

export default function ResultsPage() {
    const router = useRouter();
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [imageSrc, setImageSrc] = useState<string>('');
    const [explanation, setExplanation] = useState<LLMExplanation | null>(null);
    const [explanationLoading, setExplanationLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const {
        state,
        totalMonths,
        setT,
        weatherMode,
        setWeatherMode,
        skipRotations,
        toggleSkipRotations,
        aggressiveDriving,
        toggleAggressiveDriving,
    } = useTimeTravelState({ analysis });

    // Compute monthly wear rate for TimeTravel threshold calculation
    const monthlyWearRate = useMemo(() => {
        if (!analysis) return 0;
        return getMonthlyWearRate(analysis.wearPrediction.wearRatePer1000Miles, 12000);
    }, [analysis]);

    // Load analysis from sessionStorage
    useEffect(() => {
        setMounted(true);
        const storedAnalysis = sessionStorage.getItem('treadsight_analysis');
        const storedImage = sessionStorage.getItem('treadsight_image');

        if (!storedAnalysis || !storedImage) {
            router.push('/scan');
            return;
        }

        try {
            const parsed = JSON.parse(storedAnalysis);
            // Convert date strings back to Date objects
            parsed.wearPrediction.wetTractionDropDate = new Date(parsed.wearPrediction.wetTractionDropDate);
            parsed.wearPrediction.legalMinimumDate = new Date(parsed.wearPrediction.legalMinimumDate);
            parsed.wearPrediction.tireDeadDate = new Date(parsed.wearPrediction.tireDeadDate);
            setAnalysis(parsed);
            setImageSrc(storedImage);
        } catch {
            router.push('/scan');
        }
    }, [router]);

    // Fetch explanation
    const fetchExplanation = useCallback(async () => {
        if (!analysis) return;
        setExplanationLoading(true);
        try {
            const response = await fetch('/api/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysis, weatherMode }),
            });
            if (response.ok) {
                const data = await response.json();
                setExplanation(data);
            }
        } catch (err) {
            console.error('Failed to fetch explanation:', err);
        } finally {
            setExplanationLoading(false);
        }
    }, [analysis, weatherMode]);

    useEffect(() => {
        if (analysis) {
            fetchExplanation();
        }
    }, [analysis, fetchExplanation]);

    if (!mounted || !analysis) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const riskColor = RISK_COLORS[state.currentRisk];
    const glowColor = RISK_GLOW_COLORS[state.currentRisk];

    // Ambient background color based on risk
    const ambientColors: Record<string, { orb1: string; orb2: string }> = {
        'Safe': {
            orb1: 'rgba(16, 185, 129, 0.06)',
            orb2: 'rgba(0, 212, 255, 0.04)',
        },
        'Monitor': {
            orb1: 'rgba(245, 158, 11, 0.06)',
            orb2: 'rgba(251, 191, 36, 0.04)',
        },
        'Plan Soon': {
            orb1: 'rgba(249, 115, 22, 0.08)',
            orb2: 'rgba(245, 158, 11, 0.05)',
        },
        'Replace Now': {
            orb1: 'rgba(239, 68, 68, 0.08)',
            orb2: 'rgba(249, 115, 22, 0.05)',
        },
    };

    const ambient = ambientColors[state.currentRisk] || ambientColors['Safe'];

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen pb-10"
        >
            {/* ── Ambient Background — Mood Room ── */}
            <div className="ambient-bg">
                <div
                    className="ambient-orb ambient-orb-1"
                    style={{ background: ambient.orb1, transition: 'background 1.5s ease' }}
                />
                <div
                    className="ambient-orb ambient-orb-2"
                    style={{ background: ambient.orb2, transition: 'background 1.5s ease' }}
                />
            </div>

            {/* Header */}
            <div className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-white/[0.04]">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/scan')}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-semibold">TreadSight</span>
                    </div>
                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({ title: 'TreadSight Results', text: `My tire health score: ${state.currentScore}/100` });
                            }
                        }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
                {/* Score + Risk Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-between"
                >
                    <HealthScore score={state.currentScore} riskLevel={state.currentRisk} />
                    <RiskBadge riskLevel={state.currentRisk} remainingMonths={totalMonths} />
                </motion.div>

                {/* Tire Image Viewer */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <TireViewer
                        imageSrc={imageSrc}
                        t={state.t}
                        unevenWear={skipRotations}
                        riskColor={riskColor}
                        glowColor={glowColor}
                        weatherMode={weatherMode}
                    />
                </motion.div>

                {/* Time Travel Slider */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
                >
                    <TimeTravel
                        t={state.t}
                        onTChange={setT}
                        totalMonths={totalMonths}
                        currentDate={state.currentDate}
                        riskLevel={state.currentRisk}
                        currentDepth={state.currentDepth}
                        initialDepth={analysis.wearPrediction.currentDepth32nds}
                        monthlyWearRate={monthlyWearRate}
                    />
                </motion.div>

                {/* Weather Toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <WeatherToggle weatherMode={weatherMode} onWeatherChange={setWeatherMode} />
                </motion.div>

                {/* Acceleration Mode */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    <AccelerationMode
                        skipRotations={skipRotations}
                        aggressiveDriving={aggressiveDriving}
                        onToggleSkipRotations={toggleSkipRotations}
                        onToggleAggressiveDriving={toggleAggressiveDriving}
                    />
                </motion.div>

                {/* CTA Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <CTAPanel riskLevel={state.currentRisk} />
                </motion.div>

                {/* AI Explanation */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                >
                    <ExplanationCard explanation={explanation} loading={explanationLoading} />
                </motion.div>

                {/* Confidence Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <ConfidenceSection
                        confidence={analysis.treadEstimate.confidence}
                        bucket={analysis.treadEstimate.bucket}
                        confidenceBand={analysis.wearPrediction.confidenceBand}
                    />
                </motion.div>

                {/* Footer */}
                <div className="text-center py-4">
                    <p className="text-[10px] text-[#555570]">
                        Estimates only. Not a substitute for professional inspection.
                    </p>
                </div>
            </div>
        </motion.main>
    );
}
