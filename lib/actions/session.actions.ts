'use server';
import VoiceSession from "@/database/models/voice-session.model";
import { connectToDB } from "@/database/mongoose";
import { StartSessionResult, EndSessionResult } from "@/types";
import { getCurrentBillingPeriodStart } from "../subscription-constants";
import { auth } from "@clerk/nextjs/server";
import { getUserPlanLimits } from "@/lib/subscription-utils.server";

export const startVoiceSession = async (clerkId: string, bookId: string): Promise<StartSessionResult> => {
    try {
        await connectToDB();

        // Resolve plan limits for the current user
        const { has } = await auth();
        const { maxSessionsPerMonth, maxSessionMinutes } = await getUserPlanLimits();

        // Check monthly session limit (unlimited plans have maxSessionsPerMonth === -1)
        if (maxSessionsPerMonth !== -1) {
            const billingStart = getCurrentBillingPeriodStart();
            const sessionCount = await VoiceSession.countDocuments({
                clerkId,
                billingPeriodStart: billingStart,
            });
            if (sessionCount >= maxSessionsPerMonth) {
                return {
                    success: false,
                    error: `You've used all ${maxSessionsPerMonth} sessions for this month. Upgrade your plan for more.`,
                    isBillingError: true,
                };
            }
        }

        const session = await VoiceSession.create({
            clerkId,
            bookId,
            startedAt: new Date(),
            billingPeriodStart: getCurrentBillingPeriodStart(),
            durationSeconds: 0,
        });

        return {
            success: true,
            sessionId: session._id.toString(),
            maxDurationMinutes: maxSessionMinutes,
        };
    } catch (e) {
        console.error("Error starting a call", e);
        return { success: false, error: 'Failed to start call. Please try again.' };
    }
}

export const endVoiceSession = async (sessionId: string, durationSeconds: number): Promise<EndSessionResult> => {
    try {
        await connectToDB();

        await VoiceSession.findByIdAndUpdate(sessionId, {
            endedAt: new Date(),
            durationSeconds,
        });

        return { success: true };
    } catch (e) {
        console.error("Error ending voice session", e);
        return { success: false, error: 'Failed to end session.' };
    }
}