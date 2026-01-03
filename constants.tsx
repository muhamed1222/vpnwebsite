import { Plan } from './types';

// Планы синхронизированы с ботом (vpn_bot/src/constants.ts)
export const PLANS: Plan[] = [
  { 
    id: 'plan_7', 
    name: '7 Дней (Тест)', 
    durationMonths: 0.23, // ~7 дней
    price: 10, 
    description: 'Пробный период без ограничений' 
  },
  { 
    id: 'plan_30', 
    name: '1 Месяц', 
    durationMonths: 1, 
    price: 99, 
    description: 'Высокоскоростной доступ на месяц' 
  },
  { 
    id: 'plan_90', 
    name: '3 Месяца', 
    durationMonths: 3, 
    price: 260, 
    description: 'Оптимально для долгого доступа', 
    savings: '10%' 
  },
  { 
    id: 'plan_180', 
    name: '6 Месяцев', 
    durationMonths: 6, 
    price: 499, 
    description: 'Популярный выбор пользователей', 
    savings: '15%' 
  },
  { 
    id: 'plan_365', 
    name: '12 Месяцев', 
    durationMonths: 12, 
    price: 899, 
    description: 'Максимальная выгода и комфорт', 
    savings: '25%' 
  },
];

export const SERVER_LOCATION = {
  country: 'Все локации',
  city: 'Европа',
  emoji: '🌍',
  code: 'GLOBAL'
};

export const AVAILABLE_LOCATIONS = [
  { name: 'Нидерланды', emoji: '🇳🇱', city: 'Амстердам' },
  { name: 'Германия', emoji: '🇩🇪', city: 'Франкфурт', soon: true },
  { name: 'Турция', emoji: '🇹🇷', city: 'Стамбул', soon: true },
];

export const SUPPORT_URL = "https://t.me/chalemat";

export const PLATFORMS = [
  { id: 'ios', name: 'iOS' },
  { id: 'android', name: 'Android' },
  { id: 'windows', name: 'Windows' },
  { id: 'macos', name: 'macOS' },
];