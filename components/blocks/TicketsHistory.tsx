'use client';

import React, { useMemo } from 'react';
import { TicketHistoryEntry } from '@/types/contest';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

interface TicketsHistoryProps {
  tickets: TicketHistoryEntry[];
  onShowAll?: () => void;
}

/**
 * Компонент для отображения истории билетов
 */
export const TicketsHistory: React.FC<TicketsHistoryProps> = ({ tickets, onShowAll }) => {
  // Сортируем билеты по дате (новые сверху) и мемоизируем, ограничиваем до 5 записей
  const sortedTickets = useMemo(() => {
    return [...tickets]
      .sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 5);
  }, [tickets]);

  const hasMore = tickets.length > 5;

  const formatDate = useMemo(() => {
    return (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const ticketDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffTime = today.getTime() - ticketDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const day = date.getDate();
      const month = date.toLocaleDateString('ru-RU', { month: 'short' });
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      if (diffDays === 0) {
        return `Сегодня, ${hours}:${minutes}`;
      } else if (diffDays === 1) {
        return `Вчера, ${hours}:${minutes}`;
      } else if (diffDays < 7) {
        return `${day} ${month}, ${hours}:${minutes}`;
      } else {
        return `${day} ${month} ${year}, ${hours}:${minutes}`;
      }
    };
  }, []);

  if (sortedTickets.length === 0) {
    return (
      <div className="bg-[#121212] rounded-[16px] p-5 border border-white/5 mb-6 relative z-10">
        <h3 className="text-lg font-medium text-white mb-4">История билетов</h3>
        <div className="text-center py-8">
          <p className="text-white/60 text-sm">История билетов пуста</p>
          <p className="text-white/40 text-xs mt-2">
            Билеты появятся здесь после оплат ваших друзей
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] rounded-[16px] p-5 border border-white/5 mb-6 relative z-10">
      <h3 className="text-lg font-medium text-white mb-4">История билетов</h3>
      <div className="space-y-2">
        {sortedTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-white/5 rounded-[10px] p-3 border border-white/5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                ticket.delta > 0 
                  ? 'bg-green-500/20' 
                  : 'bg-red-500/20'
              }`}>
                {ticket.delta > 0 ? (
                  <PlusIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <MinusIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm">
                  {ticket.label}
                </div>
                <div className="text-white/40 text-xs mt-1">
                  {formatDate(ticket.created_at)}
                </div>
              </div>
            </div>
            <div className={`flex-shrink-0 text-right font-bold text-lg ${
              ticket.delta > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {ticket.delta > 0 ? '+' : ''}{ticket.delta}
            </div>
          </div>
        ))}
      </div>
      {hasMore && onShowAll && (
        <button
          onClick={onShowAll}
          className="w-full mt-3 py-2 text-white/60 text-sm hover:text-white/80 transition-colors"
        >
          Показать все ({tickets.length})
        </button>
      )}
    </div>
  );
};