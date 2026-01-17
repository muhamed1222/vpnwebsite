'use client';

import React, { lazy, Suspense } from 'react';
import { 
  CreditCardIcon as CreditCard, 
  ListBulletIcon as List, 
  UsersIcon as Users, 
  ChatBubbleLeftRightIcon as MessageSquare, 
  DocumentTextIcon as FileText, 
  DocumentDuplicateIcon as Copy, 
  CheckIcon as Check,
  ComputerDesktopIcon as Monitor,
  ChevronLeftIcon as ChevronLeft
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useUserStore } from '@/store/user.store';
import { VpnConnectionCard } from '@/components/blocks/VpnConnectionCard';
import { getTelegramWebApp } from '@/lib/telegram';
import { config } from '@/lib/config';
import { handleComponentError } from '@/lib/utils/errorHandler';
import { copyToClipboard } from '@/lib/utils/clipboard';

// Lazy loading для модалок - загружаются только когда открыты
const TransactionsModal = lazy(() => 
  import('@/components/blocks/TransactionsModal').then(m => ({ default: m.TransactionsModal }))
);
const ReferralModal = lazy(() => 
  import('@/components/blocks/ReferralModal').then(m => ({ default: m.ReferralModal }))
);
const TermsModal = lazy(() => 
  import('@/components/blocks/TermsModal').then(m => ({ default: m.TermsModal }))
);
const PaymentModal = lazy(() => 
  import('@/components/blocks/PaymentModal').then(m => ({ default: m.PaymentModal }))
);

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
    
    const copied = await copyToClipboard(idToCopy);
    
    if (copied) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      const webApp = getTelegramWebApp();
      if (webApp) {
        webApp.showAlert(`ID ${idToCopy} скопирован в буфер обмена`);
      }
    } else {
      handleComponentError(new Error('Clipboard API not available'), 'profile', 'copyId');
      
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
      handleComponentError(error, 'profile', 'openInstruction');
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
      icon: <CreditCard className="w-5 h-5 text-[#F55128]" />, 
      label: 'Оплата', 
      bg: 'bg-[#F55128]/10', 
      onClick: () => setIsPaymentOpen(true)
    },
    { 
      icon: <List className="w-5 h-5 text-[#F55128]" />, 
      label: 'Мои транзакции', 
      bg: 'bg-[#F55128]/10',
      onClick: () => setIsTransactionsOpen(true)
    },
    { 
      icon: <Users className="w-5 h-5 text-[#F55128]" />, 
      label: 'Реферальная программа', 
      bg: 'bg-[#F55128]/10',
      onClick: () => setIsReferralOpen(true)
    },
    { 
      icon: <MessageSquare className="w-5 h-5 text-[#F55128]" />, 
      label: 'Связаться с поддержкой', 
      bg: 'bg-[#F55128]/10',
      onClick: handleSupportClick
    },
    { 
      icon: <FileText className="w-5 h-5 text-[#F55128]" />, 
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
          <ChevronLeft className="w-6 h-6" />
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
            <Check className="w-3.5 h-3.5 text-[#F55128]" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
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
          <Monitor className="w-6 h-6 text-[#F55128]" aria-hidden="true" />
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

      {/* Lazy loaded modals with Suspense */}
      {isTransactionsOpen && (
        <Suspense fallback={null}>
          <TransactionsModal 
            isOpen={isTransactionsOpen} 
            onClose={() => setIsTransactionsOpen(false)} 
          />
        </Suspense>
      )}

      {isReferralOpen && (
        <Suspense fallback={null}>
          <ReferralModal 
            isOpen={isReferralOpen} 
            onClose={() => setIsReferralOpen(false)} 
          />
        </Suspense>
      )}

      {isTermsOpen && (
        <Suspense fallback={null}>
          <TermsModal 
            isOpen={isTermsOpen} 
            onClose={() => setIsTermsOpen(false)} 
          />
        </Suspense>
      )}

      {isPaymentOpen && (
        <Suspense fallback={null}>
          <PaymentModal
            isOpen={isPaymentOpen}
            onClose={() => setIsPaymentOpen(false)}
          />
        </Suspense>
      )}
    </main>
  );
}
