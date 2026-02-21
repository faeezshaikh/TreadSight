# TreadSight — AI Tire Copilot

> **Time travel your tire.** Snap a photo, see your tire's future. AI-powered tread depth analysis, wear prediction, and smart recommendations.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-purple)

## ✨ Features

- **📸 Tire Scan** — Mobile camera capture with image quality assessment
- **🕰️ Time Travel Slider** — See tire wear progression in real-time with canvas-based image deterioration
- **🌧️ Weather Modes** — Dry / Wet / Snow risk adjustment with visual overlays
- **🎮 Simulation Modes** — Toggle aggressive driving (+10%) and skip rotations (+15%)
- **🎯 Health Score** — Animated 0-100 score ring with risk-colored glow
- **🤖 AI Explanations** — OpenAI-powered insights with template fallback
- **📱 Mobile-First** — Tesla-style dark futuristic design, responsive on all devices

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Add your OpenAI API key
cp .env.local.example .env.local
# Edit .env.local and add your OPENAI_API_KEY
# The app works without it — uses built-in template explanations

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── scan/page.tsx            # Camera capture + upload
│   ├── results/page.tsx         # Full results dashboard
│   ├── api/
│   │   ├── analyze/route.ts     # Tire analysis endpoint
│   │   └── explain/route.ts     # LLM explanation endpoint
│   ├── layout.tsx               # Root layout + fonts
│   └── globals.css              # Theme + animations
├── components/results/
│   ├── TireViewer.tsx           # Canvas-based tire display
│   ├── TimeTravel.tsx           # Time slider + threshold markers
│   ├── HealthScore.tsx          # Animated score ring
│   ├── RiskBadge.tsx            # Risk level with haptic shake
│   ├── WeatherToggle.tsx        # Dry/Wet/Snow toggle
│   ├── AccelerationMode.tsx     # Gamified simulation toggles
│   ├── CTAPanel.tsx             # Dynamic call-to-action
│   ├── ConfidenceSection.tsx    # "How we estimate"
│   └── ExplanationCard.tsx      # AI explanation display
├── hooks/
│   └── useTimeTravelState.ts    # Slider + risk state management
├── lib/
│   ├── treadEstimator.ts        # Canvas-based vision heuristics
│   ├── wearModel.ts             # Synthetic wear prediction
│   ├── healthScore.ts           # Score 0-100 computation
│   ├── weatherRisk.ts           # Weather-mode risk adjustments
│   ├── imageDeterioration.ts    # Canvas transform pipeline
│   ├── llmClient.ts             # OpenAI with fallback
│   └── constants.ts             # Buckets, thresholds, colors
├── types/index.ts               # TypeScript interfaces
└── __tests__/
    ├── wearModel.test.ts
    ├── healthScore.test.ts
    └── weatherRisk.test.ts
```

## 🧪 Testing

```bash
# Run unit tests
npx jest

# Run with coverage
npx jest --coverage
```

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | OpenAI API key for AI explanations. Falls back to built-in templates if not set. |

## 🧠 How It Works

### Vision (Tread Depth Estimation)
Client-side canvas-based heuristics analyze the uploaded tire photo:
- **Edge density** (Sobel-like) — deeper grooves = more tread
- **Texture variance** — more texture = better tread
- **Contrast ratio** — worn tires appear smoother

Returns a bucket classification (NEW → CRITICAL) with confidence 55-90%.

### Wear Model
Linear wear model with modifiers:
- Base rate: ~1/32" per 6,000-8,000 miles
- Climate: cold (+5%), hot (+15%), neutral (baseline)
- Rotation: skip rotations (+15%)
- Driving style: aggressive (+10%)

### Image Deterioration
Real-time canvas pipeline (no server calls, ~60fps):
1. Contrast reduction in tread region
2. Progressive blur/smoothing
3. Groove erosion (lighten dark groove lines)
4. Micro-crack noise at high wear
5. Aging overlay + vignette

### Swapping LLM Providers
Edit `src/lib/llmClient.ts`. The API call is a standard OpenAI-compatible chat completion. Replace with any provider that supports the same interface (Anthropic, Groq, local Ollama, etc.).

## 📋 Future Work

- [ ] Real ML model for tread depth (TensorFlow.js or CoreML)
- [ ] Tire brand/model recognition
- [ ] Actual store integration for booking
- [ ] Push notification reminders
- [ ] Multi-tire tracking (all 4 tires)
- [ ] Historical scan comparison
- [ ] PDF/image report export

## ⚠️ Disclaimer

TreadSight provides **estimates** based on photo analysis and synthetic modeling. Results are not a substitute for professional tire inspection. For precise measurement, visit a certified tire professional.
