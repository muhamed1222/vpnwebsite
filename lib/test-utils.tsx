/**
 * Утилиты для тестирования React компонентов
 * Обеспечивает единый подход к тестированию
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * Провайдеры для тестирования
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Кастомная функция render с провайдерами
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Моки для Telegram WebApp
 */
export const mockTelegramWebApp = {
  initData: 'test_init_data',
  initDataUnsafe: {
    user: {
      id: 12345678,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'ru',
    },
  },
  ready: vi.fn(),
  expand: vi.fn(),
  close: vi.fn(),
  showAlert: vi.fn(),
  showConfirm: vi.fn(),
  showPopup: vi.fn(),
  openLink: vi.fn(),
  openTelegramLink: vi.fn(),
  openInvoice: vi.fn(),
  sendData: vi.fn(),
  enableClosingConfirmation: vi.fn(),
  disableClosingConfirmation: vi.fn(),
  onEvent: vi.fn(),
  offEvent: vi.fn(),
  version: '6.0',
  platform: 'web',
  colorScheme: 'dark',
  themeParams: {
    bg_color: '#000000',
    text_color: '#ffffff',
    hint_color: '#999999',
    link_color: '#F55128',
    button_color: '#F55128',
    button_text_color: '#ffffff',
  },
  isExpanded: true,
  viewportHeight: 600,
  viewportStableHeight: 600,
  headerColor: '#000000',
  backgroundColor: '#000000',
  isClosingConfirmationEnabled: false,
  BackButton: {
    isVisible: false,
    onClick: vi.fn(),
    offClick: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
  },
  MainButton: {
    text: '',
    color: '',
    textColor: '',
    isVisible: false,
    isActive: true,
    isProgressVisible: false,
    setText: vi.fn(),
    onClick: vi.fn(),
    offClick: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    showProgress: vi.fn(),
    hideProgress: vi.fn(),
    setParams: vi.fn(),
  },
  HapticFeedback: {
    impactOccurred: vi.fn(),
    notificationOccurred: vi.fn(),
    selectionChanged: vi.fn(),
  },
  CloudStorage: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    getItems: vi.fn(),
    removeItem: vi.fn(),
    removeItems: vi.fn(),
    getKeys: vi.fn(),
  },
};

/**
 * Устанавливает мок для Telegram WebApp
 */
export function setupTelegramMock() {
  // Моки для тестов могут использовать any для упрощения
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global.window as Window & { Telegram?: { WebApp: any } }).Telegram = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WebApp: mockTelegramWebApp as any,
  };
}

/**
 * Очищает мок для Telegram WebApp
 */
export function cleanupTelegramMock() {
  delete (global.window as Window & { Telegram?: unknown }).Telegram;
}

/**
 * Мок для navigator.onLine
 */
export function mockOnlineStatus(isOnline: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    configurable: true,
    value: isOnline,
  });
  
  // Триггерим событие асинхронно
  setTimeout(() => {
    const event = new Event(isOnline ? 'online' : 'offline');
    window.dispatchEvent(event);
  }, 0);
}

/**
 * Мок для localStorage
 */
export function createLocalStorageMock() {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
}

/**
 * Ожидание следующего тика
 */
export function waitForNextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Переэкспорт всего из @testing-library/react
export * from '@testing-library/react';
export { customRender as render };
