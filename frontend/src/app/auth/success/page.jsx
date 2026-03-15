"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Lottie from "lottie-react";

import AuthLayout from "@/components/AuthLayout";
import useTranslation from "@/hooks/useTranslation";
import useAppLang from "@/hooks/useAppLang";
import successAnim from "@/constants/lottieyfile/Checked.json";
import { logout } from "@/lib/auth/authService";
import { getCurrentUserProfile } from "@/services/user.services";
import { getCookie, removeCookie, setCookie } from "@/services/cookieStore";
import { notifyParentAndClose } from "@/lib/auth/popupAuthBridge";
import { resolveWebSsoRedirectUrl } from "@/services/sso.services";
import { activateSsoLock, releaseSsoLock } from "@/lib/auth/ssoLock";

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang] = useAppLang(searchParams);
  const t = useTranslation(lang);
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
  ).replace(/\/$/, "");

  useEffect(() => {
    let active = true;
    let didRun = false;

    const initialBridgeTokenFromQuery = String(searchParams?.get("bridge_token") || "").trim();
    const initialBridgeTokenFromStore = String(getCookie("signup_bridge_token") || "").trim();
    const hasBridgeToken = Boolean(initialBridgeTokenFromQuery || initialBridgeTokenFromStore);

    if (hasBridgeToken) {
      activateSsoLock();
    }

    const timer = setTimeout(async () => {
      didRun = true;
      try {
        await getCurrentUserProfile();
        if (!active) return;

        const bridgeTokenFromQuery = String(searchParams?.get("bridge_token") || "").trim();
        const bridgeTokenFromStore = String(getCookie("signup_bridge_token") || "").trim();
        const bridgeToken = bridgeTokenFromQuery || bridgeTokenFromStore;
        const homeTarget = await resolveWebSsoRedirectUrl({ webAppUrl, bridgeToken });
        removeCookie("signup_bridge_token");
        let targetOrigin = "";
        try {
          targetOrigin = new URL(homeTarget).origin;
        } catch {
          targetOrigin = "";
        }
        const handedOff = notifyParentAndClose({
          status: "success",
          returnTo: homeTarget,
          returnOrigin: targetOrigin,
        });
        if (handedOff) return;

        removeCookie("post_auth_redirect");
        setCookie("dashboard_mode", "user", { days: 365 });
        const target = homeTarget;
        if (typeof window !== "undefined") {
          window.location.href = target;
          return;
        }
        router.replace(target);
      } catch {
        if (!active) return;
        removeCookie("signup_bridge_token");
        removeCookie("post_auth_redirect");
        await logout();
        router.push("/auth/login");
      } finally {
        if (hasBridgeToken) {
          releaseSsoLock();
        }
      }
    }, 2200);

    return () => {
      active = false;
      clearTimeout(timer);
      if (hasBridgeToken && !didRun) {
        releaseSsoLock();
      }
    };
  }, [router, searchParams, webAppUrl]);

  return (
    <AuthLayout
      lang={lang}
      showLang={false}
      showBack={false}
    >
      <Lottie
        animationData={successAnim}
        loop={true}
        style={{ height: 180, margin: "0 auto" }}
      />

      <h2 className="success-title">{t.successTitle}</h2>
      <p className="success-subtitle">{t.successSubtitle}</p>
      <p className="mt-3 text-center text-[13px] text-(--auth-muted)">Redirecting...</p>
    </AuthLayout>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessPageContent />
    </Suspense>
  );
}
