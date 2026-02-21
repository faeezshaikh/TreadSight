import { NextRequest, NextResponse } from 'next/server';
import { predictWearTimeline } from '@/lib/wearModel';
import { computeHealthScore } from '@/lib/healthScore';
import { TREAD_BUCKETS, BUCKET_ORDER } from '@/lib/constants';
import type { TreadBucket, DepthRange, TreadEstimate, ImageQuality, WearPredictionInput } from '@/types';

/**
 * POST /api/analyze
 *
 * Accepts image analysis data and returns full tire analysis.
 * The actual image analysis (tread estimation) happens client-side via canvas.
 * This endpoint takes the client-side estimation and runs wear prediction + scoring.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            bucket,
            depthRange,
            confidence,
            imageQuality,
            milesPerYear = 12000,
            zip,
        } = body as {
            bucket: TreadBucket;
            depthRange: DepthRange;
            confidence: number;
            imageQuality: ImageQuality;
            milesPerYear?: number;
            zip?: string;
        };

        // Validate bucket
        if (!BUCKET_ORDER.includes(bucket)) {
            return NextResponse.json(
                { error: 'Invalid tread bucket' },
                { status: 400 }
            );
        }

        // Determine climate from ZIP (simplified for MVP)
        const climate = zipToClimate(zip);

        // Run wear prediction
        const wearInput: WearPredictionInput = {
            depthRange,
            milesPerYear,
            climate,
            rotation: 'normal',
            drivingStyle: 'normal',
        };

        const wearPrediction = predictWearTimeline(wearInput);

        // Compute health score
        const healthScore = computeHealthScore(
            wearPrediction.currentDepth32nds,
            bucket
        );

        const treadEstimate: TreadEstimate = {
            bucket,
            depthRange32nds: depthRange,
            confidence,
        };

        return NextResponse.json({
            treadEstimate,
            wearPrediction: {
                ...wearPrediction,
                wetTractionDropDate: wearPrediction.wetTractionDropDate.toISOString(),
                legalMinimumDate: wearPrediction.legalMinimumDate.toISOString(),
                tireDeadDate: wearPrediction.tireDeadDate.toISOString(),
            },
            healthScore,
            imageQuality,
        });
    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze tire image' },
            { status: 500 }
        );
    }
}

function zipToClimate(zip?: string): 'cold' | 'moderate' | 'hot' | 'neutral' {
    if (!zip) return 'neutral';

    const prefix = parseInt(zip.substring(0, 3), 10);
    if (isNaN(prefix)) return 'neutral';

    // Very rough US ZIP-based climate mapping
    if (prefix >= 0 && prefix <= 99) return 'cold';       // Northeast
    if (prefix >= 100 && prefix <= 199) return 'cold';     // NY area
    if (prefix >= 200 && prefix <= 299) return 'moderate'; // Mid-Atlantic
    if (prefix >= 300 && prefix <= 399) return 'hot';      // Southeast
    if (prefix >= 400 && prefix <= 499) return 'moderate'; // Midwest
    if (prefix >= 500 && prefix <= 599) return 'cold';     // Upper Midwest
    if (prefix >= 600 && prefix <= 699) return 'moderate'; // Central
    if (prefix >= 700 && prefix <= 799) return 'hot';      // South/TX
    if (prefix >= 800 && prefix <= 899) return 'moderate'; // Mountain
    if (prefix >= 900 && prefix <= 999) return 'hot';      // West Coast/SW

    return 'neutral';
}
