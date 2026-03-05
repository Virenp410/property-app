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
    "mt-[26px] w-full rounded-[10px] border-0 px-[14px] py-[14px] text-[15px] font-medium transition-colors duration-200 ease-in-out";
  const defaultDisabledClasses =
    "cursor-not-allowed bg-[var(--color-btn-disabled-bg)] text-[var(--color-btn-disabled-text)]";
  const defaultActiveClasses =
    "cursor-pointer bg-[var(--color-black)] text-[var(--color-white)]";
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
