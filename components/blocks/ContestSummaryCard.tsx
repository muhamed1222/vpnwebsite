'use client';

import React, { useMemo } from 'react';
import { ContestSummary } from '@/types/contest';
import { formatDateFull } from '@/lib/utils/date';

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
export default function ContestSummaryCard({ 
  summary, 
  progress
}: ContestSummaryCardProps) {
  const endDate = formatDateFull(summary.contest.ends_at);

  // Вычисляем позицию в топе и другие метрики
  const { topPosition, totalParticipants, percentile, conversionRate } = useMemo(() => {
    // TODO: Заменить на реальный расчет позиции в топе
    const topPosition = 15; // Фиксированное значение для разработки
    const totalParticipants = 150; // TODO: Получить из API
    const percentile = Math.round((1 - topPosition / totalParticipants) * 100);
    const conversionRate = summary.invited_total > 0 ? Math.round((summary.qualified_total / summary.invited_total) * 100) : 0;
    
    return { topPosition, totalParticipants, percentile, conversionRate };
  }, [summary.invited_total, summary.qualified_total]);

  return (
    <div className="bg-gradient-to-br from-[#F55128] via-[#FF6B3D] to-[#FF8A65] rounded-[20px] p-6 mb-6 border border-white/20 backdrop-blur-[12px] relative z-10 shadow-2xl">
      {/* Заголовок с прогресс-баром */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white leading-tight mb-2">
              {summary.contest.title}
            </h1>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Активен
              </span>
              <span>•</span>
              <span>До {endDate}</span>
            </div>
          </div>
          {progress && (
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {progress.daysRemaining}
              </div>
              <div className="text-xs text-white/70 uppercase tracking-wide">
                Дней осталось
              </div>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        {progress && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>Прогресс конкурса</span>
              <span>{Math.round(progress.percent)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-white/80 to-white rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Основные метрики */}
      <div className="bg-white/15 rounded-[16px] p-5 mb-4 border-2 border-white/30 shadow-lg backdrop-blur-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          {/* Билеты - главный акцент */}
          <div className="col-span-1">
            <div className="text-4xl font-black text-white mb-1 drop-shadow-lg">
              {summary.tickets_total}
            </div>
            <div className="text-white/90 text-sm font-semibold">Билетов</div>
            <div className="text-white/60 text-xs mt-1">
              Топ {percentile}%
            </div>
          </div>
          
          {/* Друзья */}
          <div className="col-span-1 border-l border-white/20 pl-4">
            <div className="text-3xl font-bold text-white mb-1">
              {summary.invited_total}
            </div>
            <div className="text-white/90 text-sm font-semibold">Друзей</div>
            <div className="text-white/60 text-xs mt-1">
              Приглашено
            </div>
          </div>
          
          {/* Конверсия */}
          <div className="col-span-1 border-l border-white/20 pl-4">
            <div className="text-3xl font-bold text-white mb-1">
              {conversionRate}%
            </div>
            <div className="text-white/90 text-sm font-semibold">Конверсия</div>
            <div className="text-white/60 text-xs mt-1">
              {summary.qualified_total}/{summary.invited_total}
            </div>
          </div>
        </div>
      </div>

      {/* Дополнительная статистика */}
      <div className="flex items-center justify-between text-white/70 text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            {summary.qualified_total} купили
          </span>
          {summary.pending_total > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
              {summary.pending_total} ожидают
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">#{topPosition}</span>
          <span>из {totalParticipants}</span>
        </div>
      </div>
    </div>
  );
};