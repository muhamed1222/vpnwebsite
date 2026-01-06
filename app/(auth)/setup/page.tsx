'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { getTelegramWebApp, getTelegramPlatform, triggerHaptic } from '@/lib/telegram';
import { InfoModal } from '@/components/blocks/InfoModal';
import { config } from '@/lib/config';
import { SUBSCRIPTION_CONFIG, APP_STORE_URLS, DEEP_LINK_PROTOCOL } from '@/lib/constants';
import { api } from '@/lib/api';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';

import { Step1Welcome } from './steps/Step1Welcome';
import { Step2Install } from './steps/Step2Install';
import { Step3Subscription } from './steps/Step3Subscription';
import { Step4Complete } from './steps/Step4Complete';

/**
 * SetupPage - Экран пошаговой настройки VPN (Onboarding).
 * 
 * Логика работы:
 * 1. Состояние `step` управляет текущим экраном (1-4).
 * 2. Используется `getTelegramPlatform` для адаптации инструкций под ОС пользователя.
 * 3. На каждом шаге визуализируется прогресс с помощью SVG-колец.
 */
export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);

  // Инициализируем платформу сразу, без useEffect
  const [platform] = useState(() => {
    if (typeof window !== 'undefined') {
      return getTelegramPlatform();
    }
    return '...';
  });

  // Загружаем реальную ссылку на подписку пользователя
  useEffect(() => {
    const loadSubscriptionUrl = async () => {
      try {
        const configData = await api.getUserConfig();
        if (configData.ok && configData.config) {
          // configData.config уже содержит полный URL на подписку
          setSubscriptionUrl(configData.config);
        }
      } catch (error) {
        console.error('Failed to load subscription URL:', error);
        // Используем дефолтную ссылку при ошибке
        setSubscriptionUrl(`${config.payment.subscriptionBaseUrl}/api/sub/${SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID}`);
      }
    };
    loadSubscriptionUrl();
  }, []);

  /* 
    Обработчик для установки на другое устройство.
    Открывает внешнюю ссылку с базой знаний.
  */
  const handleOtherDeviceClick = () => {
    const webApp = getTelegramWebApp();
    const url = config.support.helpBaseUrl;

    if (webApp) {
      webApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  /* 
    Шаг 2: Открытие информационного модального окна перед установкой приложения.
  */
  const handleInstallClick = () => {
    setIsInfoModalOpen(true);
  };

  /* 
    Шаг 3: Добавление подписки через Deep Link.
    Используется протокол happ://, который поддерживается приложением Hiddify
    для автоматического импорта конфигурации.
    Для iOS используется протокол v2raytun://import/.
  */
  const handleAddSubscription = () => {
    // Используем реальную ссылку на подписку пользователя
    const userSubscriptionUrl = subscriptionUrl || `${config.payment.subscriptionBaseUrl}/api/sub/${SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID}`;

    // Платформо-зависимый протокол и имя (для iOS используем v2raytun)
    let protocol: string = DEEP_LINK_PROTOCOL;
    let vpnName = 'OutlivionVPN';

    if (platform === 'iOS') {
      protocol = 'v2raytun://import/';
      vpnName = 'UltimaVPN';
    }

    // Формируем deep link согласно примеру: https://redirect.../?url=happ://add/https://...#Name
    // Если redirectUrl не задан, используем https://redirect.outlivion.space как дефолт
    const redirectBase = config.payment.redirectUrl || 'https://redirect.outlivion.space';
    const subUrl = `${redirectBase}/?url=${protocol}${userSubscriptionUrl}#${vpnName}`;

    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.openLink(subUrl);
    } else {
      window.open(subUrl, '_blank');
    }
  };

  /* 
    Подтверждение установки в InfoModal.
    Динамически выбирает ссылку на магазин в зависимости от платформы.
  */
  const confirmInstallation = () => {
    let url = config.support.helpBaseUrl; // Fallback

    if (platform === 'iOS') {
      url = APP_STORE_URLS.iOS;
    } else if (platform === 'Android') {
      url = APP_STORE_URLS.Android;
    } else if (platform === 'macOS') {
      url = APP_STORE_URLS.macOS;
    } else if (platform === 'Desktop') {
      url = APP_STORE_URLS.Desktop;
    }

    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
    setIsInfoModalOpen(false);
  };

  const stepVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -50 : 50,
      opacity: 0
    })
  };

  const [direction, setDirection] = useState(0);

  const goToStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
    triggerHaptic('light');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1Welcome
            key="step1"
            direction={direction}
            variants={stepVariants}
            platform={platform}
            onNext={() => goToStep(2)}
            onOtherDevice={handleOtherDeviceClick}
          />
        );
      case 2:
        return (
          <Step2Install
            key="step2"
            direction={direction}
            variants={stepVariants}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
            onInstall={handleInstallClick}
          />
        );
      case 3:
        return (
          <Step3Subscription
            key="step3"
            direction={direction}
            variants={stepVariants}
            onBack={() => goToStep(2)}
            onNext={() => goToStep(4)}
            onAdd={handleAddSubscription}
          />
        );
      case 4:
        return (
          <Step4Complete
            key="step4"
            direction={direction}
            variants={stepVariants}
            onBack={() => goToStep(3)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="w-full bg-black text-white pt-[calc(100px+env(safe-area-inset-top))] px-[calc(1rem+env(safe-area-inset-left))] font-sans select-none flex flex-col min-h-screen">
      <AnimatedBackground />

      <div className="relative flex-1 flex flex-col z-10 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {renderStep()}
        </AnimatePresence>
      </div>

      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        onConfirm={confirmInstallation}
      />
    </main>
  );
}
