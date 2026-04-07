/* eslint-disable @next/next/no-img-element */
"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import countries from "@/constants/country.json";
import AuthLayout from "@/components/AuthLayout";
import useTranslation from "@/hooks/useTranslation";
import useAppLang from "@/hooks/useAppLang";
import PrimaryButton from "@/components/PrimaryButton";

import { sendOtp } from "@/services/otp.services";
import { setJsonCookie } from "@/services/cookieStore";
import { getActiveProductKey } from "@/lib/productKey";
import { getOrCreateDeviceId } from "@/lib/deviceId";
import {
  clearPopupReturnTarget,
  savePopupReturnTarget,
} from "@/lib/auth/popupAuthBridge";

const getSafeInternalNextPath = (value) => {
  const next = String(value || "").trim();
  if (!next) return "";
  if (!next.startsWith("/")) return "";
  if (next.startsWith("//")) return "";
  if (next.startsWith("/auth/login")) return "";
  return next;
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mobile, setMobile] = useState("");
  const [method, setMethod] = useState("whatsapp");
  const [lang, setLang] = useAppLang(searchParams);
  const [country, setCountry] = useState(countries[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasCapturedPopupReturnTargetRef = useRef(false);

  const safeNextPath = useMemo(
    () => getSafeInternalNextPath(searchParams?.get("next")),
    [searchParams]
  );

  useEffect(() => {
    const returnTo = String(searchParams?.get("return_to") || "").trim();
    const returnOrigin = String(searchParams?.get("return_origin") || "").trim();
    if (!returnTo && !returnOrigin) {
      if (hasCapturedPopupReturnTargetRef.current) return;
      clearPopupReturnTarget();
      return;
    }
    hasCapturedPopupReturnTargetRef.current = true;
    savePopupReturnTarget({ returnTo, returnOrigin });
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = new URL(window.location.href);
    const hadReturnTo = current.searchParams.has("return_to");
    const hadReturnOrigin = current.searchParams.has("return_origin");
    if (!hadReturnTo && !hadReturnOrigin) return;

    current.searchParams.delete("return_to");
    current.searchParams.delete("return_origin");
    const nextUrl = `${current.pathname}${current.search}${current.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, [searchParams]);

  const t = useTranslation(lang);
  const isValidMobile = mobile.length === 10;

  const sendOtpApi = async () => {
    if (!isValidMobile || loading) return;

    setLoading(true);

    const deviceId = getOrCreateDeviceId();
    const otpContext = {
      type: "mobile",
      identifier_type: 0,
      country_code: country.dialCode.replace("+", ""),
      mobile_number: mobile,
      purpose: 0,
      via: method,
      product_key: getActiveProductKey(),
      ...(deviceId ? { device_id: deviceId } : {}),
      ...(safeNextPath ? { redirect_to: safeNextPath } : {}),
    };

    try {
      // Save context for verify/resend page
      setJsonCookie("otp_context", otpContext);

      await sendOtp(otpContext);

      router.push("/auth/otp");
    } catch (err) {
      const status = Number(err?.response?.status || 0);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        (status === 502
          ? "OTP service is temporarily unavailable. Please try again in a few minutes."
          : status >= 500
          ? "Server error while sending OTP. Please try again."
          : "Failed to send OTP");
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout lang={lang} onLangChange={setLang}>
      <div className="mb-1">
        <h2 className="text-[22px] font-bold text-[var(--color-text-heading)] tracking-tight">{t.login}</h2>
        <p className="mt-1 text-[13.5px] text-[var(--auth-subtle)]">{t.subtitle}</p>
      </div>

      <div className="mt-5">
        <label className="mb-1.5 block text-[12.5px] font-semibold uppercase tracking-wide text-[var(--auth-field-label)]">
          {t.mobileLabel}
        </label>

        <div className="relative flex items-center rounded-[10px] border border-[var(--auth-border)] bg-white transition-all duration-200 focus-within:border-[var(--color-brand-primary)] focus-within:[box-shadow:0_0_0_3px_rgba(201,162,77,0.18)]">
          <div
            className="flex cursor-pointer items-center gap-1.5 px-3 py-3 border-r border-r-[var(--auth-border)]"
            onClick={() => setShowCountries(!showCountries)}
          >
            <img
              src={country.flag}
              alt={country.name}
              className="h-3.5 w-5 object-cover rounded-[2px]"
            />
            <span className="text-[13.5px] text-[var(--color-text-body-strong)] font-medium">{country.dialCode}</span>
            <span className="text-[11px] text-[#888888]">{"▾"}</span>
          </div>

          <input
            type="tel"
            id="mobile-input"
            className="w-full border-0 px-3 py-3 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--auth-placeholder)] outline-none bg-transparent"
            placeholder={t.placeholder}
            maxLength={10}
            value={mobile}
            onChange={(e) =>
              setMobile(e.target.value.replace(/\D/g, ""))
            }
          />

          {showCountries && (
            <div className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-60 w-full overflow-y-auto rounded-[12px] border border-[var(--color-border-brand-soft)] bg-white shadow-[0_12px_36px_rgba(0,0,0,0.14)]">
              {countries.map((c) => (
                <div
                  key={c.name}
                  className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] transition-colors duration-150"
                  onClick={() => {
                    setCountry(c);
                    setShowCountries(false);
                  }}
                >
                  <img
                    src={c.flag}
                    alt={c.name}
                    className="h-4 w-5.5 object-cover rounded-[2px]"
                  />
                  <span className="flex-1 text-[13.5px]">{c.name}</span>
                  <span className="text-[12.5px] text-[var(--auth-subtle)]">{c.dialCode}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OTP method selector */}
      <div className="mt-4 flex gap-3">
        {[
          { value: "sms", label: t.viaSms },
          { value: "whatsapp", label: t.viaWhatsapp },
        ].map(({ value, label }) => {
          const isActive = method === value;
          return (
            <label
              key={value}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[9px] border py-2.5 text-[13.5px] font-medium transition-all duration-200 ${
                isActive
                  ? "border-[var(--color-brand-primary)] bg-[var(--color-page-bg-soft)] text-[var(--color-brand-primary)]"
                  : "border-[var(--auth-border)] bg-white text-[var(--auth-label)] hover:border-[var(--color-border-brand-soft)] hover:bg-[var(--color-surface-muted)]"
              }`}
            >
              <input
                type="radio"
                checked={isActive}
                onChange={() => setMethod(value)}
                className="hidden"
              />
              <span
                className={`h-3.5 w-3.5 rounded-full border-[1.5px] transition-all duration-200 ${
                  isActive
                    ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] [box-shadow:inset_0_0_0_2px_white]"
                    : "border-[#cccccc] bg-white"
                }`}
              />
              {label}
            </label>
          );
        })}
      </div>

      <PrimaryButton
        disabled={!isValidMobile || loading}
        onClick={sendOtpApi}
      >
        {loading ? "Sending…" : t.continue}
      </PrimaryButton>

      <p className="mt-4 text-center text-[12px] text-[var(--auth-muted)]">
        By continuing, you agree to our{" "}
        <a href="#" className="text-[var(--color-link-primary)] underline underline-offset-2 hover:text-[var(--color-brand-primary)]">
          Terms &amp; Conditions
        </a>{" "}
        and{" "}
        <a href="#" className="text-[var(--color-link-primary)] underline underline-offset-2 hover:text-[var(--color-brand-primary)]">
          Privacy Policy
        </a>
        .
      </p>
    </AuthLayout>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
