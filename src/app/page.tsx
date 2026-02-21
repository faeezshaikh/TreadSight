'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Scan,
  Timer,
  CloudSnow,
  Shield,
  ChevronRight,
  Gauge,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col">
      {/* ── Hero Section ──────────────────────────────────────────── */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-16">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.08)_0%,transparent_70%)]" />
          <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
        </div>

        {/* Logo / Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-black" />
            </div>
            <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#8888a0]">
              TreadSight
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10 text-5xl md:text-7xl font-extrabold text-center leading-tight mb-6"
        >
          <span className="bg-gradient-to-r from-white via-white to-[#8888a0] bg-clip-text text-transparent">
            Time travel
          </span>
          <br />
          <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            your tire.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative z-10 text-lg md:text-xl text-[#8888a0] text-center max-w-md mb-10 leading-relaxed"
        >
          Snap a photo. See your tire&apos;s future.
          <br />
          AI-powered tread analysis in seconds.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="relative z-10"
        >
          <Link href="/scan">
            <button className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,212,255,0.4)] active:scale-95">
              <span className="flex items-center gap-3">
                <Scan className="w-5 h-5" />
                Scan Now
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
            </button>
          </Link>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="relative z-10 flex items-center gap-8 mt-14 text-sm text-[#555570]"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Instant analysis</span>
          </div>
          <div className="w-px h-4 bg-[rgba(255,255,255,0.1)]" />
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>No data stored</span>
          </div>
        </motion.div>
      </section>

      {/* ── Features Section ──────────────────────────────────────── */}
      <section className="relative px-6 pb-20 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <FeatureCard
            icon={<Timer className="w-6 h-6" />}
            title="Time Travel Slider"
            description="See how your tires will wear over time. Slide through months and watch tread deteriorate in real time."
            color="cyan"
          />
          <FeatureCard
            icon={<CloudSnow className="w-6 h-6" />}
            title="Weather Modes"
            description="Switch between Dry, Wet, and Snow to see how weather affects your tire safety and risk levels."
            color="blue"
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Smart Actions"
            description="Get personalized recommendations: set reminders, schedule inspections, or lock in prices."
            color="emerald"
          />
        </motion.div>
      </section>

      {/* ── Disclaimer ────────────────────────────────────────────── */}
      <footer className="relative px-6 pb-10">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs text-[#555570] leading-relaxed">
            TreadSight provides estimates based on photo analysis and synthetic modeling.
            Results are not a substitute for professional tire inspection.
            For precise measurement, visit a certified tire professional.
          </p>
          <p className="text-xs text-[#333348] mt-3">
            © {new Date().getFullYear()} TreadSight — AI Tire Copilot
          </p>
        </div>
      </footer>
    </main>
  );
}

// ── Feature Card Component ───────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'cyan' | 'blue' | 'emerald';
}) {
  const colorMap = {
    cyan: 'from-cyan-400/10 to-transparent border-cyan-500/10 text-cyan-400',
    blue: 'from-blue-400/10 to-transparent border-blue-500/10 text-blue-400',
    emerald: 'from-emerald-400/10 to-transparent border-emerald-500/10 text-emerald-400',
  };

  return (
    <div
      className={`relative rounded-2xl border bg-gradient-to-b p-6 ${colorMap[color]} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#8888a0] leading-relaxed">{description}</p>
    </div>
  );
}
