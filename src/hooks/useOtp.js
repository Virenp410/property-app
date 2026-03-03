"use client";

import { useState, useEffect, useRef } from "react";
import {
  sendOtp,
  verifyOtp,
  sendEmailOtp,
  verifyEmailOtp,
} from "@/services/otp.services";
import { setSessionTokens } from "@/services/api";
import {
  getJsonCookie,
  setCookie,
  setJsonCookie,
} from "@/services/cookieStore";

const pickTokenValue = (payload, keys) => {
  const keyList = Array.isArray(keys) ? keys : [keys];
  for (const key of keyList) {
    const value = String(
      payload?.[key] ||
        payload?.data?.[key] ||
        payload?.tokens?.[key] ||
        payload?.data?.tokens?.[key] ||
        ""
    ).trim();
    if (value) return value;
  }
  return "";
};

export default function useOtp({ onSuccess, t }) {
  const INITIAL_RESEND_COOLDOWN = 60;
  const RESEND_COOLDOWN = 30;
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const initialCooldownAppliedRef = useRef(false);

  const otpContext =
    typeof window !== "undefined"
      ? getJsonCookie("otp_context")
      : null;

  const isEmail = otpContext?.type === "email";

  useEffect(() => {
    if (!otpContext || initialCooldownAppliedRef.current) return;
    setCooldown(INITIAL_RESEND_COOLDOWN);
    initialCooldownAppliedRef.current = true;
  }, [otpContext]);

  /* ================= VERIFY OTP ================= */

  const verify = async (otp) => {
    if (!otpContext || otp.length !== 4 || loading) return;

    try {
      setLoading(true);
      setInfoMessage("");

      let response;

      if (isEmail) {
        const emailPurpose = Number(otpContext.purpose ?? 1);
        response = await verifyEmailOtp({
          email: otpContext.email,
          otp,
          purpose: emailPurpose,
        });

        setCookie("email_verified", "true");
        setCookie("verified_email", otpContext.email);
        if (emailPurpose === 3) {
          setCookie("business_email_verified", "true");
          setCookie("verified_business_email", otpContext.email);
        }
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
      const accessToken = pickTokenValue(data, ["access_token", "accessToken", "token"]);
      const csrfToken = pickTokenValue(data, ["csrf_token", "csrfToken"]);
      const hasAccess = accessToken.length > 10;
      const hasCsrf = csrfToken.length > 10;
      const hasSessionHint = hasAccess || hasCsrf;

      if (hasAccess) {
        setSessionTokens({ access_token: accessToken });
      }

      onSuccess?.({
        ...data,
        ...(hasAccess ? { access_token: accessToken } : {}),
        ...(hasCsrf ? { csrf_token: csrfToken } : {}),
        ...(hasSessionHint ? { has_session: true } : {}),
      });
    } catch (err) {
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

      setCooldown(RESEND_COOLDOWN);
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
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
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
