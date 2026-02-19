"use client";

export default function PrimaryButton({
  children,
  disabled = false,
  onClick,
}) {
  return (
    <button
      className={`continue-btn ${!disabled ? "active" : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}