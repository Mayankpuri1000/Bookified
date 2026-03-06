'use server';

import { connectToDB } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";

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

export const checkBookExists = async (title: string) => {
    try {
        await connectToDB();
        const slug = generateSlug(title);
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
        await connectToDB();

        const slug = generateSlug(data.title);

        const existingBook = await Book.findOne({ slug }).lean();
        if(existingBook){
            return {
                success: true,
                data: serializeData(existingBook), 
                alreadyExists: true
            }
        }

        // TODO: Check subscription limits before creating a book
        const book = await Book.create({
            ...data,
            slug, 
            totalSegments: 0
        })

        return {
            success: true,
            data: serializeData(book)
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
        await connectToDB();
        console.log("Saving book segments......");
        
        const segmentsToInsert = segments.map(({text, segmentIndex, pageNumber, wordCount}) => ({
            content: text,
            bookId,
            clerkId,
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
        await Book.findByIdAndUpdate(bookId);
        console.log("Book segments deleted successfully");
    }
}