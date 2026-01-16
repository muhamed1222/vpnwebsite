'use client';

import React from 'react';
import { Contest } from '@/types/contest';
import { BottomSheet } from '../ui/BottomSheet';
import { formatDateFull } from '@/lib/utils/date';

interface ContestRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  contest: Contest;
}

/**
 * Компонент модального окна с правилами конкурса
 */
export default function ContestRulesModal({ isOpen, onClose, contest }: { isOpen: boolean; onClose: () => void; contest: Contest }) {
  const startDate = formatDateFull(contest.starts_at);
  const endDate = formatDateFull(contest.ends_at);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Правила конкурса">
      <div className="space-y-6">
        {/* Призы конкурса */}
        <div className="bg-gradient-to-br from-[#F55128]/20 to-[#FF6B3D]/20 rounded-[10px] p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="text-xl">🎁</span>
            Призы конкурса
          </h3>
          <div className="space-y-2 text-white/70 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-white font-bold">🥇</span>
              <span><span className="text-white font-medium">iPhone 17 Pro 256 GB</span></span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-white font-bold">🥈</span>
              <span><span className="text-white font-medium">Galaxy Watch Ultra 47 LTE</span></span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-white font-bold">🥉</span>
              <span><span className="text-white font-medium">AirPods 4</span></span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-white font-bold">✨</span>
              <span><span className="text-white font-medium">Яндекс Станция Миди</span></span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-white font-bold">✨</span>
              <span><span className="text-white font-medium">Яндекс Станция Стрит</span></span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-white font-bold">✨</span>
              <span><span className="text-white font-medium">6–10 места:</span> 1 год подписки Outlivion</span>
            </p>
          </div>
        </div>

        {/* Основная информация */}
        <div className="bg-white/5 rounded-[10px] p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-2">О конкурсе</h3>
          <p className="text-white/70 leading-relaxed mb-3">
            {contest.title}
          </p>
          <p className="text-white/60 text-sm leading-relaxed mb-3">
            Запускаем январскую движуху: приглашай друзей → копи билеты → выигрывай технику 😈
          </p>
          <div className="mt-3 space-y-1 text-sm">
            <div className="text-white/60">
              <span className="text-white/80">Начало:</span> {startDate}
            </div>
            <div className="text-white/60">
              <span className="text-white/80">Окончание:</span> {endDate}
            </div>
            <div className="text-white/60 mt-2">
              <span className="text-white/80">Подведение итогов:</span> {new Date(contest.ends_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>

        {/* Правила */}
        <div className="bg-white/5 rounded-[10px] p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-3">🚀 Как участвовать</h3>
          <ul className="space-y-2 text-white/70 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">1.</span>
              <span>У тебя должна быть активная подписка Outlivion</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">2.</span>
              <span>Получи свою реферальную ссылку</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">3.</span>
              <span>Приглашай друзей по своей ссылке</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">4.</span>
              <span>Друг должен купить подписку</span>
            </li>
          </ul>
        </div>

        {/* Билеты */}
        <div className="bg-white/5 rounded-[10px] p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-3">🎟 Билеты</h3>
          <ul className="space-y-2 text-white/70 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">•</span>
              <span>1 оплаченный месяц подписки приглашённого друга = 1 билет</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">•</span>
              <span>Если друг оплатил 12 месяцев — вы получаете 12 билетов</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">•</span>
              <span>Билеты суммируются, лимита нет</span>
            </li>
          </ul>
        </div>

        {/* Условия засчета */}
        <div className="bg-white/5 rounded-[10px] p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-3">✅ Кто считается "засчитанным другом"</h3>
          <p className="text-white/70 text-sm mb-2">Друг засчитывается, если он:</p>
          <ul className="space-y-2 text-white/70 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">—</span>
              <span>перешёл по вашей ссылке</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">—</span>
              <span>оформил первую оплату после перехода</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">—</span>
              <span>это не повторная оплата существующего пользователя</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F55128] mt-1">—</span>
              <span>это не ваш второй аккаунт/накрутка</span>
            </li>
          </ul>
        </div>

        {/* Что не засчитывается */}
        <div className="bg-red-500/10 rounded-[10px] p-4 border border-red-500/20">
          <h3 className="text-white font-semibold mb-3">❌ Не засчитывается</h3>
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
        <div className="bg-white/5 rounded-[10px] p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-3">💳 Возвраты</h3>
          <p className="text-white/70 leading-relaxed">
            При возврате оплаты друга билеты за эту оплату будут отозваны.
          </p>
        </div>

        {/* Важно */}
        <div className="bg-yellow-500/10 rounded-[10px] p-4 border border-yellow-500/20">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <span>❗️</span>
            Важно
          </h3>
          <p className="text-white/70 leading-relaxed text-sm">
            Вы должны быть подписаны на канал на момент подведения итогов.
          </p>
        </div>

        {/* Итоги */}
        <div className="bg-white/5 rounded-[10px] p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-2">🏆 Подведение итогов</h3>
          <p className="text-white/70 leading-relaxed text-sm mb-2">
            {new Date(contest.ends_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} случайным образом выберем 10 выигрышных билетов и объявим победителей в канале.
          </p>
          <p className="text-white/60 leading-relaxed text-xs">
            Статистика (билеты и приглашённые) — в нашем Telegram-приложении.
          </p>
        </div>
      </div>
    </BottomSheet>
  );
};