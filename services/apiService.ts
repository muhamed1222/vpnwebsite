/**
 * Сервис для работы с API VPN бота (Версия для outlivion-api)
 */
import { logger } from '../utils/logger';

// API URL для нового outlivion-api
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'https://api.outlivion.space';
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiUserStatus {
  ok: boolean;
  status: 'active' | 'disabled' | 'not_found' | 'on_hold';
  expiresAt: number | null; // В секундах (Unix timestamp)
  usedTraffic: number;
  dataLimit: number;
}

export interface ApiUserConfig {
  ok: boolean;
  config: string;
}

export interface CreateOrderResponse {
  orderId: string;
  paymentUrl: string;
}

export interface OrderDetails {
  order_id: string;
  user_ref: string;
  plan_id: string;
  status: 'pending' | 'paid' | 'canceled';
  amount: string;
  key?: string;
}

export interface PaymentHistoryItem {
  id: string;
  orderId: string;
  amount: number;
  currency: 'RUB' | 'XTR';
  date: number; // timestamp
  status: 'success' | 'fail' | 'pending' | 'cancelled';
  planName: string;
  planId?: string;
  invoiceLink?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // withCredentials: true
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Получить статус подписки пользователя
   */
  async getUserStatus(): Promise<ApiUserStatus> {
    return this.request<ApiUserStatus>('/v1/user/status');
  }

  /**
   * Получить VPN конфиг (ссылку)
   */
  async getUserConfig(): Promise<ApiUserConfig> {
    return this.request<ApiUserConfig>('/v1/user/config');
  }

  /**
   * Создать заказ на оплату
   * @param planId - ID тарифа (например, plan_30)
   */
  async createOrder(planId: string): Promise<CreateOrderResponse> {
    return this.request<CreateOrderResponse>('/v1/orders/create', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  /**
   * Получить данные заказа
   */
  async getOrder(orderId: string): Promise<OrderDetails> {
    return this.request<OrderDetails>(`/v1/orders/${orderId}`);
  }

  /**
   * Получить историю платежей
   */
  async getPaymentHistory(): Promise<PaymentHistoryItem[]> {
    return this.request<PaymentHistoryItem[]>('/v1/orders/history');
  }

  /**
   * Перевыпустить ключ
   */
  async regenerateConfig(): Promise<ApiUserConfig> {
    return this.request<ApiUserConfig>('/v1/user/regenerate', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
