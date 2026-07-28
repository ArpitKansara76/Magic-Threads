'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  title?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
  title,
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const total = images.length;
  const currentMedia = images[currentIndex] || images[0];

  const isVideoUrl = useCallback((url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.mov') ||
      lower.endsWith('.ogg') ||
      lower.includes('/videos/')
    );
  }, []);

  // Reset loading state when currentMedia changes
  useEffect(() => {
    setIsLoading(true);
  }, [currentMedia, currentIndex]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    onIndexChange((currentIndex + 1) % total);
  }, [currentIndex, total, onIndexChange]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    onIndexChange((currentIndex - 1 + total) % total);
  }, [currentIndex, total, onIndexChange]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
  };

  if (!isOpen || !images || images.length === 0) return null;

  const isCurrentVideo = isVideoUrl(currentMedia);

  return (
    <div
      className="photo-lightbox-backdrop"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Image & Video Lightbox Viewer"
    >
      {/* Top Left Close Button */}
      <button
        type="button"
        className="photo-lightbox-close-btn"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close viewer"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Main Content Area */}
      <div
        className="photo-lightbox-container"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Media Display (Photo or Video) */}
        <div className="photo-lightbox-image-wrapper" style={{ position: 'relative' }}>
          {isLoading && (
            <div className="lightbox-loader-overlay">
              <div className="lightbox-loader-spinner" />
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Loading media...</span>
            </div>
          )}

          {isCurrentVideo ? (
            <video
              src={currentMedia}
              controls
              autoPlay
              loop
              playsInline
              onLoadedData={() => setIsLoading(false)}
              onCanPlay={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              className="photo-lightbox-video"
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: '6px',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.1)',
                outline: 'none',
                opacity: isLoading ? 0 : 1,
                transition: 'opacity 0.25s ease',
              }}
            />
          ) : (
            <img
              src={currentMedia}
              alt={title ? `${title} - media ${currentIndex + 1}` : `Media ${currentIndex + 1}`}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              className="photo-lightbox-image"
              style={{
                opacity: isLoading ? 0 : 1,
                transition: 'opacity 0.25s ease',
              }}
            />
          )}
        </div>

        {/* Left Arrow Navigation */}
        {total > 1 && (
          <button
            type="button"
            className="photo-lightbox-nav-btn prev"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous item"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Right Arrow Navigation */}
        {total > 1 && (
          <button
            type="button"
            className="photo-lightbox-nav-btn next"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next item"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Bottom Pagination Dots */}
        {total > 1 && (
          <div className="photo-lightbox-dots-container" onClick={(e) => e.stopPropagation()}>
            <div className="photo-lightbox-dots">
              {images.map((itemUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`photo-lightbox-dot ${idx === currentIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onIndexChange(idx);
                  }}
                  aria-label={`Go to item ${idx + 1}`}
                  title={isVideoUrl(itemUrl) ? 'Video' : `Photo ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
