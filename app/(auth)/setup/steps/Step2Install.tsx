'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownTrayIcon as CloudDownload, ChevronLeftIcon as ChevronLeft, ArrowRightIcon as ArrowRight } from '@heroicons/react/24/outline';
import { triggerHaptic } from '@/lib/telegram';
import { VPN_APP_NAME } from '@/lib/constants';
import type { Step2InstallProps } from '@/types/setup';

export const Step2Install: React.FC<Step2InstallProps> = memo(({
    direction,
    variants,
    onBack,
    onNext,
    onInstall
}) => {
    return (
        <motion.div
            key="step2"
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
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>
            </div>

            <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="relative w-40 h-40 flex items-center justify-center mb-16">
                    <div className="absolute inset-0 bg-white/5 rounded-full border border-white/10" />
                    <CloudDownload className="w-16 h-16 text-white relative z-10" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-2xl font-medium text-white">Приложение</h1>
                    <div className="space-y-2">
                        <p className="text-white/80 text-base leading-relaxed max-w-[300px] mx-auto">
                            Установите приложение {VPN_APP_NAME}
                        </p>
                        <p className="text-white/40 text-xs leading-relaxed max-w-[260px] mx-auto">
                            Это наш официальный защищенный клиент для работы VPN
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 p-6 flex flex-col gap-3 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                <button
                    onClick={() => {
                        triggerHaptic('medium');
                        onInstall();
                    }}
                    className="w-full h-fit bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] py-[14px] flex items-center justify-center gap-2 text-white shadow-lg shadow-[#F55128]/20"
                >
                    <span className="text-lg font-medium">Установить</span>
                    <CloudDownload className="w-6 h-6" />
                </button>

                <button
                    onClick={onNext}
                    className="w-full h-fit bg-transparent hover:bg-white/5 active:scale-[0.98] transition-all rounded-[10px] py-[14px] flex items-center justify-center gap-2 text-white/40"
                >
                    <span className="text-base font-medium">Уже установлено</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );
});

Step2Install.displayName = 'Step2Install';
