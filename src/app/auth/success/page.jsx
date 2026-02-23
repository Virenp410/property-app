"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Lottie from "lottie-react";

import AuthLayout from "@/app/component/AuthLayout";
import useTranslation from "@/app/hook/useTranslation";
import successAnim from "@/app/constant/lottieyfile/Checked.json";
import PrimaryButton from "@/app/component/PrimaryButton";
import { clearSession } from "@/app/services/api";
import { getCookie, removeCookie } from "@/app/services/cookieStore";

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
  const query = new URLSearchParams(queryString);
  if (!query.get("lang")) {
    query.set("lang", lang);
  }
  const hashSuffix = hashPart ? `#${hashPart}` : "";
  const finalQuery = query.toString();
  return finalQuery ? `${pathname}?${finalQuery}${hashSuffix}` : `${pathname}${hashSuffix}`;
};

function SuccessPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const lang = params.get("lang") || "en";

  const t = useTranslation(lang);
  const handleRedirect = () => {
    const redirectFromQuery = params.get("redirect_to");
    const redirectFromCookie =
      typeof window !== "undefined" ? getCookie("post_auth_redirect") : "";
    const postAuthRedirect =
      getSafeInternalRedirectPath(redirectFromQuery) ||
      getSafeInternalRedirectPath(redirectFromCookie);
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
      if (postAuthRedirect) {
        removeCookie("post_auth_redirect");
        router.push(withLangQuery(postAuthRedirect, lang));
        return;
      }
      router.push(withLangQuery("/auth/userdash", lang));
      return;
    }

    removeCookie("post_auth_redirect");
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
