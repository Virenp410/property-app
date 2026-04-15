"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (first + last).toUpperCase() || "?";
}

function safeText(value) {
  return String(value || "").trim();
}

export default function BranchSwitcherDropdown({
  value,
  options = [],
  onChange,
  onRegisterNew,
  label = "YOUR BRANCHES",
  placeholder = "Select Branch",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onOutsideClick = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const selected = useMemo(() => {
    if (!value) return null;
    if (typeof value === "object") return value;
    return options.find((item) => item?.id === value) || null;
  }, [options, value]);


  const selectedName = safeText(selected?.name);
  const selectedSub = safeText(selected?.subtitle || selected?.city || selected?.location);
  const initials = getInitials(selectedName || placeholder);
  const selectedLogo = safeText(selected?.logo);

  return (
    <div className={`relative ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex min-h-[54px] w-[min(360px,100%)] items-center gap-3 rounded-[14px] border border-[#dbe3ef] bg-white px-3 py-2 shadow-[0_10px_18px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-[#93c5fd] focus:outline-none focus-visible:[box-shadow:0_0_0_3px_rgba(59,130,246,0.25),0_10px_18px_rgba(15,23,42,0.08)]"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-[12px] font-bold text-white">
          {selectedLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedLogo} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>

        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[14px] font-semibold text-[#0f172a]">
            {selectedName || placeholder}
          </span>
          <span className="mt-0.5 block truncate text-[12px] font-medium text-[#94a3b8]">
            {selectedSub || "\u00A0"}
          </span>
        </span>

        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-[#fbfdff] text-[#64748b] transition ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+10px)] z-[250] w-[min(380px,calc(100vw-28px))] overflow-hidden rounded-[18px] border border-[#dbe3ef] bg-white shadow-[0_18px_38px_rgba(15,23,42,0.14)]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
              {label}
            </div>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#eff6ff] px-2 text-[12px] font-bold text-[#2563eb]">
              {options.length}
            </span>
          </div>

          <div className="px-2 pb-2">
            {options.length === 0 ? (
              <div className="px-3 py-3 text-[13px] text-[#64748b]">
                No branches yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                {options.map((item) => {
                  const isActive = selected?.id != null && item?.id === selected?.id;
                  const name = safeText(item?.name);
                  const sub = safeText(item?.subtitle || item?.city || item?.location);
                  const logo = safeText(item?.logo);
                  return (
                    <button
                      key={String(item?.id ?? name)}
                      type="button"
                      className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition ${
                        isActive ? "bg-[#f1f7ff]" : "hover:bg-[#f8fafc]"
                      }`}
                      onClick={() => {
                        onChange?.(item?.id ?? item);
                        setOpen(false);
                      }}
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#eaf2ff] text-[12px] font-bold text-[#2563eb]">
                        {logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          getInitials(name)
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold text-[#0f172a]">
                          {name || "Branch"}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] font-medium text-[#94a3b8]">
                          {sub || "\u00A0"}
                        </span>
                      </span>
                      <span className="inline-flex h-8 w-8 items-center justify-center">
                        {isActive ? <CheckIcon /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {onRegisterNew ? (
              <button
                type="button"
                className="mt-2 flex w-full items-center gap-3 rounded-[14px] border border-dashed border-[#93c5fd] bg-[#f8fbff] px-3 py-3 text-left text-[14px] font-semibold text-[#2563eb] transition hover:bg-[#eff6ff]"
                onClick={() => {
                  setOpen(false);
                  onRegisterNew();
                }}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb] text-white">
                  <PlusIcon />
                </span>
                <span className="truncate">Register New Business</span>
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronDownIcon() {
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
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
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
        d="M20 6L9 17L4 12"
        stroke="#2563eb"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
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
        d="M12 5V19"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
