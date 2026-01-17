'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getTelegramInitData } from '@/lib/telegram';
import { logError } from '@/lib/utils/logging';

interface ContestParticipant {
  referrer_id: number;
  referrer_name: string | null;
  referrer_username: string | null;
  tickets_total: number;
  invited_total: number;
  qualified_total: number;
  rank: number;
  orders: Array<{
    order_id: string;
    payment_date: string;
    invitee_id: number;
    invitee_name: string | null;
    plan_id: string;
    months: number;
    tickets: number;
  }>;
}

export default function AdminContestPage() {
  const [participants, setParticipants] = useState<ContestParticipant[]>([]);
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

        // Сначала получаем активный конкурс (без headers для админов - используется сессия)
        const contestResponse = await fetch('/api/contest/active', { 
          headers: initData ? headers : undefined 
        });
        
        if (!contestResponse.ok) {
          setError('Не удалось загрузить конкурс');
          setLoading(false);
          return;
        }

        const contestData = await contestResponse.json();
        
        if (!contestData.ok || !contestData.contest) {
          setError('Активный конкурс не найден');
          setLoading(false);
          return;
        }

        const activeContestId = contestData.contest.id;
        setContestId(activeContestId);

        // Загружаем участников
        const participantsResponse = await fetch(
          `/api/admin/contest/participants?contest_id=${activeContestId}`,
          { headers }
        );

        if (!participantsResponse.ok) {
          if (participantsResponse.status === 403) {
            setError('Доступ запрещен. Требуются права администратора.');
          } else {
            setError('Не удалось загрузить участников');
          }
          setLoading(false);
          return;
        }

        const participantsData = await participantsResponse.json();
        
        if (!participantsData.ok) {
          setError(participantsData.error || 'Ошибка загрузки данных');
          setLoading(false);
          return;
        }

        setParticipants(participantsData.participants || []);
      } catch (err) {
        logError('Failed to load contest participants', err, {
          page: 'admin-contest',
          action: 'loadData'
        });
        setError('Произошла ошибка при загрузке данных');
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
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setAuthError(data.error || 'Неверный пароль');
      }
    } catch (err) {
      setAuthError('Ошибка при авторизации');
    }
  };

  // Функция экспорта в Excel (CSV формат)
  const exportToExcel = () => {
    if (participants.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    // Создаем строки для CSV
    const rows: string[] = [];
    
    // Заголовки
    rows.push('Место;ID участника;Имя участника;Username;Билетов всего;Приглашено друзей;Квалифицированных;ID заказа;Дата оплаты;ID приглашенного;Имя приглашенного;Тариф;Месяцев;Билетов');

    // Данные участников
    participants.forEach((participant) => {
      if (participant.orders.length === 0) {
        // Участник без заказов
        rows.push(
          `${participant.rank};${participant.referrer_id};${participant.referrer_name || ''};${participant.referrer_username || ''};${participant.tickets_total};${participant.invited_total};${participant.qualified_total};;;;;;;`
        );
      } else {
        // Участник с заказами
        participant.orders.forEach((order, orderIndex) => {
          const paymentDate = new Date(order.payment_date).toLocaleDateString('ru-RU');
          rows.push(
            `${orderIndex === 0 ? participant.rank : ''};${orderIndex === 0 ? participant.referrer_id : ''};${orderIndex === 0 ? participant.referrer_name || '' : ''};${orderIndex === 0 ? participant.referrer_username || '' : ''};${orderIndex === 0 ? participant.tickets_total : ''};${orderIndex === 0 ? participant.invited_total : ''};${orderIndex === 0 ? participant.qualified_total : ''};${order.order_id};${paymentDate};${order.invitee_id};${order.invitee_name || ''};${order.plan_id};${order.months};${order.tickets}`
          );
        });
      }
    });

    // Создаем CSV файл
    const csvContent = rows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `contest_participants_${contestId || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Подсчет общей статистики
  const totalStats = useMemo(() => {
    return {
      totalParticipants: participants.length,
      totalTickets: participants.reduce((sum, p) => sum + p.tickets_total, 0),
      totalInvited: participants.reduce((sum, p) => sum + p.invited_total, 0),
      totalQualified: participants.reduce((sum, p) => sum + p.qualified_total, 0),
      totalOrders: participants.reduce((sum, p) => sum + p.orders.length, 0),
    };
  }, [participants]);

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
          <h1 className="text-3xl font-bold mb-2">Участники конкурса</h1>
          <p className="text-white/60">Админ-панель для просмотра статистики участников</p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-[#121212] rounded-[10px] p-4 border border-white/10">
            <div className="text-white/60 text-sm mb-1">Участников</div>
            <div className="text-2xl font-bold text-white">{totalStats.totalParticipants}</div>
          </div>
          <div className="bg-[#121212] rounded-[10px] p-4 border border-white/10">
            <div className="text-white/60 text-sm mb-1">Билетов всего</div>
            <div className="text-2xl font-bold text-white">{totalStats.totalTickets}</div>
          </div>
          <div className="bg-[#121212] rounded-[10px] p-4 border border-white/10">
            <div className="text-white/60 text-sm mb-1">Приглашено</div>
            <div className="text-2xl font-bold text-white">{totalStats.totalInvited}</div>
          </div>
          <div className="bg-[#121212] rounded-[10px] p-4 border border-white/10">
            <div className="text-white/60 text-sm mb-1">Квалифицированных</div>
            <div className="text-2xl font-bold text-white">{totalStats.totalQualified}</div>
          </div>
          <div className="bg-[#121212] rounded-[10px] p-4 border border-white/10">
            <div className="text-white/60 text-sm mb-1">Заказов</div>
            <div className="text-2xl font-bold text-white">{totalStats.totalOrders}</div>
          </div>
        </div>

        {/* Кнопка экспорта */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={exportToExcel}
            disabled={participants.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#F55128] hover:bg-[#d43d1f] disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed active:scale-95 transition-all rounded-[10px] text-white font-medium"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Экспорт в Excel
          </button>
        </div>

        {/* Таблица */}
        <div className="bg-[#121212] rounded-[10px] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-white/80 text-sm font-semibold">Место</th>
                  <th className="px-4 py-3 text-white/80 text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-white/80 text-sm font-semibold">Имя</th>
                  <th className="px-4 py-3 text-white/80 text-sm font-semibold">Username</th>
                  <th className="px-4 py-3 text-white/80 text-sm font-semibold">Билетов</th>
                  <th className="px-4 py-3 text-white/80 text-sm font-semibold">Приглашено</th>
                  <th className="px-4 py-3 text-white/80 text-sm font-semibold">Квалиф.</th>
                  <th className="px-4 py-3 text-white/80 text-sm font-semibold">Заказов</th>
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-white/60">
                      Участников пока нет
                    </td>
                  </tr>
                ) : (
                  participants.map((participant) => (
                    <tr
                      key={participant.referrer_id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-white font-medium">#{participant.rank}</td>
                      <td className="px-4 py-3 text-white/80 font-mono text-sm">{participant.referrer_id}</td>
                      <td className="px-4 py-3 text-white">{participant.referrer_name || '—'}</td>
                      <td className="px-4 py-3 text-white/60 text-sm">@{participant.referrer_username || '—'}</td>
                      <td className="px-4 py-3 text-white font-bold">{participant.tickets_total}</td>
                      <td className="px-4 py-3 text-white/80">{participant.invited_total}</td>
                      <td className="px-4 py-3 text-white/80">{participant.qualified_total}</td>
                      <td className="px-4 py-3 text-white/80">{participant.orders.length}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Детали заказов (раскрывающийся список) */}
        {participants.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Детали заказов</h2>
            <div className="space-y-4">
              {participants.map((participant) => (
                participant.orders.length > 0 && (
                  <div key={participant.referrer_id} className="bg-[#121212] rounded-[10px] p-4 border border-white/10">
                    <div className="mb-2">
                      <span className="text-white/60 text-sm">Участник:</span>{' '}
                      <span className="text-white font-medium">
                        {participant.referrer_name || `ID: ${participant.referrer_id}`}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 border-b border-white/10">
                          <tr>
                            <th className="px-3 py-2 text-white/80 font-semibold">ID заказа</th>
                            <th className="px-3 py-2 text-white/80 font-semibold">Дата оплаты</th>
                            <th className="px-3 py-2 text-white/80 font-semibold">ID приглашенного</th>
                            <th className="px-3 py-2 text-white/80 font-semibold">Имя</th>
                            <th className="px-3 py-2 text-white/80 font-semibold">Тариф</th>
                            <th className="px-3 py-2 text-white/80 font-semibold">Месяцев</th>
                            <th className="px-3 py-2 text-white/80 font-semibold">Билетов</th>
                          </tr>
                        </thead>
                        <tbody>
                          {participant.orders.map((order) => (
                            <tr key={order.order_id} className="border-b border-white/5">
                              <td className="px-3 py-2 text-white/80 font-mono text-xs">{order.order_id}</td>
                              <td className="px-3 py-2 text-white/80">
                                {new Date(order.payment_date).toLocaleDateString('ru-RU')}
                              </td>
                              <td className="px-3 py-2 text-white/80 font-mono text-xs">{order.invitee_id}</td>
                              <td className="px-3 py-2 text-white/80">{order.invitee_name || '—'}</td>
                              <td className="px-3 py-2 text-white/80">{order.plan_id}</td>
                              <td className="px-3 py-2 text-white/80">{order.months}</td>
                              <td className="px-3 py-2 text-white font-bold">{order.tickets}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
