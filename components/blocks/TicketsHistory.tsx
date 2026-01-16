'use client';

import React, { useMemo } from 'react';
import { TicketHistoryEntry } from '@/types/contest';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { formatDateWithTime } from '@/lib/utils/date';

interface TicketsHistoryProps {
  tickets: TicketHistoryEntry[];
  onShowAll?: () => void;
}

/**
 * Компонент для отображения истории билетов
 */
export default function TicketsHistory({ tickets, onShowAll }: TicketsHistoryProps) {
  // Сортируем билеты по дате (новые сверху) и мемоизируем, ограничиваем до 5 записей
  const sortedTickets = useMemo(() => {
    return [...(tickets ?? [])]
      .sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 5);
  }, [tickets]);

  const hasMore = tickets.length > 5;

  if (sortedTickets.length === 0) {
    return (
      <div className="bg-[#121212] rounded-[10px] p-3.5 border border-white/5 mb-6 relative z-10">
        <h3 className="text-lg font-medium text-white mb-4">История билетов</h3>
        <div className="text-center py-8">
          <p className="text-white/60 text-sm">История билетов пуста</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] rounded-[10px] p-3.5 border border-white/5 mb-6 relative z-10">
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
              }`} aria-hidden="true">
                {ticket.delta > 0 ? (
                  <PlusIcon className="w-5 h-5 text-green-500" aria-hidden="true" />
                ) : (
                  <MinusIcon className="w-5 h-5 text-red-500" aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm">
                  {ticket.label}
                </div>
                <div className="text-white/40 text-xs mt-1">
                  {formatDateWithTime(ticket.created_at)}
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