'use client';
import { Mic, MicOff } from 'lucide-react'
import { useVapi } from '@/hooks/useVapi'
import { IBook } from '@/types';
import Image from 'next/image';
import Transcript from '@/components/Transcript';

const VoiceControls = ({ book }: { book: IBook }) => {
    const { status, isActive, messages, currentMessage, currentUserMessage, duration, start, stop, clearErrors } = useVapi(book);
    return (
        <>
            {/* Header Card */}
            <section className="vapi-header-card bg-[#f3e4c7] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-start relative shadow-sm">
                {/* Left: Cover Image & Mic Button */}
                <div className="relative shrink-0">
                    <div className="w-[120px] rounded-lg shadow-md overflow-hidden bg-white aspect-2/3 relative">
                        {book.coverURL ? (
                            <Image
                                src={book.coverURL}
                                alt={book.title}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-sm">No cover</span>
                            </div>
                        )}
                    </div>

                    {/* Pulsating ring — visible when AI is speaking or thinking */}
                    {(status === 'speaking' || status === 'thinking') && (
                        <span className="absolute -bottom-4 -right-4 w-[60px] h-[60px] rounded-full bg-white opacity-75 animate-ping z-9" />
                    )}

                    {/* Mic button overlapping bottom-right of cover */}
                    <button
                        onClick={isActive ? stop : start}
                        disabled={status === 'connecting'}
                        className="vapi-mic-btn absolute -bottom-4 -right-4 w-[60px] h-[60px] rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer z-10"
                    >
                        {isActive
                            ? <Mic className="w-6 h-6 text-gray-700" />
                            : <MicOff className="w-6 h-6 text-gray-700" />
                        }
                    </button>
                </div>

                {/* Right: Book Details */}
                <div className="flex flex-col flex-1 pt-2">
                    <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900 mb-1">
                        {book.title}
                    </h1>
                    <p className="text-gray-600 mb-6">by {book.author}</p>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-3 mt-4">
                        {/* Status */}
                        <div className="vapi-status-indicator flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm text-sm">
                            <span className="vapi-status-dot w-2 h-2 rounded-full bg-gray-400"></span>
                            <span className="vapi-status-text font-medium text-gray-700">Ready</span>
                        </div>

                        {/* Voice Label */}
                        <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm text-sm font-medium text-gray-700">
                            Voice: {book.persona || "Default"}
                        </div>

                        {/* Timer */}
                        <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm text-sm font-medium text-gray-700 font-mono">
                            0:00/15:00
                        </div>
                    </div>
                </div>
            </section>
            <div className="vapi-transcript-wrapper">
                <Transcript
                    messages={messages}
                    currentMessage={currentMessage}
                    currentUserMessage={currentUserMessage}
                />
            </div>
        </>

    )
}

export default VoiceControls