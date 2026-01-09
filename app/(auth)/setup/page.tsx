'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import { getTelegramWebApp, getTelegramPlatform, triggerHaptic } from '@/lib/telegram';
import { InfoModal } from '@/components/blocks/InfoModal';
import { config } from '@/lib/config';
import { SUBSCRIPTION_CONFIG, APP_STORE_URLS } from '@/lib/constants';
import { api } from '@/lib/api';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { logError } from '@/lib/utils/logging';
import { analytics } from '@/lib/analytics';
import { handleExternalLink, validateSubscriptionUrl, handleDeepLinkError, checkAppInstalled } from '@/lib/utils/setupHelpers';

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
 * 2. Используется `getTelegramPlatform` для адаптации инструкций под ОС пользователя.
 * 3. На каждом шаге визуализируется прогресс с помощью SVG-колец.
 */
export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string>('Devices');
  const [isLoadingSubscriptionUrl, setIsLoadingSubscriptionUrl] = useState(true);
  const [isAddingSubscription, setIsAddingSubscription] = useState(false);
  const [isCheckingApp, setIsCheckingApp] = useState(false);

  // Detect platform after mount to avoid hydration mismatch
  // Note: This setState in useEffect is intentional to avoid SSR/CSR mismatch
  useEffect(() => {
    setPlatform(getTelegramPlatform());
  }, []);

  // Загружаем реальную ссылку на подписку пользователя
  useEffect(() => {
    const loadSubscriptionUrl = async () => {
      try {
        const configData = await api.getUserConfig();
        if (configData.ok && configData.config) {
          // Валидация URL перед использованием
          try {
            new URL(configData.config);
            setSubscriptionUrl(configData.config);
          } catch (urlError) {
            logError('Invalid subscription URL format', urlError, {
              page: 'setup',
              action: 'validateSubscriptionUrl',
              url: configData.config
            });
            // Используем дефолтную ссылку при невалидном URL
            setSubscriptionUrl(`${config.payment.subscriptionBaseUrl}/api/sub/${SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID}`);
          }
        } else {
          // Если конфиг не получен, используем дефолтную ссылку
          setSubscriptionUrl(`${config.payment.subscriptionBaseUrl}/api/sub/${SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID}`);
        }
      } catch (error) {
        logError('Failed to load subscription URL', error, {
          page: 'setup',
          action: 'loadSubscriptionUrl'
        });
        analytics.event('setup_error', {
          step: 1,
          action: 'loadSubscriptionUrl',
          error: error instanceof Error ? error.message : String(error)
        });
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
    analytics.buttonClick('setup_other_device', { step: 1 });
    handleExternalLink(config.support.helpBaseUrl);
  };

  /* 
    Шаг 2: Открытие информационного модального окна перед установкой приложения.
  */
  const handleInstallClick = () => {
    analytics.buttonClick('setup_install', { step: 2 });
    
    try {
      setIsInfoModalOpen(true);
    } catch (error) {
      logError('Failed to open install modal', error, {
        page: 'setup',
        action: 'handleInstallClick'
      });
      analytics.event('setup_error', {
        step: 2,
        action: 'handleInstallClick',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /* 
    Проверка установки приложения через deep link
  */
  const handleCheckAppInstalled = async () => {
    setIsCheckingApp(true);
    analytics.buttonClick('setup_check_app_installed', { step: 2 });
    
    try {
      // Формируем test deep link для проверки
      const testDeepLink = platform === 'iOS' 
        ? 'v2raytun://test' 
        : 'happ://test';
      
      const isInstalled = await checkAppInstalled(testDeepLink);
      
      if (isInstalled) {
        analytics.event('setup_app_detected', { step: 2, platform });
        goToStep(3);
      } else {
        // Показываем предупреждение, но позволяем продолжить
        const webApp = getTelegramWebApp();
        if (webApp && webApp.showAlert) {
          webApp.showAlert('Приложение не обнаружено. Убедитесь, что вы установили v2RayTun, или нажмите "Уже установлено" для продолжения.');
        }
      }
    } catch (error) {
      logError('Failed to check app installation', error, {
        page: 'setup',
        action: 'handleCheckAppInstalled',
        platform
      });
      analytics.event('setup_error', {
        step: 2,
        action: 'handleCheckAppInstalled',
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsCheckingApp(false);
    }
  };

  /* 
    Шаг 3: Добавление подписки через Deep Link.
    Используется протокол happ://, который поддерживается приложением Hiddify
    для автоматического импорта конфигурации.
    Для iOS используется протокол v2raytun://import/.
  */
  const handleAddSubscription = async () => {
    analytics.buttonClick('setup_add_subscription', { step: 3 });
    
    if (isAddingSubscription) return; // Предотвращаем множественные клики
    
    setIsAddingSubscription(true);
    
    try {
      // Используем реальную ссылку на подписку пользователя
      const userSubscriptionUrl = subscriptionUrl || `${config.payment.subscriptionBaseUrl}/api/sub/${SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID}`;

      // Валидация URL перед использованием
      if (!validateSubscriptionUrl(userSubscriptionUrl)) {
        logError('Invalid subscription URL in handleAddSubscription', undefined, {
          page: 'setup',
          action: 'handleAddSubscription',
          url: userSubscriptionUrl
        });
        analytics.event('setup_error', {
          step: 3,
          action: 'handleAddSubscription',
          error: 'Invalid subscription URL'
        });
        // Показываем сообщение пользователю
        const webApp = getTelegramWebApp();
        if (webApp && webApp.showAlert) {
          webApp.showAlert('Ошибка: неверный формат ссылки на подписку. Попробуйте обновить страницу.');
        }
        return;
      }

    // Платформо-зависимый протокол (для iOS используем v2raytun)
    const protocol = platform === 'iOS' ? config.deepLink.iosProtocol : config.deepLink.defaultProtocol;
    const vpnName = config.deepLink.vpnName;

    // Формируем прямую ссылку (deep link) без редиректа
    const subUrl = `${protocol}${userSubscriptionUrl}#${vpnName}`;

    try {
      handleExternalLink(subUrl);
      analytics.event('setup_subscription_added', { step: 3, platform });
      
      // Запускаем проверку успешности добавления подписки через 2 секунды
      setTimeout(() => {
        handleCheckSubscriptionAdded();
      }, 2000);
    } catch (error) {
      await handleDeepLinkError(subUrl, error, 'handleAddSubscription');
    } finally {
      setIsAddingSubscription(false);
    }
  };

  /* 
    Проверка успешности добавления подписки
  */
  const handleCheckSubscriptionAdded = async () => {
    setIsCheckingSubscription(true);
    analytics.event('setup_check_subscription', { step: 3 });
    
    try {
      // Проверяем конфигурацию пользователя через API
      const configData = await api.getUserConfig();
      
      if (configData.ok && configData.config) {
        // Если конфигурация получена, считаем что подписка добавлена успешно
        analytics.event('setup_subscription_confirmed', { step: 3 });
        const webApp = getTelegramWebApp();
        if (webApp && webApp.showAlert) {
          webApp.showAlert('Подписка успешно добавлена! Переходим к следующему шагу.');
        }
        // Автоматически переходим к следующему шагу через 1 секунду
        setTimeout(() => {
          goToStep(4);
        }, 1000);
      } else {
        // Если конфигурация не получена, показываем предупреждение
        const webApp = getTelegramWebApp();
        if (webApp && webApp.showAlert) {
          webApp.showAlert('Не удалось подтвердить добавление подписки. Если вы добавили подписку вручную, нажмите "Далее" для продолжения.');
        }
      }
    } catch (error) {
      logError('Failed to check subscription addition', error, {
        page: 'setup',
        action: 'handleCheckSubscriptionAdded'
      });
      analytics.event('setup_error', {
        step: 3,
        action: 'handleCheckSubscriptionAdded',
        error: error instanceof Error ? error.message : String(error)
      });
      // В случае ошибки позволяем пользователю продолжить вручную
    } finally {
      setIsCheckingSubscription(false);
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

    try {
      handleExternalLink(url);
      analytics.event('setup_app_store_opened', { step: 2, platform, url });
    } catch (error) {
      handleDeepLinkError(url, error, 'confirmInstallation');
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
    if (newStep < 1 || newStep > 4) return;
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
    triggerHaptic('light');
    
    // Отслеживаем переходы между шагами
    analytics.event('setup_step_view', {
      step: newStep,
      previousStep: step,
      direction: newStep > step ? 'forward' : 'backward'
    });
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
            onCheckInstalled={handleCheckAppInstalled}
            isChecking={isCheckingApp}
          />
        );
      case 3:
        return (
          <Step3Subscription
            key="step3"
            direction={direction}
            variants={stepVariants}
            step={3}
            subscriptionUrl={subscriptionUrl}
            isAdding={isAddingSubscription}
            isChecking={isCheckingSubscription}
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
            onRestart={() => goToStep(1)}
            onCheckVpn={handleCheckVpnStatus}
            isChecking={isCheckingVpn}
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
        {/* Индикатор прогресса */}
        <div className="w-full max-w-md mx-auto mb-6 mt-4 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm font-medium">Шаг {step} из 4</span>
            <span className="text-white/40 text-xs">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#F55128] to-[#FF6B3D] transition-all duration-300 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

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
