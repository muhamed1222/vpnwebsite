'use client';

import React from 'react';
import { Contest } from '@/types/contest';
import { BottomSheet } from '../ui/BottomSheet';

interface ContestRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  contest: Contest;
}

/**
 * Модальное окно с правилами конкурса
 */
export const ContestRulesModal: React.FC<ContestRulesModalProps> = ({
  isOpen,
  onClose,
  contest,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('ru-RU', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const startDate = formatDate(contest.starts_at);
  const endDate = formatDate(contest.ends_at);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Правила конкурса">
      <div className="space-y-6">
        {/* Призы конкурса */}
        <div>
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <span className="text-xl">🎁</span>
            Призы конкурса
          </h3>
          <div className="space-y-2 text-white/70 text-sm">
            <p>• Главный приз: <span className="text-white font-medium">Подписка на 12 месяцев</span></p>
            <p>• Второе место: <span className="text-white font-medium">Подписка на 6 месяцев</span></p>
            <p>• Третье место: <span className="text-white font-medium">Подписка на 3 месяца</span></p>
          </div>
        </div>

        {/* Основная информация */}
        <div>
          <h3 className="text-white font-semibold mb-2">О конкурсе</h3>
          <p className="text-white/70 leading-relaxed">
            {contest.title}
          </p>
          <div className="mt-3 space-y-1 text-sm">
            <div className="text-white/60">
              <span className="text-white/80">Начало:</span> {startDate}
            </div>
            <div className="text-white/60">
              <span className="text-white/80">Окончание:</span> {endDate}
            </div>
          </div>
        </div>

        {/* Правила */}
        <div>
          <h3 className="text-white font-semibold mb-2">Как получить билеты</h3>
          <ul className="space-y-2 text-white/70 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">•</span>
              <span>1 оплаченный месяц вашим другом = 1 билет</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">•</span>
              <span>Чем больше билетов, тем выше шанс выиграть</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">•</span>
              <span>Друг должен оплатить в течение {contest.attribution_window_days} дней после перехода по вашей ссылке</span>
            </li>
          </ul>
        </div>

        {/* Условия засчета */}
        <div>
          <h3 className="text-white font-semibold mb-2">Когда друг засчитывается</h3>
          <ul className="space-y-2 text-white/70 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">•</span>
              <span>Друг впервые перешел по вашей реферальной ссылке</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">•</span>
              <span>Совершил первую успешную оплату в срок атрибуции</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">•</span>
              <span>Не был подписчиком до перехода по ссылке</span>
            </li>
          </ul>
        </div>

        {/* Что не засчитывается */}
        <div>
          <h3 className="text-white font-semibold mb-2">Не засчитывается</h3>
          <ul className="space-y-2 text-white/70 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Самоприглашение (приглашение самого себя)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Оплата вне окна атрибуции ({contest.attribution_window_days} дней)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Если у друга уже были успешные оплаты до привязки</span>
            </li>
          </ul>
        </div>

        {/* Возвраты */}
        <div>
          <h3 className="text-white font-semibold mb-2">Возвраты</h3>
          <p className="text-white/70 leading-relaxed">
            При возврате оплаты друга билеты за эту оплату будут отозваны.
          </p>
        </div>

        {/* Итоги */}
        <div className="bg-white/5 rounded-[10px] p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-2">Итоги конкурса</h3>
          <p className="text-white/70 leading-relaxed text-sm">
            После окончания конкурса будут опубликованы общее число билетов, 
            список выигрышных номеров билетов и список победителей.
          </p>
        </div>
      </div>
    </BottomSheet>
  );
};