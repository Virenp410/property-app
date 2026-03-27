"use client";

import { useEffect, useRef, useState } from "react";

export default function ProfileDropdown({
  fullName,
  seanebId,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onOutsideClick = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const displayName = String(fullName || "").trim() || "Profile";
  const displaySeanebId = String(seanebId || "").trim() || "-";

  return (
    <div className="relative ml-auto" ref={menuRef}>
      <button
        type="button"
        className="max-w-[240px] min-w-[150px] cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap rounded-[11px] border border-[var(--color-brand-primary)] bg-[linear-gradient(135deg,var(--color-brand-primary)_0%,var(--color-brand-secondary)_100%)] px-[18px] py-[8px] text-[14px] font-semibold text-[var(--color-white)] transition-[transform,box-shadow,background] duration-200 ease-in-out hover:translate-y-[-1px] hover:bg-[linear-gradient(135deg,var(--color-brand-secondary)_0%,var(--color-brand-primary)_100%)]"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {displayName}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[220] w-[min(340px,calc(100vw-28px))] rounded-[14px] border border-[#d8e6f3] bg-[var(--color-white)] p-3 shadow-[0_16px_32px_rgba(10,31,54,0.18)]">
          <div className="grid grid-cols-1 gap-2">
            <ProfileRow label="Full Name" value={displayName} />
            <ProfileRow label="SeaNeB ID" value={displaySeanebId} />
          </div>
          <div className="mt-[10px] grid grid-cols-1 gap-2">
            <button
              type="button"
              className="inline-flex min-h-[38px] cursor-pointer items-center justify-center rounded-[10px] border border-[#cf3d3d] bg-[#fff5f5] text-[13px] font-semibold text-[#a21f1f]"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-2 rounded-[8px] bg-[var(--color-page-bg-soft)] px-2 py-[6px]">
      <span className="text-[12px] text-[#5c7086]">{label}</span>
      <strong className="text-right text-[13px] text-[#0f2f54]">{String(value || "-")}</strong>
    </div>
  );
}
