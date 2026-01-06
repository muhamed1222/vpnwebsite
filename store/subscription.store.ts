import { create } from 'zustand';
import { Subscription, SubscriptionStatus } from '../types';

interface SubscriptionState {
  subscription: Subscription | null;
  loading: boolean;
  setSubscription: (subscription: Subscription | null) => void;
  setStatus: (status: SubscriptionStatus) => void;
  setLoading: (loading: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null,
  loading: true,
  setSubscription: (subscription) => set({ subscription, loading: false }),
  setStatus: (status) => 
    set((state) => ({ 
      subscription: state.subscription 
        ? { ...state.subscription, status } 
        : { status, expiresAt: undefined } 
    })),
  setLoading: (loading) => set({ loading }),
}));

