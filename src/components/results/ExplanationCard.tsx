'use client';

import { motion } from 'framer-motion';
import type { LLMExplanation } from '@/types';
import { Sparkles, AlertCircle, Lightbulb } from 'lucide-react';

interface ExplanationCardProps {
    explanation: LLMExplanation | null;
    loading: boolean;
}

export default function ExplanationCard({ explanation, loading }: ExplanationCardProps) {
    if (loading) {
        return (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-sm font-semibold">AI Analysis</span>
                </div>
                <div className="space-y-2">
                    <div className="h-3 bg-white/5 rounded animate-pulse w-full" />
                    <div className="h-3 bg-white/5 rounded animate-pulse w-4/5" />
                    <div className="h-3 bg-white/5 rounded animate-pulse w-3/5" />
                </div>
            </div>
        );
    }

    if (!explanation) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold">AI Analysis</span>
            </div>

            {/* Narrative */}
            <p className="text-sm text-[#8888a0] leading-relaxed mb-4">{explanation.narrative}</p>

            {/* Key Insights */}
            <div className="space-y-2 mb-4">
                {explanation.keyInsights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-[#8888a0]">{insight}</p>
                    </div>
                ))}
            </div>

            {/* Recommended Action */}
            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-xs font-medium text-cyan-300">{explanation.recommendedAction}</p>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                <AlertCircle className="w-3.5 h-3.5 text-[#555570] mt-0.5 shrink-0" />
                <p className="text-[10px] text-[#555570] leading-relaxed">{explanation.disclaimer}</p>
            </div>
        </motion.div>
    );
}
