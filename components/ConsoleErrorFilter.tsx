'use client';

import { useEffect } from 'react';

/**
 * Компонент для фильтрации предупреждений Next.js о params Promise
 * и ошибок расширений браузера (chrome.runtime, browser.runtime)
 * 
 * В Next.js 16 params является Promise и должен быть развернут через React.use()
 * Это предупреждение появляется, когда Next.js пытается сериализовать props для отладки
 * 
 * Ошибки расширений браузера (runtime.lastError) не связаны с приложением
 * и появляются из-за расширений, которые пытаются взаимодействовать с несуществующими вкладками
 */
export function ConsoleErrorFilter() {
  useEffect(() => {
    // Сохраняем оригинальные методы консоли
    const originalError = console.error;
    const originalWarn = console.warn;

    // Функция для проверки, является ли сообщение ошибкой расширения браузера
    const isBrowserExtensionError = (message: string): boolean => {
      return (
        message.includes('runtime.lastError') ||
        message.includes('No tab with id') ||
        message.includes('chrome.runtime') ||
        message.includes('browser.runtime') ||
        message.includes('Extension context invalidated')
      );
    };

    // Функция для проверки, является ли сообщение предупреждением Next.js
    const isNextJsWarning = (message: string): boolean => {
      return (
        message.includes('params are being enumerated') ||
        message.includes('params is a Promise') ||
        (message.includes('searchParams') && message.includes('Promise')) ||
        message.includes('must be unwrapped with React.use()') ||
        (message.includes('The keys of') && message.includes('were accessed directly'))
      );
    };

    // Переопределяем console.error для фильтрации
    console.error = (...args: unknown[]) => {
      const firstArg = args[0];
      const message = typeof firstArg === 'string' 
        ? firstArg 
        : firstArg instanceof Error 
          ? firstArg.message 
          : String(firstArg);

      // Игнорируем ошибки расширений браузера (всегда)
      if (isBrowserExtensionError(message)) {
        return;
      }

      // Игнорируем предупреждения Next.js только в development
      if (process.env.NODE_ENV === 'development' && isNextJsWarning(message)) {
        return;
      }

      // Вызываем оригинальный console.error для всех остальных ошибок
      originalError.apply(console, args);
    };

    // Переопределяем console.warn для фильтрации
    console.warn = (...args: unknown[]) => {
      const firstArg = args[0];
      const message = typeof firstArg === 'string' 
        ? firstArg 
        : firstArg instanceof Error 
          ? firstArg.message 
          : String(firstArg);

      // Игнорируем ошибки расширений браузера (всегда)
      if (isBrowserExtensionError(message)) {
        return;
      }

      // Игнорируем предупреждения Next.js только в development
      if (process.env.NODE_ENV === 'development' && isNextJsWarning(message)) {
        return;
      }

      // Вызываем оригинальный console.warn для всех остальных предупреждений
      originalWarn.apply(console, args);
    };

    // Восстанавливаем оригинальные методы при размонтировании
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
