"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "../../component/AuthLayout";
import useAppLang from "../../hook/useAppLang";
import { setCookie } from "../../services/cookieStore";

function PostRegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang] = useAppLang(searchParams);
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:1003"
  ).replace(/\/$/, "");

  const goHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = `${webAppUrl}/`;
      return;
    }
    router.replace(`${webAppUrl}/`);
  };

  return (
    <AuthLayout
      lang={lang}
      showLang={false}
      showBack={false}
    >
      <div className="mx-auto max-w-105">
        <h2 className="text-[28px] font-bold text-[var(--color-text-primary)]">
          Register your business?
        </h2>
        <p className="mt-2 text-[14px] text-[var(--auth-muted)]">
          You can continue as a buyer now, or register your business to access dealer tools.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 [@media(max-width:640px)]:grid-cols-1">
          <button
            type="button"
            className="cursor-pointer rounded-[10px] border border-[var(--color-btn-primary-bg)] bg-[linear-gradient(140deg,#0d5ebd_0%,#2c86dd_100%)] px-4 py-3 text-left text-[14px] font-bold text-[var(--color-white)] shadow-[0_10px_20px_rgba(18,95,189,0.25)] transition-[transform,box-shadow] duration-200 ease-in-out hover:translate-y-[-1px] hover:shadow-[0_14px_24px_rgba(18,95,189,0.30)]"
            onClick={() => {
              setCookie("dashboard_mode", "dealer", { days: 365 });
              router.push("/auth/business-reg");
            }}
          >
            Register your business
          </button>

          <button
            type="button"
            className="cursor-pointer rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-surface-section)] px-4 py-3 text-left text-[14px] font-bold text-[#1e293b] transition-[background-color,border-color] duration-200 ease-in-out hover:border-[#94a3b8] hover:bg-[var(--color-page-bg-alt)]"
            onClick={goHome}
          >
            Skip and go to home
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function PostRegisterPage() {
  return (
    <Suspense fallback={null}>
      <PostRegisterPageContent />
    </Suspense>
  );
}
