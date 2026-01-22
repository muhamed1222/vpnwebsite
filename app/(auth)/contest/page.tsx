'use client';

import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { triggerHaptic, getTelegramWebApp, getTelegramInitData, waitForTelegramInit } from '@/lib/telegram';
import { handleComponentError } from '@/lib/utils/errorHandler';
import { ContestSummary, ReferralFriend, TicketHistoryEntry, Contest } from '@/types/contest';
import { DELAYS } from '@/lib/constants';

// Lazy loading для всех тяжелых компонентов
const ContestCountdownScreen = lazy(() =>
  import('@/components/blocks/ContestCountdownScreen')
);
const ContestSummaryCard = lazy(() =>
  import('@/components/blocks/ContestSummaryCard')
);
const FriendsList = lazy(() =>
  import('@/components/blocks/FriendsList')
);
const TicketsHistory = lazy(() =>
  import('@/components/blocks/TicketsHistory')
);
const ContestRulesModal = lazy(() =>
  import('@/components/blocks/ContestRulesModal')
);

export default function ContestPage() {
  const [summary, setSummary] = useState<ContestSummary | null>(null);
  const [friends, setFriends] = useState<ReferralFriend[]>([]);
  const [tickets, setTickets] = useState<TicketHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Мемоизируем функцию загрузки данных
  const loadContestData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Ожидаем инициализации Telegram WebApp (важно для Android)
      console.log('[Contest] Waiting for Telegram init...');
      const isReady = await waitForTelegramInit();
      console.log('[Contest] Telegram ready:', isReady);
      
      // Получаем Telegram initData для авторизации
      const initData = isReady ? getTelegramInitData() : '';
      console.log('[Contest] initData length:', initData?.length || 0);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (initData) {
        headers['X-Telegram-Init-Data'] = initData;
        headers['Authorization'] = initData;
      } else if (process.env.NODE_ENV === 'development') {
        const mockInitData = 'query_id=STUB&user=%7B%22id%22%3A12345678%2C%22first_name%22%3A%22Developer%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22dev%22%2C%22language_code%22%3A%22ru%22%7D&auth_date=1623822263&hash=7777777777777777777777777777777777777777777777777777777777777777';
        headers['X-Telegram-Init-Data'] = mockInitData;
        headers['Authorization'] = mockInitData;
      }

      // Сначала получаем активный конкурс
      console.log('[Contest] Fetching active contest...');
      const activeContestResponse = await fetch('/api/contest/active', { headers, cache: 'no-store' }).catch((err) => {
        // Ошибка сети - не критично, просто вернем null
        console.error('[Contest] Fetch error:', err);
        return null;
      });

      if (!activeContestResponse) {
        // Если ошибка сети, выбрасываем ошибку, которая будет поймана ниже
        setError('Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.');
        return;
      }

      console.log('[Contest] Response status:', activeContestResponse.status);

      let activeContestData;
      try {
        activeContestData = await activeContestResponse.json();
        console.log('[Contest] Response data:', JSON.stringify(activeContestData).substring(0, 200));
      } catch {
        setError('Ошибка обработки данных. Попробуйте позже.');
        return;
      }

      // Проверяем наличие активного конкурса
      if (!activeContestData.ok || !activeContestData.contest) {
        const errorMsg = activeContestData.error || '';
        if (activeContestResponse.status === 404 || errorMsg.includes('not found')) {
          setError('В данный момент нет активного конкурса.');
        } else {
          // Преобразуем техническое сообщение в понятное
          const { getUserFriendlyMessage } = await import('@/lib/utils/user-messages');
          setError(getUserFriendlyMessage(errorMsg) || 'Не удалось загрузить конкурс.');
        }
        return;
      }

      const contestId = activeContestData.contest.id;
      const startsAt = new Date(activeContestData.contest.starts_at).getTime();
      const now = new Date().getTime();

      // Если конкурс еще не начался, не пытаемся грузить статистику (ее нет)
      if (now < startsAt) {
        const emptySummary: ContestSummary = {
          contest: activeContestData.contest,
          ref_link: '',
          tickets_total: 0,
          invited_total: 0,
          qualified_total: 0,
          pending_total: 0,
        };
        setSummary(emptySummary);
        setFriends([]);
        setTickets([]);
        return;
      }

      // Если конкурс активен, загружаем дополнительные данные
      const [summaryResponse, friendsResponse, ticketsResponse] = await Promise.all([
        fetch(`/api/referral/summary?contest_id=${contestId}`, { headers, cache: 'no-store' }).catch(() => null),
        fetch(`/api/referral/friends?contest_id=${contestId}&limit=50`, { headers, cache: 'no-store' }).catch(() => null),
        fetch(`/api/referral/tickets?contest_id=${contestId}&limit=20`, { headers, cache: 'no-store' }).catch(() => null),
      ]);

      // Обрабатываем ответы
      const summaryData = summaryResponse?.ok
        ? await summaryResponse.json().catch(() => ({ ok: false }))
        : { ok: false };

      const friendsData = friendsResponse?.ok
        ? await friendsResponse.json().catch(() => ({ ok: false }))
        : { ok: false };

      const ticketsData = ticketsResponse?.ok
        ? await ticketsResponse.json().catch(() => ({ ok: false }))
        : { ok: false };

      if (!summaryData.ok || !summaryData.summary) {
        // Fallback если сводка не найдена, но конкурс есть
        const fallbackSummary: ContestSummary = {
          contest: activeContestData.contest,
          ref_link: '',
          tickets_total: 0,
          invited_total: 0,
          qualified_total: 0,
          pending_total: 0,
        };
        setSummary(fallbackSummary);
      } else {
        setSummary(summaryData.summary);
      }

      setFriends(friendsData.friends || []);
      setTickets(ticketsData.tickets || []);

    } catch (err) {
      // Используем централизованный обработчик ошибок
      const errorMessage = handleComponentError(err, 'contest', 'loadContestData');
      
      // FALLBACK FOR LOCAL DEVELOPMENT ONLY
      // Если произошла ошибка (например, 404 на API в dev environment), подставляем mock данные
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using Dev Fallback Data due to error');
        const fallbackContest: Contest = {
          id: 'fallback-contest',
          title: 'Розыгрыш призов (Dev)',
          starts_at: '2026-01-20T00:00:00Z',
          ends_at: '2026-01-27T00:00:00Z',
          attribution_window_days: 7,
          rules_version: '1.0',
          is_active: false
        };
        const devFallbackSummary: ContestSummary = {
          contest: fallbackContest,
          ref_link: '',
          tickets_total: 0,
          invited_total: 0,
          qualified_total: 0,
          pending_total: 0,
        };
        setSummary(devFallbackSummary);
        setError(null);
      } else {
        // В продакшене показываем ошибку (преобразуем техническое сообщение в понятное)
        const { getUserFriendlyMessage } = await import('@/lib/utils/user-messages');
        setError(getUserFriendlyMessage(errorMessage));
      }
    } finally {
      // Это гарантирует, что спиннер исчезнет в любом случае
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContestData();

    // Safety timeout to prevent infinite loading state
    const timer = setTimeout(() => {
      setLoading(current => {
        if (current) {
          console.warn('Force disabling loader due to timeout');
          // Если мы все еще грузимся через 4 секунды, пытаемся показать mock (в dev) или просто error
          if (process.env.NODE_ENV === 'development') {
            const timeoutFallbackContest: Contest = {
              id: 'fallback-timeout',
              title: 'Розыгрыш призов (Fallback)',
              starts_at: '2026-01-20T00:00:00Z',
              ends_at: '2026-01-27T00:00:00Z',
              attribution_window_days: 7,
              rules_version: '1.0',
              is_active: false
            };
            const timeoutFallbackSummary: ContestSummary = {
              contest: timeoutFallbackContest,
              ref_link: '',
              tickets_total: 0,
              invited_total: 0,
              qualified_total: 0,
              pending_total: 0,
            };
            setSummary(prev => prev || timeoutFallbackSummary);
          }
          return false;
        }
        return current;
      });
    }, DELAYS.CONTEST_REFRESH);

    return () => clearTimeout(timer);
  }, [loadContestData]);

  // Вычисляем, начался ли конкурс на основе summary
  const contestHasStarted = useMemo(() => {
    if (!summary) return null;

    const now = new Date().getTime();
    const startTime = new Date(summary.contest.starts_at).getTime();
    return now >= startTime;
  }, [summary]);

  // Обновляем состояние, если конкурс скоро начнется
  useEffect(() => {
    if (contestHasStarted === null || contestHasStarted === true) return;

    const intervalId = setInterval(() => {
      if (!summary) return;
      const now = new Date().getTime();
      const startTime = new Date(summary.contest.starts_at).getTime();
      if (now >= startTime) {
        loadContestData();
      }
    }, DELAYS.CONTEST_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [contestHasStarted, summary, loadContestData]);

  const handleShare = useCallback(async () => {
    if (!summary) return;

    try {
      triggerHaptic('medium');
      const webApp = getTelegramWebApp();

      if (webApp && webApp.openTelegramLink) {
        const shareText = `🎁 Розыгрыш Outlivion VPN!\n\nИспользуй мою реферальную ссылку и получи больше билетов для участия!`;
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(summary.ref_link || '')}&text=${encodeURIComponent(shareText)}`;
        webApp.openTelegramLink(shareUrl);
      } else if (navigator.share) {
        await navigator.share({
          title: 'Розыгрыш Outlivion VPN',
          text: `Присоединяйся к розыгрышу Outlivion VPN! Используй мою реферальную ссылку: ${summary.ref_link}`,
          url: summary.ref_link || '',
        });
      } else {
        const { copyToClipboard } = await import('@/lib/utils/clipboard');
        const copied = await copyToClipboard(summary.ref_link || '');
        if (copied) {
          const webApp = getTelegramWebApp();
          if (webApp) webApp.showAlert('✅ Реферальная ссылка скопирована');
        } else {
          handleComponentError(new Error('Clipboard copy failed'), 'contest', 'share');
        }
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name !== 'AbortError') {
        handleComponentError(err, 'contest', 'share');
      }
    }
  }, [summary]);

  if (loading) {
    return (
      <main className="w-full text-white pt-[calc(100px+env(safe-area-inset-top))] pl-4 pr-4 font-sans select-none flex flex-col min-h-screen">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">Загрузка...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="w-full text-white pt-[calc(100px+env(safe-area-inset-top))] pl-4 pr-4 font-sans select-none flex flex-col min-h-screen">
        <div className="sticky top-[calc(100px+env(safe-area-inset-top))] z-50 flex items-center justify-between w-fit mb-4">
          <Link href="/" className="p-2 bg-white/10 rounded-xl border border-white/10 active:scale-95 transition-all hover:bg-white/15" aria-label="Назад на главную">
            <ChevronLeftIcon className="w-6 h-6 text-white" aria-hidden="true" />
          </Link>
        </div>
        <div className="flex items-center justify-center flex-1">
          <div className="text-center max-w-[300px]">
            <p className="text-white/80 text-lg mb-2">Конкурс недоступен</p>
            <p className="text-white/60 text-sm">{error || 'Нет активного конкурса'}</p>
          </div>
        </div>
      </main>
    );
  }

  const shouldShowCountdown = contestHasStarted === false;

  if (shouldShowCountdown) {
    return (
      <div className="w-full text-white pt-[calc(100px+env(safe-area-inset-top))] pl-4 pr-4 font-sans select-none flex flex-col min-h-screen transition-all duration-300">
        <Suspense fallback={<div className="h-screen bg-white/5 rounded-2xl animate-pulse" />}>
          <ContestCountdownScreen
            contestTitle={summary.contest.title}
            startsAt={summary.contest.starts_at}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <main className="w-full text-white pt-[calc(100px+env(safe-area-inset-top))] pl-4 pr-4 font-sans select-none flex flex-col h-fit pb-[calc(40px+env(safe-area-inset-bottom))] relative">
      <div className="sticky top-[calc(100px+env(safe-area-inset-top))] z-50 flex items-center justify-between w-fit mb-4 relative">
        <Link
          href="/"
          onClick={() => triggerHaptic('light')}
          className="p-2 bg-white/10 rounded-xl border border-white/10 active:scale-95 transition-all hover:bg-white/15"
          aria-label="Назад на главную"
        >
          <ChevronLeftIcon className="w-6 h-6 text-white" aria-hidden="true" />
        </Link>
      </div>

      <Suspense fallback={<div className="h-56 bg-white/5 rounded-2xl animate-pulse mb-6 relative z-10" />}>
        <ContestSummaryCard
          summary={summary}
        />
      </Suspense>

      <div className="mb-6 relative z-10">
        <button
          onClick={handleShare}
          className="w-full bg-gradient-to-r from-[#F55128] to-[#FF6B3D] hover:from-[#d43d1f] hover:to-[#e55a2d] active:scale-[0.98] transition-all duration-200 rounded-[10px] py-2 px-4 text-white font-medium text-base shadow-xl flex items-center justify-center gap-3 border border-white/20"
        >
          <span className="text-2xl">🎁</span>
          <span>Пригласить друзей</span>
        </button>
      </div>

      <Suspense fallback={<div className="h-64 bg-white/5 rounded-2xl animate-pulse mb-6 relative z-10" />}>
        <FriendsList friends={friends} />
      </Suspense>

      <Suspense fallback={<div className="h-64 bg-white/5 rounded-2xl animate-pulse mb-6 relative z-10" />}>
        <TicketsHistory tickets={tickets} />
      </Suspense>

      <div className="mb-6 relative z-10">
        <button
          onClick={() => {
            triggerHaptic('light');
            setIsRulesOpen(true);
          }}
          className="w-full bg-transparent border border-white/10 hover:bg-white/5 active:scale-[0.98] transition-all rounded-[10px] py-3 px-4 text-white/80 font-medium"
        >
          Правила конкурса
        </button>
      </div>

      <Suspense fallback={null}>
        <ContestRulesModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
          contest={summary.contest}
        />
      </Suspense>
    </main>
  );
}
