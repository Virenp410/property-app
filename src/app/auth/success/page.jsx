"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Lottie from "lottie-react";

import AuthLayout from "@/app/component/AuthLayout";
import useTranslation from "@/app/hook/useTranslation";
import useAppLang from "@/app/hook/useAppLang";
import successAnim from "@/app/constant/lottieyfile/Checked.json";
import { clearSession } from "@/app/services/api";
import { getCookie, removeCookie, setCookie } from "@/app/services/cookieStore";

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang] = useAppLang(searchParams);
  const t = useTranslation(lang);

  useEffect(() => {
    const timer = setTimeout(() => {
      const accessToken =
        typeof window !== "undefined"
          ? getCookie("access_token_auto") || getCookie("access_token")
          : null;
      const csrfToken =
        typeof window !== "undefined"
          ? getCookie("csrf_token_auto") || getCookie("csrf_token")
          : null;

      const hasSession =
        typeof accessToken === "string" &&
        accessToken.length > 10 &&
        typeof csrfToken === "string" &&
        csrfToken.length > 10;

      if (hasSession) {
        removeCookie("post_auth_redirect");
        setCookie("dashboard_mode", "user", { days: 365 });
        router.push("/auth/post-register");
        return;
      }

      removeCookie("post_auth_redirect");
      clearSession();
      router.push("/auth/login");
    }, 2200);

    return () => clearTimeout(timer);
  }, [lang, router]);

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
