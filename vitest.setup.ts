import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { setupTelegramMock, mockOnlineStatus } from './lib/test-utils';

// Mock window.Telegram для тестов
global.window = global.window || {};

// Устанавливаем мок для Telegram WebApp
setupTelegramMock();

// Устанавливаем мок для navigator.onLine
mockOnlineStatus(true);

// Mock для matchMedia (нужно для некоторых компонентов)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock для IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

