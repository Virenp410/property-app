/* eslint-disable @next/next/no-img-element */
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import countries from "@/constants/country.json";
import AuthLayout from "@/components/AuthLayout";
import useTranslation from "@/hooks/useTranslation";
import useAppLang from "@/hooks/useAppLang";
import PrimaryButton from "@/components/PrimaryButton";

import { sendOtp } from "@/services/otp.services";
import { setJsonCookie } from "@/services/cookieStore";
import { getActiveProductKey } from "@/lib/productKey";
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

  const safeNextPath = useMemo(
    () => getSafeInternalNextPath(searchParams?.get("next")),
    [searchParams]
  );

  useEffect(() => {
    const returnTo = String(searchParams?.get("return_to") || "").trim();
    const returnOrigin = String(searchParams?.get("return_origin") || "").trim();
    if (!returnTo && !returnOrigin) {
      clearPopupReturnTarget();
      return;
    }
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

    const otpContext = {
      type: "mobile",
      identifier_type: 0,
      country_code: country.dialCode.replace("+", ""),
      mobile_number: mobile,
      purpose: 0,
      via: method,
      product_key: getActiveProductKey(),
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
      <h2 className="text-[24px] font-semibold text-black">{t.login}</h2>
      <p className="mt-1.5 text-[14px] text-(--auth-subtle)">{t.subtitle}</p>

      <label className="mb-1.5 mt-5.5 block text-[14px] text-(--auth-label)">
        {t.mobileLabel}
      </label>

      <div className="relative flex items-center rounded-[10px] border border-(--auth-border) bg-white p-2.5 focus-within:border-(--auth-border-strong) focus-within:[box-shadow:0_0_0_1px_var(--auth-border-strong)]">
        <div
          className="flex cursor-pointer items-center gap-1.5 border-r border-r-(--auth-border) pr-4.5"
          onClick={() => setShowCountries(!showCountries)}
        >
          <img
            src={country.flag}
            alt={country.name}
            className="h-3.5 w-5 object-cover"
          />
          <span>{country.dialCode}</span>
          <span className="text-[12px] text-[#555555]">{"\u25BE"}</span>
        </div>

        <input
          type="tel"
          className="w-full border-0 pl-2.5 text-[14px] outline-none"
          placeholder={t.placeholder}
          maxLength={10}
          value={mobile}
          onChange={(e) =>
            setMobile(e.target.value.replace(/\D/g, ""))
          }
        />

        {showCountries && (
          <div className="absolute left-0 top-14.5 z-50 max-h-65 w-full overflow-y-auto rounded-xl border border-[#dddddd] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
            {countries.map((c) => (
              <div
                key={c.name}
                className="flex cursor-pointer items-center gap-2.5 border border-(--color-border-brand-soft) bg-white px-3 py-2.5 text-(--color-brand-primary) hover:bg-(--color-surface-muted)"
                onClick={() => {
                  setCountry(c);
                  setShowCountries(false);
                }}
              >
                <img
                  src={c.flag}
                  alt={c.name}
                  className="h-4 w-5.5 object-cover"
                />
                <span className="flex-1 text-[14px]">{c.name}</span>
                <span className="text-[13px] text-[#555555]">{c.dialCode}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4.5 flex gap-5">
        <label className="flex cursor-pointer items-center gap-1.5 text-[14px] text-(--auth-label)">
          <input
            type="radio"
            checked={method === "sms"}
            onChange={() => setMethod("sms")}
          />
          {t.viaSms}
        </label>

        <label className="flex cursor-pointer items-center gap-1.5 text-[14px] text-(--auth-label)">
          <input
            type="radio"
            checked={method === "whatsapp"}
            onChange={() => setMethod("whatsapp")}
          />
          {t.viaWhatsapp}
        </label>
      </div>

      <PrimaryButton
        disabled={!isValidMobile || loading}
        onClick={sendOtpApi}
      >
        {loading ? "Sending..." : t.continue}
      </PrimaryButton>
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
