"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Lottie from "lottie-react";

import AuthLayout from "@/components/AuthLayout";
import useTranslation from "@/hooks/useTranslation";
import useAppLang from "@/hooks/useAppLang";
import successAnim from "@/constants/lottieyfile/Checked.json";
import { clearServerSession, clearSession } from "@/services/api";
import { getCurrentUserProfile } from "@/services/user.services";
import { removeCookie, setCookie } from "@/services/cookieStore";
import { notifyParentAndClose } from "@/lib/auth/popupAuthBridge";

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang] = useAppLang(searchParams);
  const t = useTranslation(lang);
  const webAppUrl = String(process.env.NEXT_PUBLIC_WEB_APP_URL || "").replace(/\/$/, "");

  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      try {
        await getCurrentUserProfile();
        if (!active) return;

        const homeTarget = `${webAppUrl}/`;
        const handedOff = notifyParentAndClose({
          status: "success",
          returnTo: homeTarget,
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
        removeCookie("post_auth_redirect");
        await clearServerSession();
        clearSession();
        router.push("/auth/login");
      }
    }, 2200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [router, webAppUrl]);

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
