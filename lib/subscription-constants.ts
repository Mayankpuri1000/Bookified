// ============================================
// PLAN DEFINITIONS
// ============================================

export const PLANS = {
    free: 'free',
    standard: 'standard',
    pro: 'pro',
} as const;

export type PlanType = (typeof PLANS)[keyof typeof PLANS];

// ============================================
// PLAN LIMITS
// ============================================

export interface PlanLimits {
    /** Maximum number of books a user can upload */
    maxBooks: number;
    /** Maximum voice sessions per calendar month. -1 means unlimited */
    maxSessionsPerMonth: number;
    /** Maximum duration (in minutes) for a single voice session */
    maxSessionMinutes: number;
    /** Whether the user can view past session history */
    hasSessionHistory: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    free: {
        maxBooks: 1,
        maxSessionsPerMonth: 5,
        maxSessionMinutes: 5,
        hasSessionHistory: false,
    },
    standard: {
        maxBooks: 10,
        maxSessionsPerMonth: 100,
        maxSessionMinutes: 15,
        hasSessionHistory: true,
    },
    pro: {
        maxBooks: 100,
        maxSessionsPerMonth: -1, // unlimited
        maxSessionMinutes: 60,
        hasSessionHistory: true,
    },
};

// ============================================
// BILLING PERIOD HELPERS
// ============================================

/** Returns the start of the current calendar month (UTC midnight). */
export const getCurrentBillingPeriodStart = (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};
