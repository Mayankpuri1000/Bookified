'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import LoadingOverlay from './LoadingOverlay';
import { useAuth } from '@clerk/nextjs';
import { checkBookExists, createBook, saveBookSegments } from '@/lib/actions/book.actions';
import { useRouter } from 'next/navigation';
import { parsePDFFile } from '@/lib/utils';
import { upload } from '@vercel/blob/client';

const formSchema = z.object({
    pdfFile: z.any().refine((file) => file, "PDF file is required"),
    coverImage: z.any().optional(),
    title: z.string().min(1, "Title is required"),
    author: z.string().min(1, "Author name is required"),
    persona: z.string().min(1, "Please select an assistant voice"),
});

const VOICES = {
    male: [
        { id: 'dave', name: 'Dave', description: 'Young male, British-Essex, casual & conversational' },
        { id: 'daniel', name: 'Daniel', description: 'Middle-aged male, British, authoritative but warm' },
        { id: 'chris', name: 'Chris', description: 'Male, casual & easy-going' },
    ],
    female: [
        { id: 'rachel', name: 'Rachel', description: 'Young female, American, calm & clear' },
        { id: 'sarah', name: 'Sarah', description: 'Young female, American, soft & approachable' },
    ],
};

const UploadForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pdfFileName, setPdfFileName] = useState<string | null>(null);
    const [coverImageName, setCoverImageName] = useState<string | null>(null);
    const { userId } = useAuth();
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            author: '',
            pdfFile: undefined,
            coverImage: undefined,
            persona: ''
        },
    });

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        if (!userId) {
            return toast.error("You must be logged in to upload a book");
        }
        setIsSubmitting(true);
        // Simulate API call

        try {
            const existsCheck = await checkBookExists(data.title);
            if (existsCheck.exists && existsCheck.book) {
                toast.info("Book already exists");
                form.reset();
                router.push(`/book/${existsCheck.book.slug}`);
                return;
            }

            const fileTitle = data.title.replace(/\s/g, "-").toLowerCase();
            const pdfFile = data.pdfFile;

            const parsedPdf = await parsePDFFile(pdfFile);

            if (parsedPdf.content.length === 0) {
                toast.error("Failed to parse PDF file");
                return;
            }

            const uploadedPdfBlob = await upload(fileTitle, pdfFile, {
                access: 'public',
                handleUploadUrl: "/api/upload",
                contentType: "application/pdf"
            })

            let coverUrl: string;

            if (data.coverImage) {
                const coverFile = data.coverImage;
                const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, coverFile, {
                    access: 'public',
                    handleUploadUrl: "/api/upload",
                    contentType: coverFile.type
                });
                coverUrl = uploadedCoverBlob.url;
            } else {
                const response = await fetch(parsedPdf.cover);
                const blob = await response.blob();
                const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, blob, {
                    access: 'public',
                    handleUploadUrl: "/api/upload",
                    contentType: blob.type
                });
                coverUrl = uploadedCoverBlob.url;
            }

            const book = await createBook({
                clerkId: userId,
                title: data.title,
                author: data.author,
                persona: data.persona,
                fileURL: uploadedPdfBlob.url,
                fileBlobKey: uploadedPdfBlob.pathname,
                coverURL: coverUrl,
                fileSize: pdfFile.size
            })

            if (!book.success) {
                toast.error("Failed to upload book");
                return;
            }
            if (book.alreadyExists) {
                toast.info("Book already exists");
                form.reset();
                router.push(`/book/${book.data.slug}`);
                return;
            }

            const segments = await saveBookSegments(book.data._id, userId, parsedPdf.content);
            if (!segments?.success) {
                toast.error("Failed to save book segments");
                throw new Error("Failed to save book segments");
            }

            form.reset();
            router.push('/');

        } catch (error) {
            console.error(error);
            toast.error("Failed to upload book");
        }
        finally {
            setIsSubmitting(false);
        }
    };

    const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: File) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            setPdfFileName(file.name);
            onChange(file);
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: File) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImageName(file.name);
            onChange(file);
        }
    };

    return (
        <div className="new-book-wrapper">
            {isSubmitting && <LoadingOverlay />}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {/* PDF File Upload */}
                    <FormField
                        control={form.control}
                        name="pdfFile"
                        render={({ field: { onChange, value, ...field } }) => (
                            <FormItem>
                                <FormLabel className="form-label">Book PDF File</FormLabel>
                                <FormControl>
                                    <div className={`upload-dropzone border-2 border-dashed border-(--border-subtle) ${pdfFileName ? 'upload-dropzone-uploaded' : ''}`}>
                                        <Input
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            id="pdf-upload"
                                            onChange={(e) => handlePdfChange(e, onChange)}
                                            {...field}
                                        />
                                        {pdfFileName ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <span className="upload-dropzone-text">{pdfFileName}</span>
                                                <button
                                                    type="button"
                                                    className="upload-dropzone-remove"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setPdfFileName(null);
                                                        onChange(undefined as any);
                                                    }}
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label htmlFor="pdf-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                                <Upload className="upload-dropzone-icon" />
                                                <span className="upload-dropzone-text">Click to upload PDF</span>
                                                <span className="upload-dropzone-hint">PDF file (max 50MB)</span>
                                            </label>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Cover Image Upload */}
                    <FormField
                        control={form.control}
                        name="coverImage"
                        render={({ field: { onChange, value, ...field } }) => (
                            <FormItem>
                                <FormLabel className="form-label">Cover Image (Optional)</FormLabel>
                                <FormControl>
                                    <div className={`upload-dropzone border-2 border-dashed border-(--border-subtle) ${coverImageName ? 'upload-dropzone-uploaded' : ''}`}>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="cover-upload"
                                            onChange={(e) => handleCoverChange(e, onChange)}
                                            {...field}
                                        />
                                        {coverImageName ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <span className="upload-dropzone-text">{coverImageName}</span>
                                                <button
                                                    type="button"
                                                    className="upload-dropzone-remove"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setCoverImageName(null);
                                                        onChange(undefined as any);
                                                    }}
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label htmlFor="cover-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                                <ImageIcon className="upload-dropzone-icon" />
                                                <span className="upload-dropzone-text">Click to upload cover image</span>
                                                <span className="upload-dropzone-hint">Leave empty to auto-generate from PDF</span>
                                            </label>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Title Input */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="form-label">Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: Rich Dad Poor Dad" className="form-input" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Author Input */}
                    <FormField
                        control={form.control}
                        name="author"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="form-label">Author Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: Robert Kiyosaki" className="form-input" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Voice Selector */}
                    <FormField
                        control={form.control}
                        name="persona"
                        render={({ field }) => (
                            <FormItem className="space-y-4">
                                <FormLabel className="form-label text-xl">Choose Assistant Voice</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-col gap-6"
                                    >
                                        <div className="space-y-3">
                                            <h4 className="text-(--text-secondary) text-sm font-medium">Male Voices</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {VOICES.male.map((voice) => (
                                                    <div key={voice.id} className="relative flex">
                                                        <RadioGroupItem value={voice.id} id={`voice-male-${voice.id}`} className="peer sr-only" />
                                                        <label
                                                            htmlFor={`voice-male-${voice.id}`}
                                                            className={`voice-selector-option w-full ${field.value === voice.id
                                                                ? 'voice-selector-option-selected'
                                                                : 'voice-selector-option-default'
                                                                }`}
                                                        >
                                                            <div className="flex flex-col items-start gap-1 w-full relative">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${field.value === voice.id ? 'border-(--color-brand) bg-transparent' : 'border-gray-300'}`}>
                                                                        {field.value === voice.id && <div className="w-2 h-2 rounded-full bg-(--color-brand)" />}
                                                                    </div>
                                                                    <span className="font-semibold text-(--text-primary)">{voice.name}</span>
                                                                </div>
                                                                <span className="text-xs text-(--text-secondary) leading-tight pl-6">
                                                                    {voice.description}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-(--text-secondary) text-sm font-medium">Female Voices</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {VOICES.female.map((voice) => (
                                                    <div key={voice.id} className="relative flex">
                                                        <RadioGroupItem value={voice.id} id={`voice-female-${voice.id}`} className="peer sr-only" />
                                                        <label
                                                            htmlFor={`voice-female-${voice.id}`}
                                                            className={`voice-selector-option w-full ${field.value === voice.id
                                                                ? 'voice-selector-option-selected'
                                                                : 'voice-selector-option-default'
                                                                }`}
                                                        >
                                                            <div className="flex flex-col items-start gap-1 w-full relative">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${field.value === voice.id ? 'border-(--color-brand) bg-transparent' : 'border-gray-300'}`}>
                                                                        {field.value === voice.id && <div className="w-2 h-2 rounded-full bg-(--color-brand)" />}
                                                                    </div>
                                                                    <span className="font-semibold text-(--text-primary)">{voice.name}</span>
                                                                </div>
                                                                <span className="text-xs text-(--text-secondary) leading-tight pl-6">
                                                                    {voice.description}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="form-btn">
                        Begin Synthesis
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default UploadForm;