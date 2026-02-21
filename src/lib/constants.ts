import { TreadBucket, DepthRange, RiskLevel, WeatherMode, CTAAction } from '@/types';

// ── Tread Depth Buckets ──────────────────────────────────────────────

export const TREAD_BUCKETS: Record<TreadBucket, DepthRange> = {
    NEW: { min: 8, max: 10 },
    HEALTHY: { min: 6, max: 8 },
    MODERATE: { min: 4, max: 6 },
    LOW: { min: 2, max: 4 },
    CRITICAL: { min: 0, max: 2 },
};

export const BUCKET_ORDER: TreadBucket[] = ['NEW', 'HEALTHY', 'MODERATE', 'LOW', 'CRITICAL'];

// ── Risk Level Thresholds ────────────────────────────────────────────

export const RISK_THRESHOLDS: Record<RiskLevel, DepthRange> = {
    'Safe': { min: 6, max: 10 },
    'Monitor': { min: 4, max: 6 },
    'Plan Soon': { min: 2, max: 4 },
    'Replace Now': { min: 0, max: 2 },
};

export const RISK_COLORS: Record<RiskLevel, string> = {
    'Safe': '#10B981', // emerald-500
    'Monitor': '#F59E0B', // amber-500
    'Plan Soon': '#F97316', // orange-500
    'Replace Now': '#EF4444', // red-500
};

export const RISK_GLOW_COLORS: Record<RiskLevel, string> = {
    'Safe': 'rgba(16, 185, 129, 0.3)',
    'Monitor': 'rgba(245, 158, 11, 0.3)',
    'Plan Soon': 'rgba(249, 115, 22, 0.4)',
    'Replace Now': 'rgba(239, 68, 68, 0.5)',
};

// ── Weather Modifiers ────────────────────────────────────────────────

export const WEATHER_RISK_MULTIPLIERS: Record<WeatherMode, number> = {
    dry: 1.0,
    wet: 1.35,
    snow: 1.7,
};

export const WEATHER_DEPTH_THRESHOLDS: Record<WeatherMode, { warning: number; critical: number }> = {
    dry: { warning: 4, critical: 2 },
    wet: { warning: 5, critical: 3 },
    snow: { warning: 6, critical: 4 },
};

// ── Score Ranges ─────────────────────────────────────────────────────

export const SCORE_RANGES: Record<TreadBucket, { min: number; max: number }> = {
    NEW: { min: 85, max: 100 },
    HEALTHY: { min: 70, max: 85 },
    MODERATE: { min: 50, max: 70 },
    LOW: { min: 25, max: 50 },
    CRITICAL: { min: 0, max: 25 },
};

// ── CTA Actions ──────────────────────────────────────────────────────

export const CTA_ACTIONS: Record<RiskLevel, CTAAction> = {
    'Safe': {
        label: 'Set Reminder',
        description: 'We\'ll remind you to check again in 3 months',
        icon: 'bell',
        urgency: 'low',
    },
    'Monitor': {
        label: 'Schedule Free Inspection',
        description: 'Get a professional measurement at your nearest store',
        icon: 'calendar',
        urgency: 'medium',
    },
    'Plan Soon': {
        label: 'Lock Price Today',
        description: 'Reserve today\'s price before your next replacement',
        icon: 'tag',
        urgency: 'high',
    },
    'Replace Now': {
        label: 'Book Install Now',
        description: 'Your tires need immediate attention for your safety',
        icon: 'alert-triangle',
        urgency: 'critical',
    },
};

// ── Wear Model Defaults ─────────────────────────────────────────────

export const DEFAULT_MILES_PER_YEAR = 12000;
export const DEFAULT_CLIMATE = 'neutral' as const;
export const DEFAULT_ROTATION = 'normal' as const;
export const DEFAULT_DRIVING_STYLE = 'normal' as const;

// Average tire loses about 1/32" per 6,000-8,000 miles
export const BASE_WEAR_RATE_PER_1000_MILES = 0.14; // 32nds per 1000 miles

export const WEAR_MODIFIERS = {
    climate: {
        cold: 1.05,
        moderate: 1.0,
        hot: 1.15,
        neutral: 1.0,
    },
    rotation: {
        normal: 1.0,
        'skip-rotations': 1.15,
    },
    driving: {
        normal: 1.0,
        aggressive: 1.10,
    },
};

// ── Legal / Safety Thresholds ────────────────────────────────────────

export const WET_TRACTION_DROP_DEPTH = 4; // 32nds
export const LEGAL_MINIMUM_DEPTH = 2;     // 32nds

// ── Image Quality Thresholds ─────────────────────────────────────────

export const IMAGE_QUALITY_MIN = 0.35;
