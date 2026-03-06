'use server';

import { connectToDB } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import { del } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";

export const getAllBooks = async () => {
    try {
        await connectToDB();
        const books = await Book.find().sort({ createdAt: -1 }).lean();
        return {
            success: true,
            data: serializeData(books)
        }
    } catch (error) {
        console.error("Error getting all books", error);
        return {
            success: false,
            error: error
        }
    }
}

export const deleteFileByUrl = async (url: string) => {
    try {
        await del(url);
        return { success: true };
    } catch (error) {
        console.error("Error deleting file", error);
        return { success: false, error };
    }
}

export const checkBookExists = async (title: string) => {
    try {
        await connectToDB();
        const slug = generateSlug(title);
        if (!slug) {
            throw new Error("Invalid title: generated slug is empty");
        }
        const existingBook = await Book.findOne({ slug }).lean();
        if(existingBook){
            return {
                exists: true,
                book: serializeData(existingBook)
            }
        }
        return {
            exists: false,
        }
    } catch (e) {
        console.error("Error checking book exists", e);
        return {
            exists: false,
            error: e
        };
    }
}

export const createBook = async (data: CreateBook) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        await connectToDB();

        const slug = generateSlug(data.title);
        if (!slug) {
            return { success: false, error: "Invalid title: generated slug is empty" };
        }

        try {
            // TODO: Check subscription limits before creating a book
            const book = await Book.create({
                ...data,
                clerkId: userId,
                slug, 
                totalSegments: 0
            });

            return {
                success: true,
                data: serializeData(book)
            };
        } catch (error: any) {
            if (error?.code === 11000 && error?.keyPattern?.slug) {
                const existingBook = await Book.findOne({ slug }).lean();
                if (existingBook) {
                    return {
                        success: true,
                        data: serializeData(existingBook), 
                        alreadyExists: true
                    };
                }
            }
            throw error;
        }
    } catch (e) {
        console.error("Error creating a book", e);
        return {
            success: false,
            error: e 
        }
    }
}

export const saveBookSegments = async (bookId: string, clerkId: string, segments: TextSegment[]) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        await connectToDB();

        const book = await Book.findById(bookId).lean();
        if (!book) {
            return { success: false, error: "Book not found" };
        }
        if (book.clerkId !== userId) {
            return { success: false, error: "Unauthorized: You do not own this book" };
        }

        console.log("Saving book segments......");
        
        const segmentsToInsert = segments.map(({text, segmentIndex, pageNumber, wordCount}) => ({
            content: text,
            bookId,
            clerkId: userId,
            segmentIndex,
            pageNumber,
            wordCount
        }));

        await BookSegment.insertMany(segmentsToInsert);
        await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

        return {
            success: true,
            data: {segmentsCreated: segments.length}
        }
    }
    catch (e) {
        console.error("Error saving book segments", e);
        await BookSegment.deleteMany({ bookId });
        await Book.findByIdAndDelete(bookId);
        console.error("Book and segments rolled back successfully due to error.");
        return { success: false, error: e };
    }
}

export const searchBookSegments = async (bookId: string, query: string, topN: number = 3) => {
    try {
        await connectToDB();

        const segments = await BookSegment.find(
            { bookId, $text: { $search: query } },
            { score: { $meta: 'textScore' } }
        )
            .sort({ score: { $meta: 'textScore' } })
            .limit(topN)
            .lean();

        return {
            success: true,
            data: serializeData(segments)
        };
    } catch (error) {
        console.error('Error searching book segments', error);
        return { success: false, error };
    }
};

export const getBookBySlug = async (slug: string) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        await connectToDB();
        
        const book = await Book.findOne({ slug, clerkId: userId }).lean();
        if (!book) {
            return { success: false, error: "Book not found" };
        }

        return {
            success: true,
            data: serializeData(book)
        }
    } catch (error) {
        console.error("Error getting book by slug", error);
        return {
            success: false,
            error: error
        }
    }
}