'use client';

import React from 'react';
import { 
  CreditCard, 
  List, 
  Users, 
  MessageSquare, 
  FileText, 
  Copy, 
  Check,
  Monitor,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '@/store/user.store';
import { TransactionsModal } from '@/components/blocks/TransactionsModal';
import { ReferralModal } from '@/components/blocks/ReferralModal';
import { TermsModal } from '@/components/blocks/TermsModal';
import { PaymentModal } from '@/components/blocks/PaymentModal';
import { VpnConnectionCard } from '@/components/blocks/VpnConnectionCard';
import { getTelegramWebApp } from '@/lib/telegram';
import { config } from '@/lib/config';
import { Maximize } from 'lucide-react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

export default function ProfilePage() {
  const { user } = useUserStore();
  const { requestFullscreen } = useTelegramWebApp();
  const [isTransactionsOpen, setIsTransactionsOpen] = React.useState(false);
  const [isReferralOpen, setIsReferralOpen] = React.useState(false);
  const [isTermsOpen, setIsTermsOpen] = React.useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  /* 
    Обработчик кнопки "Связаться с поддержкой".
    Использует метод Telegram WebApp SDK для открытия чата внутри мессенджера.
    Если WebApp недоступен, открывает ссылку в обычном браузере.
  */
  const handleSupportClick = () => {
    const webApp = getTelegramWebApp();
    const supportUrl = config.support.telegramUrl;
    
    if (webApp) {
      webApp.openTelegramLink(supportUrl);
    } else {
      window.open(supportUrl, '_blank');
    }
  };

  const handleCopyId = () => {
    const idToCopy = user?.id?.toString() || '12345678';
    navigator.clipboard.writeText(idToCopy);
    
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);

    // Показываем уведомление в Telegram WebApp
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.showAlert(`ID ${idToCopy} скопирован в буфер обмена`);
    }
  };

  interface MenuItem {
    icon: React.ReactNode;
    label: string;
    bg: string;
    onClick?: () => void;
    href?: string;
    show?: boolean;
  }

  const tg = getTelegramWebApp();
  const isFullscreenSupported = !!tg?.requestFullscreen;

  return (
    <main className="min-h-[var(--tg-viewport-height,100vh)] bg-black text-white p-4 pt-[calc(100px+env(safe-area-inset-top))] pb-[calc(40px+env(safe-area-inset-bottom))] px-[calc(1rem+env(safe-area-inset-left))] font-sans select-none">
      {/* Header with Back Button */}
      <div className="sticky top-[calc(100px+env(safe-area-inset-top))] z-50 flex items-center justify-between w-fit">
        <Link href="/" className="p-2 bg-white/5 rounded-xl border border-white/5 active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </Link>
      </div>

      {/* 
        Блок информации о пользователе 
        Отображает имя из Telegram и уникальный ID аккаунта.
        Клик по ID копирует его в буфер обмена для обращения в поддержку.
        При копировании иконка временно меняется на галочку.
      */}
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-xl font-medium mb-1">
          {user?.firstName || 'Пользователь'}
        </h1>
        <button
          onClick={handleCopyId}
          className="flex items-center justify-center gap-2 text-white/40 active:opacity-60 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg px-2 py-1"
          aria-label={`Скопировать ID пользователя: ${user?.id || '12345678'}`}
          aria-live="polite"
          type="button"
        >
          <span className="text-base">id: {user?.id || '12345678'}</span>
          {isCopied ? (
            <Check size={16} className="text-[#F55128]" aria-hidden="true" />
          ) : (
            <Copy size={16} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* 
        Список меню 
        Набор основных действий пользователя в профиле.
      */}
      <nav className="bg-[#121212] rounded-[16px] overflow-hidden border border-white/5 mb-6" aria-label="Меню профиля">
        {(
          [
            { 
              /* 
                Пункт "Оплата" 
                Назначение: Управление способами оплаты и автопродлением.
              */
              icon: <CreditCard className="text-[#F55128]" size={20} />, 
              label: 'Оплата', 
              bg: 'bg-[#F55128]/10', 
              onClick: () => setIsPaymentOpen(true)
            },
            { 
              /* 
                Пункт "Мои транзакции" 
                Назначение: Просмотр истории платежей.
              */
              icon: <List className="text-[#F55128]" size={20} />, 
              label: 'Мои транзакции', 
              bg: 'bg-[#F55128]/10',
              onClick: () => setIsTransactionsOpen(true)
            },
            { 
              /* 
                Пункт "Реферальная программа" 
                Назначение: Просмотр статистики приглашенных друзей и бонусов.
              */
              icon: <Users className="text-[#A78BFA]" size={20} />, 
              label: 'Реферальная программа', 
              bg: 'bg-[#A78BFA]/10',
              onClick: () => setIsReferralOpen(true)
            },
            { 
              /* 
                Пункт "Связаться с поддержкой" 
                Назначение: Прямой переход в чат поддержки.
              */
              icon: <MessageSquare className="text-[#D9A14E]" size={20} />, 
              label: 'Связаться с поддержкой', 
              bg: 'bg-[#D9A14E]/10',
              onClick: handleSupportClick
            },
            { 
              /* 
                Пункт "Пользовательское соглашение" 
                Назначение: Юридическая информация и правила сервиса.
              */
              icon: <FileText className="text-[#F472B6]" size={20} />, 
              label: 'Пользовательское соглашение', 
              bg: 'bg-[#F472B6]/10',
              onClick: () => setIsTermsOpen(true)
            },
            {
              /* 
                Пункт "На весь экран" 
                Назначение: Переход в полноэкранный режим (для поддерживаемых клиентов).
              */
              icon: <Maximize className="text-[#10B981]" size={20} />, 
              label: 'На весь экран', 
              bg: 'bg-[#10B981]/10',
              onClick: requestFullscreen,
              show: isFullscreenSupported
            },
          ] as MenuItem[]
        ).filter(item => item.show !== false).map((item, index) => {
          const content = (
            <>
              <div className={`${item.bg} p-2 rounded-lg`}>
                {item.icon}
              </div>
              <span className="text-base font-medium text-white/90">{item.label}</span>
            </>
          );
          
          const className = `w-full flex items-center gap-4 p-5 hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 text-left`;

          if (item.href) {
            return (
              <Link key={index} href={item.href} className={className}>
                {content}
              </Link>
            );
          }

          return (
            <button 
              key={index} 
              className={`${className} focus:outline-none focus:ring-2 focus:ring-white/20`}
              onClick={item.onClick}
              aria-label={item.label}
              type="button"
            >
              {content}
            </button>
          );
        })}
      </nav>

      <TransactionsModal 
        isOpen={isTransactionsOpen} 
        onClose={() => setIsTransactionsOpen(false)} 
      />

      <ReferralModal 
        isOpen={isReferralOpen} 
        onClose={() => setIsReferralOpen(false)} 
      />

      <TermsModal 
        isOpen={isTermsOpen} 
        onClose={() => setIsTermsOpen(false)} 
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />

      {/* VPN Connection Card */}
      <div className="mb-6">
        <VpnConnectionCard />
      </div>

      {/* Bottom Action Button */}
      <button 
        className="w-full bg-[#121212] hover:bg-[#121212]/80 active:scale-[0.98] transition-all border border-white/5 rounded-[10px] p-5 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-white/20"
        aria-label="Открыть инструкцию по настройке VPN для всех платформ"
        type="button"
      >
        <Monitor size={24} className="text-[#F55128]" aria-hidden="true" />
        <span className="text-base font-medium">Инструкция для всех платформ</span>
      </button>
    </main>
  );
}

