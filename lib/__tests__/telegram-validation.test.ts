import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  parseInitData,
  validateTelegramInitData,
  extractUserFromInitData,
} from '../telegram-validation';

describe('telegram-validation', () => {
  const botToken = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

  describe('parseInitData', () => {
    it('should parse valid initData string', () => {
      const initData = 'query_id=AAHdF6IQAAAAAN0XohDhrOr8&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22Vladislav%22%2C%22last_name%22%3A%22Kibenko%22%2C%22username%22%3A%22vdkfrost%22%2C%22language_code%22%3A%22ru%22%7D&auth_date=1662771648&hash=c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2a2b2';
      
      const parsed = parseInitData(initData);
      
      expect(parsed.query_id).toBe('AAHdF6IQAAAAAN0XohDhrOr8');
      expect(parsed.auth_date).toBe('1662771648');
      expect(parsed.hash).toBe('c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2a2b2');
      expect(parsed.user).toBeDefined();
    });

    it('should handle empty initData', () => {
      const parsed = parseInitData('');
      expect(parsed.auth_date).toBe('');
      expect(parsed.hash).toBe('');
    });
  });

  describe('validateTelegramInitData', () => {
    it('should return false for empty initData', () => {
      expect(validateTelegramInitData('', botToken)).toBe(false);
    });

    it('should return false for empty botToken', () => {
      const initData = 'auth_date=1662771648&hash=test';
      expect(validateTelegramInitData(initData, '')).toBe(false);
    });

    it('should return false for missing hash', () => {
      const initData = 'auth_date=1662771648';
      expect(validateTelegramInitData(initData, botToken)).toBe(false);
    });

    it('should return false for missing auth_date', () => {
      const initData = 'hash=test';
      expect(validateTelegramInitData(initData, botToken)).toBe(false);
    });

    it('should return false for expired auth_date', () => {
      // auth_date более 24 часов назад
      const oldAuthDate = Math.floor(Date.now() / 1000) - (25 * 60 * 60);
      const initData = `auth_date=${oldAuthDate}&hash=test`;
      expect(validateTelegramInitData(initData, botToken)).toBe(false);
    });

    it('should validate correctly signed initData', () => {
      // Создаем валидный initData
      const authDate = Math.floor(Date.now() / 1000).toString();
      const user = JSON.stringify({
        id: 12345678,
        first_name: 'Test',
        username: 'testuser',
      });
      
      // Формируем данные для подписи
      const dataCheckString = `auth_date=${authDate}\nuser=${user}`;
      
      // Вычисляем секретный ключ
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();
      
      // Вычисляем хеш
      const hash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
      
      // Формируем initData
      const initData = `auth_date=${authDate}&user=${encodeURIComponent(user)}&hash=${hash}`;
      
      expect(validateTelegramInitData(initData, botToken)).toBe(true);
    });

    it('should return false for invalid hash', () => {
      const authDate = Math.floor(Date.now() / 1000).toString();
      const initData = `auth_date=${authDate}&hash=invalid_hash`;
      expect(validateTelegramInitData(initData, botToken)).toBe(false);
    });
  });

  describe('extractUserFromInitData', () => {
    it('should extract user data from valid initData', () => {
      const user = {
        id: 12345678,
        first_name: 'Test',
        username: 'testuser',
      };
      const initData = `user=${encodeURIComponent(JSON.stringify(user))}&auth_date=1662771648&hash=test`;
      
      const extracted = extractUserFromInitData(initData);
      
      expect(extracted).toEqual(user);
    });

    it('should return null for missing user', () => {
      const initData = 'auth_date=1662771648&hash=test';
      expect(extractUserFromInitData(initData)).toBeNull();
    });

    it('should return null for invalid JSON in user', () => {
      const initData = 'user=invalid_json&auth_date=1662771648&hash=test';
      expect(extractUserFromInitData(initData)).toBeNull();
    });
  });
});

