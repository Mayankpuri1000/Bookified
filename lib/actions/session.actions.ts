'use server';
import VoiceSession from "@/database/models/voice-session.model";
import { connectToDB } from "@/database/mongoose";
import {StartSessionResult, EndSessionResult} from "@/types";
import { getCurrentBillingPeriodStart } from "../subscription-constants";

export const startVoiceSession = async (clerkId: string, bookId: string): Promise<StartSessionResult> => {
    // TODO: implement session creation logic
    try {
        await connectToDB();

        // Limits to see whether a plan is allowed or not
        const session = await VoiceSession.create({clerkId, bookId, startedAt: new Date(), 
            billingPeriodStart: getCurrentBillingPeriodStart(),
            durationSeconds: 0,
        })

        return {
            success: true,
            sessionId: session._id.toString(),
            // maxDurationMinutes: check.maxDurationMinutes,
        }
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