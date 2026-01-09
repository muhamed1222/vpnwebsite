/**
 * Типы для API ответов
 */

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface Tariff {
  id: string;
  name: string;
  days: number;
  price_stars: number;
  price_rub?: number;
}

export interface UserConfig {
  ok: boolean;
  config: string | null;
}

export interface UserStatus {
  status: 'active' | 'expired' | 'none';
  expiresAt: number | null;
  usedTraffic: number;
  dataLimit: number;
}

export interface BillingData {
  usedBytes: number;
  limitBytes: number | null;
  averagePerDayBytes: number;
  planId: string | null;
  planName: string | null;
  period: {
    start: number | null;
    end: number | null;
  };
}

export interface ReferralStats {
  totalCount: number;
  trialCount: number;
  premiumCount: number;
  referralCode: string;
}

export interface OrderResponse {
  orderId: string;
  status: 'pending' | 'paid' | 'failed';
  paymentUrl: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  date: number;
  status: 'success' | 'pending' | 'fail' | 'paid';
}
