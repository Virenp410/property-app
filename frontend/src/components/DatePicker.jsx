/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useRef, useEffect } from "react";

export default function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("year");
  const dropdownRef = useRef(null);

  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [day, setDay] = useState(null);

  const currentYear = new Date().getFullYear();

  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setYear(d.getFullYear());
      setMonth(d.getMonth());
      setDay(d.getDate());
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sendDate = (y, m, d) => {
    if (y && m !== null && d) {
      const formattedMonth = String(m + 1).padStart(2, "0");
      const formattedDay = String(d).padStart(2, "0");

      const isoDate = `${y}-${formattedMonth}-${formattedDay}`;

      onChange?.(isoDate);
    }
  };

  const handleYear = (y) => {
    setYear(y);
    setStep("month");
  };

  const handleMonth = (m) => {
    setMonth(m);
    setStep("day");
  };

  const handleDay = (d) => {
    setDay(d);
    sendDate(year, month, d);
    setOpen(false);
    setStep("year");
  };

  const formatDate = () => {
    if (!year || month === null || !day) return "";
    const dd = String(day).padStart(2, "0");
    const mm = String(month + 1).padStart(2, "0");
    return `${dd} / ${mm} / ${year}`;
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Input */}
      <div className="relative">
        <input
          readOnly
          value={formatDate()}
          placeholder="DD / MM / YYYY"
          onClick={() => setOpen(!open)}
          className="h-[44px] w-full rounded-xl border border-gray-300 px-4 pr-10 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#C9A24D] focus:ring-2 focus:ring-[rgba(201,162,77,0.25)] outline-none transition cursor-pointer"
        />

        {/* Icon */}
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M8 7V3M16 7V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[9999] mt-2 w-[260px] rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">

          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              Select {step}
            </span>

            {step !== "year" && (
              <button
                onClick={() => setStep(step === "day" ? "month" : "year")}
                className="text-xs text-[#B4892F] hover:underline"
              >
                Back
              </button>
            )}
          </div>

          {/* Year */}
          {step === "year" && (
            <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => handleYear(y)}
                  className={`py-2 rounded-lg text-sm font-medium transition ${
                    year === y
                      ? "bg-[#C9A24D] text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Month */}
          {step === "month" && (
            <div className="grid grid-cols-3 gap-2">
              {months.map((m, i) => (
                <button
                  key={m}
                  onClick={() => handleMonth(i)}
                  className={`py-2 rounded-lg text-sm font-medium transition ${
                    month === i
                      ? "bg-[#C9A24D] text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* Day */}
          {step === "day" && (
            <div className="grid grid-cols-7 gap-1">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => handleDay(d)}
                  className={`h-8 flex items-center justify-center rounded-md text-xs transition ${
                    day === d
                      ? "bg-[#C9A24D] text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
