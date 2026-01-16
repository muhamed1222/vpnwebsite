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
export default function ContestSummaryCard({ 
  summary, 
  progress
}: ContestSummaryCardProps) {
  // Вычисляем позицию в топе и другие метрики
  const { topPosition, totalParticipants, percentile } = useMemo(() => {
    // TODO: Получить реальную позицию из API (когда будет реализован эндпоинт)
    const topPosition = summary.rank || null; // Будет приходить из API
    const totalParticipants = summary.total_participants || null; // Будет приходить из API
    
    // Процент участников, которых пользователь обогнал
    const percentile = topPosition && totalParticipants 
      ? Math.round((1 - topPosition / totalParticipants) * 100)
      : null;
    
    return { topPosition, totalParticipants, percentile };
  }, [summary.rank, summary.total_participants]);

  return (
    <div className="bg-gradient-to-br from-[#F55128] via-[#FF6B3D] to-[#FF8A65] rounded-[10px] p-3.5 mb-6 border border-white/20 backdrop-blur-[12px] relative z-10 shadow-2xl">
      {/* Заголовок с прогресс-баром */}
      <div className="mb-[14px]">
        <div className="flex justify-between items-start mb-0">
          <div className="flex-1">
            <h1 className="text-xl font-medium text-white leading-tight mb-2">
              Розыгрыш
            </h1>
          </div>
          {progress && (
            <div className="text-right flex items-center gap-2">
              <div className="text-sm font-bold text-white">
                {progress.daysRemaining}
              </div>
              <div className="text-sm text-white/70 uppercase tracking-wide">
                Дней осталось
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Основные метрики */}
      <div className="bg-white/15 rounded-[10px] p-3.5 mb-0 border-2 border-white/30 shadow-lg backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-4 text-center">
          {/* Билеты - главный акцент */}
          <div className="col-span-1">
            <div className={`${summary.tickets_total === 0 ? 'text-3xl' : 'text-4xl'} font-medium text-white mb-1 drop-shadow-lg`}>
              {summary.tickets_total}
            </div>
            <div className="text-white/90 text-sm font-medium">Билетов</div>
            <div className="text-white/60 text-xs mt-1">
              {percentile !== null && totalParticipants && totalParticipants > 0 
                ? `Лучше ${percentile}%` 
                : summary.tickets_total > 0 
                  ? 'В рейтинге' 
                  : '—'
              }
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
        </div>
      </div>
    </div>
  );
};