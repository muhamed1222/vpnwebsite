'use client';

import React, { useState, useEffect } from 'react';
import { Plug, ChevronLeft, CloudDownload, ArrowRight, Plus, CirclePlus, Check } from 'lucide-react';
import Link from 'next/link';
import { getTelegramWebApp, getTelegramPlatform } from '@/lib/telegram';
import { InfoModal } from '@/components/blocks/InfoModal';
import { config } from '@/lib/config';
import { SUBSCRIPTION_CONFIG, APP_STORE_URLS, DEEP_LINK_PROTOCOL } from '@/lib/constants';
import { api } from '@/lib/api';

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
  */
  const handleAddSubscription = () => {
    // Используем реальную ссылку на подписку пользователя
    const userSubscriptionUrl = subscriptionUrl || `${config.payment.subscriptionBaseUrl}/api/sub/${SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID}`;
    
    // Формируем deep link для автоматического импорта в приложение
    let subUrl: string;
    
    if (config.payment.redirectUrl) {
      // Используем редирект для deep link
      subUrl = `${config.payment.redirectUrl}/?url=${DEEP_LINK_PROTOCOL}/${userSubscriptionUrl}#OutlivionVPN`;
    } else {
      // Прямой deep link (убираем http:// или https:// для протокола happ://)
      const cleanUrl = userSubscriptionUrl.replace(/^https?:\/\//, '');
      subUrl = `${DEEP_LINK_PROTOCOL}/${cleanUrl}#OutlivionVPN`;
    }
    
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

  const handleCopyLinkFallback = () => {
    // Используем реальную ссылку на подписку пользователя
    const subUrl = subscriptionUrl || `${config.payment.subscriptionBaseUrl}/api/sub/${SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID}`;
    navigator.clipboard.writeText(subUrl);
    
    const webApp = getTelegramWebApp();
    if (webApp) {
      try {
        if (typeof webApp.showAlert === 'function') {
          webApp.showAlert('Ссылка скопирована для ручного ввода!');
        }
      } catch (e) {
        // Игнорируем ошибки
      }
    }
  };

  /* 
    ШАГ 2: УСТАНОВКА ПРИЛОЖЕНИЯ
    Пользователь должен скачать клиент Hiddify из стора.
  */
  if (step === 2) {
    return (
      <main className="relative min-h-[var(--tg-viewport-height,100vh)] bg-black overflow-hidden font-sans select-none flex flex-col safe-area-padding">
        {/* Фоновые круги с индикатором прогресса 33% */}
        <div className="absolute top-0 left-0 right-0 h-[60%] flex items-center justify-center opacity-20 pointer-events-none">
          <div className="absolute w-[300px] h-[300px] border border-white/40 rounded-full" />
          <div className="absolute w-[450px] h-[450px] border border-white/30 rounded-full" />
          <div className="absolute w-[600px] h-[600px] border border-[#F55128]/40 rounded-full" />
          <div className="absolute w-[750px] h-[750px] border border-white/10 rounded-full" />
          
          {/* Индикатор прогресса (SVG Ring) */}
          <svg className="absolute w-[450px] h-[450px] -rotate-90">
            <circle
              cx="225"
              cy="225"
              r="224"
              fill="none"
              stroke="#F55128"
              strokeWidth="2"
              strokeDasharray="1408"
              strokeDashoffset="1000"
              className="opacity-60"
            />
          </svg>
        </div>

        {/* Шапка с кнопкой назад */}
        <div className="relative z-10 p-4">
          <button 
            onClick={() => setStep(1)}
            className="inline-flex p-2 bg-white/5 rounded-xl border border-white/5 active:scale-90 transition-transform"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
        </div>

        {/* Основной контент */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="relative w-40 h-40 flex items-center justify-center mb-16">
            <div className="absolute inset-0 bg-white/5 rounded-full border border-white/10" />
            <CloudDownload size={64} className="text-white relative z-10" />
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl font-medium text-white">Приложение</h1>
            <div className="space-y-2">
              <p className="text-white/80 text-base leading-relaxed max-w-[300px] mx-auto">
                Установите приложение Hiddify
              </p>
              <p className="text-white/40 text-xs leading-relaxed max-w-[260px] mx-auto">
                Это наш официальный защищенный плеер для работы VPN-протоколов
              </p>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="relative z-10 p-6 flex flex-col gap-3 pb-12">
          <button 
            onClick={handleInstallClick}
            className="w-full bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] py-5 flex items-center justify-center gap-2 text-white shadow-lg shadow-[#F55128]/20 focus:outline-none focus:ring-2 focus:ring-[#F55128]/50"
            aria-label="Установить приложение Hiddify"
            type="button"
          >
            <span className="text-lg font-medium">Установить</span>
            <CloudDownload size={24} aria-hidden="true" />
          </button>
          
          <button 
            onClick={() => setStep(3)}
            className="w-full bg-transparent hover:bg-white/5 active:scale-[0.98] transition-all rounded-[10px] py-4 flex items-center justify-center gap-2 text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Перейти к следующему шагу, если приложение уже установлено"
            type="button"
          >
            <span className="text-base font-medium">Уже установлено</span>
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        </div>

        <InfoModal 
          isOpen={isInfoModalOpen} 
          onClose={() => setIsInfoModalOpen(false)} 
          onConfirm={confirmInstallation}
        />
      </main>
    );
  }

  /* 
    ШАГ 4: ЗАВЕРШЕНИЕ
    Финальный экран подтверждения успешной настройки.
  */
  if (step === 4) {
    return (
      <main className="relative min-h-[var(--tg-viewport-height,100vh)] bg-black overflow-hidden font-sans select-none flex flex-col safe-area-padding">
        {/* Фоновые круги с индикатором прогресса 100% */}
        <div className="absolute top-0 left-0 right-0 h-[60%] flex items-center justify-center opacity-20 pointer-events-none">
          <div className="absolute w-[300px] h-[300px] border border-white/40 rounded-full" />
          <div className="absolute w-[450px] h-[450px] border border-[#F55128] rounded-full" />
          <div className="absolute w-[600px] h-[600px] border border-[#F55128]/40 rounded-full" />
          <div className="absolute w-[750px] h-[750px] border border-white/10 rounded-full" />
          
          <svg className="absolute w-[450px] h-[450px] -rotate-90">
            <circle
              cx="225"
              cy="225"
              r="224"
              fill="none"
              stroke="#F55128"
              strokeWidth="2"
              className="opacity-100"
            />
          </svg>
        </div>

        <div className="relative z-10 p-4">
          <button 
            onClick={() => setStep(3)}
            className="inline-flex p-2 bg-white/5 rounded-xl border border-white/5 active:scale-90 transition-transform"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="relative w-48 h-48 flex items-center justify-center mb-16">
            <div className="absolute inset-0 bg-[#F55128] rounded-full" />
            <Check size={80} className="text-white relative z-10" />
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl font-medium text-white tracking-tight">Готово!</h1>
            <p className="text-white/60 text-base leading-relaxed max-w-[300px] mx-auto">
              Нажмите на круглую кнопку включения VPN в приложении Hiddify
            </p>
          </div>
        </div>

        <div className="relative z-10 p-6 pb-12">
          <Link 
            href="/"
            className="w-full bg-[#121212] hover:bg-[#121212]/80 active:scale-[0.98] transition-all border border-white/10 rounded-[10px] py-5 flex items-center justify-center text-white"
          >
            <span className="text-base font-medium">Завершить настройку</span>
          </Link>
        </div>
      </main>
    );
  }

  /* 
    ШАГ 3: ДОБАВЛЕНИЕ ПОДПИСКИ
    Автоматический импорт настроек через Deep Link.
  */
  if (step === 3) {
    return (
      <main className="relative min-h-[var(--tg-viewport-height,100vh)] bg-black overflow-hidden font-sans select-none flex flex-col safe-area-padding">
        {/* Фоновые круги с индикатором прогресса 66% */}
        <div className="absolute top-0 left-0 right-0 h-[60%] flex items-center justify-center opacity-20 pointer-events-none">
          <div className="absolute w-[300px] h-[300px] border border-white/40 rounded-full" />
          <div className="absolute w-[450px] h-[450px] border border-white/30 rounded-full" />
          <div className="absolute w-[600px] h-[600px] border border-[#F55128]/40 rounded-full" />
          <div className="absolute w-[750px] h-[750px] border border-white/10 rounded-full" />
          
          <svg className="absolute w-[450px] h-[450px] -rotate-90">
            <circle
              cx="225"
              cy="225"
              r="224"
              fill="none"
              stroke="#F55128"
              strokeWidth="2"
              strokeDasharray="1408"
              strokeDashoffset="470"
              className="opacity-60 transition-all duration-500"
            />
          </svg>
        </div>

        <div className="relative z-10 p-4">
          <button 
            onClick={() => setStep(2)}
            className="inline-flex p-2 bg-white/5 rounded-xl border border-white/5 active:scale-90 transition-transform"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="relative w-40 h-40 flex items-center justify-center mb-16">
            <div className="absolute inset-0 bg-white/5 rounded-full border border-white/10" />
            <div className="relative z-10 w-24 h-24 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-white">
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  strokeDasharray="8 8" 
                  className="opacity-20"
                />
                <path 
                  d="M50 10 A40 40 0 0 1 50 90" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  strokeLinecap="round"
                  className="opacity-90"
                />
              </svg>
              <Plus size={48} className="text-white relative z-10" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl font-medium text-white">Подписка</h1>
            <p className="text-white/60 text-base leading-relaxed max-w-[300px] mx-auto">
              Нажмите «Добавить», чтобы настройки применились автоматически
            </p>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="relative z-10 p-6 flex flex-col gap-3 pb-12">
          <button 
            onClick={handleAddSubscription}
            className="w-full bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] py-5 flex items-center justify-center gap-2 text-white shadow-lg shadow-[#F55128]/20"
          >
            <span className="text-lg font-medium">Добавить</span>
            <CirclePlus size={24} />
          </button>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setStep(4)}
              className="w-full bg-transparent hover:bg-white/5 active:scale-[0.98] transition-all rounded-[10px] py-4 flex items-center justify-center gap-2 text-white/40"
            >
              <span className="text-base font-medium">Далее</span>
              <ArrowRight size={20} />
            </button>

            <button 
              onClick={handleCopyLinkFallback}
              className="text-white/20 text-sm underline underline-offset-4 hover:text-white/40 transition-colors"
            >
              Не работает кнопка? Скопировать ссылку вручную
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* 
    ШАГ 1: ПРИВЕТСТВИЕ И ВЫБОР УСТРОЙСТВА
    Начальный экран онбординга.
  */
  return (
    <main className="relative min-h-[var(--tg-viewport-height,100vh)] bg-black overflow-hidden font-sans select-none flex flex-col safe-area-padding">
      <div className="absolute top-0 left-0 right-0 h-[60%] flex items-center justify-center opacity-20 pointer-events-none">
        <div className="absolute w-[300px] h-[300px] border border-white/40 rounded-full" />
        <div className="absolute w-[450px] h-[450px] border border-white/30 rounded-full" />
        <div className="absolute w-[600px] h-[600px] border border-white/20 rounded-full" />
        <div className="absolute w-[750px] h-[750px] border border-white/10 rounded-full" />
      </div>

      <div className="relative z-10 p-4">
        <Link href="/" className="inline-flex p-2 bg-white/5 rounded-xl border border-white/5 active:scale-90 transition-transform">
          <ChevronLeft size={24} className="text-white" />
        </Link>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative w-32 h-32 flex items-center justify-center mb-12">
          <div className="absolute inset-0 bg-[#F55128]/20 rounded-full blur-2xl" />
          <div className="relative bg-white/5 p-8 rounded-[40px] border border-white/10 flex items-center justify-center rotate-45">
            <Plug size={48} className="text-white" />
          </div>
        </div>

        <div className="text-center space-y-4 mb-12">
          <h1 className="text-2xl font-medium text-white leading-tight">
            Настройка на {platform}
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-[280px] mx-auto">
            Настройка VPN происходит в 3 шага и занимает пару минут
          </p>
        </div>
      </div>

      <div className="relative z-10 p-6 space-y-3 pb-12">
        <button 
          onClick={() => setStep(2)}
          className="w-full bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] py-5 text-base font-medium text-white shadow-lg shadow-[#F55128]/10"
        >
          Начать настройку на этом устройстве
        </button>
        
        <button 
          onClick={handleOtherDeviceClick}
          className="w-full bg-[#121212] hover:bg-[#121212]/80 active:scale-[0.98] transition-all border border-white/5 rounded-[10px] py-5 text-base font-medium text-white"
        >
          Установить на другом устройстве
        </button>
      </div>
    </main>
  );
}
