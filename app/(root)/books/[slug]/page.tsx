import React from 'react';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getBookBySlug } from '@/lib/actions/book.actions';
import { Mic, MicOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import VoiceControls from '@/components/VapiControls';

interface BookPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function BookPage({ params }: BookPageProps) {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    const { slug } = await params;

    // Fetch the book using server action
    const response = await getBookBySlug(slug);

    if (!response.success || !response.data) {
        redirect('/');
    }

    const book = response.data;

    // Use the book's properties.
    // We expect: title, author, coverURL, persona.
    // Note: Model uses title, author, coverImage, persona. Let's cover both.
    const coverURL = book.coverImage || book.coverURL;

    return (
        <div className="book-page-container min-h-screen relative bg-background pb-12 pt-24 px-4 sm:px-8">
            {/* Floating Back Button */}
            {/* Note: In Prompt it says 'fixed at top-24 left-6' but using CSS classes back-btn-floating might override it. Adding classes according to instructions */}
            <Link
                href="/"
                className="back-btn-floating fixed top-24 left-6 w-12 h-12 bg-white rounded-full flex items-center justify-center border shadow-md hover:bg-gray-50 transition-colors z-10"
            >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>

            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                {/* Transcript Area */}
                <VoiceControls book={book} />
            </div>
        </div>
    );
}
