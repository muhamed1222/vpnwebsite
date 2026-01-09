import '@testing-library/jest-dom';

// Mock window.Telegram для тестов
global.window = global.window || {};

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user: {
      id: number;
      first_name: string;
      username: string;
    };
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  showAlert: () => void;
  openLink: () => void;
}

interface TelegramMock {
  WebApp: TelegramWebApp;
}

(global.window as Window & { Telegram?: TelegramMock }).Telegram = {
  WebApp: {
    initData: 'test_init_data',
    initDataUnsafe: {
      user: {
        id: 12345678,
        first_name: 'Test',
        username: 'testuser',
      },
    },
    ready: () => {},
    expand: () => {},
    close: () => {},
    showAlert: () => {},
    openLink: () => {},
  },
};

