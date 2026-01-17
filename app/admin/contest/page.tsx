'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getTelegramInitData } from '@/lib/telegram';
import { handleComponentError } from '@/lib/utils/errorHandler';

interface ContestTicket {
  referrer_id: number; // ID участника (получатель билета)
  referred_id: number; // ID приглашенного (или сам участник для SELF_PURCHASE)
  order_id: string; // ID заказа
  created_at: string; // Дата и время создания билета
}

export default function AdminContestPage() {
  const [tickets, setTickets] = useState<ContestTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contestId, setContestId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth');
        const data = await response.json();
        setIsAuthenticated(data.authenticated || false);
      } catch (err) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Загружаем данные конкурса
  useEffect(() => {
    if (isAuthenticated !== true) {
      return; // Не загружаем данные пока не авторизованы
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        // Пытаемся получить Telegram initData (если есть), если нет - используем сессию
        const initData = getTelegramInitData();
        if (initData) {
          headers['Authorization'] = initData;
        }

        // Для админов: используем известный ID конкурса напрямую
        // (так как getActiveContest проверяет даты, а конкурс может еще не начаться)
        const KNOWN_CONTEST_ID = '550e8400-e29b-41d4-a716-446655440000';
        
        // Пробуем сначала получить через /api/contest/active (для проверки)
        const contestResponse = await fetch('/api/contest/active', { 
          headers: initData ? headers : undefined,
          credentials: 'include',
          cache: 'no-store' // Не кешируем для админов
        });
        
        let activeContestId: string = KNOWN_CONTEST_ID; // По умолчанию используем известный ID
        
        if (contestResponse.ok) {
          const contestData = await contestResponse.json();
          
          if (contestData.ok && contestData.contest) {
            // Проверяем, что это не mock конкурс и не старый деактивированный конкурс
            if (contestData.contest.id !== 'upcoming-contest-mock' && 
                contestData.contest.id !== 'dev-mock-contest' &&
                contestData.contest.id !== 'contest-20260117') { // Игнорируем старый конкурс
              activeContestId = contestData.contest.id;
            }
          }
        }
        
        setContestId(activeContestId);

        // Загружаем билеты (развернутые)
        const ticketsResponse = await fetch(
          `/api/admin/contest/participants?contest_id=${activeContestId}`,
          { 
            headers,
            credentials: 'include' // Важно: передаем cookies для админской сессии
          }
        );

        if (!ticketsResponse.ok) {
          if (ticketsResponse.status === 403) {
            setError('Доступ запрещен. Требуются права администратора.');
          } else {
            setError('Не удалось загрузить билеты');
          }
          setLoading(false);
          return;
        }

        const ticketsData = await ticketsResponse.json();
        
        if (!ticketsData.ok) {
          setError(ticketsData.error || 'Ошибка загрузки данных');
          setLoading(false);
          return;
        }

        setTickets(ticketsData.tickets || []);
      } catch (err) {
        const errorMessage = handleComponentError(err, 'admin-contest', 'loadData');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  // Обработка входа по паролю
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'include' // Важно: для установки cookie
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setPassword('');
        // Перезагружаем страницу для применения cookie
        window.location.reload();
      } else {
        setAuthError(data.error || 'Неверный пароль');
      }
    } catch (err) {
      setAuthError('Ошибка при авторизации');
    }
  };

  // Функция экспорта в Excel (CSV формат)
  const exportToExcel = () => {
    if (tickets.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    // Создаем строки для CSV
    const rows: string[] = [];
    
    // Заголовки
    rows.push('№;ID участника;Пригласил ID;Order ID;Дата и время покупки');

    // Данные билетов (каждая строка = один билет)
    tickets.forEach((ticket, index) => {
      const date = ticket.created_at ? new Date(ticket.created_at).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : '-';
      rows.push(`${index + 1};${ticket.referrer_id};${ticket.referred_id};${ticket.order_id};${date}`);
    });

    // Создаем CSV файл
    const csvContent = rows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `contest_tickets_${contestId || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Подсчет общей статистики
  const totalStats = useMemo(() => {
    const uniqueParticipants = new Set(tickets.map(t => t.referrer_id)).size;
    return {
      totalTickets: tickets.length,
      totalParticipants: uniqueParticipants,
    };
  }, [tickets]);

  // Форма входа
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121212] rounded-[16px] p-8 border border-white/10">
          <h1 className="text-2xl font-bold mb-2 text-center">Вход в админ-панель</h1>
          <p className="text-white/60 text-center mb-6">Введите пароль для доступа</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-[10px] text-white placeholder-white/40 focus:outline-none focus:border-[#F55128] transition-colors"
                autoFocus
                required
              />
            </div>
            
            {authError && (
              <div className="text-red-500 text-sm text-center">{authError}</div>
            )}
            
            <button
              type="submit"
              className="w-full px-4 py-3 bg-[#F55128] hover:bg-[#d43d1f] active:scale-95 transition-all rounded-[10px] text-white font-medium"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121212] rounded-[16px] p-6 border border-white/10 text-center">
          <h2 className="text-xl font-bold mb-2 text-red-500">Ошибка</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#F55128] hover:bg-[#d43d1f] active:scale-95 transition-all rounded-[10px] text-white font-medium"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Билеты конкурса</h1>
          <p className="text-white/60">Список всех билетов для розыгрыша (каждая строка = один билет)</p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#121212] rounded-[10px] p-4 border border-white/10">
            <div className="text-white/60 text-sm mb-1">Билетов всего</div>
            <div className="text-2xl font-bold text-white">{totalStats.totalTickets}</div>
          </div>
          <div className="bg-[#121212] rounded-[10px] p-4 border border-white/10">
            <div className="text-white/60 text-sm mb-1">Участников</div>
            <div className="text-2xl font-bold text-white">{totalStats.totalParticipants}</div>
          </div>
        </div>

        {/* Кнопка экспорта */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={exportToExcel}
            disabled={tickets.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#F55128] hover:bg-[#d43d1f] disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed active:scale-95 transition-all rounded-[10px] text-white font-medium"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Экспорт в Excel
          </button>
        </div>

        {/* Таблица билетов */}
        <div className="bg-[#121212] rounded-[10px] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-white/80 text-sm font-semibold">№</th>
                  <th className="px-4 py-3 text-white/80 text-sm font-semibold">ID участника</th>
                  <th className="px-4 py-3 text-white/80 text-sm font-semibold">Пригласил ID</th>
                  <th className="px-4 py-3 text-white/80 text-sm font-semibold">Order ID</th>
                  <th className="px-4 py-3 text-white/80 text-sm font-semibold">Дата и время покупки</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-white/60">
                      Билетов пока нет
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket, index) => {
                    const date = ticket.created_at ? new Date(ticket.created_at).toLocaleString('ru-RU', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    }) : '-';
                    return (
                      <tr
                        key={`${ticket.referrer_id}-${ticket.order_id}-${index}`}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 text-white/80 font-mono text-sm">{index + 1}</td>
                        <td className="px-4 py-3 text-white font-mono text-sm">{ticket.referrer_id}</td>
                        <td className="px-4 py-3 text-white/80 font-mono text-sm">{ticket.referred_id}</td>
                        <td className="px-4 py-3 text-white/60 font-mono text-xs">{ticket.order_id}</td>
                        <td className="px-4 py-3 text-white/70 font-mono text-sm">{date}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
