import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Subscription, SubscriptionStatus } from '../types';

interface SubscriptionState {
  subscription: Subscription | null;
  loading: boolean;
  discount: {
    percent: number;
    expiresAt?: number;
  } | null;
  setSubscription: (subscription: Subscription | null) => void;
  setDiscount: (discount: { percent: number; expiresAt?: number } | null) => void;
  setStatus: (status: SubscriptionStatus) => void;
  setLoading: (loading: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      subscription: null,
      loading: true,
      discount: null,
      setSubscription: (subscription) => set({ subscription, loading: false }),
      setDiscount: (discount) => set({ discount }),
      setStatus: (status) =>
        set((state) => ({
          subscription: state.subscription
            ? { ...state.subscription, status }
            : { status, expiresAt: undefined }
        })),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'subscription-storage',
    }
  )
);

