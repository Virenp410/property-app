"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageCarousel({ images = [], autoPlay = true, autoPlayInterval = 3000, className = "" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  // If no images are provided, use some visually pleasing static placeholder gradients
  const fallbackImages = [
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1448630360428-65456885c650?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  ];
  
  const safeImages = Array.isArray(images) && images.length > 0 ? images : fallbackImages;

  // Handle manual scrolling to update active dot
  const handleScroll = (e) => {
    if (!scrollRef.current) return;
    const scrollPosition = e.target.scrollLeft;
    const width = scrollRef.current.clientWidth;
    if (width === 0) return;
    const newIndex = Math.round(scrollPosition / width);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const scrollTo = (index) => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: width * index,
      behavior: "smooth"
    });
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    const nextIndex = (currentIndex + 1) % safeImages.length;
    scrollTo(nextIndex);
  };

  const prevSlide = () => {
    const prevIndex = (currentIndex - 1 + safeImages.length) % safeImages.length;
    scrollTo(prevIndex);
  };

  useEffect(() => {
    if (!autoPlay || safeImages.length <= 1) return;
    
    const interval = setInterval(() => {
      if (scrollRef.current) {
        // Calculate next slide manually just in case state wasn't updated in closure
        const width = scrollRef.current.clientWidth;
        if (width === 0) return;
        const currentPos = scrollRef.current.scrollLeft;
        const cIndex = Math.round(currentPos / width);
        let nIndex = (cIndex + 1) % safeImages.length;
        scrollTo(nIndex);
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, safeImages.length]);

  return (
    <div className={`group relative w-full overflow-hidden ${className}`}>
      {/* Scrollable container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Hide scrollbar for Firefox/IE
      >
        {safeImages.map((src, i) => (
          <div key={i} className="h-full min-w-full shrink-0 snap-center snap-always bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={src} 
              alt={`Carousel image ${i + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows (Visible on hover) */}
      {safeImages.length > 1 && (
        <>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); prevSlide(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-1.5 text-slate-800 opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-300 hover:bg-white group-hover:opacity-100"
            aria-label="Previous image"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); nextSlide(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-1.5 text-slate-800 opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-300 hover:bg-white group-hover:opacity-100"
            aria-label="Next image"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {safeImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {safeImages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); scrollTo(i); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}
