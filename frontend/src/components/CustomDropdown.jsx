/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect } from "react";

export default function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select",
  className = "",
  variant = "default",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected =
    typeof value === "object"
      ? value
      : options.find((option) => option.value === value);
  const isLang = variant === "lang";

  const wrapperClasses = isLang
    ? "relative w-[124px] min-w-[124px] max-w-[124px] text-[14px] [@media(max-width:900px)]:w-[108px] [@media(max-width:900px)]:min-w-[108px] [@media(max-width:900px)]:max-w-[108px]"
    : "relative w-full text-[14px]";

  const triggerClasses = isLang
    ? "flex h-[44px] cursor-pointer items-center justify-between rounded-[10px] border border-[var(--auth-border-strong)] bg-[var(--color-white)] px-[10px] py-2"
    : "flex h-[44px] cursor-pointer items-center justify-between rounded-[10px] border border-[var(--auth-border-strong)] bg-[var(--color-white)] px-[14px] py-3";

  const selectedWrapClasses = isLang
    ? "inline-flex min-w-0 flex-1 items-center justify-center gap-2"
    : "flex min-w-0 flex-1 items-center gap-2 text-[14px] text-[var(--color-black)]";

  const selectedTextClasses = isLang
    ? "inline-block w-[68px] overflow-visible whitespace-nowrap text-center text-[17px] font-medium leading-[1.3] text-[var(--color-black)]"
    : "block truncate";

  const menuClasses = isLang
    ? "absolute left-0 top-[calc(100%+6px)] z-[100] w-[124px] min-w-[124px] max-w-[124px] rounded-[10px] border border-[var(--auth-border-strong)] bg-[var(--color-white)] shadow-[0_12px_30px_rgba(0,0,0,0.15)] [@media(max-width:900px)]:w-[108px] [@media(max-width:900px)]:min-w-[108px] [@media(max-width:900px)]:max-w-[108px]"
    : "absolute left-0 top-[calc(100%+6px)] z-[100] w-full rounded-[10px] border border-[var(--auth-border-strong)] bg-[var(--color-white)] shadow-[0_12px_30px_rgba(0,0,0,0.15)]";

  return (
    <div className={`${wrapperClasses} ${className}`.trim()} ref={ref}>
      <div
        className={triggerClasses}
        onClick={() => setOpen(!open)}
      >
        <div className={selectedWrapClasses}>
          {selected?.flag && (
            <img
              src={selected.flag}
              alt=""
              className="h-4 w-[22px] rounded-sm object-cover"
            />
          )}

          <span className={selectedTextClasses}>
            {selected ? selected.dialCode || selected.label : placeholder}
          </span>
        </div>

        <span
          className={`inline-flex text-[12px] text-[var(--color-black)] transition-transform duration-200 ease-in-out ${
            open ? "rotate-180" : ""
          }`}
        >
          {"\u25BE"}
        </span>
      </div>

      {open && (
        <div className={menuClasses}>
          {options.map((opt, index) => (
            <div
              key={index}
              className={`flex cursor-pointer items-center gap-2 ${
                isLang
                  ? "justify-center px-[10px] py-[9px] text-center text-[16px] whitespace-nowrap"
                  : "px-[14px] py-[10px] text-[14px]"
              } ${
                opt.value === value
                  ? "active rounded-[4px] border border-[var(--auth-border-strong)] bg-[var(--color-surface-inverse)] text-[var(--color-white)]"
                  : "text-[var(--color-black)] hover:bg-[var(--color-surface-hover-neutral)]"
              }`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.flag && (
                <img
                  src={opt.flag}
                  alt=""
                  className="h-4 w-[22px] rounded-sm object-cover"
                />
              )}
              <span className={isLang ? "block" : "block truncate"}>
                {opt.name ? `${opt.name} (${opt.dialCode})` : opt.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
