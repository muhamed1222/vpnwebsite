/**
 * Утилиты для работы с админскими сессиями
 * Централизует логику создания и валидации сессий
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_CONFIG } from '@/lib/constants';

const SESSION_PREFIX = 'admin_';

/**
 * Создает токен сессии для админа
 * 
 * Токен содержит префикс 'admin_', timestamp и случайное число, закодированные в base64.
 * Срок действия токена проверяется при валидации (24 часа).
 * 
 * @returns Строка токена в формате base64
 * 
 * @example
 * ```ts
 * const token = createAdminSessionToken();
 * // "admin_1704067200000_0.123456789" в base64
 * ```
 */
export function createAdminSessionToken(): string {
  return Buffer.from(`${SESSION_PREFIX}${Date.now()}_${Math.random()}`).toString('base64');
}

/**
 * Валидирует токен сессии админа
 */
export function validateAdminSessionToken(sessionToken: string): boolean {
  try {
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    
    // Проверяем формат: "admin_TIMESTAMP_RANDOM"
    if (!decoded.startsWith(SESSION_PREFIX)) {
      return false;
    }

    // Извлекаем timestamp
    const parts = decoded.split('_');
    if (parts.length < 2) {
      return false;
    }

    const timestamp = parseInt(parts[1], 10);
    if (isNaN(timestamp)) {
      return false;
    }

    // Проверяем срок действия (24 часа)
    const now = Date.now();
    if (now - timestamp > SESSION_CONFIG.MAX_AGE_MS) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Устанавливает HTTP-only cookie с админской сессией
 * 
 * Настройки cookie:
 * - httpOnly: true (недоступен из JavaScript)
 * - secure: true в production (только HTTPS)
 * - sameSite: 'lax'
 * - maxAge: 24 часа
 * - path: '/'
 * 
 * @param response - NextResponse объект для установки cookie
 * @param sessionToken - Токен сессии
 * 
 * @example
 * ```ts
 * const token = createAdminSessionToken();
 * const response = NextResponse.json({ ok: true });
 * setAdminSessionCookie(response, token);
 * return response;
 * ```
 */
export function setAdminSessionCookie(response: NextResponse, sessionToken: string): void {
  const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  
  response.cookies.set('admin_session', sessionToken, {
    httpOnly: true,
    secure: isProduction, // true для production (HTTPS), false для localhost
    sameSite: 'lax',
    maxAge: SESSION_CONFIG.MAX_AGE_SECONDS, // 24 часа в секундах
    path: '/',
  });
}

/**
 * Получает админскую сессию из cookies
 */
export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value || null;
}

/**
 * Проверяет, валидна ли текущая админская сессия из cookies
 * 
 * Объединяет проверку наличия сессии и её валидности.
 * 
 * @returns true, если сессия существует и валидна, иначе false
 * 
 * @example
 * ```ts
 * const isValid = await isAdminSessionValid();
 * if (!isValid) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 */
export async function isAdminSessionValid(): Promise<boolean> {
  const sessionToken = await getAdminSession();
  if (!sessionToken) {
    return false;
  }
  return validateAdminSessionToken(sessionToken);
}
