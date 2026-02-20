"use client";

import { useMemo, useState } from "react";
import { checkSeanebId } from "@/app/services/auth.services";

export default function SeanebIdField({
  value,
  onChange,
  verified,
  setVerified,
}) {
  const [checking, setChecking] = useState(false);

  // ✅ allow hyphen
  const seanebRegex = /^[a-z0-9-]{6,30}$/;
  const isValidSeaneb = seanebRegex.test(value);

  const seanebError = useMemo(() => {
    if (!value) return "";
    if (!isValidSeaneb) {
      return "6–30 characters. Lowercase letters, numbers, and hyphen (-) only.";
    }
    return "";
  }, [value, isValidSeaneb]);

  const handleVerify = async () => {
    if (!isValidSeaneb || checking) return;

    try {
      setChecking(true);
      await checkSeanebId(value);
      setVerified(true);
    } catch (err) {
      setVerified(false);

      const status = err?.response?.status;

      if (status === 409) {
        alert("SeaNeB ID already exists");
      } else if (status === 400) {
        alert("Invalid SeaNeB ID");
      } else {
        alert("Unable to verify SeaNeB ID");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="reg-field">
      <label>SeaNeB ID</label>

      <div className="verify-input-wrapper">
        <input
          className="reg-input"
          value={value}
          placeholder="username01"
          onChange={(e) => {
            setVerified(false);
            onChange(e.target.value.toLowerCase());
          }}
        />

        <button
          type="button"
          className={`verify-btn ${verified ? "verified" : ""}`}
          disabled={!isValidSeaneb || checking}
          onClick={handleVerify}
        >
          {checking ? "Checking..." : verified ? "Verified" : "Verify"}
        </button>
      </div>

      {(value || seanebError) && (
        <p className={`field-helper ${seanebError ? "error" : ""}`}>
          {seanebError ||
            "6–30 characters. Lowercase letters, numbers, and hyphen (-) only."}
        </p>
      )}
    </div>
  );
}
