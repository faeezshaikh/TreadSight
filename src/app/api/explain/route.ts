import { NextRequest, NextResponse } from 'next/server';
import { generateExplanation } from '@/lib/llmClient';
import type { AnalysisResult, WeatherMode } from '@/types';

/**
 * POST /api/explain
 *
 * Generates an AI explanation for the tire analysis results.
 * Falls back to template-based explanation if OpenAI key is not configured.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            analysis,
            weatherMode = 'dry',
        } = body as {
            analysis: AnalysisResult;
            weatherMode?: WeatherMode;
        };

        if (!analysis || !analysis.treadEstimate || !analysis.wearPrediction || !analysis.healthScore) {
            return NextResponse.json(
                { error: 'Invalid analysis data' },
                { status: 400 }
            );
        }

        // Reconstruct dates from ISO strings
        const analysisWithDates: AnalysisResult = {
            ...analysis,
            wearPrediction: {
                ...analysis.wearPrediction,
                wetTractionDropDate: new Date(analysis.wearPrediction.wetTractionDropDate),
                legalMinimumDate: new Date(analysis.wearPrediction.legalMinimumDate),
                tireDeadDate: new Date(analysis.wearPrediction.tireDeadDate),
            },
        };

        const explanation = await generateExplanation(analysisWithDates, weatherMode);

        return NextResponse.json(explanation);
    } catch (error) {
        console.error('Explanation generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate explanation' },
            { status: 500 }
        );
    }
}
