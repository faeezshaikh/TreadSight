'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Camera,
    Upload,
    Loader2,
    AlertCircle,
    ArrowLeft,
    MapPin,
    Gauge,
    ChevronRight,
    RefreshCw,
    Check,
    X,
} from 'lucide-react';
import { estimateTreadBucket, assessImageQuality } from '@/lib/treadEstimator';

export default function ScanPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [milesPerYear, setMilesPerYear] = useState('12000');
    const [zip, setZip] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [imageQualityOk, setImageQualityOk] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setImageFile(file);
            setError(null);
            setImageQualityOk(null);

            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string;
                setImagePreview(dataUrl);

                // Check image quality
                const img = new Image();
                img.onload = () => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;

                    canvas.width = Math.min(img.width, 640);
                    canvas.height = Math.min(img.height, 640);
                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const quality = assessImageQuality(imageData);
                    setImageQualityOk(quality.acceptable);
                };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);
        },
        []
    );

    const handleAnalyze = useCallback(async () => {
        if (!imagePreview || !canvasRef.current) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            // Run client-side tread estimation
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d')!;
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const treadEstimate = estimateTreadBucket(imageData);
            const imageQuality = assessImageQuality(imageData);

            // Call server for full analysis
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bucket: treadEstimate.bucket,
                    depthRange: treadEstimate.depthRange32nds,
                    confidence: treadEstimate.confidence,
                    imageQuality,
                    milesPerYear: parseInt(milesPerYear, 10) || 12000,
                    zip: zip || undefined,
                }),
            });

            if (!response.ok) throw new Error('Analysis failed');

            const analysis = await response.json();

            // Store results in sessionStorage for the results page
            sessionStorage.setItem('treadsight_analysis', JSON.stringify(analysis));
            sessionStorage.setItem('treadsight_image', imagePreview);

            // Navigate to results
            router.push('/results');
        } catch (err) {
            setError('Analysis failed. Please try again.');
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [imagePreview, milesPerYear, zip, router]);

    const handleRetake = useCallback(() => {
        setImageFile(null);
        setImagePreview(null);
        setImageQualityOk(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    return (
        <main className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-8"
            >
                <button
                    onClick={() => router.push('/')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold">Scan Your Tire</h1>
                    <p className="text-sm text-[#8888a0]">Take or upload a photo of your tire tread</p>
                </div>
            </motion.div>

            {/* Hidden canvas for image processing */}
            <canvas ref={canvasRef} className="hidden" />

            <AnimatePresence mode="wait">
                {!imagePreview ? (
                    /* ── Upload Zone ──────────────────────────────────────── */
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex-1 flex flex-col"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="tire-upload"
                        />

                        <label
                            htmlFor="tire-upload"
                            className="flex-1 min-h-[300px] flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-[rgba(255,255,255,0.1)] hover:border-cyan-500/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 cursor-pointer"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center mb-2">
                                <Camera className="w-10 h-10 text-cyan-400" />
                            </div>
                            <p className="text-lg font-semibold">Tap to capture</p>
                            <p className="text-sm text-[#8888a0]">or upload from gallery</p>
                            <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-full bg-white/5">
                                <Upload className="w-4 h-4 text-[#8888a0]" />
                                <span className="text-xs text-[#8888a0]">JPG, PNG up to 10MB</span>
                            </div>
                        </label>

                        {/* Tips */}
                        <div className="mt-6 space-y-2">
                            <p className="text-xs text-[#555570] font-medium uppercase tracking-wider">Tips for best results</p>
                            <ul className="space-y-1.5 text-sm text-[#8888a0]">
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                    Get close to the tread — fill the frame
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                    Good lighting — avoid harsh shadows
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                    Keep the camera steady for a sharp image
                                </li>
                            </ul>
                        </div>
                    </motion.div>
                ) : (
                    /* ── Preview + Form ───────────────────────────────────── */
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex-1 flex flex-col gap-6"
                    >
                        {/* Image Preview */}
                        <div className="relative rounded-2xl overflow-hidden border border-white/10">
                            <img
                                src={imagePreview}
                                alt="Tire preview"
                                className="w-full aspect-square object-cover"
                            />

                            {/* Quality badge */}
                            {imageQualityOk !== null && (
                                <div
                                    className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md ${imageQualityOk
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                        }`}
                                >
                                    {imageQualityOk ? (
                                        <>
                                            <Check className="w-3 h-3" /> Good quality
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-3 h-3" /> Low quality
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Retake button */}
                            <button
                                onClick={handleRetake}
                                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium hover:bg-black/80 transition-colors border border-white/10"
                            >
                                <RefreshCw className="w-3 h-3" /> Retake
                            </button>
                        </div>

                        {/* Poor quality warning */}
                        {imageQualityOk === false && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
                            >
                                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-300">Image quality may affect accuracy</p>
                                    <p className="text-xs text-amber-300/70 mt-1">
                                        Try retaking with better lighting or closer to the tread for improved results.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Optional Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#8888a0] mb-2">
                                    Miles driven per year
                                </label>
                                <div className="relative">
                                    <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555570]" />
                                    <input
                                        type="number"
                                        value={milesPerYear}
                                        onChange={(e) => setMilesPerYear(e.target.value)}
                                        placeholder="12000"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 text-white placeholder-[#555570] transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#8888a0] mb-2">
                                    ZIP code <span className="text-[#555570]">(optional)</span>
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555570]" />
                                    <input
                                        type="text"
                                        value={zip}
                                        onChange={(e) => setZip(e.target.value)}
                                        placeholder="e.g., 85001"
                                        maxLength={5}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 text-white placeholder-[#555570] transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <X className="w-4 h-4 text-red-400" />
                                <span className="text-sm text-red-300">{error}</span>
                            </div>
                        )}

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold text-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    Analyze Tire
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
