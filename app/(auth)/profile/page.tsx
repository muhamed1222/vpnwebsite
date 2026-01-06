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

export default function ProfilePage() {
  const { user } = useUserStore();
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://ultm.app/QEbFPbbh');
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 font-sans select-none">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-8 pt-2">
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
      <div className="text-center mb-8">
        <h1 className="text-2xl font-medium mb-1">
          {user?.firstName || 'Пользователь'}
        </h1>
        <button
          onClick={handleCopyId}
          className="flex items-center justify-center gap-2 text-white/40 active:opacity-60 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg px-2 py-1"
          aria-label={`Скопировать ID пользователя: ${user?.id || '12345678'}`}
          aria-live="polite"
          type="button"
        >
          <span className="text-lg">id: {user?.id || '12345678'}</span>
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
        {[
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
        ].map((item, index) => {
          const content = (
            <>
              <div className={`${item.bg} p-2 rounded-lg`}>
                {item.icon}
              </div>
              <span className="text-lg font-medium text-white/90">{item.label}</span>
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

      {/* Subscription Link Card */}
      <div className="bg-[#121212] rounded-[16px] p-6 border border-white/5 mb-6">
        <h2 className="text-lg font-medium mb-4 text-white/90">
          Ссылка на подписку для ручного ввода:
        </h2>
        <button
          onClick={handleCopyLink}
          className="w-full bg-black/40 rounded-[10px] p-4 flex items-center justify-between border border-white/5 active:bg-black/60 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Скопировать ссылку на подписку"
          type="button"
        >
          <code className="text-[#F55128] text-lg">https://ultm.app/QEbFPbbh</code>
          <Copy size={20} className="text-white/40" aria-hidden="true" />
        </button>
      </div>

      {/* Bottom Action Button */}
      <button 
        className="w-full bg-[#121212] hover:bg-[#121212]/80 active:scale-[0.98] transition-all border border-white/5 rounded-[10px] p-5 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-white/20"
        aria-label="Открыть инструкцию по настройке VPN для всех платформ"
        type="button"
      >
        <Monitor size={24} className="text-[#F55128]" aria-hidden="true" />
        <span className="text-lg font-medium">Инструкция для всех платформ</span>
      </button>
    </main>
  );
}

