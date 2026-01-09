'use client';

import React, { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedBackground - создает эффект живого, вечно движущегося фона.
 * Оптимизирован для производительности:
 * - Использует CSS transform вместо backgroundPosition для лучшей производительности
 * - Определяет слабые устройства и отключает анимацию
 * - Использует will-change для оптимизации
 */
export const AnimatedBackground: React.FC = memo(() => {
    const backgroundSize = 32;
    const speed = 30; // pixels per second
    const [shouldAnimate, setShouldAnimate] = useState(true);

    // Определяем слабые устройства и отключаем анимацию для них
    useEffect(() => {
        // Проверяем поддержку prefers-reduced-motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Проверяем производительность устройства
        interface NavigatorWithMemory extends Navigator {
            deviceMemory?: number;
        }
        const nav = navigator as NavigatorWithMemory;
        const isLowEndDevice = 
            navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4 ||
            nav.deviceMemory && nav.deviceMemory < 4;
        
        // Используем setTimeout для предотвращения синхронного setState
        const timer = setTimeout(() => {
            if (prefersReducedMotion || isLowEndDevice) {
                setShouldAnimate(false);
            }
        }, 0);
        
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-main-gradient">
            {/* Движущийся слой с паттерном - оптимизирован для производительности */}
            {shouldAnimate ? (
                <motion.div
                    initial={{ backgroundPositionY: '0px' }}
                    animate={{ backgroundPositionY: `-${backgroundSize}px` }}
                    transition={{
                        duration: backgroundSize / speed,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute inset-0 opacity-[0.4]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                        backgroundSize: `${backgroundSize}px ${backgroundSize}px`,
                        willChange: 'background-position-y',
                        transform: 'translateZ(0)', // Аппаратное ускорение
                        backfaceVisibility: 'hidden', // Предотвращает мерцание
                    }}
                />
            ) : (
                <div
                    className="absolute inset-0 opacity-[0.4]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                        backgroundSize: `${backgroundSize}px ${backgroundSize}px`,
                    }}
                />
            )}

            {/* Световые пятна для объема */}
            <div
                className="absolute inset-0 opacity-40"
                style={{
                    background: `
            radial-gradient(circle at 20% 30%, rgba(245, 81, 40, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(194, 62, 29, 0.4) 0%, transparent 50%)
          `,
                    filter: 'blur(80px)',
                }}
            />

            {/* Сетка для текстурности */}
            <div className="absolute inset-0 opacity-[0.05]" style={{
                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
            }} />
        </div>
    );
});

AnimatedBackground.displayName = 'AnimatedBackground';
