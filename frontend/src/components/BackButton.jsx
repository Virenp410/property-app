"use client";

import { useRouter } from "next/navigation";

export default function BackButton({
  className = "",
  fallbackPath = "/",
  label = "Back",
}) {
  const router = useRouter();
  const isAuthVariant = String(className)
    .split(/\s+/)
    .includes("auth-back-btn");

  const baseClasses = isAuthVariant
    ? "inline-flex items-center gap-[6px] mt-[10px] border-0 bg-transparent p-0 text-[15px] font-medium text-[var(--color-text-muted-strong)] transition-colors duration-200 ease-in-out hover:text-[var(--color-link-primary)] hover:underline"
    : "inline-flex cursor-pointer items-center gap-[6px] rounded-[8px] border border-[var(--color-border-default)] bg-[var(--color-btn-secondary-bg)] px-[10px] py-[6px] text-[13px] font-semibold text-[var(--color-btn-secondary-text)] transition-all duration-200 ease-in-out hover:border-[var(--color-border-brand-soft)] hover:bg-[var(--color-btn-secondary-hover)]";

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackPath);
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${className}`.trim()}
      onClick={handleBack}
      aria-label={label}
    >
      {"\u2190"} {label}
    </button>
  );
}
