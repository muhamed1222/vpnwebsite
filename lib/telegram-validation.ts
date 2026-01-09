import crypto from 'crypto';
import { logError } from './utils/logging';

/**
 * Валидация Telegram WebApp initData
 * 
 * Telegram отправляет данные в формате query string:
 * query_id=...&user=...&auth_date=...&hash=...
 * 
 * Hash вычисляется как HMAC-SHA256 от всех полей кроме hash,
 * отсортированных по ключу, в формате "key=value\n"
 */
export interface ParsedInitData {
  query_id?: string;
  user?: string;
  auth_date: string;
  hash: string;
  [key: string]: string | undefined;
}

/**
 * Парсит строку initData в объект
 */
export function parseInitData(initData: string): ParsedInitData {
  const params = new URLSearchParams(initData);
  const data: ParsedInitData = {
    auth_date: '',
    hash: '',
  };

  params.forEach((value, key) => {
    data[key] = value;
  });

  return data;
}

/**
 * Проверяет подпись Telegram initData
 * 
 * @param initData - Строка initData от Telegram
 * @param botToken - Токен бота от Telegram BotFather
 * @returns true если подпись валидна
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string
): boolean {
  if (!initData || !botToken) {
    return false;
  }

  // РАЗРЕШАЕМ ЛОКАЛЬНУЮ РАЗРАБОТКУ
  if (initData.includes('query_id=STUB') && process.env.NODE_ENV === 'development') {
    return true;
  }

  try {
    const parsed = parseInitData(initData);
    const { hash, ...dataWithoutHash } = parsed;

    if (!hash || !dataWithoutHash.auth_date) {
      return false;
    }

    // Проверяем, что данные не старше 24 часов
    const authDate = parseInt(dataWithoutHash.auth_date, 10);
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 24 * 60 * 60; // 24 часа

    if (now - authDate > maxAge) {
      return false;
    }

    // Сортируем ключи и формируем строку для проверки
    const dataCheckString = Object.keys(dataWithoutHash)
      .sort()
      .map((key) => `${key}=${dataWithoutHash[key]}`)
      .join('\n');

    // Вычисляем секретный ключ
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Вычисляем хеш
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Сравниваем хеши
    // Используем простое сравнение строк, как на бэкенде, для совместимости
    return hash.toLowerCase() === calculatedHash.toLowerCase();
  } catch (error) {
    logError('Error validating Telegram initData', error, {
      action: 'validateTelegramInitData'
    });
    return false;
  }
}

/**
 * Извлекает данные пользователя из валидного initData
 */
export function extractUserFromInitData(initData: string) {
  try {
    const parsed = parseInitData(initData);
    if (parsed.user) {
      return JSON.parse(parsed.user);
    }
    return null;
  } catch (error) {
    logError('Error extracting user from initData', error, {
      action: 'extractUserFromInitData'
    });
    return null;
  }
}

