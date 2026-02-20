/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import countries from "@/app/constant/country.json";
import AuthLayout from "@/app/component/AuthLayout";
import useTranslation from "@/app/hook/useTranslation";
import PrimaryButton from "@/app/component/PrimaryButton";

import { sendOtp } from "@/app/services/otp.services";
import { setJsonCookie } from "@/app/services/cookieStore";

export default function Login() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [method, setMethod] = useState("whatsapp");
  const [lang, setLang] = useState("en");
  const [country, setCountry] = useState(countries[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [loading, setLoading] = useState(false);

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
    };

    try {
      // Save context for verify/resend page
      setJsonCookie("otp_context", otpContext);

      const res = await sendOtp(otpContext);

      console.log("OTP Sent:", res?.data);

      router.push(
        `/auth/otp?mobile=${country.dialCode}${mobile}&lang=${lang}`
      );
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
      console.warn("SEND OTP ERROR:", { status, message });
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout lang={lang} onLangChange={setLang}>
      <h2 className="login-title">{t.login}</h2>
      <p className="login-subtitle">{t.subtitle}</p>

      <label className="form-label">{t.mobileLabel}</label>

      <div className="phone-input">
        <div
          className="country-code"
          onClick={() => setShowCountries(!showCountries)}
        >
          <img src={country.flag} alt={country.name} />
          <span>{country.dialCode}</span>
          <span className="arrow">▾</span>
        </div>

        <input
          type="tel"
          placeholder={t.placeholder}
          maxLength={10}
          value={mobile}
          onChange={(e) =>
            setMobile(e.target.value.replace(/\D/g, ""))
          }
        />

        {showCountries && (
          <div className="country-dropdown">
            {countries.map((c) => (
              <div
                key={c.name}
                className="country-item"
                onClick={() => {
                  setCountry(c);
                  setShowCountries(false);
                }}
              >
                <img src={c.flag} alt={c.name} />
                <span className="country-name">{c.name}</span>
                <span className="country-code-text">
                  {c.dialCode}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="otp-options">
        <label>
          <input
            type="radio"
            checked={method === "sms"}
            onChange={() => setMethod("sms")}
          />
          {t.viaSms}
        </label>

        <label>
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
