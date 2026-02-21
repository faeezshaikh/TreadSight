'use client';

import type { TreadBucket } from '@/types';

interface ConfidenceSectionProps {
    confidence: number;
    bucket: TreadBucket;
    confidenceBand: number;
}

export default function ConfidenceSection({
    confidence,
    bucket,
    confidenceBand,
}: ConfidenceSectionProps) {
    const confidencePercent = Math.round(confidence * 100);
    const bandPercent = Math.round(confidenceBand * 100);

    return (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold mb-4">How We Estimate</h3>

            {/* Confidence Meter */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#8888a0]">Image Confidence</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">{confidencePercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${confidencePercent}%` }}
                    />
                </div>
            </div>

            {/* Info */}
            <div className="space-y-3 text-xs text-[#8888a0]">
                <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <p>
                        Classification: <span className="text-white font-medium">{bucket}</span> — based on
                        texture analysis, edge density, and contrast patterns in your photo.
                    </p>
                </div>
                <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <p>
                        Prediction band: <span className="text-white font-medium">±{bandPercent}%</span> — accounts for
                        driving variation, climate, and measurement uncertainty.
                    </p>
                </div>
                <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <p>
                        This estimate uses synthetic wear modeling. For precise measurement, a calibrated depth
                        gauge at a tire shop is recommended.
                    </p>
                </div>
            </div>
        </div>
    );
}
