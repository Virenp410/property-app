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
      : "max-w-[420px] rounded-[14px] p-5";
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
          "linear-gradient(160deg, rgba(4, 22, 52, 0.58) 0%, rgba(6, 27, 64, 0.48) 42%, rgba(6, 19, 45, 0.62) 100%), url('/auth-bg.jpg')",
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
        className={`w-full bg-[var(--color-white)] text-[var(--color-black)] shadow-[0_20px_44px_rgba(17,35,67,0.16)] ${cardClasses} ${cardClassName}`}
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
