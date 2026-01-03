import React, { useState, useEffect } from 'react';
import { apiService, PaymentHistoryItem } from '../services/apiService';
import { isTelegramWebApp } from '../utils/telegram';
import { AlertCircle, CheckCircle2, XCircle, Clock, Receipt, ExternalLink } from 'lucide-react';

export const PaymentHistoryCard: React.FC = () => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Загрузка истории платежей
  useEffect(() => {
    const loadPaymentHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      
      try {
        const history = await apiService.getPaymentHistory();
        setPaymentHistory(history);
      } catch (err) {
        console.error('Ошибка при загрузке истории платежей:', err);
        setHistoryError('Не удалось загрузить историю платежей.');
        setPaymentHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadPaymentHistory();
  }, []);

  return (
    <div className="card-ref p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-medium text-fg-4 mb-1">История платежей</h3>
          <p className="text-sm text-fg-2">Все ваши транзакции и операции</p>
        </div>
      </div>

      {historyError && (
        <div className="mb-4 p-3 bg-[var(--warning-bg)] border border-[var(--warning-border)] rounded-lg flex items-start gap-2" role="alert">
          <AlertCircle size={16} className="text-[var(--warning-text)] mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--warning-text)]">{historyError}</p>
        </div>
      )}

      {historyLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-bg-2 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : paymentHistory.length === 0 ? (
        <div className="py-12 text-center">
          <Receipt size={48} className="mx-auto text-fg-1 mb-4" />
          <p className="text-sm text-fg-2 font-medium mb-1">История платежей пуста</p>
          <p className="text-xs text-fg-1">Здесь будут отображаться все ваши транзакции</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paymentHistory.map((payment) => (
            <PaymentItem key={payment.id} payment={payment} />
          ))}
        </div>
      )}
    </div>
  );
};

const PaymentItem: React.FC<{ payment: PaymentHistoryItem }> = ({ payment }) => {
  const getStatusIcon = () => {
    switch (payment.status) {
      case 'success':
        return <CheckCircle2 size={16} className="text-[var(--success-text)]" />;
      case 'fail':
        return <XCircle size={16} className="text-[var(--danger-text)]" />;
      case 'pending':
        return <Clock size={16} className="text-[var(--warning-text)]" />;
      case 'cancelled':
        return <XCircle size={16} className="text-fg-2" />;
      default:
        return <Clock size={16} className="text-fg-2" />;
    }
  };

  const getStatusText = () => {
    switch (payment.status) {
      case 'success':
        return 'Успешно';
      case 'fail':
        return 'Ошибка';
      case 'pending':
        return 'Ожидание';
      case 'cancelled':
        return 'Отменено';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusColor = () => {
    switch (payment.status) {
      case 'success':
        return 'bg-[var(--success-bg)] border-[var(--success-border)] text-[var(--success-text)]';
      case 'fail':
        return 'bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger-text)]';
      case 'pending':
        return 'bg-[var(--warning-bg)] border-[var(--warning-border)] text-[var(--warning-text)]';
      case 'cancelled':
        return 'bg-bg-2 border-border text-fg-2';
      default:
        return 'bg-bg-2 border-border text-fg-2';
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Сегодня';
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дней назад`;
    } else {
      return date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'short', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  const formatAmount = (amount: number, currency: PaymentHistoryItem['currency']) => {
    if (currency === 'XTR') return `${amount} ⭐️`;
    return `${amount} ₽`;
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-bg-2 hover:bg-bg-3 transition-all group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`p-2 rounded-lg ${getStatusColor()} shrink-0`}>
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-fg-4">{payment.planName}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-fg-2">
            <span>{formatDate(payment.date)}</span>
            <span>•</span>
            <span>ID: {payment.orderId.slice(-8)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className="text-sm font-bold text-fg-4">{formatAmount(payment.amount, payment.currency)}</div>
          {payment.invoiceLink && (
            <a
              href={payment.invoiceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-fg-2 hover:text-[var(--primary)] transition-colors flex items-center gap-1 mt-0.5"
              aria-label="Открыть счет"
            >
              Счет <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
