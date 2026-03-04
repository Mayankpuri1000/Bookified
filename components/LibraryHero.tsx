import { Plus } from "lucide-react";
import Image from "next/image";

export function LibraryHero() {
    return (
        <section className="pt-28">
            <div className="library-hero-card">
                <div className="library-hero-content">
                    {/* Left side: Heading, Description, CTA */}
                    <div className="library-hero-text">
                        <h1 className="library-hero-title">Your Library</h1>
                        <p className="library-hero-description">
                            Convert your books into interactive AI conversations.
                            <br />
                            Listen, learn, and discuss your favorite reads.
                        </p>
                        <button className="library-cta-primary mt-2">
                            <Plus className="w-5 h-5" />
                            Add new book
                        </button>
                    </div>

                    {/* Center: Illustration for Mobile (Hidden on Desktop) */}
                    <div className="library-hero-illustration">
                        <Image
                            src="/assets/hero-illustration.png"
                            alt="Vintage books and globe"
                            width={300}
                            height={225}
                            priority
                            className="object-contain"
                        />
                    </div>

                    {/* Center: Illustration for Desktop */}
                    <div className="library-hero-illustration-desktop">
                        <Image
                            src="/assets/hero-illustration.png"
                            alt="Vintage books and globe"
                            width={400}
                            height={300}
                            priority
                            className="object-contain"
                        />
                    </div>

                    {/* Right side: Steps Card */}
                    <div className="library-steps-card">
                        <ul className="flex flex-col gap-4">
                            <li className="library-step-item">
                                <div className="library-step-number">1</div>
                                <div>
                                    <h4 className="library-step-title">Upload PDF</h4>
                                    <p className="library-step-description">Add your book file</p>
                                </div>
                            </li>
                            <li className="library-step-item">
                                <div className="library-step-number">2</div>
                                <div>
                                    <h4 className="library-step-title">AI Processing</h4>
                                    <p className="library-step-description">We analyze the content</p>
                                </div>
                            </li>
                            <li className="library-step-item">
                                <div className="library-step-number">3</div>
                                <div>
                                    <h4 className="library-step-title">Voice Chat</h4>
                                    <p className="library-step-description">Discuss with AI</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>


    );
}
