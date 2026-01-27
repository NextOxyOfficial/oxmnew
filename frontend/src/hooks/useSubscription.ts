"use client";

import { useState, useEffect } from 'react';
import { ApiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionPlan {
  name: string;
  id: string;
}

interface SubscriptionData {
  success: boolean;
  subscription?: {
    plan?: SubscriptionPlan;
    status?: string;
    expires_at?: string;
  };
}

export function useSubscription() {
  const { isAuthenticated, profile } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro'>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!isAuthenticated) {
      setSubscriptionStatus('free');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const subscriptionData: SubscriptionData = await ApiService.getMySubscription();
      
      if (subscriptionData?.success && subscriptionData?.subscription?.plan?.name) {
        const planName = subscriptionData.subscription.plan.name.toLowerCase();
        setSubscriptionStatus(planName === 'pro' ? 'pro' : 'free');
      } else {
        setSubscriptionStatus('free');
      }
    } catch (error) {
      console.error("Failed to load subscription status:", error);
      setSubscriptionStatus('free');
      setError('Failed to load subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [isAuthenticated, profile]);

  return {
    subscriptionStatus,
    isLoading,
    error,
    refetch: fetchSubscription,
    isPro: subscriptionStatus === 'pro',
    isFree: subscriptionStatus === 'free'
  };
}
