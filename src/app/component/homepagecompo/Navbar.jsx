"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import LocationDetector from "./LoactionDetector";
import LangSelect from "../LangSelect";
import { getCookie, getJsonCookie, setCookie } from "@/app/services/cookieStore";
import { getCurrentUserProfile } from "@/app/services/user.services";
import navbarLinks from "../../jsondata/navbarLinks.json";
import navbarI18n from "../../jsondata/navbarI18n.json";
const DEFAULT_PROFILE_SRC = "/images/profile.svg";

const parseJwtPayload = (token) => {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return {};
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
};

const toTitleCase = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const readCookieValue = (name) => {
  return String(getCookie(name) || "");
};

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

const formatPhone = (countryCode, mobileNumber) => {
  const cc = digitsOnly(countryCode);
  const mobile = digitsOnly(mobileNumber);
  if (!mobile) return "";
  return cc ? `+${cc}${mobile}` : mobile;
};

const getAuthSnapshot = () => {
  if (typeof window === "undefined") {
    return { authenticated: false, displayName: "", email: "", phoneNumber: "" };
  }

  const token =
    String(
      readCookieValue("access_token_auto") ||
        readCookieValue("access_token") ||
        window.localStorage.getItem("access_token") ||
        ""
    ).trim();

  const authenticated = token.length > 10;
  if (!authenticated) return { authenticated: false, displayName: "", email: "", phoneNumber: "" };

  const claims = parseJwtPayload(token);
  const tokenName = toTitleCase(
    claims?.first_name ||
      claims?.firstName ||
      claims?.name ||
      claims?.full_name ||
      claims?.user_name ||
      claims?.username ||
      ""
  );
  const email = String(
    claims?.email || readCookieValue("verified_email") || readCookieValue("user_email") || ""
  ).trim();
  const verifiedMobile = getJsonCookie("verified_mobile") || {};
  const otpContext = getJsonCookie("otp_context") || {};
  const tokenMobile = String(
    claims?.mobile_number || claims?.mobile || claims?.phone_number || claims?.phone || ""
  ).trim();
  const tokenCountryCode = String(claims?.country_code || claims?.countryCode || "").trim();
  const phoneNumber =
    formatPhone(verifiedMobile?.country_code, verifiedMobile?.mobile_number) ||
    formatPhone(otpContext?.country_code, otpContext?.mobile_number) ||
    formatPhone(tokenCountryCode, tokenMobile);

  const emailLocal = email.includes("@") ? email.split("@")[0] : "";
  const cachedName = toTitleCase(readCookieValue("user_display_name"));
  const fallbackName = toTitleCase(cachedName || tokenName || emailLocal || "Profile");

  return { authenticated: true, displayName: fallbackName, email, phoneNumber };
};

const getBusinessRegistrationSnapshot = () => {
  if (typeof window === "undefined") return false;

  const token =
    String(
      readCookieValue("access_token_auto") ||
        readCookieValue("access_token") ||
        window.localStorage.getItem("access_token") ||
        ""
    ).trim();

  const claims = parseJwtPayload(token);
  const fromClaims =
    claims?.business_registered === true ||
    claims?.registered_business === true ||
    claims?.is_business_user === true ||
    Boolean(String(claims?.business_id || claims?.businessId || "").trim()) ||
    Boolean(String(claims?.branch_id || claims?.branchId || "").trim());

  const fromCookies =
    String(readCookieValue("business_registered")).trim().toLowerCase() === "true" ||
    String(readCookieValue("business_register")).trim().toLowerCase() === "true" ||
    Boolean(String(readCookieValue("business_id")).trim()) ||
    Boolean(String(readCookieValue("branch_id")).trim());

  return fromClaims || fromCookies;
};

function renderNavItem(item, onClick) {
  const key = `${item.name}-${item.href}`;
  const isHashLink = item.href?.startsWith("#");

  if (item.download) {
    return (
      <a
        key={key}
        href={item.href}
        download
        onClick={onClick}
      >
        {item.name}
      </a>
    );
  }

  if (isHashLink) {
    return (
      <a key={key} href={item.href} onClick={onClick}>
        {item.name}
      </a>
    );
  }

  return (
    <Link key={key} href={item.href} onClick={onClick}>
      {item.name}
    </Link>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [overHero, setOverHero] = useState(false);
  const [lang, setLang] = useState("en");
  const [authState, setAuthState] = useState({
    authenticated: false,
    displayName: "",
    email: "",
    phoneNumber: "",
  });
  const [isBusinessRegistered, setIsBusinessRegistered] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [avatarSrc, setAvatarSrc] = useState(DEFAULT_PROFILE_SRC);
  const navRef = useRef(null);
  const profileMenuRef = useRef(null);
  const pathname = usePathname();
  const logoSrc = overHero ? "/logo/white-logo-2.png" : "/logo/white-logo-3.svg";
  const i18nLabels = navbarI18n?.labels?.[lang] || navbarI18n?.labels?.en || {};
  const linkLabels = i18nLabels?.links || {};
  const appLabel = i18nLabels?.getApp || "Get the App";
  const loginLabel = i18nLabels?.login || "Login";
  const authAppUrl = String(process.env.NEXT_PUBLIC_AUTH_APP_URL || "http://localhost:3002").replace(/\/$/, "");
  const authLoginHref = `${authAppUrl}/auth/login`;
  const businessActionHref = isBusinessRegistered
    ? `${authAppUrl}/auth/dealerdash`
    : `${authAppUrl}/auth/business-reg`;
  const businessActionLabel = isBusinessRegistered
    ? "Switch to Dealer Profile"
    : "Register Your Business";

  useEffect(() => {
    const savedLang = String(window.localStorage.getItem("app_lang") || "").trim();
    if (["en", "hi", "gu"].includes(savedLang)) {
      setLang(savedLang);
    }

    const syncAuth = () => {
      setAuthState(getAuthSnapshot());
      setIsBusinessRegistered(getBusinessRegistrationSnapshot());
    };
    syncAuth();
    window.addEventListener("focus", syncAuth);
    window.addEventListener("storage", syncAuth);
    document.addEventListener("visibilitychange", syncAuth);

    return () => {
      window.removeEventListener("focus", syncAuth);
      window.removeEventListener("storage", syncAuth);
      document.removeEventListener("visibilitychange", syncAuth);
    };
  }, [pathname]);

  useEffect(() => {
    let active = true;

    const loadNameFromDb = async () => {
      if (!authState.authenticated) return;
      try {
        const profile = await getCurrentUserProfile();
        const dbName = String(profile?.displayName || "").trim();
        if (!active || !dbName) return;
        setCookie("user_display_name", dbName, { days: 365 });
        if (profile?.profile) {
          setUserProfile(profile.profile);
          if (profile.profile.isBusinessRegistered === true) {
            setIsBusinessRegistered(true);
          }
        }
        setAuthState((prev) => ({ ...prev, displayName: dbName }));
      } catch {
        // keep fallback display name; silent to avoid console noise
      }
    };

    loadNameFromDb();
    return () => {
      active = false;
    };
  }, [authState.authenticated]);

  useEffect(() => {
    const nextPhoto = String(userProfile?.profilePhoto || "").trim();
    setAvatarSrc(nextPhoto || DEFAULT_PROFILE_SRC);
  }, [userProfile?.profilePhoto]);

  useEffect(() => {
    const onOutsideClick = (event) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  useEffect(() => {
    const hero = document.querySelector('.hero-section');
    if (!hero) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // when hero is intersecting (visible), keep navbar in 'over-hero' state
          setOverHero(entry.isIntersecting && entry.intersectionRatio > 0.1);
        });
      },
      { root: null, threshold: [0, 0.1, 0.5, 1] }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const handleLangChange = (nextLang) => {
    const normalized = ["en", "hi", "gu"].includes(nextLang) ? nextLang : "en";
    setLang(normalized);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("app_lang", normalized);
    }
  };

  const handleBusinessActionClick = () => {
    if (typeof window !== "undefined") {
      window.location.href = businessActionHref;
    }
  };

  return (
    <header ref={navRef} className={`navbar ${overHero ? 'over-hero' : ''}`}>
      <div className="nav-inner">
        {/* Left Section */}
        <div className="nav-left">
          <Link href="/" className="logo">
            <Image
              src={logoSrc}
              alt="SeaNeB Autos"
              width={130}
              height={40}
              className="logo-img"
              style={{ width: "auto", height: "auto" }}
              priority
            />
          </Link>

          <LocationDetector />
        </div>

        {/* Desktop Nav */}
        <nav className="nav-links" aria-label="Primary">
          {navbarLinks.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            const linkLabel = linkLabels[item.href] || item.name;

            return (
              <Link
                key={`${item.name}-${item.href}`}
                href={item.href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                {linkLabel}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Buttons */}
        <div className="nav-buttons">
          <div className="nav-lang-wrap" aria-label="Language">
            <LangSelect value={lang} onChange={handleLangChange} />
          </div>
          <a
            className={`btn-outline nav-app-btn ${overHero ? "on-dark" : "on-light"}`}
            href="#"
          >
            {appLabel}
          </a>
          {authState.authenticated ? (
            <div className="nav-profile-wrap" ref={profileMenuRef}>
              <button
                type="button"
                className="btn-solid nav-profile-btn"
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5em" }}>
                  <Image
                    src={avatarSrc}
                    alt="Profile"
                    width={18}
                    height={18}
                    className="nav-profile-icon"
                    unoptimized
                    onError={() => setAvatarSrc(DEFAULT_PROFILE_SRC)}
                  />
                  {authState.displayName}
                </span>
              </button>

              {profileOpen && (
                <div className="nav-profile-menu">
                  <div className="nav-profile-head">
                    <strong>{authState.displayName}</strong>
                  </div>
                  <div className="nav-profile-grid">
                    <ProfileRow label="Full Name" value={userProfile?.fullName || authState?.displayName} />
                    <ProfileRow label="SeaNeB ID" value={userProfile?.seanebId} />
                  </div>
                  <div className="nav-profile-actions">
                    <button
                      type="button"
                      className="nav-profile-link"
                      onClick={handleBusinessActionClick}
                    >
                      {businessActionLabel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a href={authLoginHref} className="btn-solid">
              {loginLabel}
            </a>
          )}
        </div>

        {/* Hamburger */}
        <button
          type="button"
          className="hamburger"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() =>
            setMenuOpen((prev) => {
              const next = !prev;
              if (!next) setMobileProfileOpen(false);
              return next;
            })
          }
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <div className="mobile-lang-row">
            <span>Language</span>
            <div className="nav-lang-wrap mobile-lang-wrap" aria-label="Language">
              <LangSelect value={lang} onChange={handleLangChange} />
            </div>
          </div>

          {navbarLinks.map((item) =>
            renderNavItem(
              { ...item, name: linkLabels[item.href] || item.name },
              () => setMenuOpen(false)
            )
          )}

          <div className="mobile-menu-actions">
            <button className="btn-outline mobile-cta-btn" onClick={() => setMenuOpen(false)}>
              {appLabel}
            </button>
            {authState.authenticated ? (
              <>
                <button
                  type="button"
                  className="btn-solid mobile-cta-btn mobile-login-btn"
                  onClick={() => setMobileProfileOpen((prev) => !prev)}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5em" }}>
                    <Image
                      src={avatarSrc}
                      alt="Profile"
                      width={18}
                      height={18}
                      className="nav-profile-icon"
                      unoptimized
                      onError={() => setAvatarSrc(DEFAULT_PROFILE_SRC)}
                    />
                    {authState.displayName}
                  </span>
                </button>
                {mobileProfileOpen && (
                  <div className="mobile-profile-card">
                    <ProfileRow label="Full Name" value={userProfile?.fullName || authState?.displayName} />
                    <ProfileRow label="SeaNeB ID" value={userProfile?.seanebId} />
                    <button
                      type="button"
                      className="nav-profile-link"
                      onClick={() => {
                        setMobileProfileOpen(false);
                        setMenuOpen(false);
                        handleBusinessActionClick();
                      }}
                    >
                      {businessActionLabel}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <a
                href={authLoginHref}
                className="btn-solid mobile-cta-btn mobile-login-btn"
                onClick={() => setMenuOpen(false)}
              >
                {loginLabel}
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="nav-profile-row">
      <span>{label}</span>
      <strong>{String(value || "-")}</strong>
    </div>
  );
}
