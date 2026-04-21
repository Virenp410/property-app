"use client";

import React from "react";
import ImageCarousel from "./ImageCarousel";

export default function PropertyListingCard({ 
  images = [], 
  title = "Zara Rossa", 
  subtitle = "Bengaluru · bengaluru",
  avatarInitial = "",
  onClick,
}) {
  const displayInitial = avatarInitial || (title ? title.charAt(0).toUpperCase() : "Z");
  const handleKeyDown = (event) => {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`group overflow-hidden rounded-[20px] border border-[#eef0f4] bg-white shadow-[0_8px_30px_rgb(15,23,42,0.04)] transition-all duration-300 ${
        onClick ? "cursor-pointer hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(15,23,42,0.08)]" : ""
      }`}
    >
      {/* Top section: Carousel */}
      <div className="relative h-[220px] w-full">
        <ImageCarousel 
          images={images.length > 0 ? images : undefined} 
          className="h-full w-full"
          autoPlay={true}
          autoPlayInterval={4000}
        />
        
        {/* Decorative Badge */}
        <div className="absolute left-3 top-3 rounded-xl bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0f172a] shadow-sm backdrop-blur-md">
          Featured
        </div>

        {/* Action buttons overlay (like save/favorite) */}
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-slate-400 shadow-sm backdrop-blur-md transition hover:scale-105 hover:text-[#ef4444]"
          aria-label="Save property"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
        </button>
      </div>

      {/* Bottom section: Info */}
      <div className="flex items-center gap-4 border-t border-[#f8fafc] bg-white px-5 py-4">
        {/* Avatar */}
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-[#e2e8f0] text-lg font-semibold text-[#64748b] shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:from-[var(--color-brand-primary)] group-hover:to-[var(--color-brand-secondary)] group-hover:text-white group-hover:border-transparent">
          {displayInitial}
        </div>
        
        {/* Details */}
        <div className="flex flex-col">
          <h3 className="text-base font-semibold tracking-tight text-[#0f172a] transition-colors group-hover:text-[var(--color-brand-primary)]">
            {title}
          </h3>
          <p className="mt-0.5 flex text-sm text-[#64748b]">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
