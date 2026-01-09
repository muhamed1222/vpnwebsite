/**
 * Типы данных для системы конкурсов и реферальной программы
 * Соответствует архитектуре с четкими правилами атрибуции и начисления билетов
 */

// ============================================================================
// 0) Основные сущности
// ============================================================================

/**
 * Конкурс - основная сущность для изоляции билетов между розыгрышами
 */
export interface Contest {
  id: string;
  title: string; // "Январский розыгрыш Outlivion"
  starts_at: string; // ISO datetime
  ends_at: string; // ISO datetime
  attribution_window_days: number; // 7 дней для квалификации
  rules_version: string; // "1.0"
  is_active: boolean;
}

/**
 * Событие привязки по реферальной ссылке
 * Храним именно "привязку", а не просто клик
 */
export interface RefEvent {
  id: string;
  contest_id: string;
  referrer_user_id: string;
  invitee_tg_id: number; // Telegram ID приглашенного
  invitee_user_id: string | null; // UUID пользователя (nullable до регистрации)
  bound_at: string; // ISO datetime - момент привязки
  source: 'bot' | 'miniapp'; // источник привязки
  status: 'bound' | 'qualified' | 'not_qualified' | 'blocked';
  status_reason: string | null; // SELF_REF, EXISTING_PAYER, ATTR_WINDOW_EXPIRED
  qualified_at: string | null; // ISO datetime - момент квалификации
}

/**
 * Платеж с привязкой к конкурсу
 */
export interface Payment {
  id: string;
  user_id: string;
  contest_id: string | null; // Определяется по времени оплаты
  provider: string; // 'yookassa' | 'telegram_stars' | 'crypto'
  provider_payment_id: string; // Уникальный ID от провайдера
  status: 'pending' | 'succeeded' | 'refunded' | 'canceled';
  months: number; // Количество месяцев подписки
  amount: number; // Сумма в валюте
  paid_at: string; // ISO datetime
}

/**
 * Запись в бухгалтерии билетов
 * Источник правды для всех начислений
 */
export interface TicketLedger {
  id: string;
  contest_id: string;
  user_id: string; // Кому начислили (реферер)
  invitee_user_id: string; // За кого начислили
  payment_id: string;
  delta: number; // +months или -months
  reason: 'INVITEE_PAYMENT' | 'REFUND' | 'MANUAL_ADJUST';
  created_at: string; // ISO datetime
}

/**
 * Агрегированная статистика пользователя в конкурсе
 * Для быстройого отображения в UI
 */
export interface UserContestStats {
  contest_id: string;
  user_id: string;
  tickets_total: number;
  invited_total: number; // bound events
  qualified_total: number;
  pending_total: number;
  updated_at: string;
}

// ============================================================================
// 1) API Response типы
// ============================================================================

/**
 * Активный конкурс
 */
export interface ActiveContestResponse {
  contest: Contest;
}

/**
 * Сводка по реферальной программе пользователя
 */
export interface ReferralSummaryResponse {
  contest: Contest;
  ref_link: string;
  tickets_total: number;
  invited_total: number;
  qualified_total: number;
  pending_total: number;
  ends_at: string;
}

/**
 * Друг в реферальной программе
 */
export interface ReferralFriend {
  id: string;
  name: string | null;
  tg_username: string | null;
  status: 'bound' | 'qualified' | 'blocked' | 'not_qualified';
  status_reason: string | null;
  tickets_from_friend_total: number;
  bound_at: string;
}

/**
 * Запись истории билетов
 */
export interface TicketHistoryEntry {
  id: string;
  created_at: string;
  delta: number;
  label: string;
  invitee_name: string | null;
}

// ============================================================================
// 2) UI типы (для совместимости со старым кодом)
// ============================================================================

/**
 * @deprecated Использовать ContestSummary вместо этого
 */
export interface ContestSummary {
  contest: Contest;
  ref_link: string;
  tickets_total: number;
  invited_total: number;
  qualified_total: number;
  pending_total: number;
}

// ============================================================================
// 3) Бизнес-логика типы
// ============================================================================

/**
 * Правила квалификации друга
 */
export interface QualificationRules {
  attribution_window_days: number;
  disallow_existing_payers: boolean; // Проверка оплат до bound_at
  allow_self_ref: boolean; // Разрешить самореферал (обычно false)
}

/**
 * Результат квалификации платежа
 */
export interface QualificationResult {
  qualified: boolean;
  reason: string | null;
  ref_event: RefEvent | null;
  tickets_earned: number;
}

/**
 * Статистика конверсии
 */
export interface ConversionStats {
  invited_total: number;
  qualified_total: number;
  pending_total: number;
  conversion_rate: number; // percentage
  tickets_per_friend: number; // среднее
}

// ============================================================================
// 4) Антифрод типы
// ============================================================================

/**
 * Причины блокировки
 */
export type BlockReason = 
  | 'SELF_REF'           // Самореферал
  | 'EXISTING_PAYER'     // Уже был подписчиком
  | 'ATTR_WINDOW_EXPIRED' // Оплата вне окна атрибуции
  | 'DUPLICATE_BIND'     // Попытка перепривязки
  | 'SUSPICIOUS_PATTERN' // Подозрительная активность
  | 'MANUAL_BLOCK';      // Ручная блокировка

/**
 * Подозрительные паттерны для анализа
 */
export interface SuspiciousPattern {
  pattern_type: string;
  confidence: number; // 0-100
  description: string;
  requires_review: boolean;
}

// ============================================================================
// 5) Прозрачность и отчеты
// ============================================================================

/**
 * Информация о победителе для публикации
 */
export interface ContestWinner {
  user_id: string;
  tickets_total: number;
  prize_tier: string;
  announced_at: string;
}

/**
 * Публичный отчет о конкурсе
 */
export interface ContestReport {
  contest_id: string;
  total_participants: number;
  total_tickets: number;
  winners: ContestWinner[];
  winning_tickets: string[]; // Хеши или ID билетов
  published_at: string;
}

// ============================================================================
// 6) Вспомогательные типы
// ============================================================================

/**
 * Статус реферального события
 */
export type RefEventStatus = RefEvent['status'];

/**
 * Статус платежа
 */
export type PaymentStatus = Payment['status'];

/**
 * Причина начисления билетов
 */
export type TicketReason = TicketLedger['reason'];

/**
 * Источник привязки
 */
export type RefSource = RefEvent['source'];

/**
 * Проверка уникальности для ref_events
 */
export interface RefEventUniqueKey {
  contest_id: string;
  invitee_tg_id: number;
}

// ============================================================================
// 7) Константы
// ============================================================================

export const CONTEST_DEFAULTS = {
  ATTRIBUTION_WINDOW_DAYS: 7,
  RULES_VERSION: '1.0',
  TICKETS_PER_MONTH: 1,
} as const;

export const REF_EVENT_STATUSES = {
  BOUND: 'bound',
  QUALIFIED: 'qualified',
  NOT_QUALIFIED: 'not_qualified',
  BLOCKED: 'blocked',
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  REFUNDED: 'refunded',
  CANCELED: 'canceled',
} as const;

export const TICKET_REASONS = {
  INVITEE_PAYMENT: 'INVITEE_PAYMENT',
  REFUND: 'REFUND',
  MANUAL_ADJUST: 'MANUAL_ADJUST',
} as const;

export const BLOCK_REASONS = {
  SELF_REF: 'SELF_REF',
  EXISTING_PAYER: 'EXISTING_PAYER',
  ATTR_WINDOW_EXPIRED: 'ATTR_WINDOW_EXPIRED',
  DUPLICATE_BIND: 'DUPLICATE_BIND',
  SUSPICIOUS_PATTERN: 'SUSPICIOUS_PATTERN',
  MANUAL_BLOCK: 'MANUAL_BLOCK',
} as const;
