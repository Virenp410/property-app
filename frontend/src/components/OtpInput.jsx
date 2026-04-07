"use client";

import { useState, useRef, useEffect } from "react";

export default function OtpInput({
  length = 4,
  onComplete,
  resetKey,
  wrapperClassName = "",
  inputClassName = "",
}) {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputsRef = useRef([]);

  useEffect(() => {
    // Reset the controlled OTP fields when parent changes resetKey.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOtp(Array(length).fill(""));
    inputsRef.current[0]?.focus();
  }, [resetKey, length]);

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    // Handle paste
    if (value.length > 1) {
      const pasted = value.slice(0, length).split("");
      pasted.forEach((char, i) => {
        if (i < length) newOtp[i] = char;
      });
      setOtp(newOtp);
      onComplete?.(newOtp.join(""));
      inputsRef.current[length - 1]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newOtp.join("").length === length) {
      onComplete?.(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  return (
    <div
      className={`my-6 flex justify-center gap-[12px] ${wrapperClassName}`.trim()}
    >
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="tel"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target.value, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className={`h-[56px] w-[56px] rounded-[12px] border-[1.5px] border-[#e0e0e0] text-center text-[20px] font-semibold text-[var(--color-text-heading)] [-webkit-text-security:disc] [text-security:disc] transition-all duration-200 focus:border-[var(--color-brand-primary)] focus:outline-none focus:[box-shadow:0_0_0_3px_rgba(201,162,77,0.20)] ${digit ? "border-[var(--color-brand-primary)] bg-[var(--color-page-bg-soft)]" : "bg-white"} ${inputClassName}`.trim()}
        />
      ))}
    </div>
  );
}
