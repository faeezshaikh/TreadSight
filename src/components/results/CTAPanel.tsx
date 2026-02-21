'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RiskLevel } from '@/types';
import { CTA_ACTIONS, RISK_COLORS } from '@/lib/constants';
import { Bell, Calendar, Tag, AlertTriangle, X, Check } from 'lucide-react';

interface CTAPanelProps {
    riskLevel: RiskLevel;
}

const ICONS: Record<string, React.ReactNode> = {
    bell: <Bell className="w-5 h-5" />,
    calendar: <Calendar className="w-5 h-5" />,
    tag: <Tag className="w-5 h-5" />,
    'alert-triangle': <AlertTriangle className="w-5 h-5" />,
};

export default function CTAPanel({ riskLevel }: CTAPanelProps) {
    const [showModal, setShowModal] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const action = CTA_ACTIONS[riskLevel];
    const color = RISK_COLORS[riskLevel];

    const handleClick = () => {
        setShowModal(true);
        setConfirmed(false);
    };

    const handleConfirm = () => {
        setConfirmed(true);
        setTimeout(() => setShowModal(false), 1500);
    };

    return (
        <>
            <motion.button
                onClick={handleClick}
                className="w-full py-4 px-6 rounded-2xl flex items-center justify-between gap-4 border transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                style={{
                    backgroundColor: `${color}15`,
                    borderColor: `${color}30`,
                }}
                whileHover={{ boxShadow: `0 0 30px ${color}20` }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${color}20`, color }}
                    >
                        {ICONS[action.icon]}
                    </div>
                    <div className="text-left">
                        <p className="font-semibold" style={{ color }}>
                            {action.label}
                        </p>
                        <p className="text-xs text-[#8888a0]">{action.description}</p>
                    </div>
                </div>
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                >
                    <span style={{ color }}>→</span>
                </div>
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[#16161f] border border-white/10 rounded-3xl p-6 max-w-sm w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">{action.label}</h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-4 h-4 text-[#8888a0]" />
                                </button>
                            </div>

                            <p className="text-sm text-[#8888a0] mb-6">{action.description}</p>

                            {!confirmed ? (
                                <button
                                    onClick={handleConfirm}
                                    className="w-full py-3 rounded-xl font-semibold text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    style={{ backgroundColor: color }}
                                >
                                    Confirm
                                </button>
                            ) : (
                                <div className="flex items-center justify-center gap-2 py-3 text-emerald-400">
                                    <Check className="w-5 h-5" />
                                    <span className="font-semibold">Done! (Demo)</span>
                                </div>
                            )}

                            <p className="text-[10px] text-[#555570] text-center mt-3">
                                This is a demo action. No real booking or scheduling occurs.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
