'use client';

import React, { useEffect, useState } from 'react';
import { FolderOpenIcon as FolderOpen, CalendarIcon as Calendar, CreditCardIcon as CreditCard, CheckCircleIcon as CheckCircle2, XCircleIcon as XCircle, ClockIcon as Clock } from '@heroicons/react/24/outline';
import { BottomSheet } from '../ui/BottomSheet';
import { api } from '@/lib/api';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { logError } from '@/lib/utils/logging';

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  date: number;
  status: 'success' | 'pending' | 'fail' | 'paid'; // Added 'paid' as it might come from backend
  planId: string;
  planName: string;
}

interface TransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
    case 'paid':
      return <CheckCircle2 className="w-4 h-4" className="text-green-500" />;
    case 'fail':
      return <XCircle className="w-4 h-4" className="text-red-500" />;
    case 'pending':
    default:
      return <Clock className="w-4 h-4" className="text-yellow-500" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'success':
    case 'paid':
      return 'Оплачено';
    case 'fail':
      return 'Ошибка';
    case 'pending':
    default:
      return 'В обработке';
  }
};

/**
 * Компонент TransactionsModal
 * Использует универсальный BottomSheet для отображения истории транзакций.
 */
export const TransactionsModal: React.FC<TransactionsModalProps> = ({ isOpen, onClose }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadTransactions = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await api.getPaymentsHistory();
          setTransactions(data as Transaction[]);
        } catch (err) {
          logError('Failed to load transactions', err, {
            page: 'profile',
            action: 'loadTransactions'
          });
          setError('Не удалось загрузить историю транзакций');
        } finally {
          setLoading(false);
        }
      };

      loadTransactions();
    }
  }, [isOpen]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Мои транзакции">
      <div className="flex flex-col h-full min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-white/40 text-sm">Загрузка истории...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <XCircle size={48} className="text-red-500/20 mb-4" />
            <p className="text-white text-lg font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 text-[#F55128] font-medium"
            >
              Попробовать снова
            </button>
          </div>
        ) : transactions.length === 0 ? (
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
        ) : (
          <div className="space-y-3 px-1">
            {transactions.map((tx, index) => (
              <div 
                key={tx.id || index}
                className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 css-dialog_content-item"
                style={{ '--index': index + 1 } as React.CSSProperties}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-white font-medium text-lg">
                      {tx.planName || 'Подписка VPN'}
                    </span>
                    <div className="flex items-center gap-2 text-white/40 text-sm">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(tx.date)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-white font-bold text-lg">
                      {tx.amount} {tx.currency === 'XTR' ? '⭐️' : '₽'}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      {getStatusIcon(tx.status)}
                      <span className={
                        tx.status === 'success' || tx.status === 'paid' ? 'text-green-500' : 
                        tx.status === 'fail' ? 'text-red-500' : 'text-yellow-500'
                      }>
                        {getStatusText(tx.status)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-white/20 uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <CreditCard size={12} />
                    <span>ID: {tx.orderId || tx.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Декоративный элемент для заполнения пространства, если транзакций много */}
        {!loading && !error && (
          <div 
            className="mt-6 p-4 rounded-[16px] bg-white/[0.02] border border-white/5 css-dialog_content-item"
            style={{ '--index': transactions.length + 1 } as React.CSSProperties}
          >
            <p className="text-white/30 text-xs text-center uppercase tracking-widest font-medium">
              История обновляется мгновенно
            </p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
