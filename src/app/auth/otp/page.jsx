"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import AuthLayout from "@/app/component/AuthLayout";
import OtpInput from "@/app/component/OtpInput";
import useTranslation from "@/app/hook/useTranslation";
import PrimaryButton from "@/app/component/PrimaryButton";
import useOtp from "@/app/hook/useOtp";
import { getJsonCookie, setCookie } from "@/app/services/cookieStore";

const getSafeInternalRedirectPath = (value) => {
  const next = String(value || "").trim();
  if (!next) return "";
  if (!next.startsWith("/")) return "";
  if (next.startsWith("//")) return "";
  if (next.startsWith("/auth/login")) return "";
  return next;
};

const withLangQuery = (path, lang) => {
  const [basePart, hashPart = ""] = String(path || "").split("#");
  const [pathname, queryString = ""] = basePart.split("?");
  const params = new URLSearchParams(queryString);
  if (!params.get("lang")) {
    params.set("lang", lang);
  }
  const query = params.toString();
  const hashSuffix = hashPart ? `#${hashPart}` : "";
  return query ? `${pathname}?${query}${hashSuffix}` : `${pathname}${hashSuffix}`;
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
        const redirectTo = getSafeInternalRedirectPath(otpContext?.redirect_to);
        const mobilePurpose = Number(otpContext?.purpose ?? 0);

        const hasAccessToken =
          typeof response?.access_token === "string" &&
          response.access_token.length > 10;

        if (redirectTo && mobilePurpose !== 0) {
          router.replace(withLangQuery(redirectTo, lang));
          return;
        }

        if (!hasAccessToken) {
          if (redirectTo) {
            setCookie("post_auth_redirect", redirectTo, { days: 1 });
            router.replace(
              `/auth/reg?lang=${lang}&redirect_to=${encodeURIComponent(redirectTo)}`
            );
            return;
          }
          router.replace(`/auth/reg?lang=${lang}`);
          return;
        }

        if (redirectTo) {
          router.replace(withLangQuery(redirectTo, lang));
          return;
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
      <div className="mx-auto max-w-105 text-center">
        <h2 className="mb-1.5 text-[26px] font-semibold">{t.otpTitle}</h2>
        <p className="mb-5.5 text-[14px] text-[#666666]">{subtitle}</p>

        <OtpInput length={4} onComplete={setFinalOtp} />

        <PrimaryButton
          className="mt-0"
          disabled={finalOtp.length !== 4 || loading}
          onClick={() => verify(finalOtp)}
        >
          {loading ? t.verifying : t.verifyOtp}
        </PrimaryButton>

        {infoMessage && <p className="mt-3 text-[13px] text-(--auth-muted)">{infoMessage}</p>}

        <div className="mt-3.5 text-center">
          <button
            className="cursor-pointer border-0 bg-transparent p-0 text-[14px] text-[#1a73e8] underline disabled:cursor-not-allowed disabled:text-[#aaaaaa]"
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
            <div className="mt-2 flex items-center justify-center gap-2.5">
              <button
                className="cursor-pointer border-0 bg-transparent p-0 text-[14px] text-[#1a73e8] disabled:cursor-not-allowed disabled:text-[#aaaaaa]"
                disabled={resending}
                onClick={() => {
                  resend("whatsapp");
                  setShowResendOptions(false);
                }}
              >
                {t.viaWhatsapp}
              </button>
              <span className="text-[14px] text-[#999999]">|</span>
              <button
                className="cursor-pointer border-0 bg-transparent p-0 text-[14px] text-[#1a73e8] disabled:cursor-not-allowed disabled:text-[#aaaaaa]"
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
