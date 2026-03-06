'use client';

import { useAuth } from '@clerk/nextjs';
import { PLAN_LIMITS, PLANS, PlanType } from '@/lib/subscription-constants';

/**
 * React hook to read the current user's Clerk plan and associated limits
 * in Client Components.
 *
 * Returns:
 *  - plan: 'free' | 'standard' | 'pro'
 *  - limits: PlanLimits for that plan
 */
export function useSubscription() {
    const { has } = useAuth();

    const plan: PlanType = has?.({ plan: PLANS.pro })
        ? PLANS.pro
        : has?.({ plan: PLANS.standard })
          ? PLANS.standard
          : PLANS.free;

    return { plan, limits: PLAN_LIMITS[plan] };
}
