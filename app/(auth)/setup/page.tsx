'use client';

import React, { useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import { InfoModal } from '@/components/blocks/InfoModal';
import { config } from '@/lib/config';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { handleExternalLink } from '@/lib/utils/setupHelpers';
import { analytics } from '@/lib/analytics';
import { useSetupState } from '@/hooks/useSetupState';
import { useSubscriptionSetup } from '@/hooks/useSubscriptionSetup';
import { useAppInstall } from '@/hooks/useAppInstall';
import { usePlatform } from '@/hooks/usePlatform';
import { STEP_ANIMATION_VARIANTS } from '@/lib/utils/setupConstants';

// Dynamic imports for code splitting - only load steps when needed
const Step1Welcome = dynamic(() => import('./steps/Step1Welcome').then(m => ({ default: m.Step1Welcome })), { ssr: false });
const Step2Install = dynamic(() => import('./steps/Step2Install').then(m => ({ default: m.Step2Install })), { ssr: false });
const Step3Subscription = dynamic(() => import('./steps/Step3Subscription').then(m => ({ default: m.Step3Subscription })), { ssr: false });
const Step4Complete = dynamic(() => import('./steps/Step4Complete').then(m => ({ default: m.Step4Complete })), { ssr: false });

/**
 * SetupPage - Экран пошаговой настройки VPN (Onboarding).
 * 
 * Логика работы:
 * 1. Состояние `step` управляет текущим экраном (1-4).
 * 2. Используется `usePlatform` для адаптации инструкций под ОС пользователя.
 * 3. На каждом шаге визуализируется прогресс с помощью прогресс-бара.
 */
export default function SetupPage() {
  const platform = usePlatform();
  const { step, direction, goToStep, goNext, goBack, progressPercent } = useSetupState();
  const subscriptionSetup = useSubscriptionSetup();
  const appInstall = useAppInstall();

  // Обработчик для установки на другое устройство (мемоизирован)
  const handleOtherDeviceClick = useCallback(() => {
    analytics.event('setup_other_device', { step: 1 });
    handleExternalLink(config.support.helpBaseUrl);
  }, []);

  // Обработчик добавления подписки с последующей проверкой (мемоизирован)
  const handleAddSubscription = useCallback(async () => {
    await subscriptionSetup.addSubscription(platform);
    const success = await subscriptionSetup.checkSubscriptionAdded();
    if (success) {
      setTimeout(() => goToStep(4), 1000);
    }
  }, [platform, subscriptionSetup, goToStep]);

  // Мемоизированный рендер шагов
  const renderStep = useMemo(() => {
    switch (step) {
      case 1:
        return (
          <Step1Welcome
            key="step1"
            direction={direction}
            variants={STEP_ANIMATION_VARIANTS}
            platform={platform}
            onNext={goNext}
            onOtherDevice={handleOtherDeviceClick}
            subscriptionStatus={subscriptionSetup.subscriptionStatus.status}
          />
        );
      case 2:
        return (
          <Step2Install
            key="step2"
            direction={direction}
            variants={STEP_ANIMATION_VARIANTS}
            onBack={goBack}
            onNext={goNext}
            onInstall={appInstall.openModal}
          />
        );
      case 3:
        return (
          <Step3Subscription
            key="step3"
            direction={direction}
            variants={STEP_ANIMATION_VARIANTS}
            step={3}
            isAdding={subscriptionSetup.isAdding}
            isChecking={subscriptionSetup.isChecking}
            checkFailed={subscriptionSetup.checkFailed}
            onBack={goBack}
            onNext={goNext}
            onAdd={handleAddSubscription}
          />
        );
      case 4:
        return (
          <Step4Complete
            key="step4"
            direction={direction}
            variants={STEP_ANIMATION_VARIANTS}
            onBack={goBack}
            onRestart={() => goToStep(1)}
            onCheckVpn={subscriptionSetup.checkVpnStatus}
            isChecking={false}
          />
        );
      default:
        return null;
    }
  }, [step, direction, platform, goNext, goBack, goToStep, subscriptionSetup, appInstall, handleOtherDeviceClick, handleAddSubscription]);

  return (
    <main className="w-full bg-black text-white pt-[calc(100px+env(safe-area-inset-top))] px-[calc(1rem+env(safe-area-inset-left))] font-sans select-none flex flex-col min-h-screen">
      <AnimatedBackground />

      <div className="relative flex-1 flex flex-col z-10 overflow-hidden">
        {/* Индикатор прогресса */}
        <div className="w-full max-w-md mx-auto mb-6 mt-4 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm font-medium">Шаг {step} из 4</span>
            <span className="text-white/40 text-xs">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#F55128] to-[#FF6B3D] transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {renderStep}
        </AnimatePresence>
      </div>

      <InfoModal
        isOpen={appInstall.isModalOpen}
        onClose={appInstall.closeModal}
        onConfirm={() => appInstall.confirmInstallation(platform)}
      />
    </main>
  );
}
