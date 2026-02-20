"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import AuthLayout from "@/app/component/AuthLayout";
import OtpInput from "@/app/component/OtpInput";
import useTranslation from "@/app/hook/useTranslation";
import PrimaryButton from "@/app/component/PrimaryButton";
import useOtp from "@/app/hook/useOtp";
import { getJsonCookie, getCookie, setCookie, setJsonCookie } from "@/app/services/cookieStore";

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

const getBusinessOwnerMobileKey = (countryCode, mobileNumber) => {
  const cc = String(countryCode || "").replace(/\D/g, "").trim();
  const mobile = String(mobileNumber || "").replace(/\D/g, "").trim();
  if (!cc || !mobile) return "";
  return `${cc}-${mobile}`;
};

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

function VerifyOtpContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [lang, setLang] = useState(params.get("lang") || "en");
  const t = useTranslation(lang);

  const [finalOtp, setFinalOtp] = useState("");
  const [showResendOptions, setShowResendOptions] = useState(false);

  const otpContext =
    typeof window !== "undefined" ? getJsonCookie("otp_context") : null;

  useEffect(() => {
    if (typeof window !== "undefined" && !otpContext) {
      router.replace("/auth/login");
    }
  }, [otpContext, router]);

  const {
    verify,
    resend,
    loading,
    resending,
    infoMessage,
    cooldown,
    isEmail,
  } = useOtp({
    t,
    onSuccess: (response) => {
      const continueRouting = async () => {
        const redirectTo = String(otpContext?.redirect_to || "").trim();
        if (redirectTo) {
          router.replace(`${redirectTo}?lang=${lang}`);
          return;
        }

        const hasAccessToken =
          typeof response?.access_token === "string" &&
          response.access_token.length > 10;

        if (!hasAccessToken) {
          router.replace(`/auth/reg?lang=${lang}`);
          return;
        }

        const verified = getJsonCookie("verified_mobile");
        const ownerKey = getBusinessOwnerMobileKey(
          verified?.country_code,
          verified?.mobile_number
        );
        const profileKey = getBusinessProfileStorageKey(
          verified?.country_code,
          verified?.mobile_number
        );

        const businessFromCookies =
          String(getCookie("business_registered") || "").trim().toLowerCase() === "true" ||
          String(getCookie("business_register") || "").trim().toLowerCase() === "true" ||
          Boolean(String(getCookie("business_id") || "").trim()) ||
          Boolean(String(getCookie("branch_id") || "").trim()) ||
          Boolean(String(getCookie("business_name") || "").trim()) ||
          String(getCookie("has_business_for_mobile") || "").trim().toLowerCase() === "true";

        const businessFromToken = extractBusinessIdentityFromClaims(
          parseJwtPayload(response?.access_token)
        );

        if (businessFromToken.registered || businessFromCookies) {
          setCookie("has_business_for_mobile", "true", { days: 365 });
          if (ownerKey) setCookie("business_owner_mobile", ownerKey, { days: 365 });
          if (businessFromToken.businessId) {
            setCookie("business_id", businessFromToken.businessId, { days: 365 });
          }
          if (businessFromToken.branchId) {
            setCookie("branch_id", businessFromToken.branchId, { days: 365 });
          }
          if (businessFromToken.businessName) {
            setCookie("business_name", businessFromToken.businessName, { days: 365 });
          }
          if (profileKey) {
            persistBusinessProfile(profileKey, {
              registered: true,
              business_id:
                businessFromToken.businessId ||
                String(getCookie("business_id") || "").trim(),
              branch_id:
                businessFromToken.branchId ||
                String(getCookie("branch_id") || "").trim(),
              business_name:
                businessFromToken.businessName ||
                String(getCookie("business_name") || "").trim(),
            });
          }
        }

        setCookie("dashboard_mode", "user", { days: 365 });
        router.replace(`/auth/userdash?lang=${lang}`);
      };

      continueRouting();
    },
  });

  const subtitle = otpContext
    ? isEmail
      ? `OTP sent to ${otpContext?.email}`
      : `OTP sent to +${otpContext?.country_code}${otpContext?.mobile_number}`
    : "";

  if (!otpContext) return null;

  return (
    <AuthLayout
      lang={lang}
      onLangChange={setLang}
      showBack={true}
      backFallback="/auth/login"
    >
      <div className="otp-card">
        <h2 className="otp-title">{t.otpTitle}</h2>
        <p className="otp-subtitle">{subtitle}</p>

        <OtpInput length={4} onComplete={setFinalOtp} />

        <PrimaryButton
          className="otp-verify-btn"
          disabled={finalOtp.length !== 4 || loading}
          onClick={() => verify(finalOtp)}
        >
          {loading ? t.verifying : t.verifyOtp}
        </PrimaryButton>

        {infoMessage && <p className="otp-info-text">{infoMessage}</p>}

        <div className="otp-resend-box">
          <button
            className="otp-resend-link"
            disabled={cooldown > 0}
            onClick={() => {
              if (isEmail) resend();
              else setShowResendOptions((prev) => !prev);
            }}
          >
            {cooldown > 0
              ? t.resendAvailableIn.replace("{{seconds}}", cooldown)
              : t.resendOtp}
          </button>

          {!isEmail && showResendOptions && cooldown === 0 && (
            <div className="otp-resend-actions">
              <button
                className="otp-method-btn link"
                disabled={resending}
                onClick={() => {
                  resend("whatsapp");
                  setShowResendOptions(false);
                }}
              >
                {t.viaWhatsapp}
              </button>
              <span className="otp-separator">|</span>
              <button
                className="otp-method-btn link"
                disabled={resending}
                onClick={() => {
                  resend("sms");
                  setShowResendOptions(false);
                }}
              >
                {t.viaSms}
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

export default function VerifyOtp() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpContent />
    </Suspense>
  );
}
