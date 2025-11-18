import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageComparatorProps {
  originalSrc: string;
  editedSrc: string;
  editedStyle: React.CSSProperties;
}

const ImageComparator: React.FC<ImageComparatorProps> = ({ originalSrc, editedSrc, editedStyle }) => {
  const [sliderPosition, setSliderPosition] = useState(100); // Start fully showing edited image
  const [isDragging, setIsDragging] = useState(false);
  const [isHandleVisible, setIsHandleVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  // Reset slider position whenever the edited image source changes (e.g., on undo/redo)
  useEffect(() => {
    setSliderPosition(100);
  }, [editedSrc]);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const resetHideTimeout = useCallback(() => {
    clearHideTimeout();
    setIsHandleVisible(true);
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsHandleVisible(false);
    }, 3000); // Hide after 3 seconds of inactivity
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
    resetHideTimeout(); // Keep handle visible while moving
  }, [resetHideTimeout]);
  
  const handleDragMove = useCallback((clientX: number) => {
      if(!isDragging) return;
      handleMove(clientX);
  }, [isDragging, handleMove]);
  
  const handleInteractionStart = () => {
    clearHideTimeout();
    setIsHandleVisible(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleInteractionStart();
    handleMove(e.clientX);
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleInteractionStart();
    handleMove(e.touches[0].clientX);
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    resetHideTimeout();
  }, [resetHideTimeout]);
  
  const handleMouseEnter = () => {
    handleInteractionStart();
  };
  
  const handleMouseLeave = () => {
    if (!isDragging) {
      resetHideTimeout();
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full select-none overflow-hidden cursor-ew-resize" 
      onMouseDown={handleMouseDown} 
      onTouchStart={handleTouchStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Original Image (Bottom Layer) */}
      <img
        src={originalSrc}
        alt="Original"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        draggable="false"
      />
      
      {/* Edited Image (Top Layer, clipped) */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={editedSrc}
          alt="Edited"
          className="absolute inset-0 w-full h-full object-contain"
          style={editedStyle}
          draggable="false"
        />
      </div>

      {/* Slider Visuals */}
      <div
        className={`absolute top-0 bottom-0 w-8 -ml-4 pointer-events-none transition-opacity duration-300 ease-in-out ${isHandleVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: `${sliderPosition}%` }}
        role="separator" 
        aria-orientation="vertical"
        aria-valuenow={sliderPosition}
      >
        {/* Visual Line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-1 -ml-0.5 bg-white/50 backdrop-blur-sm" />
        {/* Visual Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full h-10 w-10 shadow-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-800 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
        </div>
      </div>
    </div>
  );
};

export default ImageComparator;
