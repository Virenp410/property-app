"use client";

import LangSelect from "./LangSelect";
import Image from "next/image";
import Link from "next/link";
import BackButton from "./BackButton";

export default function AuthLayout({
  children,
  lang,
  onLangChange,
  variant = "default",
  showLang = true,
  logoBg = "light",
  showBack = false,
  backFallback = "/auth/login",
}) {
  const logoSrc =
    logoBg === "dark" ? "/logo/white-logo-2.png" : "/logo/white-logo-3.svg";
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:1003"
  ).replace(/\/$/, "");
  const cardClasses =
    variant === "reg"
      ? "max-w-[760px] rounded-[14px] p-9 [@media(max-width:900px)]:max-w-full [@media(max-width:900px)]:rounded-[12px] [@media(max-width:900px)]:px-4 [@media(max-width:900px)]:py-5"
      : "max-w-[420px] rounded-[14px] p-5";

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-6 [@media(max-width:900px)]:items-start [@media(max-width:900px)]:px-3 [@media(max-width:900px)]:pb-7 [@media(max-width:900px)]:pt-[14px]">
      <div
        className={`w-full bg-[var(--color-white)] text-[var(--color-black)] shadow-[0_10px_30px_rgba(0,0,0,0.12)] ${cardClasses}`}
      >
        <div className="mb-6 flex items-start justify-between [@media(max-width:900px)]:mb-[18px] [@media(max-width:900px)]:flex-wrap [@media(max-width:900px)]:gap-[10px]">
          <div className="block">
            <Link
              href={`${webAppUrl}/`}
              className="flex items-center leading-none no-underline"
              aria-label="SeaNeB Home"
            >
              <Image
                src={logoSrc}
                alt="SeaNeB Autos"
                width={150}
                height={40}
                className="block h-auto w-[150px] object-contain"
                priority
              />
            </Link>
            {showBack && (
              <BackButton className="auth-back-btn" fallbackPath={backFallback} />
            )}
          </div>

          {showLang && onLangChange && (
            <div className="flex-[0_0_124px] [@media(max-width:900px)]:flex-[0_0_108px]">
              <LangSelect value={lang} onChange={onLangChange} variant="lang" />
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
