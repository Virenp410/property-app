/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect } from "react";

export default function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected =
    typeof value === "object"
      ? value
      : options.find((o) => o.value === value);

  return (
    <div className={`cd ${className}`.trim()} ref={ref}>
      <div
        className="cd-trigger"
        onClick={() => setOpen(!open)}
      >
        <div className="cd-selected">
          {selected?.flag && (
            <img
              src={selected.flag}
              alt=""
              className="cd-flag"
            />
          )}

          <span>
            {selected
              ? selected.dialCode || selected.label
              : placeholder}
          </span>
        </div>

        <span className={`cd-arrow ${open ? "up" : ""}`}>
          ▾
        </span>
      </div>

      {open && (
        <div className="cd-menu">
          {options.map((opt, i) => (
            <div
              key={i}
              className={`cd-item ${
                opt.value === value ? "active" : ""
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
                  className="cd-flag"
                />
              )}
              <span>
                {opt.name
                  ? `${opt.name} (${opt.dialCode})`
                  : opt.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
