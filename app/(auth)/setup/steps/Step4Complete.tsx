'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { triggerHaptic } from '@/lib/telegram';
import { VPN_APP_NAME } from '@/lib/constants';
import { analytics } from '@/lib/analytics';
import type { Step4CompleteProps } from '@/types/setup';


export const Step4Complete: React.FC<Step4CompleteProps> = ({
    direction,
    variants,
    onBack,
    onRestart,
    onCheckVpn,
    isChecking = false
}) => {
    return (
        <motion.div
            key="step4"
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col"
        >
            <div className="sticky top-0 z-50 flex items-center justify-between w-fit mb-4">
                <button
                    onClick={onBack}
                    className="p-2 bg-white/10 rounded-xl border border-white/10 active:scale-95 transition-all hover:bg-white/15"
                >
                    <ChevronLeft size={24} className="text-white" />
                </button>
            </div>

            <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="relative w-48 h-48 flex items-center justify-center mb-16">
                    <div className="absolute inset-0 bg-[#F55128] rounded-full" aria-hidden="true" />
                    <Check size={80} className="text-white relative z-10" aria-hidden="true" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-2xl font-medium text-white tracking-tight">Готово!</h1>
                    <div className="space-y-3 text-white/60 text-base leading-relaxed max-w-[300px] mx-auto">
                        <p>
                            Настройка завершена! Теперь включите VPN в приложении {VPN_APP_NAME}:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-left">
                            <li>Откройте приложение {VPN_APP_NAME}</li>
                            <li>Найдите кнопку включения VPN (обычно в верхней части экрана)</li>
                            <li>Нажмите на неё, чтобы активировать VPN</li>
                        </ol>
                        <p className="text-white/40 text-sm mt-4">
                            После включения VPN вы сможете безопасно пользоваться интернетом
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 p-6 space-y-3 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                {onCheckVpn && (
                    <button
                        onClick={() => {
                            triggerHaptic('medium');
                            onCheckVpn();
                        }}
                        disabled={isChecking}
                        className="w-full h-fit bg-transparent border border-white/20 hover:bg-white/5 active:scale-[0.98] transition-all rounded-[10px] py-[14px] flex items-center justify-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Проверить статус VPN"
                        aria-busy={isChecking}
                    >
                        {isChecking ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                <span className="text-base font-medium">Проверка...</span>
                            </>
                        ) : (
                            <span className="text-base font-medium">Проверить статус VPN</span>
                        )}
                    </button>
                )}
                <Link
                    href="/"
                    onClick={() => {
                        triggerHaptic('success');
                        analytics.event('setup_complete', { step: 4 });
                    }}
                    className="w-full h-fit bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] py-[14px] flex items-center justify-center text-white shadow-lg shadow-[#F55128]/20"
                    aria-label="Завершить настройку и вернуться на главную"
                >
                    <span className="text-base font-medium">Завершить настройку</span>
                </Link>
                {onRestart && (
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            analytics.buttonClick('setup_restart', { step: 4 });
                            onRestart();
                        }}
                        className="w-full h-fit bg-transparent border border-white/10 hover:bg-white/5 active:scale-[0.98] transition-all rounded-[10px] py-[14px] flex items-center justify-center text-white/60"
                        aria-label="Начать настройку заново"
                    >
                        <span className="text-base font-medium">Начать заново</span>
                    </button>
                )}
            </div>
        </motion.div>
    );
};
