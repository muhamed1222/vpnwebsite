import { describe, it, expect } from 'vitest';
import {
  SUBSCRIPTION_CONFIG,
  APP_STORE_URLS,
  DEEP_LINK_PROTOCOL,
  ANIMATION_DURATIONS,
  API_CONFIG,
  UI_CONSTANTS,
  COLORS,
} from '../constants';

describe('constants', () => {
  describe('SUBSCRIPTION_CONFIG', () => {
    it('should have default subscription ID', () => {
      expect(SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID).toBe('EyR56URS1GQXgcLS');
    });

    it('should have default devices count', () => {
      expect(SUBSCRIPTION_CONFIG.DEFAULT_DEVICES_COUNT).toBe(5);
    });

    it('should have minimum price', () => {
      expect(SUBSCRIPTION_CONFIG.MIN_PRICE).toBe(10);
    });
  });

  describe('APP_STORE_URLS', () => {
    it('should have iOS URL', () => {
      expect(APP_STORE_URLS.iOS).toContain('apps.apple.com');
    });

    it('should have Android URL', () => {
      expect(APP_STORE_URLS.Android).toContain('play.google.com');
    });

    it('should have macOS URL', () => {
      expect(APP_STORE_URLS.macOS).toContain('apps.apple.com');
    });

    it('should have Desktop URL', () => {
      expect(APP_STORE_URLS.Desktop).toContain('v2raytun.com');
    });
  });

  describe('DEEP_LINK_PROTOCOL', () => {
    it('should have correct protocol', () => {
      expect(DEEP_LINK_PROTOCOL).toBe('happ://add/');
    });
  });

  describe('ANIMATION_DURATIONS', () => {
    it('should have modal close duration', () => {
      expect(ANIMATION_DURATIONS.MODAL_CLOSE).toBe(350);
    });

    it('should have backdrop duration', () => {
      expect(ANIMATION_DURATIONS.BACKDROP).toBe(300);
    });

    it('should have modal duration', () => {
      expect(ANIMATION_DURATIONS.MODAL).toBe(350);
    });
  });

  describe('API_CONFIG', () => {
    it('should have timeout', () => {
      expect(API_CONFIG.TIMEOUT).toBe(10000);
    });

    it('should have max retries', () => {
      expect(API_CONFIG.MAX_RETRIES).toBe(3);
    });

    it('should have retry delay', () => {
      expect(API_CONFIG.RETRY_DELAY).toBe(1000);
    });
  });

  describe('UI_CONSTANTS', () => {
    it('should have drag threshold', () => {
      expect(UI_CONSTANTS.DRAG_THRESHOLD).toBe(100);
    });

    it('should have max modal height', () => {
      expect(UI_CONSTANTS.MAX_MODAL_HEIGHT).toBe('92vh');
    });
  });

  describe('COLORS', () => {
    it('should have primary color', () => {
      expect(COLORS.PRIMARY).toBe('#F55128');
    });

    it('should have secondary color', () => {
      expect(COLORS.SECONDARY).toBe('#121212');
    });
  });
});

