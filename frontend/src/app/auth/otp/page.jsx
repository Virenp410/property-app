"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import AuthLayout from "@/components/AuthLayout";
import OtpInput from "@/components/OtpInput";
import useTranslation from "@/hooks/useTranslation";
import useAppLang from "@/hooks/useAppLang";
import PrimaryButton from "@/components/PrimaryButton";
import useOtp from "@/hooks/useOtp";
import { getCookie, getJsonCookie, setCookie } from "@/services/cookieStore";
import { getCurrentUserProfile } from "@/services/user.services";
import { refreshAccessToken } from "@/lib/auth/apiClient";
import { notifyParentAndClose } from "@/lib/auth/popupAuthBridge";
import { readBridgeToken, resolveWebSsoRedirectUrl } from "@/services/sso.services";

const getSafeInternalRedirectPath = (value) => {
  const next = String(value || "").trim();
  if (!next) return "";
  if (!next.startsWith("/")) return "";
  if (next.startsWith("//")) return "";
  if (next.startsWith("/auth/login")) return "";
  return next;
};

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

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useAppLang(searchParams);
  const t = useTranslation(lang);
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
  ).replace(/\/$/, "");

  const redirectToWebHome = async (authPayload = null) => {
    const bridgeToken = readBridgeToken(authPayload);
    const target = await resolveWebSsoRedirectUrl({ webAppUrl, bridgeToken });
    let targetOrigin = "";
    try {
      targetOrigin = new URL(target).origin;
    } catch {
      targetOrigin = "";
    }

    const handedOff = notifyParentAndClose({
      status: "authenticated",
      returnTo: target,
      returnOrigin: targetOrigin,
    });
    if (handedOff) return;

    if (typeof window !== "undefined") {
      window.location.href = target;
      return;
    }
    router.replace(target);
  };

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
        const otpType = String(otpContext?.type || "").trim().toLowerCase();
        const redirectTo = getSafeInternalRedirectPath(otpContext?.redirect_to);
        const mobilePurpose = Number(otpContext?.purpose ?? 0);
        const isMobileUserFlow = otpType === "mobile" && mobilePurpose === 0;
        const isBusinessMobileFlow = otpType === "mobile" && mobilePurpose === 2;
        const isEmailFlow = otpType === "email";

        const accessToken = pickTokenValue(response, ["access_token", "accessToken", "token"]);
        const csrfToken = pickTokenValue(response, ["csrf_token", "csrfToken"]);
        const hasAccessToken = accessToken.length > 10;
        const hasCsrfToken = csrfToken.length > 10;
        const hasCookieRefresh = String(getCookie("refresh_token") || "").trim().length > 10;
        const hasCookieCsrf = String(getCookie("csrf_token") || "").trim().length > 10;
        const hasSessionHint = hasAccessToken || hasCookieRefresh;

        if (isBusinessMobileFlow) {
          router.replace(redirectTo || "/auth/business-reg");
          return;
        }

        if (isEmailFlow) {
          if (redirectTo) {
            router.replace(redirectTo);
            return;
          }

          if (mobilePurpose === 3) {
            router.replace("/auth/business-reg");
            return;
          }

          router.replace("/auth/reg");
          return;
        }

        if (isMobileUserFlow) {
          const resolveAuthenticatedUser = async () => {
            try {
              const profile = await getCurrentUserProfile();
              const hasProfileIdentity = Boolean(
                String(
                  profile?.profile?.seanebId ||
                    profile?.profile?.displayName ||
                    profile?.displayName ||
                    ""
                ).trim()
              );
              return hasProfileIdentity ? "authenticated" : "not_authenticated";
            } catch (err) {
              const status = Number(err?.response?.status || 0);
              if (status !== 401 && status !== 403 && status !== 404) {
                return hasSessionHint ? "unknown_but_session_present" : "not_authenticated";
              }

              const canTryRefresh =
                hasCookieCsrf || hasCookieRefresh || hasAccessToken || hasCsrfToken;
              if (!canTryRefresh) return "not_authenticated";

              try {
                await refreshAccessToken();
                const profile = await getCurrentUserProfile();
                const hasProfileIdentity = Boolean(
                  String(
                    profile?.profile?.seanebId ||
                      profile?.profile?.displayName ||
                      profile?.displayName ||
                      ""
                  ).trim()
                );
                return hasProfileIdentity ? "authenticated" : "not_authenticated";
              } catch (retryError) {
                const retryStatus = Number(retryError?.response?.status || 0);
                if (retryStatus === 401 || retryStatus === 404) {
                  return "not_authenticated";
                }
                if (retryStatus === 403) {
                  return "unknown_but_session_present";
                }
                return hasSessionHint ? "unknown_but_session_present" : "not_authenticated";
              }
            }
          };

          const authenticationState = await resolveAuthenticatedUser();

          if (
            authenticationState === "authenticated" ||
            authenticationState === "unknown_but_session_present"
          ) {
            setCookie("dashboard_mode", "user", { days: 365 });
            if (redirectTo && redirectTo !== "/auth/reg") {
              if (redirectTo === "/") {
                await redirectToWebHome(response);
                return;
              }
              router.replace(redirectTo);
              return;
            }
            await redirectToWebHome(response);
            return;
          }

          if (redirectTo) {
            setCookie("post_auth_redirect", redirectTo, { days: 1 });
            router.replace(`/auth/reg?redirect_to=${encodeURIComponent(redirectTo)}`);
            return;
          }

          router.replace("/auth/reg");
          return;
        }

        if (redirectTo) {
          if (redirectTo === "/") {
            await redirectToWebHome(response);
            return;
          }
          router.replace(redirectTo);
          return;
        }

        if (!hasSessionHint) {
          router.replace("/auth/reg");
          return;
        }

        setCookie("dashboard_mode", "user", { days: 365 });
        await redirectToWebHome(response);
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
    <AuthLayout lang={lang} onLangChange={setLang} showBack={false}>
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
