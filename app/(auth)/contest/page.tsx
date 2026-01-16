'use client';

import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { triggerHaptic, getTelegramWebApp, getTelegramInitData } from '@/lib/telegram';
import { logError } from '@/lib/utils/logging';
import { ContestSummary, ReferralFriend, TicketHistoryEntry } from '@/types/contest-v2';

// Lazy loading для компонентов
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
const ContestCountdownScreen = lazy(() =>
  import('@/components/blocks/ContestCountdownScreen')
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
      // Получаем Telegram initData для авторизации
      const initData = getTelegramInitData();

      // В режиме разработки используем mock данные, если initData нет
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (initData) {
        headers['X-Telegram-Init-Data'] = initData;
        headers['Authorization'] = initData;
      } else if (process.env.NODE_ENV === 'development') {
        // В development режиме используем mock initData
        const mockInitData = 'query_id=STUB&user=%7B%22id%22%3A12345678%2C%22first_name%22%3A%22Developer%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22dev%22%2C%22language_code%22%3A%22ru%22%7D&auth_date=1623822263&hash=7777777777777777777777777777777777777777777777777777777777777777';
        headers['X-Telegram-Init-Data'] = mockInitData;
        headers['Authorization'] = mockInitData;
      }

      // Helper for fetch with timeout
      const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          clearTimeout(id);
          return response;
        } catch (error) {
          clearTimeout(id);
          throw error;
        }
      };

      // Сначала получаем активный конкурс
      const activeContestResponse = await fetchWithTimeout('/api/contest/active', { headers }).catch((e) => {
        console.error('Active contest fetch error:', e);
        return null;
      });

      if (!activeContestResponse) {
        setError('Сервер временно недоступен (timeout). Проверьте подключение.');
        setLoading(false);
        return;
      }

      let activeContestData;
      try {
        activeContestData = await activeContestResponse.json();
      } catch (parseError) {
        setError('Ошибка при обработке ответа сервера. Попробуйте позже.');
        setLoading(false);
        return;
      }

      // Проверяем наличие активного конкурса
      if (!activeContestData.ok || !activeContestData.contest) {
        // ... error handling code remains similar but explicit ...
        const errorMsg = activeContestData.error || '';
        if (activeContestResponse.status === 404 || errorMsg.includes('not found')) {
          setError('В данный момент нет активного конкурса.');
        } else {
          setError(errorMsg || 'Не удалось загрузить конкурс.');
        }
        setLoading(false);
        return;
      }

      const contestId = activeContestData.contest.id;

      // Теперь загружаем данные конкурса параллельно с таймаутом
      const [summaryResponse, friendsResponse, ticketsResponse] = await Promise.all([
        fetchWithTimeout(`/api/referral/summary?contest_id=${contestId}`, { headers }).catch(() => null),
        fetchWithTimeout(`/api/referral/friends?contest_id=${contestId}&limit=50`, { headers }).catch(() => null),
        fetchWithTimeout(`/api/referral/tickets?contest_id=${contestId}&limit=20`, { headers }).catch(() => null),
      ]);

      // Обрабатываем ответы
      let summaryData, friendsData, ticketsData;

      try {
        summaryData = summaryResponse?.ok
          ? await summaryResponse.json().catch(() => ({ ok: false, summary: null, error: 'Parse error' }))
          : { ok: false, summary: null, error: summaryResponse ? `HTTP ${summaryResponse.status}` : 'Network error' };

        friendsData = friendsResponse?.ok
          ? await friendsResponse.json().catch(() => ({ ok: false, friends: [], error: 'Parse error' }))
          : { ok: false, friends: [], error: friendsResponse ? `HTTP ${friendsResponse.status}` : 'Network error' };

        ticketsData = ticketsResponse?.ok
          ? await ticketsResponse.json().catch(() => ({ ok: false, tickets: [], error: 'Parse error' }))
          : { ok: false, tickets: [], error: ticketsResponse ? `HTTP ${ticketsResponse.status}` : 'Network error' };
      } catch (parseError) {
        setError('Ошибка при обработке данных конкурса. Попробуйте позже.');
        setLoading(false);
        return;
      }

      // Проверяем наличие сводки
      if (!summaryData.ok || !summaryData.summary) {
        // Если сводка не найдена, но конкурс есть, показываем конкурс без данных
        const errorMsg = summaryData.error || '';
        if (summaryResponse?.status === 404 || errorMsg.includes('404') || errorMsg.includes('not found')) {
          setError('Данные конкурса временно недоступны. Попробуйте позже.');
        } else {
          setError('Не удалось загрузить данные конкурса. Попробуйте позже.');
        }
        setLoading(false);
        return;
      }

      setSummary(summaryData.summary);
      setFriends(friendsData.friends || []);
      setTickets(ticketsData.tickets || []);
    } catch (err) {
      // Логируем только неожиданные ошибки (не связанные с отсутствием эндпоинтов)
      const isExpectedError = err instanceof Error && (
        err.message.includes('404') ||
        err.message.includes('401') ||
        err.message.includes('Missing Telegram initData') ||
        err.message.includes('Failed to fetch')
      );

      if (!isExpectedError) {
        logError('Failed to load contest data', err, {
          page: 'contest',
          action: 'loadContestData',
        });
      }
      setError('Не удалось загрузить данные конкурса');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContestData();
  }, [loadContestData]);

  // Вычисляем, начался ли конкурс на основе summary
  const contestHasStarted = useMemo(() => {
    if (!summary) return null; // Еще не загружено

    const now = new Date().getTime();
    const startTime = new Date(summary.contest.starts_at).getTime();
    return now >= startTime;
  }, [summary]);

  // Обновляем состояние и проверяем периодически, если конкурс еще не начался
  useEffect(() => {
    if (contestHasStarted === null || contestHasStarted === true) {
      // Конкурс еще не загружен или уже начался - не нужно проверять
      return;
    }

    // Конкурс еще не начался - проверяем каждую секунду
    const intervalId = setInterval(() => {
      if (!summary) return;

      const now = new Date().getTime();
      const startTime = new Date(summary.contest.starts_at).getTime();
      const started = now >= startTime;

      if (started) {
        // Конкурс начался - перезагружаем данные (useMemo автоматически обновит contestHasStarted)
        loadContestData();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [contestHasStarted, summary, loadContestData]);

  // Мемоизируем расчет прогресса конкурса
  const contestProgress = useMemo(() => {
    if (!summary) return { daysRemaining: 0, daysTotal: 0, percent: 0 };

    const now = new Date().getTime();
    const start = new Date(summary.contest.starts_at).getTime();
    const end = new Date(summary.contest.ends_at).getTime();

    const total = end - start;
    const remaining = Math.max(0, end - now);
    const percent = total > 0 ? Math.max(0, Math.min(100, ((total - remaining) / total) * 100)) : 0;

    const daysTotal = Math.ceil(total / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));

    return { daysRemaining, daysTotal, percent };
  }, [summary]);

  const handleShare = useCallback(async () => {
    if (!summary) return;

    try {
      triggerHaptic('medium');

      const webApp = getTelegramWebApp();

      // Используем Telegram Share API для приглашения друзей
      if (webApp && webApp.openTelegramLink) {
        // Формируем текст для приглашения (без ссылки, она добавится автоматически)
        const shareText = `🎁 Розыгрыш Outlivion VPN!\n\nИспользуй мою реферальную ссылку и получи больше билетов для участия!`;
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(summary.ref_link)}&text=${encodeURIComponent(shareText)}`;

        webApp.openTelegramLink(shareUrl);
      } else if (navigator.share) {
        // Fallback: используем Web Share API
        await navigator.share({
          title: 'Розыгрыш Outlivion VPN',
          text: `Присоединяйся к розыгрышу Outlivion VPN! Используй мою реферальную ссылку: ${summary.ref_link}`,
          url: summary.ref_link,
        });
      } else {
        // Fallback: копируем в буфер обмена
        const { copyToClipboard } = await import('@/lib/utils/clipboard');
        const copied = await copyToClipboard(summary.ref_link);

        if (copied) {
          const webApp = getTelegramWebApp();
          if (webApp) {
            webApp.showAlert('✅ Реферальная ссылка скопирована');
          }
        } else {
          logError('Failed to copy referral link', new Error('Clipboard API not available'), {
            page: 'contest',
            action: 'share',
          });
        }
      }
    } catch (err) {
      // Если пользователь отменил share, это не ошибка
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      logError('Failed to share referral link', err, {
        page: 'contest',
        action: 'share',
      });
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

  // Если конкурс еще не начался, показываем экран ожидания
  // contestHasStarted === false означает что конкурс еще не начался
  const shouldShowCountdown = contestHasStarted === false;

  if (shouldShowCountdown) {
    return (
      <Suspense fallback={
        <main className="w-full text-white pt-[calc(100px+env(safe-area-inset-top))] pl-4 pr-4 font-sans select-none flex flex-col min-h-screen">
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60">Загрузка...</p>
            </div>
          </div>
        </main>
      }>
        <ContestCountdownScreen
          contestTitle={summary.contest.title}
          startsAt={summary.contest.starts_at}
        />
      </Suspense>
    );
  }

  return (
    <main className="w-full text-white pt-[calc(100px+env(safe-area-inset-top))] pl-4 pr-4 font-sans select-none flex flex-col h-fit pb-[calc(40px+env(safe-area-inset-bottom))] relative">
      {/* Header with Back Button */}
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

      {/* Contest Summary */}
      <Suspense fallback={<div className="h-56 bg-white/5 rounded-2xl animate-pulse mb-6 relative z-10" />}>
        <ContestSummaryCard
          summary={summary}
          progress={contestProgress}
        />
      </Suspense>

      {/* Invite Section */}
      <div className="mb-6 relative z-10">
        <button
          onClick={handleShare}
          className="w-full bg-gradient-to-r from-[#F55128] to-[#FF6B3D] hover:from-[#d43d1f] hover:to-[#e55a2d] active:scale-[0.98] transition-all duration-200 rounded-[10px] py-2 px-4 text-white font-medium text-base shadow-xl flex items-center justify-center gap-3 border border-white/20"
        >
          <span className="text-2xl">🎁</span>
          <span>Пригласить друзей</span>
        </button>
      </div>

      {/* Friends List */}
      <Suspense fallback={<div className="h-64 bg-white/5 rounded-2xl animate-pulse mb-6 relative z-10" />}>
        <FriendsList friends={friends} />
      </Suspense>

      {/* Tickets History */}
      <Suspense fallback={<div className="h-64 bg-white/5 rounded-2xl animate-pulse mb-6 relative z-10" />}>
        <TicketsHistory tickets={tickets} />
      </Suspense>

      {/* Rules Button */}
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

      {/* Rules Modal */}
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
