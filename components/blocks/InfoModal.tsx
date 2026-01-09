'use client';

import React from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { VPN_APP_NAME } from '@/lib/constants';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Компонент InfoModal
 * Отображает важную информацию перед установкой приложения.
 * Переведен на использование универсального BottomSheet.
 */
export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Важная информация">
      <div className="flex flex-col">
        {/* Информационный текст */}
        <div 
          className="mb-8 text-white/80 text-lg leading-relaxed css-dialog_content-item"
          style={{ '--index': 1 } as React.CSSProperties}
        >
          После установки приложения <span className="text-white font-medium">{VPN_APP_NAME}</span>, обязательно вернитесь на этот экран и нажмите <span className="text-white font-medium">«Далее»</span>, чтобы добавить конфигурацию. 
          <br /><br />
          Без этого шага VPN работать не будет.
        </div>

        {/* Кнопка подтверждения */}
        <div 
          className="css-dialog_content-item"
          style={{ '--index': 2 } as React.CSSProperties}
        >
          <button 
            onClick={onConfirm}
            className="w-full bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] py-[14px] text-base font-medium text-white shadow-lg shadow-[#F55128]/20"
          >
            Хорошо, к установке
          </button>
        </div>

        {/* Декоративная подпись */}
        <p 
          className="mt-4 text-center text-white/20 text-sm css-dialog_content-item"
          style={{ '--index': 3 } as React.CSSProperties}
        >
          Нажмите в любом месте, чтобы закрыть
        </p>
      </div>
    </BottomSheet>
  );
};
