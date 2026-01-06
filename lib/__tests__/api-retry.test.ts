import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, withTimeout } from '../api-retry';
import { ApiException } from '../api';

describe('api-retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fetchFn = vi.fn().mockResolvedValue('success');
      
      const result = await withRetry(fetchFn);
      
      expect(result).toBe('success');
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fetchFn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');
      
      const result = await withRetry(fetchFn, 3, 10);
      
      expect(result).toBe('success');
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx errors', async () => {
      const error = new ApiException('Unauthorized', 401);
      const fetchFn = vi.fn().mockRejectedValue(error);
      
      await expect(withRetry(fetchFn)).rejects.toThrow('Unauthorized');
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on 5xx errors', async () => {
      const fetchFn = vi.fn()
        .mockRejectedValueOnce(new ApiException('Server Error', 500))
        .mockResolvedValueOnce('success');
      
      const result = await withRetry(fetchFn, 3, 10);
      
      expect(result).toBe('success');
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(withRetry(fetchFn, 2, 10)).rejects.toThrow('Network error');
      expect(fetchFn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should use exponential backoff', async () => {
      const fetchFn = vi.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');
      
      const startTime = Date.now();
      await withRetry(fetchFn, 3, 10);
      const duration = Date.now() - startTime;
      
      // Должно быть минимум 10ms (первая задержка) + 20ms (вторая задержка)
      expect(duration).toBeGreaterThanOrEqual(30);
      expect(fetchFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('withTimeout', () => {
    it('should resolve before timeout', async () => {
      const promise = Promise.resolve('success');
      
      const result = await withTimeout(promise, 1000);
      
      expect(result).toBe('success');
    });

    it('should reject on timeout', async () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve('success'), 2000);
      });
      
      await expect(withTimeout(promise, 100)).rejects.toThrow('Request timeout');
    });

    it('should preserve original error if not timeout', async () => {
      const promise = Promise.reject(new Error('Original error'));
      
      await expect(withTimeout(promise, 1000)).rejects.toThrow('Original error');
    });
  });
});

