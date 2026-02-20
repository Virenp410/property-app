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

const getBusinessProfileStorageKey = (countryCode, mobileNumber) => {
  const cc = String(countryCode || "").replace(/\D/g, "").trim();
  const mobile = String(mobileNumber || "").replace(/\D/g, "").trim();
  if (!cc || !mobile) return "";
  return `business_profile_${cc}_${mobile}`;
};

const persistBusinessProfile = (storageKey, profile) => {
  if (!storageKey || !profile) return;
  setJsonCookie(storageKey, profile, { days: 365 });
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(profile));
  } catch {
    // ignore
  }
};

const getBusinessOwnerMobileKey = (countryCode, mobileNumber) => {
  const cc = String(countryCode || "").replace(/\D/g, "").trim();
  const mobile = String(mobileNumber || "").replace(/\D/g, "").trim();
  if (!cc || !mobile) return "";
  return `${cc}-${mobile}`;
};

const parseJwtPayload = (token) => {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return {};
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
};

const extractBusinessIdentityFromClaims = (claims) => {
  const businessId = String(
    claims?.business_id ??
      claims?.businessId ??
      claims?.bid ??
      claims?.biz_id ??
      ""
  ).trim();
  const branchId = String(
    claims?.branch_id ??
      claims?.branchId ??
      claims?.default_branch_id ??
      ""
  ).trim();
  const businessName = String(
    claims?.business_name ??
      claims?.businessName ??
      claims?.biz_name ??
      ""
  ).trim();
  const registered =
    claims?.business_registered === true ||
    claims?.registered_business === true ||
    claims?.is_business_user === true ||
    Boolean(businessId) ||
    Boolean(branchId);

  return { businessId, branchId, businessName, registered };
};

const extractBusinessIdentityFromOtpResponse = (data) => {
  const directBusinessId = String(
    data?.business_id ?? data?.businessId ?? data?.id ?? ""
  ).trim();
  const directBranchId = String(
    data?.branch_id ?? data?.default_branch_id ?? data?.branchId ?? ""
  ).trim();
  const directBusinessName = String(
    data?.business_name ?? data?.businessName ?? data?.name ?? ""
  ).trim();

  if (directBusinessId || directBranchId || directBusinessName) {
    return {
      businessId: directBusinessId,
      branchId: directBranchId,
      businessName: directBusinessName,
      registered: true,
    };
  }

  const candidates = [
    data?.business,
    data?.profile,
    data?.result?.business,
    data?.data?.business,
    ...(Array.isArray(data?.businesses) ? data.businesses : []),
    ...(Array.isArray(data?.result?.businesses) ? data.result.businesses : []),
    ...(Array.isArray(data?.data?.businesses) ? data.data.businesses : []),
  ].filter(Boolean);

  for (const item of candidates) {
    const businessId = String(
      item?.business_id ?? item?.businessId ?? item?.id ?? ""
    ).trim();
    const branchId = String(
      item?.branch_id ?? item?.default_branch_id ?? item?.branchId ?? ""
    ).trim();
    const businessName = String(
      item?.business_name ?? item?.businessName ?? item?.name ?? ""
    ).trim();
    const registered =
      item?.registered === true ||
      String(item?.status || "").toLowerCase() === "active";

    if (businessId || branchId || businessName || registered) {
      return { businessId, branchId, businessName, registered: true };
    }
  }

  const registeredFlag =
    data?.registered === true ||
    data?.business_registered === true ||
    data?.has_business === true ||
    data?.result?.registered === true ||
    data?.data?.registered === true;

  if (registeredFlag) {
    return { businessId: "", branchId: "", businessName: "", registered: true };
  }

  return { businessId: "", branchId: "", businessName: "", registered: false };
};

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

        const storageKey = getBusinessProfileStorageKey(
          otpContext.country_code,
          otpContext.mobile_number
        );
        let hasBusinessForCurrentMobile = false;
        if (storageKey) {
          try {
            const parsed = getJsonCookie(storageKey);
            if (parsed?.registered) {
              hasBusinessForCurrentMobile = true;
              const mobileOwnerKey = getBusinessOwnerMobileKey(
                otpContext.country_code,
                otpContext.mobile_number
              );
              setCookie("business_registered", "true", { days: 365 });
              if (parsed.business_id) {
                setCookie("business_id", String(parsed.business_id), { days: 365 });
              }
              if (parsed.branch_id) {
                setCookie("branch_id", String(parsed.branch_id), { days: 365 });
              }
              if (parsed.business_name) {
                setCookie("business_name", String(parsed.business_name), { days: 365 });
              }
              setCookie("business_owner_mobile", mobileOwnerKey, { days: 365 });
            }
          } catch {
            // ignore malformed local profile
          }
        }
        if (!hasBusinessForCurrentMobile) {
          // Keep previously saved business identity cookies intact.
          // Routing guards already use owner/mobile matching before trusting them.
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

      const businessIdentity = isEmail
        ? { businessId: "", branchId: "", businessName: "", registered: false }
        : extractBusinessIdentityFromOtpResponse(data);
      const tokenClaimsIdentity = isEmail
        ? { businessId: "", branchId: "", businessName: "", registered: false }
        : extractBusinessIdentityFromClaims(parseJwtPayload(data?.access_token));
      const finalBusinessIdentity = businessIdentity.registered
        ? businessIdentity
        : tokenClaimsIdentity;

      if (finalBusinessIdentity.registered) {
        const mobileOwnerKey = getBusinessOwnerMobileKey(
          otpContext?.country_code,
          otpContext?.mobile_number
        );
        const profileKey = getBusinessProfileStorageKey(
          otpContext?.country_code,
          otpContext?.mobile_number
        );
        setCookie("business_registered", "true", { days: 365 });
        if (finalBusinessIdentity.businessId) {
          setCookie("business_id", finalBusinessIdentity.businessId, { days: 365 });
        }
        if (finalBusinessIdentity.branchId) {
          setCookie("branch_id", finalBusinessIdentity.branchId, { days: 365 });
        }
        if (finalBusinessIdentity.businessName) {
          setCookie("business_name", finalBusinessIdentity.businessName, { days: 365 });
        }
        if (mobileOwnerKey) {
          setCookie("business_owner_mobile", mobileOwnerKey, { days: 365 });
        }
        setCookie("has_business_for_mobile", "true", { days: 365 });
        if (profileKey) {
          persistBusinessProfile(profileKey, {
            registered: true,
            business_id: finalBusinessIdentity.businessId || "",
            branch_id: finalBusinessIdentity.branchId || "",
            business_name: finalBusinessIdentity.businessName || "",
          });
        }
      } else if (!isEmail) {
        if (!isExistingUser) {
          setCookie("has_business_for_mobile", "false", { days: 365 });
        }
      }

      if (isExistingUser) {
        console.log("✅ Existing user detected. Saving tokens.");

        setSessionTokens({
          access_token: accessToken,
          csrf_token: csrfToken,
        });
      } else {
        console.log("🆕 New user detected. No tokens returned.");
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
