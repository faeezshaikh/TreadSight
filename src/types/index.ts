// ── TreadSight Type Definitions ──────────────────────────────────────

export type TreadBucket = 'NEW' | 'HEALTHY' | 'MODERATE' | 'LOW' | 'CRITICAL';

export type RiskLevel = 'Safe' | 'Monitor' | 'Plan Soon' | 'Replace Now';

export type WeatherMode = 'dry' | 'wet' | 'snow';

export type DrivingStyle = 'normal' | 'aggressive' | 'skip-rotations';

export interface DepthRange {
  min: number; // in 32nds of an inch
  max: number;
}

export interface TreadEstimate {
  bucket: TreadBucket;
  depthRange32nds: DepthRange;
  confidence: number; // 0.55 – 0.9
}

export interface ImageQuality {
  blur: number;       // 0–1 (1 = sharp)
  brightness: number; // 0–1
  contrast: number;   // 0–1
  overall: number;    // 0–1
  acceptable: boolean;
}

export interface WearPredictionInput {
  depthRange: DepthRange;
  milesPerYear: number;
  climate: 'cold' | 'moderate' | 'hot' | 'neutral';
  rotation: 'normal' | 'skip-rotations';
  drivingStyle: 'normal' | 'aggressive';
}

export interface WearPrediction {
  currentDepth32nds: number;
  wearRatePer1000Miles: number; // 32nds lost per 1000 miles
  wetTractionDropDate: Date;   // when crossing 4/32
  legalMinimumDate: Date;      // when crossing 2/32
  tireDeadDate: Date;          // when reaching ≤2/32
  remainingMonths: number;
  confidenceBand: number;      // ±percentage (0.15–0.20)
}

export interface HealthScoreResult {
  score: number;       // 0–100
  riskLevel: RiskLevel;
  bucket: TreadBucket;
}

export interface WeatherRiskResult {
  adjustedRiskLevel: RiskLevel;
  riskModifier: number; // multiplier
  description: string;
}

export interface CTAAction {
  label: string;
  description: string;
  icon: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface LLMExplanation {
  narrative: string;
  keyInsights: string[];
  recommendedAction: string;
  disclaimer: string;
}

export interface AnalysisResult {
  treadEstimate: TreadEstimate;
  wearPrediction: WearPrediction;
  healthScore: HealthScoreResult;
  imageQuality: ImageQuality;
}

export interface TimeTravelState {
  t: number;              // 0..1 (today..tire dead)
  currentDate: Date;
  currentDepth: number;   // 32nds
  currentScore: number;   // 0–100
  currentRisk: RiskLevel;
  weatherMode: WeatherMode;
  skipRotations: boolean;
  aggressiveDriving: boolean;
}
