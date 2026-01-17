'use client';

import React, { useState } from 'react';
import { ChevronDownIcon as ChevronDown, ChevronUpIcon as ChevronUp, ArrowTopRightOnSquareIcon as ExternalLink, ChatBubbleLeftRightIcon as MessageSquare } from '@heroicons/react/24/outline';
import { config } from '@/lib/config';
import { BottomSheet } from '../ui/BottomSheet';
import { useTelegramLink } from '@/hooks/useTelegramAlert';
import { logError } from '@/lib/utils/logging';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getFAQData = (handleInstructionClick: () => void): FAQItem[] => [
  {
    question: 'Как подключить VPN на дополнительные устройства',
    answer: (
      <div className="space-y-4">
        <p className="text-white/70 leading-relaxed">
          Чтобы подключить дополнительное устройство или друга к своей подписке — 
          вставьте ссылку на подписку из вашего профиля на другом устройстве. 
          Воспользуйтесь инструкцией, чтобы сделать это ⤵️
        </p>
        <button 
          onClick={handleInstructionClick}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-[10px] px-[14px] py-[14px] flex items-center justify-center gap-2 transition-colors"
        >
          <span className="font-medium text-white/90">Подробная инструкция</span>
          <ExternalLink className="w-[18px] h-[18px] text-white/40" />
        </button>
      </div>
    ),
  },
  {
    question: 'Перестал подключаться VPN на iOS',
    answer: (
      <p className="text-white/70 leading-relaxed">
        Такое случается очень редко, попробуйте перезагрузить телефон, если проблема не решилась — напишите в поддержку, мы обязательно поможем.
      </p>
    ),
  },
];

/**
 * Компонент SupportModal
 * Использует BottomSheet для отображения FAQ и кнопки связи с поддержкой.
 */
export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const openTelegramLink = useTelegramLink(true); // Для Telegram ссылок
  const openLink = useTelegramLink(); // Для обычных ссылок

  const handleSupportClick = () => {
    const supportUrl = config.support.telegramUrl;
    openTelegramLink(supportUrl);
  };

  const handleInstructionClick = () => {
    const instructionUrl = config.support.helpBaseUrl;
    
    try {
      openLink(instructionUrl);
    } catch (error) {
      logError('Failed to open instruction link', error, {
        page: 'support',
        action: 'openInstruction',
        url: instructionUrl
      });
      // Fallback уже встроен в useTelegramLink
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Поддержка">
      <div className="flex flex-col space-y-4">
        {/* FAQ Section */}
        <div className="space-y-3">
          {getFAQData(handleInstructionClick).map((item, index) => {
            const isItemOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="bg-transparent rounded-[10px] border border-white/10 overflow-hidden transition-all css-dialog_content-item"
                style={{ '--index': index + 1 } as React.CSSProperties}
              >
                <button 
                  onClick={() => setOpenIndex(isItemOpen ? null : index)}
                  className="w-full px-[14px] py-[14px] flex items-start justify-between text-left gap-4 hover:bg-white/5 transition-all"
                >
                  <span className="text-base font-medium text-white/90 leading-snug">
                    {item.question}
                  </span>
                  {isItemOpen ? (
                    <ChevronUp className="w-6 h-6 text-white/20 flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-white/20 flex-shrink-0 mt-1" />
                  )}
                </button>
                
                {isItemOpen && (
                  <div className="px-[14px] pb-[14px] animate-in slide-in-from-top-2 duration-200">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Support Button */}
        <div 
          className="pt-4 css-dialog_content-item"
          style={{ '--index': getFAQData(handleInstructionClick).length + 1 } as React.CSSProperties}
        >
          <button 
            onClick={handleSupportClick}
            className="w-full bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] px-[14px] py-[14px] flex items-center justify-center gap-3 text-white shadow-lg shadow-[#F55128]/10"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-lg font-medium">Написать в поддержку</span>
          </button>
        </div>

        <p 
          className="text-white/30 text-center text-xs css-dialog_content-item"
          style={{ '--index': getFAQData(handleInstructionClick).length + 2 } as React.CSSProperties}
        >
          Мы отвечаем в течение 15 минут
        </p>
      </div>
    </BottomSheet>
  );
};
