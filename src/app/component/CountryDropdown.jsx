/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect } from "react";

export default function CountryDropdown({
  value,
  onChange,
  options,
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
    return () =>
      document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="country-dd" ref={ref}>
      <div
        className="country-trigger"
        onClick={() => setOpen(!open)}
      >
        <img src={value.flag} alt="" />
        <span>{value.dialCode}</span>
        <span className="arrow">▾</span>
      </div>

      {open && (
        <div className="country-panel">
          {options.map((c) => (
            <div
              key={c.name}
              className="country-row"
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
            >
              <img src={c.flag} alt="" />
              <span className="name">{c.name}</span>
              <span className="code">{c.dialCode}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}