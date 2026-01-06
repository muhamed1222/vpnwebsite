'use client';

import React from 'react';
import { Plus, Check } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';

interface PaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMethod: string;
  onSelect: (id: string) => void;
}

const METHODS = [
  { 
    id: 'sbp', 
    label: 'Оплата новым счетом СБП', 
    icon: (
      <div className="w-12 h-12 bg-[#121212] rounded-xl flex items-center justify-center border border-white/5 overflow-hidden p-2">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" fill="#FF4D00" opacity="0.2"/>
          <text x="50" y="60" fontSize="24" fontWeight="500" fill="white" textAnchor="middle">сбп</text>
        </svg>
      </div>
    )
  },
  { 
    id: 'sberpay', 
    label: 'Оплата новым SberPay', 
    icon: (
      <div className="w-12 h-12 bg-[#121212] rounded-xl flex items-center justify-center border border-white/5 overflow-hidden">
        <div className="bg-[#21A038] w-full h-full flex items-center justify-center">
          <span className="text-[10px] font-medium text-white">SberPay</span>
        </div>
      </div>
    )
  },
  { 
    id: 'card', 
    label: 'Оплата новой картой', 
    icon: (
      <div className="w-12 h-12 bg-[#121212] rounded-xl flex items-center justify-center border border-white/5">
        <Plus size={24} className="text-white/60" />
      </div>
    )
  },
];

/**
 * Компонент PaymentMethodsModal
 * Позволяет выбрать способ оплаты (СБП, SberPay, Карта).
 * Переведен на использование универсального BottomSheet.
 */
export const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedMethod,
  onSelect
}) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Способ оплаты">
      <div className="flex flex-col space-y-3">
        {METHODS.map((method, index) => {
          const isSelected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              onClick={() => {
                onSelect(method.id);
                onClose();
              }}
              className={`w-full flex items-center justify-between p-4 rounded-[10px] border transition-all css-dialog_content-item ${
                isSelected 
                  ? 'bg-[#F55128]/10 border-[#F55128]/30 shadow-[inset_0_0_20px_rgba(245,81,40,0.05)]' 
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
              style={{ '--index': index + 1 } as React.CSSProperties}
            >
              <div className="flex items-center gap-4">
                {method.icon}
                <span className="text-lg font-medium text-white/90">{method.label}</span>
              </div>
              {isSelected && (
                <div className="w-8 h-8 bg-[#F55128]/20 rounded-full flex items-center justify-center border border-[#F55128]/30">
                  <Check size={18} className="text-[#F55128]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};
