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
  cardClassName = "",
  showLang = true,
  logoBg = "light",
  showBack = false,
  backFallback = "/auth/login",
  headerLeft = null,
  headerRight = null,
}) {
  const logoSrc =
    logoBg === "dark" ? "/logo/white-logo-2.png" : "/logo/white-logo-3.svg";
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
  ).replace(/\/$/, "");
  const isRegVariant = variant === "reg";
  const cardClasses =
    isRegVariant
      ? "max-w-[980px] rounded-[16px] p-8 [@media(max-width:1100px)]:max-w-full [@media(max-width:900px)]:rounded-[12px] [@media(max-width:900px)]:px-4 [@media(max-width:900px)]:py-5"
      : "max-w-[420px] rounded-[14px] p-6";
  const shellClasses =
    isRegVariant
      ? "bg-[radial-gradient(1200px_420px_at_10%_-10%,rgba(15,78,201,0.12),transparent_58%),radial-gradient(1000px_360px_at_90%_-20%,rgba(27,150,255,0.09),transparent_62%),linear-gradient(180deg,#f2f6fc_0%,#edf3fb_100%)]"
      : "";
  const mobileAlignmentClasses = isRegVariant
    ? "[@media(max-width:900px)]:items-start [@media(max-width:900px)]:pt-[14px] [@media(max-width:900px)]:pb-7"
    : "[@media(max-width:900px)]:items-center [@media(max-width:900px)]:py-6";
  const defaultAuthBackgroundStyle = isRegVariant
    ? undefined
    : {
        backgroundImage:
          "linear-gradient(160deg, rgba(12, 8, 2, 0.60) 0%, rgba(22, 14, 4, 0.46) 48%, rgba(10, 6, 0, 0.64) 100%), url('/auth-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };

  return (
    <div
      className={`flex min-h-screen min-h-[100dvh] w-full items-center justify-center px-4 py-6 [@media(max-width:900px)]:px-3 ${mobileAlignmentClasses} ${shellClasses}`}
      style={defaultAuthBackgroundStyle}
    >
      <div
        className={`w-full bg-[var(--color-white)] text-[var(--color-black)] ${isRegVariant ? "" : "border-t-[3px] border-t-[var(--color-brand-primary)]"} shadow-[0_24px_64px_rgba(0,0,0,0.26),0_4px_18px_rgba(0,0,0,0.12)] ${cardClasses} ${cardClassName}`}
      >
        <div className="mb-5 flex items-center justify-between [@media(max-width:900px)]:mb-[14px] [@media(max-width:900px)]:flex-wrap [@media(max-width:900px)]:gap-[10px]">
          {headerLeft ? (
            <div className="flex flex-col">{headerLeft}</div>
          ) : (
            <div className="flex flex-col">
              <Link
                href={`${webAppUrl}/`}
                className="flex items-center leading-none no-underline"
                aria-label="SeaNeB Realty Home"
              >
                <Image
                  src={logoSrc}
                  alt="SeaNeB Realty"
                  width={150}
                  height={150}
                  className={`block h-auto object-contain ${isRegVariant ? "w-[110px]" : "w-[90px]"}`}
                  priority
                />
              </Link>
              {showBack && (
                <BackButton className="auth-back-btn" fallbackPath={backFallback} />
              )}
            </div>
          )}

          {headerRight ? (
            <div className="ml-auto">{headerRight}</div>
          ) : (
            showLang &&
            onLangChange && (
              <div className="flex-[0_0_124px] [@media(max-width:900px)]:flex-[0_0_108px]">
                <LangSelect value={lang} onChange={onLangChange} variant="lang" />
              </div>
            )
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
