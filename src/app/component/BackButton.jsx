"use client";

import { useRouter } from "next/navigation";

export default function BackButton({
  className = "",
  fallbackPath = "/",
  label = "Back",
}) {
  const router = useRouter();

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
      className={`back-btn ${className}`.trim()}
      onClick={handleBack}
      aria-label={label}
    >
      ← {label}
    </button>
  );
}
