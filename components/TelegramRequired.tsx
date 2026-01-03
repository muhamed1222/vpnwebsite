import React from 'react';

interface TelegramRequiredProps {
  botUrl?: string; // URL бота с параметром startapp
}

/**
 * Компонент для отображения экрана "Откройте кабинет через Telegram"
 */
export const TelegramRequired: React.FC<TelegramRequiredProps> = ({ botUrl = 'https://t.me/outlivion_bot?start=login' }) => {
  const handleOpen = () => {
    if (botUrl) {
      window.open(botUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-[var(--card)] rounded-2xl p-8 shadow-lg">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-[var(--primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-[var(--fg)] mb-4">
            Откройте кабинет через Telegram
          </h1>
          
          <p className="text-[var(--fg-2)] mb-8">
            Для доступа к личному кабинету необходимо открыть приложение через Telegram бота.
          </p>

          {botUrl && (
            <button
              onClick={handleOpen}
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Открыть
            </button>
          )}

          {!botUrl && (
            <p className="text-sm text-[var(--fg-2)]">
              Обратитесь к администратору для получения ссылки на бота
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

