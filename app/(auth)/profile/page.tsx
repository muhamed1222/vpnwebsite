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
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { logError } from '@/lib/utils/logging';

export default function ProfilePage() {
  const { user } = useUserStore();
  const [isTransactionsOpen, setIsTransactionsOpen] = React.useState(false);
  const [isReferralOpen, setIsReferralOpen] = React.useState(false);
  const [isTermsOpen, setIsTermsOpen] = React.useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  const handleSupportClick = React.useCallback(() => {
    const webApp = getTelegramWebApp();
    const supportUrl = config.support.telegramUrl;
    
    if (webApp) {
      webApp.openTelegramLink(supportUrl);
    } else {
      window.open(supportUrl, '_blank');
    }
  }, []);

  const handleCopyId = React.useCallback(async () => {
    const idToCopy = user?.id?.toString() || '12345678';
    
    try {
      await navigator.clipboard.writeText(idToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      const webApp = getTelegramWebApp();
      if (webApp) {
        webApp.showAlert(`ID ${idToCopy} скопирован в буфер обмена`);
      }
    } catch (error) {
      logError('Failed to copy ID to clipboard', error, {
        page: 'profile',
        action: 'copyId',
        userId: user?.id
      });
      
      // Fallback: показываем сообщение об ошибке
      const webApp = getTelegramWebApp();
      if (webApp) {
        webApp.showAlert('Не удалось скопировать ID. Попробуйте еще раз.');
      } else {
        alert('Не удалось скопировать ID. Попробуйте еще раз.');
      }
    }
  }, [user?.id]);

  const handleInstructionClick = React.useCallback(() => {
    const webApp = getTelegramWebApp();
    const instructionUrl = config.support.helpBaseUrl;
    
    try {
      if (webApp) {
        webApp.openLink(instructionUrl);
      } else {
        window.open(instructionUrl, '_blank');
      }
    } catch (error) {
      logError('Failed to open instruction link', error, {
        page: 'profile',
        action: 'openInstruction',
        url: instructionUrl
      });
      // Fallback: попытка открыть через window.open
      window.open(instructionUrl, '_blank');
    }
  }, []);

  interface MenuItem {
    icon: React.ReactNode;
    label: string;
    bg: string;
    onClick?: () => void;
    href?: string;
    show?: boolean;
  }

  const menuItems: MenuItem[] = React.useMemo(() => [
    { 
      icon: <CreditCard className="text-[#F55128]" size={20} />, 
      label: 'Оплата', 
      bg: 'bg-[#F55128]/10', 
      onClick: () => setIsPaymentOpen(true)
    },
    { 
      icon: <List className="text-[#F55128]" size={20} />, 
      label: 'Мои транзакции', 
      bg: 'bg-[#F55128]/10',
      onClick: () => setIsTransactionsOpen(true)
    },
    { 
      icon: <Users className="text-[#F55128]" size={20} />, 
      label: 'Реферальная программа', 
      bg: 'bg-[#F55128]/10',
      onClick: () => setIsReferralOpen(true)
    },
    { 
      icon: <MessageSquare className="text-[#F55128]" size={20} />, 
      label: 'Связаться с поддержкой', 
      bg: 'bg-[#F55128]/10',
      onClick: handleSupportClick
    },
    { 
      icon: <FileText className="text-[#F55128]" size={20} />, 
      label: 'Пользовательское соглашение', 
      bg: 'bg-[#F55128]/10',
      onClick: () => setIsTermsOpen(true)
    },
  ], [handleSupportClick]);

  return (
    <main className="w-full bg-black text-white pt-[calc(100px+env(safe-area-inset-top))] px-[calc(1rem+env(safe-area-inset-left))] font-sans select-none flex flex-col">
      {/* Header with Back Button */}
      <div className="sticky top-[calc(100px+env(safe-area-inset-top))] z-50 flex items-center justify-between w-fit mb-4">
        <Link href="/" className="p-2 bg-white/10 rounded-xl border border-white/10 active:scale-95 transition-all hover:bg-white/15">
          <ChevronLeft size={24} />
        </Link>
      </div>

      {/* 
        Блок информации о пользователе 
      */}
      <div className="flex flex-col items-center text-center mb-10">
        <h1 className="text-2xl font-semibold mb-2">
          {user?.firstName || 'Пользователь'}
        </h1>
        <button
          onClick={handleCopyId}
          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F55128]/40 rounded-full px-4 py-1.5 border border-white/5"
          aria-label={`Скопировать ID пользователя: ${user?.id || 'ID не указан'}`}
          type="button"
        >
          <span className="text-sm font-medium tracking-wide">ID: {user?.id || '********'}</span>
          {isCopied ? (
            <Check size={14} className="text-[#F55128]" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>

      {/* VPN Connection Card */}
      <div className="mb-6">
        <VpnConnectionCard />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <button 
          onClick={handleInstructionClick}
          className="w-full bg-[#121212] hover:bg-[#1a1a1a] active:scale-[0.98] transition-all border border-white/5 rounded-2xl p-5 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-white/10"
          aria-label="Открыть инструкцию по настройке VPN для всех платформ"
          type="button"
        >
          <Monitor size={24} className="text-[#F55128]" aria-hidden="true" />
          <span className="text-base font-medium">Инструкция для всех платформ</span>
        </button>
      </div>

      {/* 
        Список меню 
      */}
      <nav className="bg-[#0A0A0A] rounded-[24px] overflow-hidden border border-white/5" aria-label="Меню профиля">
        {menuItems.filter(item => item.show !== false).map((item, index) => {
          const content = (
            <>
              <div className={`${item.bg} p-2.5 rounded-xl`}>
                {item.icon}
              </div>
              <span className="text-[17px] font-medium text-white/90">{item.label}</span>
            </>
          );
          
          const className = `w-full flex items-center gap-4 p-4 hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 text-left`;

          return (
            <button 
              key={index} 
              className={className}
              onClick={item.onClick}
              aria-label={item.label}
              type="button"
            >
              {content}
            </button>
          );
        })}
      </nav>

      {/* Bottom Spacer - 100px + safe area to ensure scroll room */}
      <div className="min-h-[calc(100px+env(safe-area-inset-bottom))] w-full" aria-hidden="true" />

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
    </main>
  );
}
