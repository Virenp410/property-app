"use client";

export default function PrimaryButton({
  children,
  disabled = false,
  onClick,
  className = "",
  activeClassName = "",
  disabledClassName = "",
}) {
  const baseClasses =
    "mt-[26px] w-full rounded-[10px] border-0 px-[14px] py-[14px] text-[15px] font-semibold tracking-wide transition-all duration-200 ease-in-out";
  const defaultDisabledClasses =
    "cursor-not-allowed bg-[var(--color-btn-disabled-bg)] text-[var(--color-btn-disabled-text)]";
  const defaultActiveClasses =
    "cursor-pointer bg-[var(--color-brand-primary)] text-[var(--color-white)] hover:bg-[var(--color-brand-secondary)] shadow-[0_4px_14px_rgba(201,162,77,0.35)] hover:shadow-[0_4px_18px_rgba(201,162,77,0.50)]";
  const stateClasses = disabled
    ? disabledClassName || defaultDisabledClasses
    : activeClassName || defaultActiveClasses;

  return (
    <button
      className={`${baseClasses} ${stateClasses} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
