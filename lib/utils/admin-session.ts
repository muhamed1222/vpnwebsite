/**
 * Утилиты для работы с админскими сессиями
 * Централизует логику создания и валидации сессий
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_PREFIX = 'admin_';
const SESSION_MAX_AGE = 60 * 60 * 24 * 1000; // 24 часа

/**
 * Создает токен сессии для админа
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
    if (now - timestamp > SESSION_MAX_AGE) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Устанавливает cookie с админской сессией
 */
export function setAdminSessionCookie(response: NextResponse, sessionToken: string): void {
  const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  
  response.cookies.set('admin_session', sessionToken, {
    httpOnly: true,
    secure: isProduction, // true для production (HTTPS), false для localhost
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 часа в секундах
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
 * Проверяет, валидна ли текущая админская сессия
 */
export async function isAdminSessionValid(): Promise<boolean> {
  const sessionToken = await getAdminSession();
  if (!sessionToken) {
    return false;
  }
  return validateAdminSessionToken(sessionToken);
}
