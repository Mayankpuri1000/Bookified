import { IBook, Messages } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { ASSISTANT_ID, DEFAULT_VOICE, VOICE_SETTINGS } from "@/lib/constants";
import { startVoiceSession } from "@/lib/actions/session.actions";
import Vapi from '@vapi-ai/web';
import { getVoice } from "@/lib/utils";

export type CallStatus = "idle" | "connecting" | "starting" | "listening" | "speaking" | "thinking";

export function useLatestRef<T>(value: T) {
    const ref = useRef(value);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref;
}

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;

let vapi: InstanceType<typeof Vapi>;
function getVapi() {
    if (!vapi) {
        if (!VAPI_API_KEY) {
            throw new Error("VAPI_API_KEY is not defined");
        }
        vapi = new Vapi(VAPI_API_KEY);
    }
    return vapi;
}

export const useVapi = (book: IBook) => {
    const { userId } = useAuth();
    // TODO: Implement limits

    const [status, setStatus] = useState<CallStatus>("idle");
    const [messages, setMessages] = useState<Messages[]>([]);
    const [currentMessage, setCurrentMessage] = useState<string>("");
    const [currentUserMessage, setCurrentUserMessage] = useState<string>("");
    const [duration, setDuration] = useState<number>(0);
    const [limitError, setLimitError] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const isStoppingRef = useRef<boolean>(false);

    const bookRef = useLatestRef(book);
    const durationRef = useLatestRef(duration);
    const voice = book.persona || DEFAULT_VOICE;
    const isActive =
        status === "listening" ||
        status === "speaking" ||
        status === "thinking" ||
        status === "starting";

    // Limits:
    // const maxDurationRef = useLatestRef(limits.maxSessionMinutes * 60);
    // const maxDurationSeconds
    // const remainingSeconds
    // const showTimeWarning

    // ─── VAPI Event Listeners ────────────────────────────────────────────────
    useEffect(() => {
        const vapiInstance = getVapi();

        // ── call-start: VAPI confirmed the call is live ──────────────────────
        const onCallStart = () => {
            setStatus("listening");
        };

        // ── call-end: clean up streaming state ───────────────────────────────
        const onCallEnd = () => {
            setStatus("idle");
            setCurrentMessage("");
            setCurrentUserMessage("");
            isStoppingRef.current = false;
        };

        // ── message: transcript events from VAPI ─────────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onMessage = (message: any) => {
            // We only care about transcript-type messages
            if (message.type !== "transcript") return;

            const { role, transcriptType, transcript } = message as {
                role: "user" | "assistant";
                transcriptType: "partial" | "final";
                transcript: string;
            };

            if (role === "user") {
                if (transcriptType === "partial") {
                    // Live speech-to-text — update the streaming bubble in real time
                    setCurrentUserMessage(transcript);
                } else if (transcriptType === "final") {
                    // User finished their turn — commit to history, clear stream
                    const content = transcript?.trim();
                    if (content) {
                        setMessages((prev) => {
                            // Deduplicate: don't append if identical to the last message
                            const last = prev[prev.length - 1];
                            if (last?.role === "user" && last.content === content) return prev;
                            return [...prev, { role: "user", content }];
                        });
                    }
                    setCurrentUserMessage("");
                    setStatus("thinking"); // waiting for assistant response
                }
            } else if (role === "assistant") {
                if (transcriptType === "partial") {
                    // Streaming assistant speech — update the streaming bubble in real time
                    setCurrentMessage(transcript);
                    setStatus("speaking");
                } else if (transcriptType === "final") {
                    // Assistant finished its turn — commit to history, clear stream
                    const content = transcript?.trim();
                    if (content) {
                        setMessages((prev) => {
                            // Deduplicate: don't append if identical to the last message
                            const last = prev[prev.length - 1];
                            if (last?.role === "assistant" && last.content === content) return prev;
                            return [...prev, { role: "assistant", content }];
                        });
                    }
                    setCurrentMessage("");
                    setStatus("listening"); // back to listening for user
                }
            }
        };

        vapiInstance.on("call-start", onCallStart);
        vapiInstance.on("call-end", onCallEnd);
        vapiInstance.on("message", onMessage);

        return () => {
            vapiInstance.off("call-start", onCallStart);
            vapiInstance.off("call-end", onCallEnd);
            vapiInstance.off("message", onMessage);
        };
    }, []); // singleton Vapi instance — no deps needed
    // ─────────────────────────────────────────────────────────────────────────

    const start = async () => {
        if (!userId) return setLimitError("Please login to start a conversation");
        setLimitError(null);
        setStatus("connecting");

        try {
            const result = await startVoiceSession(userId, book._id);

            if (!result.success) {
                setLimitError(result.error || "Session limit reached. Please upgrade your plan");
                setStatus("idle");
                return;
            }

            sessionIdRef.current = result.sessionId || null;
            const firstMessage = `Hey, Good to meet you. Quick question, have you actually read ${book.title}? Or are we starting fresh?`;

            await getVapi().start(ASSISTANT_ID, {
                firstMessage,
                variableValues: {
                    title: book.title,
                    author: book.author,
                    bookId: book._id,
                },
                // voice: {
                //     provider: '11labs' as const,
                //     voiceId: getVoice(voice).id,
                //     model: "eleven_turbo_v2_5" as const,
                //     stability: VOICE_SETTINGS.stability,
                //     similarityBoost: VOICE_SETTINGS.similarityBoost,
                //     style: VOICE_SETTINGS.style,
                //     useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost,
                // }
            });
        } catch (e) {
            console.error("Error starting a call", e);
            setStatus("idle");
            setLimitError("Failed to start call. Please try again.");
        }
    };

    const stop = useCallback(() => {
        isStoppingRef.current = true;
        getVapi().stop();
    }, []);

    const clearErrors = () => {
        setLimitError(null);
    };

    return {
        status,
        isActive,
        messages,
        currentMessage,
        currentUserMessage,
        limitError,
        duration,
        start,
        stop,
        clearErrors,
        // maxDurationSeconds,
        // remainingSeconds,
        // showTimeWarning,
    };
};

export default useVapi;