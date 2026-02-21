import { LLMExplanation, AnalysisResult, WeatherMode } from '@/types';

/**
 * Generate an AI explanation for the tire analysis.
 * Uses OpenAI API if available, falls back to template-based explanation.
 */
export async function generateExplanation(
    analysis: AnalysisResult,
    weatherMode: WeatherMode = 'dry'
): Promise<LLMExplanation> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return generateFallbackExplanation(analysis, weatherMode);
    }

    try {
        const prompt = buildPrompt(analysis, weatherMode);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a tire safety expert providing clear, helpful analysis. Be confident but honest about limitations. Never be alarmist. Always include that this is an estimate and professional inspection is recommended. Respond in JSON format with keys: narrative (3-4 sentences), keyInsights (array of 2-3 strings), recommendedAction (string).`,
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 500,
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);

        return {
            narrative: content.narrative,
            keyInsights: content.keyInsights,
            recommendedAction: content.recommendedAction,
            disclaimer: 'This is an estimate based on photo analysis and assumptions. For precise measurement, visit a certified tire professional.',
        };
    } catch (error) {
        console.error('LLM generation failed, using fallback:', error);
        return generateFallbackExplanation(analysis, weatherMode);
    }
}

// ── Prompt Builder ───────────────────────────────────────────────────

function buildPrompt(analysis: AnalysisResult, weatherMode: WeatherMode): string {
    const { treadEstimate, wearPrediction, healthScore } = analysis;

    return `Analyze this tire condition:
- Tread Depth: ${treadEstimate.depthRange32nds.min}-${treadEstimate.depthRange32nds.max}/32" (${treadEstimate.bucket} condition)
- Health Score: ${healthScore.score}/100
- Risk Level: ${healthScore.riskLevel}
- Estimated Remaining Life: ~${wearPrediction.remainingMonths} months
- Weather Context: ${weatherMode} conditions
- Confidence: ${Math.round(treadEstimate.confidence * 100)}%

Provide analysis considering ${weatherMode} driving conditions. Be helpful and calm.`;
}

// ── Fallback Template ────────────────────────────────────────────────

function generateFallbackExplanation(
    analysis: AnalysisResult,
    weatherMode: WeatherMode
): LLMExplanation {
    const { treadEstimate, wearPrediction, healthScore } = analysis;
    const { bucket } = treadEstimate;
    const { score, riskLevel } = healthScore;
    const { remainingMonths } = wearPrediction;

    const narratives: Record<string, string> = {
        NEW: `Your tires appear to be in excellent condition with substantial tread remaining. Based on our analysis, you have approximately ${remainingMonths} months of safe driving ahead. Continue with regular rotation and inspection schedules to maximize tire life.`,
        HEALTHY: `Your tires are in good shape with healthy tread depth. Our estimate suggests around ${remainingMonths} months of service life remaining. Regular maintenance and rotations will help ensure even wear and optimal performance.`,
        MODERATE: `Your tires are showing moderate wear and should be monitored more closely. With an estimated ${remainingMonths} months remaining, now is a good time to start planning for replacement. ${weatherMode !== 'dry' ? `In ${weatherMode} conditions, reduced tread affects stopping distance significantly.` : ''}`,
        LOW: `Your tires are approaching the end of their service life with limited tread remaining. We estimate approximately ${remainingMonths} months before reaching the legal minimum. ${weatherMode !== 'dry' ? `${weatherMode === 'snow' ? 'Snow and ice' : 'Wet'} performance is notably compromised at this depth.` : 'Consider scheduling a replacement soon.'}`,
        CRITICAL: `Your tires have critically low tread and should be replaced as soon as possible. At this depth, stopping distances are significantly increased and ${weatherMode !== 'dry' ? `${weatherMode} weather driving poses serious safety risks` : 'safety is compromised'}. We strongly recommend immediate professional inspection.`,
    };

    const insights: Record<string, string[]> = {
        NEW: [
            `Health score of ${score}/100 indicates excellent condition`,
            'Tread depth is well above safety thresholds',
            'No immediate action needed — maintain regular rotation schedule',
        ],
        HEALTHY: [
            `Health score of ${score}/100 shows good tire condition`,
            `Approximately ${remainingMonths} months of service life estimated`,
            'Continue monitoring at regular intervals',
        ],
        MODERATE: [
            `Health score of ${score}/100 — entering monitor zone`,
            `Wet traction begins declining at this depth`,
            'Start comparing replacement options and pricing',
        ],
        LOW: [
            `Health score of ${score}/100 — replacement recommended soon`,
            'Stopping distance in wet conditions significantly increased',
            `Estimated ${remainingMonths} months until legal minimum`,
        ],
        CRITICAL: [
            `Health score of ${score}/100 — immediate attention needed`,
            'Tire is at or near legal minimum tread depth',
            'Hydroplaning risk is extremely high in wet conditions',
        ],
    };

    const actions: Record<string, string> = {
        NEW: 'Set a reminder to check again in 3-4 months.',
        HEALTHY: 'Schedule a professional inspection at your next service visit.',
        MODERATE: 'Book a free inspection and start comparing replacement tires.',
        LOW: 'Lock in pricing today and schedule replacement within the next few weeks.',
        CRITICAL: 'Book a tire replacement appointment immediately for your safety.',
    };

    return {
        narrative: narratives[bucket] || narratives.MODERATE,
        keyInsights: insights[bucket] || insights.MODERATE,
        recommendedAction: actions[bucket] || actions.MODERATE,
        disclaimer: 'This is an estimate based on photo analysis and assumptions. For precise measurement, visit a certified tire professional.',
    };
}
