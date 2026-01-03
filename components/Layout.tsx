import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { ChevronRight, User, CreditCard, Settings, HelpCircle, LogOut, Moon, Sun } from 'lucide-react';
import { AnimatedOutlet } from './AnimatedOutlet';
import { VpnConnectionCard } from './VpnConnectionCard';
import { BillingPlanCard } from './BillingPlanCard';
import { UsageChartCard } from './UsageChartCard';
import { PaymentHistoryCard } from './PaymentHistoryCard';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useTheme } from '../hooks/useTheme';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/account', label: 'Основное', icon: <User size={18} />, group: 'account' },
  { to: '/account/billing', label: 'Биллинг', icon: <CreditCard size={18} />, group: 'account' },
  { to: '/instructions', label: 'Настройка', icon: <Settings size={18} />, group: 'help' },
  { to: '/support', label: 'Поддержка', icon: <HelpCircle size={18} />, group: 'help' },
];

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/account': { title: 'Аккаунт', description: 'Управление аккаунтом и настройками' },
  '/account/billing': { title: 'Биллинг', description: 'Управление подпиской и платежами' },
  '/instructions': { title: 'Настройка', description: 'Активация доступа в три простых шага' },
  '/support': { title: 'Поддержка', description: 'Центр поддержки и помощи' },
  '/pay': { title: 'Оплата', description: 'Выбор и оплата тарифа' },
  '/result': { title: 'Результат', description: 'Статус оплаты' },
};

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const { theme, toggleTheme } = useTheme();

  // Для HashRouter путь может быть с хешем, нормализуем его
  const pathname = location.pathname || location.hash.replace('#', '') || '/';
  
  const pageInfo = useMemo(() => {
    return PAGE_TITLES[pathname] || { title: 'Аккаунт', description: 'Управление аккаунтом и настройками' };
  }, [pathname]);

  const helpItems = NAV_ITEMS.filter(item => item.group === 'help');
  
  // Определяем, какой контент показывать на главной странице аккаунта
  const isAccountRoot = pathname === '/account' || pathname === '/';
  // Определяем, показывать ли блоки биллинга (только на странице биллинга)
  const isBillingPage = pathname === '/account/billing';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="w-full h-14 border-b border-border sticky top-0 bg-[var(--background)]/80 backdrop-blur-md z-50 flex justify-center items-center" style={{ borderBottomColor: 'var(--border)' }}>
        <div className="w-full max-w-[788px] h-full px-4 md:px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/account"><Logo className="w-6 h-6 text-fg-4" /></Link>
            <div className="flex items-center gap-2 text-[13px] font-medium text-fg-2">
              <ChevronRight size={14} className="opacity-30" />
              <div className="flex items-center gap-1.5 p-1 px-2 hover:bg-bg-2 rounded-full transition-colors cursor-pointer text-fg-4 font-medium">
                 <div className="w-4 h-4 bg-[var(--contrast-bg)] rounded flex items-center justify-center">
                   <Logo className="w-2.5 h-2.5 text-[var(--contrast-text)]" />
                 </div>
                 <span>Аккаунт</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full border border-border bg-bg-2 text-fg-4 flex items-center justify-center transition-colors hover:bg-bg-3"
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
              aria-pressed={theme === 'dark'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/account" className="w-8 h-8 rounded-full overflow-hidden border border-border">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username || 'Пользователь'} />
              ) : (
                <div className="w-full h-full bg-bg-2 flex items-center justify-center text-fg-3 text-xs font-bold">
                  {user?.username?.[0]?.toUpperCase() || 'П'}
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Title */}
      {!isOnline && (
        <div className="w-full bg-[var(--warning-bg)] text-[var(--warning-text)] text-xs font-medium py-2 px-4 text-center border-b border-[var(--warning-border)]">
          Вы офлайн. Некоторые действия могут быть недоступны.
        </div>
      )}
      <div className="w-full pt-8 md:pt-16 pb-2 flex flex-col items-center gap-1 text-center px-4">
        <h1 className="text-xl md:text-2xl font-medium tracking-tight text-fg-4">
          {pageInfo.title}
        </h1>
        <p className="text-xs md:text-sm text-fg-2">{pageInfo.description}</p>
      </div>

      {/* Main Grid */}
      <div className="w-full max-w-[788px] mx-auto px-4 md:px-5 py-6 md:py-10 flex flex-col md:flex-row gap-6 md:gap-7 flex-1">
        <aside className="w-full md:w-56 shrink-0">
          <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-1 md:gap-1 tabs-scrollbar">
            {/* Account Section */}
            <SidebarLink 
              to="/account" 
              label="Аккаунт"
              icon={<User size={18} />}
              active={pathname === '/account' || (pathname.startsWith('/account') && pathname !== '/account/billing')}
            />
            
            <SidebarLink 
              to="/account/billing" 
              label="Биллинг"
              icon={<CreditCard size={18} />}
              active={pathname === '/account/billing'}
            />

            <div className="hidden md:block h-px bg-border my-4 mx-3" />
            
            {/* Help Section */}
            {helpItems.map((item) => (
              <SidebarLink 
                key={item.to}
                to={item.to} 
                label={item.label}
                icon={item.icon}
                active={pathname === item.to}
              />
            ))}

            {/* Logout - desktop only in sidebar */}
            {user && (
              <div className="hidden md:block">
                <div className="h-px bg-border my-4 mx-3" />
                <button
                  onClick={logout}
                  className="sidebar-link w-full text-left"
                  aria-label="Выйти из аккаунта"
                >
                  <LogOut size={18} />
                  <span>Выйти</span>
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 w-full max-w-[768px] md:w-[496px]">
          {isAccountRoot && <VpnConnectionCard />}
          {isAccountRoot && <BillingPlanCard />}
          
          {isBillingPage && <UsageChartCard />}
          {isBillingPage && <PaymentHistoryCard />}
          
          <AnimatedOutlet />
        </main>
      </div>

      <footer className="pt-2.5 pb-2.5 text-center border-t border-border mt-0">
         <p className="text-xs font-medium text-fg-1">© 2025 Outlivion. Простой и красивый VPN-дашборд.</p>
      </footer>
    </div>
  );
};

const SidebarLink = ({ 
  to, 
  label, 
  icon, 
  active 
}: { 
  to: string; 
  label: string; 
  icon?: React.ReactNode; 
  active: boolean;
}) => (
  <Link 
    to={to} 
    className={`sidebar-link group relative shrink-0 ${
      active ? 'active' : ''
    }`}
    data-active={active}
    aria-current={active ? 'page' : undefined}
  >
    {icon && (
      <span className={`shrink-0 transition-colors ${
        active ? 'text-fg-4' : 'text-fg-2 group-hover:text-fg-4'
      }`}>
        {icon}
      </span>
    )}
    <span className="flex-1 font-medium whitespace-nowrap">{label}</span>
    {active && (
      <div className="absolute left-0 md:left-0 bottom-0 md:top-1/2 md:-translate-y-1/2 w-full md:w-1 h-0.5 md:h-6 bg-[var(--primary)] rounded-t-full md:rounded-r-full" 
           aria-hidden="true" />
    )}
  </Link>
);
