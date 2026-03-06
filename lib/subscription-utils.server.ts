import { auth } from '@clerk/nextjs/server';
import { PLAN_LIMITS, PLANS, PlanType } from './subscription-constants';

/**
 * Resolves the active Clerk plan for the currently authenticated user.
 * Checks in order: pro → standard → free (default).
 */
export async function getUserPlan(): Promise<PlanType> {
    const { has } = await auth();
    if (has({ plan: PLANS.pro })) return PLANS.pro;
    if (has({ plan: PLANS.standard })) return PLANS.standard;
    return PLANS.free;
}

/**
 * Returns the active plan slug and its associated limits for the
 * currently authenticated user.
 */
export async function getUserPlanLimits() {
    const plan = await getUserPlan();
    return { plan, ...PLAN_LIMITS[plan] };
}
