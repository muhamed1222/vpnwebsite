import '@testing-library/jest-dom';

// Mock window.Telegram для тестов
global.window = global.window || {};
(global.window as any).Telegram = {
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

