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
    process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  return (
    <div className="login-wrapper">
      <div className={`login-card ${variant === "reg" ? "reg" : ""}`}>
        <div className="login-header">
          <div className="login-header-left">
            <Link href={`${webAppUrl}/`} className="login-logo" aria-label="SeaNeB Home">
              <Image
                src={logoSrc}
                alt="SeaNeB Autos"
                width={150}
                height={40}
                className="auth-logo-img"
                priority
              />
            </Link>
            {showBack && (
              <BackButton className="auth-back-btn" fallbackPath={backFallback} />
            )}
          </div>

          {showLang && onLangChange && (
            <div className="lang-container">
              <LangSelect value={lang} onChange={onLangChange} />
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
