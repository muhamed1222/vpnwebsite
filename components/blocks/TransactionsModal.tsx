'use client';

import React from 'react';
import { FolderOpen } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';

interface TransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Компонент TransactionsModal
 * Использует универсальный BottomSheet для отображения истории транзакций.
 */
export const TransactionsModal: React.FC<TransactionsModalProps> = ({ isOpen, onClose }) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Мои транзакции">
      <div className="flex flex-col">
        {/* 
          Пустое состояние (Empty State) 
          Анимируется с задержкой через --index
        */}
        <div 
          className="flex flex-col items-center justify-center py-16 text-center css-dialog_content-item"
          style={{ '--index': 1 } as React.CSSProperties}
        >
          <div className="bg-white/5 p-6 rounded-[28px] mb-6 border border-white/5 shadow-inner">
            <FolderOpen size={48} className="text-white/20" />
          </div>
          
          <div className="space-y-2">
            <p className="text-white text-xl font-medium">Транзакций пока нет</p>
            <p className="text-white/40 text-base max-w-[240px] leading-relaxed">
              Здесь будет отображаться история ваших покупок и продлений
            </p>
          </div>
        </div>

        {/* Декоративный элемент для заполнения пространства, если транзакций много */}
        <div 
          className="mt-4 p-4 rounded-[16px] bg-white/[0.02] border border-white/5 css-dialog_content-item"
          style={{ '--index': 2 } as React.CSSProperties}
        >
          <p className="text-white/30 text-xs text-center uppercase tracking-widest font-medium">
            История обновляется мгновенно
          </p>
        </div>
      </div>
    </BottomSheet>
  );
};
