import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { AccountGeneral } from './pages/AccountGeneral';
import { AccountBilling } from './pages/AccountBilling';
import { Pay } from './pages/Pay';
import { Result } from './pages/Result';
import { PayReturn } from './pages/PayReturn';
import { Instructions } from './pages/Instructions';
import { Support } from './pages/Support';
import { User, Subscription, SubscriptionStatus } from './types';
import { AuthContext } from './context/AuthContext';
import { apiService } from './services/apiService';
import { logger } from './utils/logger';
import { useTelegramAuth } from './hooks/useTelegramAuth';
import { TelegramRequired } from './components/TelegramRequired';

const mapSubscription = (subscription: {
  isActive: boolean;
  expiresAt: number | null;
}): Subscription => {
  const now = Date.now();
  const expiresAt = subscription.expiresAt;
  const isStillActive = typeof expiresAt === 'number' && expiresAt > now;

  let status = SubscriptionStatus.NONE;
  if (subscription.isActive || isStillActive) {
    status = SubscriptionStatus.ACTIVE;
  } else if (typeof expiresAt === 'number' && expiresAt <= now) {
    status = SubscriptionStatus.EXPIRED;
  }

  return {
    status,
    activeUntil: status === SubscriptionStatus.ACTIVE && typeof expiresAt === 'number'
      ? new Date(expiresAt).toLocaleDateString('ru-RU')
      : undefined,
    planId: undefined,
  };
};

const App: React.FC = () => {
  // ВСЕ хуки должны быть вызваны на верхнем уровне, до любых условных return'ов
  const { state: authState, user: telegramUser } = useTelegramAuth();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription>({
    status: SubscriptionStatus.NONE
  });
  const [loading, setLoading] = useState(true);

  // Загрузка данных пользователя после успешной авторизации
  useEffect(() => {
    // Если авторизация еще не завершена, не делаем ничего
    if (authState === 'loading') {
      return;
    }

    // Если не авторизован или ошибка, завершаем загрузку
    if (authState !== 'authenticated' || !telegramUser) {
      setLoading(false);
      return;
    }

    // Авторизация прошла успешно, загружаем данные пользователя
    const loadUserData = async () => {
      try {
        // Используем данные из telegramUser (получены при авторизации)
        const userData: User = {
          id: `usr_${telegramUser.tgId}`,
          telegramId: telegramUser.tgId,
          username: telegramUser.firstName || telegramUser.username || `User ${telegramUser.tgId}`,
          avatar: undefined
        };

        setUser(userData);

        // TODO: Загрузить подписку из API, когда будет соответствующий эндпоинт
        // Пока оставляем пустую подписку
        setSubscription({ status: SubscriptionStatus.NONE });
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
        setLoading(false);
      }
    };

    loadUserData();
  }, [authState, telegramUser]);

  // Используем useCallback для функций, чтобы они не менялись между рендерами
  const login = useCallback(async () => {
    logger.debug('[Login] Авторизация уже выполнена через Telegram WebApp');
    // Авторизация происходит автоматически через useTelegramAuth
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    setSubscription({ status: SubscriptionStatus.NONE });
    // TODO: Возможно, нужно будет вызвать API для выхода
    // Пока просто перезагружаем страницу
    window.location.reload();
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (authState !== 'authenticated') {
      return;
    }

    try {
      // TODO: Загрузить подписку из API, когда будет соответствующий эндпоинт
      // const apiUser = await apiService.getMe();
      // setSubscription(mapSubscription(apiUser.subscription));
    } catch (error) {
      console.error('Ошибка при обновлении подписки:', error);
    }
  }, [authState]);

  // Мемоизируем значение контекста
  const authContextValue = useMemo(() => ({
    user,
    subscription,
    loading,
    login,
    logout,
    refreshSubscription,
  }), [user, subscription, loading, login, logout, refreshSubscription]);

  // Определяем, какой контент показывать (после всех хуков)
  const renderContent = () => {
    // Если не в Telegram, показываем экран с требованием открыть через Telegram
    if (authState === 'not_in_telegram') {
      const botUrl = 'https://t.me/outlivion_bot?start=login'; // Ссылка на вашего основного бота
      return <TelegramRequired botUrl={botUrl} />;
    }

    // Если ошибка авторизации
    if (authState === 'error') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-[var(--card)] rounded-2xl p-8 shadow-lg">
              <h1 className="text-2xl font-bold text-[var(--fg)] mb-4">
                Ошибка авторизации
              </h1>
              <p className="text-[var(--fg-2)] mb-8">
                Не удалось выполнить авторизацию. Пожалуйста, перезагрузите страницу.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Перезагрузить
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Если загрузка авторизации
    if (authState === 'loading' || loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-fg-2">Загрузка...</p>
          </div>
        </div>
      );
    }

    // Если авторизация прошла, но пользователь еще не загружен
    if (authState === 'authenticated' && !user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-fg-2">Загрузка данных пользователя...</p>
          </div>
        </div>
      );
    }

    // Основной рендер приложения
    return (
      <AuthContext.Provider value={authContextValue}>
        <Router>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/account" /> : <Home />} />
            <Route element={<ProtectedRoute user={user} />}>
              <Route element={<Layout />}>
                <Route path="/account" element={<AccountGeneral />} />
                <Route path="/account/billing" element={<AccountBilling />} />
                <Route path="/pay" element={<Pay />} />
                <Route path="/pay/return" element={<PayReturn />} />
                <Route path="/result" element={<Result />} />
                <Route path="/instructions" element={<Instructions />} />
                <Route path="/support" element={<Support />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthContext.Provider>
    );
  };

  // Всегда возвращаем результат renderContent (все хуки уже вызваны)
  return renderContent();
};

const ProtectedRoute: React.FC<{ user: User | null }> = ({ user }) => {
  if (!user) return <Navigate to="/" />;
  return <Outlet />;
};

export default App;
