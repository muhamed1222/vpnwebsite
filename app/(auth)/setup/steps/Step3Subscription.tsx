'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, CirclePlus, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '@/lib/telegram';
import type { Step3SubscriptionProps } from '@/types/setup';

export const Step3Subscription: React.FC<Step3SubscriptionProps> = memo(({
    direction,
    variants,
    onBack,
    onNext,
    onAdd,
    step = 3,
    isAdding = false,
    isChecking = false,
    checkFailed = false
}) => {
    // Вычисляем прогресс динамически (step / 4 * 100)
    const progress = (step / 4) * 100;
    return (
        <motion.div
            key="step3"
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col"
        >
            {/* Индикатор прогресса */}
            <div className="sticky top-0 z-50 flex items-center justify-between w-fit mb-4">
                <button
                    onClick={onBack}
                    className="p-2 bg-white/10 rounded-xl border border-white/10 active:scale-95 transition-all hover:bg-white/15"
                >
                    <ChevronLeft size={24} className="text-white" />
                </button>
            </div>

            <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="relative w-40 h-40 flex items-center justify-center mb-16">
                    <div className="absolute inset-0 bg-white/5 rounded-full border border-white/10" aria-hidden="true" />
                    <div className="relative z-10 w-24 h-24 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-white" aria-hidden="true">
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray="8 8"
                                className="opacity-20"
                            />
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                                transform="rotate(-90 50 50)"
                                className="opacity-90"
                            />
                        </svg>
                        <Plus size={48} className="text-white relative z-10" aria-hidden="true" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-2xl font-medium text-white">Подписка</h1>
                    {isChecking ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" aria-hidden="true" />
                            <p className="text-white/60 text-base leading-relaxed max-w-[300px] mx-auto">
                                Проверяем добавление подписки...
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-white/60 text-base leading-relaxed max-w-[300px] mx-auto">
                                Нажмите «Добавить», чтобы настройки применились автоматически
                            </p>
                            {checkFailed && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg max-w-[300px] mx-auto">
                                    <p className="text-red-500/90 text-xs leading-relaxed text-center">
                                        Не удалось подтвердить добавление подписки. Если вы добавили подписку вручную, нажмите «Далее» для продолжения.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 p-6 flex flex-col gap-3 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                <button
                    onClick={() => {
                        if (isAdding) return;
                        triggerHaptic('medium');
                        onAdd();
                    }}
                    disabled={isAdding || isChecking}
                    className="w-full h-fit bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] py-[14px] flex items-center justify-center gap-2 text-white shadow-lg shadow-[#F55128]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Добавить подписку"
                    aria-busy={isAdding}
                >
                    {isAdding ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                            <span className="text-lg font-medium">Добавление...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-lg font-medium">Добавить</span>
                            <CirclePlus size={24} aria-hidden="true" />
                        </>
                    )}
                </button>

                <button
                    onClick={onNext}
                    className="w-full h-fit bg-transparent hover:bg-white/5 active:scale-[0.98] transition-all rounded-[10px] py-[14px] flex items-center justify-center gap-2 text-white/40"
                    aria-label="Перейти к следующему шагу"
                >
                    <span className="text-base font-medium">Далее</span>
                    <ArrowRight size={20} aria-hidden="true" />
                </button>
            </div>
        </motion.div>
    );
});

Step3Subscription.displayName = 'Step3Subscription';
