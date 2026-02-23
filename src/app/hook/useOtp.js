"use client";

import { useState, useEffect } from "react";
import {
  sendOtp,
  verifyOtp,
  sendEmailOtp,
  verifyEmailOtp,
} from "@/app/services/otp.services";
import { setSessionTokens } from "@/app/services/api";
import {
  getJsonCookie,
  setCookie,
  setJsonCookie,
} from "@/app/services/cookieStore";

export default function useOtp({ onSuccess, t }) {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const otpContext =
    typeof window !== "undefined"
      ? getJsonCookie("otp_context")
      : null;

  const isEmail = otpContext?.type === "email";

  /* ================= VERIFY OTP ================= */

  const verify = async (otp) => {
    if (!otpContext || otp.length !== 4 || loading) return;

    try {
      setLoading(true);
      setInfoMessage("");

      let response;

      if (isEmail) {
        response = await verifyEmailOtp({
          email: otpContext.email,
          otp,
          purpose: otpContext.purpose ?? 1,
        });

        setCookie("email_verified", "true");
        setCookie("verified_email", otpContext.email);
      } else {
        response = await verifyOtp({ otp });

        const mobilePurpose = Number(otpContext.purpose ?? 0);
        setCookie("mobile_verified", "true");
        setJsonCookie("verified_mobile", {
          country_code: otpContext.country_code,
          mobile_number: otpContext.mobile_number,
          purpose: mobilePurpose,
        });

        if (mobilePurpose === 2) {
          setCookie("business_mobile_verified", "true");
        }
      }

      const data = response?.data || {};
      const accessToken = data.access_token;
      const csrfToken = data.csrf_token;
      const isExistingUser =
        typeof accessToken === "string" &&
        accessToken.length > 10 &&
        typeof csrfToken === "string" &&
        csrfToken.length > 10;

      if (isExistingUser) {
        setSessionTokens({
          access_token: accessToken,
          csrf_token: csrfToken,
        });
      }

      onSuccess?.(data);
    } catch (err) {
      console.error("OTP Verify Error:", err?.response?.data || err);
      setInfoMessage(t?.otpInvalid || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESEND OTP ================= */

  const resend = async (via) => {
    if (!otpContext || cooldown > 0 || resending) return;

    try {
      setResending(true);
      setInfoMessage("");

      if (isEmail) {
        await sendEmailOtp({
          email: otpContext.email,
          purpose: otpContext.purpose ?? 1,
        });
        setInfoMessage("OTP sent to your email");
      } else {
        const currentContext = getJsonCookie("otp_context") || otpContext;
        await sendOtp({
          ...currentContext,
          via,
        });

        setInfoMessage(
          via === "whatsapp"
            ? t?.otpResentWhatsapp
            : t?.otpResentSms
        );
      }

      setCooldown(30);
    } catch {
      setInfoMessage(t?.otpResendFailed || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  /* ================= COOLDOWN ================= */

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  return {
    verify,
    resend,
    loading,
    resending,
    infoMessage,
    cooldown,
    isEmail,
  };
}
