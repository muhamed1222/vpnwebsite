export interface User {
  id: number;
  firstName: string;
  username?: string;
}

export type SubscriptionStatus = 'active' | 'expired' | 'none' | 'loading';

export interface Subscription {
  status: SubscriptionStatus;
  expiresAt?: string;
  priceFrom?: number;
  subscriptionUrl?: string;
}

export interface AppState {
  user: User | null;
  subscription: Subscription | null;
  loading: boolean;
}

