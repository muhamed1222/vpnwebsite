/**
 * Утилиты для проксирования запросов на бэкенд API
 * Устраняет дублирование кода в API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { logError } from './logging';
import { getUserFriendlyMessage } from './user-messages';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';

/**
 * Опции для проксирования запроса
 */
export interface ProxyOptions {
  /** Метод HTTP */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Тело запроса (для POST, PUT, PATCH) */
  body?: unknown;
  /** Заголовки запроса */
  headers?: Record<string, string>;
  /** Требуется ли авторизация (initData) */
  requireAuth?: boolean;
  /** Кэширование Next.js (в секундах) */
  revalidate?: number;
  /** Дополнительные query параметры */
  queryParams?: Record<string, string>;
  /** Контекст для логирования */
  logContext?: {
    page?: string;
    action?: string;
    endpoint?: string;
  };
  /** Админский API ключ (для админских запросов) */
  adminApiKey?: string;
  /** Отключить кэширование (для админских запросов) */
  noCache?: boolean;
}

/**
 * Проксирует несколько запросов параллельно
 * 
 * @param request - Next.js request объект
 * @param backendPaths - Массив путей на бэкенде
 * @param options - Опции проксирования
 * @returns Массив NextResponse
 */
export async function proxyMultiple(
  request: NextRequest,
  backendPaths: string[],
  options: ProxyOptions = {}
): Promise<NextResponse[]> {
  const { requireAuth = true } = options;
  
  // Получаем initData
  const initData = request.headers.get('X-Telegram-Init-Data') ||
    request.headers.get('Authorization');

  if (requireAuth && !initData) {
    return backendPaths.map(() => 
      NextResponse.json({ error: 'Missing Telegram initData' }, { status: 401 })
    );
  }

  // Выполняем запросы параллельно
  const requests = backendPaths.map(path => 
    proxyToBackend(request, path, { ...options, requireAuth: false })
  );

  return Promise.all(requests);
}

/**
 * Проксирует запрос на бэкенд API
 * 
 * @param request - Next.js request объект
 * @param backendPath - Путь на бэкенде (например, '/v1/tariffs')
 * @param options - Опции проксирования
 * @returns NextResponse с данными или ошибкой
 */
export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
  options: ProxyOptions = {}
): Promise<NextResponse> {
  const {
    method = 'GET',
    body,
    headers = {},
    requireAuth = true,
    revalidate,
    queryParams,
    logContext = {},
    adminApiKey,
    noCache = false,
  } = options;

  try {
    // Получаем initData из заголовков
    const initData = request.headers.get('X-Telegram-Init-Data') ||
      request.headers.get('Authorization');

    // Если требуется авторизация, но initData отсутствует
    if (requireAuth && !initData) {
      return NextResponse.json(
        { error: 'Missing Telegram initData' },
        { status: 401 }
      );
    }

    // Формируем URL
    const url = new URL(backendPath, BACKEND_API_URL);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Формируем заголовки
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Добавляем Authorization или админский API ключ
    if (adminApiKey) {
      requestHeaders['x-admin-api-key'] = adminApiKey;
    } else if (initData) {
      requestHeaders['Authorization'] = initData;
    }

    // Формируем опции fetch
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // Добавляем тело запроса, если есть
    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    // Добавляем кэширование Next.js, если указано
    // Используем расширенный тип для Next.js fetch
    if (noCache) {
      fetchOptions.cache = 'no-store';
    } else if (revalidate !== undefined) {
      // Next.js расширяет RequestInit с помощью свойства next
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetchOptions as any).next = { revalidate };
    }

    // Выполняем запрос
    const backendResponse = await fetch(url.toString(), fetchOptions);

    // Обрабатываем ответ
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'Ошибка запроса к серверу';
      
      // Логируем ошибку
      logError('Backend API error', new Error(errorMessage), {
        ...logContext,
        status: backendResponse.status,
        backendPath,
        method,
      });

      // Возвращаем понятное сообщение пользователю
      return NextResponse.json(
        { error: getUserFriendlyMessage(errorMessage) },
        { status: backendResponse.status }
      );
    }

    // Парсим успешный ответ
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    // Логируем ошибку
    logError('Backend proxy error', error, {
      ...logContext,
      backendPath,
      method,
    });

    // Обрабатываем сетевые ошибки
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return NextResponse.json(
          { error: 'Проблема с подключением к серверу. Проверьте интернет-соединение.' },
          { status: 503 }
        );
      }
    }

    // Общая ошибка
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера. Попробуйте позже.' },
      { status: 500 }
    );
  }
}

/**
 * Проксирует GET запрос на бэкенд
 */
export async function proxyGet(
  request: NextRequest,
  backendPath: string,
  options: Omit<ProxyOptions, 'method'> = {}
): Promise<NextResponse> {
  return proxyToBackend(request, backendPath, { ...options, method: 'GET' });
}

/**
 * Проксирует POST запрос на бэкенд
 */
export async function proxyPost(
  request: NextRequest,
  backendPath: string,
  body: unknown,
  options: Omit<ProxyOptions, 'method' | 'body'> = {}
): Promise<NextResponse> {
  return proxyToBackend(request, backendPath, { ...options, method: 'POST', body });
}

/**
 * Проксирует PUT запрос на бэкенд
 */
export async function proxyPut(
  request: NextRequest,
  backendPath: string,
  body: unknown,
  options: Omit<ProxyOptions, 'method' | 'body'> = {}
): Promise<NextResponse> {
  return proxyToBackend(request, backendPath, { ...options, method: 'PUT', body });
}

/**
 * Проксирует DELETE запрос на бэкенд
 */
export async function proxyDelete(
  request: NextRequest,
  backendPath: string,
  options: Omit<ProxyOptions, 'method'> = {}
): Promise<NextResponse> {
  return proxyToBackend(request, backendPath, { ...options, method: 'DELETE' });
}
