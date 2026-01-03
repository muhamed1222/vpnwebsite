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
import { Toaster } from 'react-hot-toast';

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

  // Используем useCallback для функций, чтобы они не менялись между рендерами
  const login = useCallback(async () => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      logger.debug('[Login] Режим разработки - создание мокового пользователя');
      const mockUser = {
        id: 'usr_1',
        telegramId: 12345678,
        username: 'Muhamed Chalemat',
        avatar: 'https://i.pravatar.cc/150?img=68',
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      // Перезагружаем для подхвата пользователя
      window.location.reload();
      return;
    }
    logger.debug('[Login] Авторизация уже выполнена через Telegram WebApp');
    // Авторизация происходит автоматически через useTelegramAuth
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    apiService.clearCache();
    setSubscription({ status: SubscriptionStatus.NONE });
    // Перезагружаем для полной очистки состояния
    window.location.reload();
  }, []);

  // Настройка обработчика 401 ошибки
  useEffect(() => {
    apiService.setUnauthorizedHandler(() => {
      console.warn('[App] Session expired, logging out...');
      logout();
    });
  }, [logout]);

  const refreshSubscription = useCallback(async (force = false) => {
    if (authState !== 'authenticated') {
      return;
    }

    try {
      const status = await apiService.getUserStatus(force);
      if (status.ok) {
        const now = Math.floor(Date.now() / 1000);
        let subStatus = SubscriptionStatus.NONE;
        
        if (status.status === 'active') {
          if (status.expiresAt === 0 || (status.expiresAt && status.expiresAt > now)) {
            subStatus = SubscriptionStatus.ACTIVE;
          } else {
            subStatus = SubscriptionStatus.EXPIRED;
          }
        } else if (status.status === 'disabled' || status.status === 'on_hold') {
          subStatus = SubscriptionStatus.EXPIRED;
        }

        setSubscription({
          status: subStatus,
          activeUntil: status.expiresAt && status.expiresAt > 0 
            ? new Date(status.expiresAt * 1000).toLocaleDateString('ru-RU')
            : (status.expiresAt === 0 ? 'Безлимит' : undefined),
          planId: undefined,
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') return;
      console.error('Ошибка при обновлении подписки:', error);
    }
  }, [authState]);

  // Загрузка данных пользователя после успешной авторизации
  useEffect(() => {
    if (authState === 'loading') return;

    if (authState !== 'authenticated' || !telegramUser) {
      setLoading(false);
      return;
    }

    const loadUserData = async () => {
      try {
        const userData: User = {
          id: `usr_${telegramUser.tgId}`,
          telegramId: telegramUser.tgId,
          username: telegramUser.firstName || telegramUser.username || `User ${telegramUser.tgId}`,
          avatar: telegramUser.photoUrl
        };

        setUser(userData);
        await refreshSubscription();
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
        setLoading(false);
      }
    };

    loadUserData();
  }, [authState, telegramUser, refreshSubscription]);

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
    // На localhost разрешаем продолжить без Telegram для отладки
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (authState === 'not_in_telegram' && !isLocal) {
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
        <Toaster position="top-center" reverseOrder={false} />
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
