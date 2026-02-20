"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Lottie from "lottie-react";

import AuthLayout from "@/app/component/AuthLayout";
import useTranslation from "@/app/hook/useTranslation";
import successAnim from "@/app/constant/lottieyfile/Checked.json";
import PrimaryButton from "@/app/component/PrimaryButton";
import { clearSession } from "@/app/services/api";
import { getCookie } from "@/app/services/cookieStore";

function SuccessPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const lang = params.get("lang") || "en";

  const t = useTranslation(lang);
  const handleRedirect = () => {
    const accessToken =
      typeof window !== "undefined"
        ? getCookie("access_token")
        : null;
    const csrfToken =
      typeof window !== "undefined"
        ? getCookie("csrf_token")
        : null;

    const hasSession =
      typeof accessToken === "string" &&
      accessToken.length > 10 &&
      typeof csrfToken === "string" &&
      csrfToken.length > 10;

    if (hasSession) {
      router.push("/auth/userdash");
      return;
    }

    clearSession();
    router.push(`/auth/login?lang=${lang}`);
  };

  return (
    <AuthLayout
      lang={lang}
      showLang={false}
      showBack={true}
      backFallback="/auth/login"
    >
      <Lottie
        animationData={successAnim}
        loop={true}
        style={{ height: 180, margin: "0 auto" }}
      />

      <h2 className="success-title">{t.successTitle} 🎉</h2>
      <p className="success-subtitle">{t.successSubtitle}</p>

      <PrimaryButton onClick={handleRedirect}>
        {t.goToDashboard}
      </PrimaryButton>
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
