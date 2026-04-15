"use client";

import { useEffect, useRef, useState } from "react";

export default function ProfileDropdown({
  fullName,
  seanebId,
  onAccount,
  onSwitchProfile,
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
        className="min-w-[160px] max-w-[240px] rounded-[14px] border border-[#e6e8ee] bg-white px-4 py-2 text-left text-[12px] font-semibold text-[#1f2937] shadow-[0_10px_18px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-[#C9A24D]"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="block truncate">{displayName}</span>
        <span className="block truncate text-[11px] font-medium text-[#98a2b3]">{displaySeanebId}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[220] w-[min(340px,calc(100vw-28px))] rounded-[16px] border border-[#e6e8ee] bg-white p-3 shadow-[0_18px_34px_rgba(15,23,42,0.14)]">
          <div className="px-2 pb-2 text-[13px] font-semibold text-[#1f2937]">{displayName}</div>
          <div className="grid grid-cols-1 gap-2">
            <ProfileRow label="Full Name" value={displayName} />
            <ProfileRow label="SeaNeB ID" value={displaySeanebId} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2">
            <button
              type="button"
              className="inline-flex min-h-[40px] items-center justify-center rounded-[10px] border border-[#e6e8ee] bg-white text-[13px] font-semibold text-[#344054] transition hover:border-[#C9A24D] hover:text-[#7a5b22]"
              onClick={() => {
                setOpen(false);
                onAccount?.();
              }}
            >
              My Account
            </button>
            <button
              type="button"
              className="inline-flex min-h-[40px] items-center justify-center rounded-[10px] border border-[#e6e8ee] bg-white text-[13px] font-semibold text-[#344054] transition hover:border-[#C9A24D] hover:text-[#7a5b22]"
              onClick={() => {
                setOpen(false);
                onSwitchProfile?.();
              }}
            >
              Switch to Dealer Profile
            </button>
            <button
              type="button"
              className="inline-flex min-h-[40px] items-center justify-center rounded-[10px] border border-[#f1c0c0] bg-[#fff6f6] text-[13px] font-semibold text-[#b42318]"
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
    <div className="flex items-baseline justify-between gap-2 rounded-[10px] border border-[#eef0f4] bg-[#f9fafc] px-2 py-[6px]">
      <span className="text-[12px] text-[#667085]">{label}</span>
      <strong className="text-right text-[13px] text-[#1f2937]">{String(value || "-")}</strong>
    </div>
  );
}
