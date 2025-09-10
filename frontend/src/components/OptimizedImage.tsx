"use client";

import { useState, useEffect } from "react";
import { ApiService } from "../lib/api";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  showFallback?: boolean;
  onError?: () => void;
  onLoad?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  className = "",
  fallbackText = "Image failed to load",
  showFallback = true,
  onError,
  onLoad,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageKey, setImageKey] = useState(0);

  // Reset state when src changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
    setImageKey(prev => prev + 1);
  }, [src]);

  const handleError = () => {
    console.error("Image failed to load:", src);
    setImageError(true);
    setImageLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setImageLoading(false);
    setImageError(false);
    onLoad?.();
  };

  const imageUrl = ApiService.getImageUrl(src);

  if (imageError && showFallback) {
    return (
      <div className={`flex items-center justify-center bg-slate-800/50 ${className}`}>
        <div className="text-center">
          <svg 
            className="mx-auto h-12 w-12 text-slate-400 mb-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-red-400 text-sm">{fallbackText}</p>
          <p className="text-slate-500 text-xs mt-1">Please try re-uploading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {imageLoading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-slate-800/50 ${className}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      )}
      <img
        key={imageKey}
        src={imageUrl}
        alt={alt}
        className={`${className} max-w-full max-h-full`}
        onError={handleError}
        onLoad={handleLoad}
        style={{ display: imageError ? 'none' : 'block' }}
      />
    </div>
  );
}
