"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import BranchSwitcherDropdown from "./BranchSwitcherDropdown";

export default function AppTopbar({
  branches = [],
  activeBranch,
  onBranchChange,
  onRegisterNewBusiness,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search here (Ctrl+/)",
  homeHref = "/",
  rightSlot = null,
  className = "",
  enableSearchHotkey = true,
}) {
  const searchRef = useRef(null);

  useEffect(() => {
    if (!enableSearchHotkey) return;
    const handler = (event) => {
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      if (!isCtrlOrMeta) return;
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enableSearchHotkey]);

  return (
    <div
      className={`w-full rounded-[18px] border border-[#eef2f7] bg-white px-3 py-2 shadow-[0_10px_18px_rgba(15,23,42,0.06)] ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center gap-3">
        <BranchSwitcherDropdown
          value={activeBranch}
          options={branches}
          onChange={onBranchChange}
          onRegisterNew={onRegisterNewBusiness}
          className="flex-[1_1_320px]"
        />

        <div className="flex flex-[2_1_520px] items-center gap-2 rounded-[14px] border border-[#eef2f7] bg-[#f8fafc] px-3 py-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-[#94a3b8] shadow-[0_6px_12px_rgba(15,23,42,0.06)]">
            <SearchIcon />
          </span>
          <input
            ref={searchRef}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[14px] font-medium text-[#0f172a] outline-none placeholder:font-medium placeholder:text-[#94a3b8]"
          />
        </div>

        {rightSlot ? (
          <div className="ml-auto flex items-center">{rightSlot}</div>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={homeHref}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-[14px] border border-[#eef2f7] bg-white px-4 text-[14px] font-semibold text-[#334155] shadow-[0_10px_18px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#dbeafe]"
            >
              <HomeIcon />
              Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10.5 18.5C14.9183 18.5 18.5 14.9183 18.5 10.5C18.5 6.08172 14.9183 2.5 10.5 2.5C6.08172 2.5 2.5 6.08172 2.5 10.5C2.5 14.9183 6.08172 18.5 10.5 18.5Z"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M21 21L16.8 16.8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 10.5L12 4L20 10.5V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V10.5Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 21V14.5C9.5 13.9477 9.94772 13.5 10.5 13.5H13.5C14.0523 13.5 14.5 13.9477 14.5 14.5V21"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
