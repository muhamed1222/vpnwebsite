import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PLATFORMS } from '../constants';
import { Download, ExternalLink, Laptop, Monitor, Apple, Tablet, AlertCircle, Loader2 } from 'lucide-react';
import { useVpnKey } from '../hooks/useVpnKey';
import { VpnKeyCode } from '../components/VpnKeyCode';

const PlatformIcon = ({ id, size = 20 }: { id: string, size?: number }) => {
  switch (id) {
    case 'ios': return <Apple size={size} />;
    case 'android': return <Tablet size={size} />;
    case 'windows': return <Monitor size={size} />;
    case 'macos': return <Apple size={size} />;
    default: return <Laptop size={size} />;
  }
};

// Ссылки на скачивание приложений для разных платформ (синхронизировано с ботом)
const DOWNLOAD_LINKS: Record<string, { url: string; name: string }> = {
  ios: { url: 'https://apps.apple.com/ru/app/v2raytun/id6476628951', name: 'v2RayTUN' },
  android: { url: 'https://play.google.com/store/apps/details?id=com.happproxy', name: 'Happ' },
  windows: { url: 'https://storage.v2raytun.com/v2RayTun_Setup.exe', name: 'v2RayTUN (Setup)' },
  macos: { url: 'https://github.com/yanue/V2rayU/releases', name: 'v2rayU' },
};

export const Instructions: React.FC = () => {
  // Загружаем сохраненную платформу из localStorage или используем первую по умолчанию
  const getInitialPlatform = () => {
    const saved = localStorage.getItem('selectedPlatform');
    return saved && PLATFORMS.find(p => p.id === saved) ? saved : PLATFORMS[0].id;
  };

  const [activePlatform, setActivePlatform] = useState(getInitialPlatform);
  const { vpnKey, loading, error } = useVpnKey();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabListRef = useRef<HTMLDivElement>(null);

  // Сохраняем выбор платформы в localStorage
  useEffect(() => {
    localStorage.setItem('selectedPlatform', activePlatform);
  }, [activePlatform]);

  // Обработка клавиатурной навигации
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = index > 0 ? index - 1 : PLATFORMS.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        newIndex = index < PLATFORMS.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = PLATFORMS.length - 1;
        break;
      default:
        return;
    }

    const newPlatform = PLATFORMS[newIndex];
    setActivePlatform(newPlatform.id);
    tabRefs.current[newIndex]?.focus();
  };

  const downloadLink = DOWNLOAD_LINKS[activePlatform];

  return (
    <div className="max-w-[800px] mx-auto space-y-10 animate-fade">
      {/* Tabs */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Выбор платформы"
        className="flex gap-1.5 bg-[var(--background)] p-1.5 rounded-2xl border border-border overflow-x-auto tabs-scrollbar"
        style={{ borderColor: 'var(--border)' }}
      >
        {PLATFORMS.map((p, index) => {
          const isActive = activePlatform === p.id;
          return (
            <button
              key={p.id}
              ref={(el) => { tabRefs.current[index] = el; }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`platform-content-${p.id}`}
              id={`platform-tab-${p.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActivePlatform(p.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`flex-1 min-w-[100px] py-3 px-3 md:px-4 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2.5 relative focus:outline-none focus:ring-2 focus:ring-[var(--contrast-bg)] focus:ring-offset-2 focus:ring-offset-[var(--background)] ${
                isActive
                  ? 'bg-[var(--contrast-bg)] text-[var(--contrast-text)] shadow-sm'
                  : 'text-fg-2 hover:text-fg-4 hover:bg-bg-2'
              }`}
            >
              <PlatformIcon id={p.id} size={16} />
              <span>{p.name}</span>
              {isActive && (
                <span className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[var(--contrast-text)] rounded-full" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div
        id={`platform-content-${activePlatform}`}
        role="tabpanel"
        aria-labelledby={`platform-tab-${activePlatform}`}
        className="card-premium p-5 space-y-12 mt-5 animate-fade"
        style={{ marginTop: '20px' }}
      >
        <div className="space-y-12">
          <Step 
            number="1" 
            title="Установка клиента"
            description={`Загрузите и установите официальное приложение для ${PLATFORMS.find(p => p.id === activePlatform)?.name}.`}
            action={
              downloadLink ? (
                <a
                  href={downloadLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 bg-[var(--contrast-bg)] text-[var(--contrast-text)] px-6 py-3 rounded-xl text-[13px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98] hover:bg-[var(--contrast-bg-hover)] w-full sm:w-fit"
                >
                  <Download size={16} /> Скачать из {downloadLink.name}
                  <ExternalLink size={14} />
                </a>
              ) : (
                <button 
                  disabled
                  className="flex items-center justify-center gap-2.5 bg-[var(--contrast-bg)] text-[var(--contrast-text)] px-6 py-3 rounded-xl text-[13px] font-bold cursor-not-allowed opacity-50 w-full sm:w-fit"
                >
                  <Download size={16} /> Скачать приложение
                </button>
              )
            }
          />
          <Step 
            number="2" 
            title="Копирование ключа"
            description="Ваш уникальный идентификатор для безопасного туннеля."
            action={
              <div className="flex flex-col gap-3">
                {error ? (
                  <div className="p-4 bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-xl flex items-start gap-2" role="alert">
                    <AlertCircle size={16} className="text-[var(--danger-text)] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-[var(--danger-text)] font-medium mb-1">{error}</p>
                      <Link 
                        to="/account" 
                        className="text-xs text-[var(--danger-text)] hover:underline font-medium"
                      >
                        Перейти в аккаунт →
                      </Link>
                    </div>
                  </div>
                ) : loading ? (
                  <div className="bg-bg-2 rounded-lg p-4 flex items-center gap-3">
                    <Loader2 size={16} className="text-fg-3 animate-spin" />
                    <span className="text-xs text-fg-2 font-medium">Загрузка VPN ключа...</span>
                  </div>
                ) : vpnKey ? (
                  <div className="bg-bg-2 rounded-lg p-4">
                    <VpnKeyCode value={vpnKey} />
                  </div>
                ) : (
                  <div className="p-4 bg-bg-2 border border-border rounded-xl">
                    <p className="text-xs text-fg-2">VPN ключ недоступен</p>
                  </div>
                )}
              </div>
            }
          />
          <Step 
            number="3" 
            title="Подключение"
            description="Запустите приложение, выберите «Импорт из буфера» и нажмите кнопку подключения."
          />
        </div>

        <div className="pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTopColor: 'var(--border)' }}>
          <p className="text-[13px] text-fg-2 font-medium">Нужна помощь с конфигурацией?</p>
          <Link 
            to="/support" 
            className="flex items-center gap-2 text-[13px] font-bold text-[var(--primary)] hover:translate-x-1 transition-transform"
          >
            Связаться с инженером <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

const Step: React.FC<{ number: string; title: string; description: string; action?: React.ReactNode }> = ({ number, title, description, action }) => (
  <div className="flex gap-4 md:gap-5 group">
    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-bg-2 border border-border text-fg-4 flex items-center justify-center text-[13px] md:text-[15px] font-black shrink-0 transition-colors group-hover:bg-[var(--contrast-bg)] group-hover:text-[var(--contrast-text)] group-hover:border-[var(--contrast-bg)]" style={{ borderColor: 'var(--border)' }}>
      {number}
    </div>
    <div className="flex-1 space-y-4 md:space-y-5 min-w-0">
      <div>
        <h4 className="text-base md:text-lg font-bold text-fg-4 tracking-tight">{title}</h4>
        <p className="text-sm md:text-[15px] text-fg-2 leading-relaxed mt-1">{description}</p>
      </div>
      {action && <div className="animate-fade">{action}</div>}
    </div>
  </div>
);
