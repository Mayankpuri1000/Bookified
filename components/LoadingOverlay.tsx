'use client';

import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    title?: string;
}

const LoadingOverlay = ({ title = "Synthesizing Book..." }: LoadingOverlayProps) => {
    return (
        <div className="loading-wrapper">
            <div className="loading-shadow-wrapper bg-white">
                <div className="loading-shadow">
                    <Loader2 className="loading-animation w-12 h-12 text-[#663820]" />
                    <h3 className="loading-title">{title}</h3>
                    <div className="loading-progress">
                        <div className="loading-progress-item">
                            <span className="loading-progress-status" />
                            <span>Processing content...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingOverlay;
