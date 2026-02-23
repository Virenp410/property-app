"use client";

import { useMemo, useState } from "react";
import { checkSeanebId } from "@/app/services/auth.services";

export default function SeanebIdField({
  value,
  onChange,
  verified,
  setVerified,
  label = "SeaNeB ID",
  placeholder = "username01",
  verifyLabel = "Verify",
  checkingLabel = "Checking...",
  verifiedLabel = "Verified",
  editLabel = "Edit SeaNeB ID",
  formatHint = "6-30 characters. Lowercase letters, numbers, and hyphen (-) only.",
  verifiedMessage = "SeaNeB ID verified.",
  existsMessage = "SeaNeB ID already exists.",
  invalidMessage = "Invalid SeaNeB ID format.",
  verifyFailedMessage = "Unable to verify SeaNeB ID.",
  verifyRequiredMessage = "Verify SeaNeB ID before submission.",
}) {
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("");

  const seanebRegex = /^[a-z0-9-]{6,30}$/;
  const inputValue = String(value || "");
  const isValidSeaneb = seanebRegex.test(inputValue);
  const isLocked = Boolean(verified);
  const shouldShowVerifyRequired =
    Boolean(inputValue) && isValidSeaneb && !isLocked && !statusMessage;

  const seanebError = useMemo(() => {
    if (!inputValue) return "";
    if (!isValidSeaneb) return formatHint;
    return "";
  }, [formatHint, inputValue, isValidSeaneb]);

  const handleVerify = async () => {
    if (!isValidSeaneb || checking || isLocked) return;

    try {
      setChecking(true);
      setStatusType("");
      setStatusMessage("");
      await checkSeanebId(inputValue.trim().toLowerCase());
      setVerified(true);
      setStatusType("success");
      setStatusMessage(verifiedMessage);
    } catch (err) {
      setVerified(false);
      const status = Number(err?.response?.status || 0);
      setStatusType("error");

      if (status === 409) {
        setStatusMessage(existsMessage);
      } else if (status === 400) {
        setStatusMessage(invalidMessage);
      } else {
        setStatusMessage(verifyFailedMessage);
      }
    } finally {
      setChecking(false);
    }
  };

  const handleEdit = () => {
    setVerified(false);
    setStatusType("");
    setStatusMessage("");
  };

  const helperMessage =
    seanebError ||
    statusMessage ||
    (isLocked ? verifiedMessage : shouldShowVerifyRequired ? verifyRequiredMessage : formatHint);

  const helperClass =
    "mt-[6px] text-[12px] " +
    (seanebError || statusType === "error" || shouldShowVerifyRequired
      ? "text-[var(--color-danger)]"
      : statusType === "success"
      ? "text-[var(--color-success-strong)]"
      : "text-[var(--auth-muted)]");

  const inputClasses = isLocked
    ? "h-[44px] w-full rounded-[10px] border border-[var(--auth-border)] px-[14px] py-3 pr-[90px] text-[14px] text-[var(--color-black)] placeholder:text-[var(--auth-placeholder)] outline-none disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--auth-muted)]"
    : "h-[44px] w-full rounded-[10px] border border-[var(--auth-border)] px-[14px] py-3 pr-[90px] text-[14px] text-[var(--color-black)] placeholder:text-[var(--auth-placeholder)] focus:border-[var(--auth-border-strong)] focus:outline-none";

  const verifyButtonClass = isLocked
    ? "absolute right-[10px] top-1/2 h-8 -translate-y-1/2 cursor-default whitespace-nowrap rounded-[6px] border border-[var(--color-success)] bg-[var(--color-success)] px-3 text-[12px] text-[var(--color-white)]"
    : "absolute right-[10px] top-1/2 h-8 -translate-y-1/2 whitespace-nowrap rounded-[6px] border border-[var(--auth-border-light)] bg-[var(--color-white)] px-3 text-[12px] text-[var(--color-black)] hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="relative min-w-0">
      <label className="mb-1.5 block text-[14px] text-(--auth-field-label)">{label}</label>

      <div className="relative w-full">
        <input
          className={inputClasses}
          value={inputValue}
          placeholder={placeholder}
          disabled={isLocked}
          onChange={(e) => {
            setVerified(false);
            setStatusType("");
            setStatusMessage("");
            onChange(String(e.target.value || "").toLowerCase());
          }}
        />

        <button
          type="button"
          className={verifyButtonClass}
          disabled={isLocked || !isValidSeaneb || checking}
          onClick={handleVerify}
        >
          {checking ? checkingLabel : isLocked ? verifiedLabel : verifyLabel}
        </button>
      </div>

      {isLocked && (
        <button
          type="button"
          className="mt-2 cursor-pointer rounded-lg border border-(--color-border-default) bg-(--color-surface-section) px-2.5 py-1.5 text-[12px] font-semibold text-(--color-link-primary) transition-colors duration-200 ease-in-out hover:border-(--color-border-brand-soft) hover:bg-(--color-btn-secondary-hover)"
          onClick={handleEdit}
        >
          {editLabel}
        </button>
      )}

      {(inputValue || helperMessage) && <p className={helperClass}>{helperMessage}</p>}
    </div>
  );
}
