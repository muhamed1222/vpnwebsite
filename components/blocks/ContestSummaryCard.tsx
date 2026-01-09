'use client';

import React, { useMemo } from 'react';
import { ContestSummary } from '@/types/contest';

interface ContestProgress {
  daysRemaining: number;
  daysTotal: number;
  percent: number;
}

interface ContestSummaryCardProps {
  summary: ContestSummary;
  progress?: ContestProgress;
}

/**
 * Компонент для отображения сводки по конкурсу
 * Показывает количество билетов и статистику
 */
export const ContestSummaryCard: React.FC<ContestSummaryCardProps> = ({ 
  summary, 
  progress
}) => {
  const formatDate = useMemo(() => {
    return (dateString: string) => {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleDateString('ru-RU', { month: 'long' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };
  }, []);

  const endDate = formatDate(summary.contest.ends_at);

  return (
    <div className="bg-gradient-to-r from-[#F55128] to-[#FF6B3D] rounded-[16px] p-6 mb-6 border border-white/10 backdrop-blur-[12px] relative z-10 shadow-2xl">
      {/* Заголовок */}
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-white leading-tight mb-1">{summary.contest.title}</h1>
        <p className="text-white/70 text-sm">
          {progress && progress.daysRemaining > 0 
            ? `Осталось ${progress.daysRemaining} дней до ${endDate}`
            : `До ${endDate}`
          }
        </p>
      </div>

      {/* Билеты - главный акцент */}
      <div className="bg-white/15 rounded-[12px] p-6 mb-4 border-2 border-white/30 shadow-lg">
        <div className="text-center">
          <div className="text-6xl font-bold text-white mb-3 drop-shadow-lg">
            {summary.tickets_total}
          </div>
          <div className="text-white/90 text-lg font-semibold">Билетов</div>
        </div>
      </div>

      {/* Краткая статистика */}
      {summary.invited_total > 0 && (
        <div className="text-center text-white/60 text-sm">
          {summary.invited_total} приглашено • {summary.qualified_total} купили
          {summary.pending_total > 0 && ` • ${summary.pending_total} ожидают`}
        </div>
      )}
    </div>
  );
};