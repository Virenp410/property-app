"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api, { clearServerSession, clearSession } from "@/app/services/api";
import BackButton from "@/app/component/BackButton";
import ProfileDropdown from "@/app/component/ProfileDropdown";
import { getCookie, getJsonCookie, setCookie, setJsonCookie } from "@/app/services/cookieStore";
import { getCurrentUserProfile } from "@/app/services/user.services";

const PRODUCT_KEY = String(process.env.NEXT_PUBLIC_PRODUCT_KEY || "auto").trim() || "auto";

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

const extractBusinessIdentityFromClaims = (claims) => {
  const businessId = String(
    claims?.business_id ??
      claims?.businessId ??
      claims?.bid ??
      claims?.biz_id ??
      ""
  ).trim();
  const branchId = String(
    claims?.branch_id ??
      claims?.branchId ??
      claims?.default_branch_id ??
      ""
  ).trim();
  const businessName = String(
    claims?.business_name ??
      claims?.businessName ??
      claims?.biz_name ??
      ""
  ).trim();
  const registered =
    claims?.business_registered === true ||
    claims?.registered_business === true ||
    claims?.is_business_user === true ||
    Boolean(businessId) ||
    Boolean(branchId);
  return { businessId, branchId, businessName, registered };
};

const extractOwnerMobileKeyFromClaims = (claims) => {
  const cc = String(
    claims?.country_code ??
      claims?.countryCode ??
      claims?.cc ??
      ""
  )
    .replace(/\D/g, "")
    .trim();
  const mobile = String(
    claims?.mobile_number ??
      claims?.mobile ??
      claims?.phone ??
      claims?.phone_number ??
      ""
  )
    .replace(/\D/g, "")
    .trim();
  if (!cc || !mobile) return "";
  return `${cc}-${mobile}`;
};

const getBusinessProfileStorageKey = (countryCode, mobileNumber) => {
  const cc = String(countryCode || "").replace(/\D/g, "").trim();
  const mobile = String(mobileNumber || "").replace(/\D/g, "").trim();
  if (!cc || !mobile) return "";
  return `business_profile_${cc}_${mobile}`;
};

const getStoredBusinessProfile = (storageKey) => {
  if (!storageKey) return null;
  const fromCookie = getJsonCookie(storageKey);
  if (fromCookie?.registered) return fromCookie;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.registered ? parsed : null;
  } catch {
    return null;
  }
};

const persistBusinessProfile = (storageKey, profile) => {
  if (!storageKey || !profile) return;
  setJsonCookie(storageKey, profile, { days: 365 });
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(profile));
  } catch {
    // ignore
  }
};

const getBusinessOwnerMobileKey = (countryCode, mobileNumber) => {
  const cc = String(countryCode || "").replace(/\D/g, "").trim();
  const mobile = String(mobileNumber || "").replace(/\D/g, "").trim();
  if (!cc || !mobile) return "";
  return `${cc}-${mobile}`;
};

const normalizeOwnerMobileKey = (value) =>
  String(value || "").replace(/\D/g, "").trim();
const USERDASH_SEEN_COOKIE = "userdash_seen";

export default function DashboardPage() {
  const router = useRouter();
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [showBizPrompt, setShowBizPrompt] = useState(false);
  const [stateResolved, setStateResolved] = useState(false);
  const [profileInfo, setProfileInfo] = useState({ fullName: "-", seanebId: "-" });
  const productsFetchedRef = useRef(false);

  const getCurrentMobileOwnerKey = () => {
    const verified = getJsonCookie("verified_mobile");
    const fromVerified = getBusinessOwnerMobileKey(
      verified?.country_code,
      verified?.mobile_number
    );
    if (fromVerified) return fromVerified;
    const accessToken =
      String(getCookie("access_token_auto") || getCookie("access_token") || "").trim();
    return extractOwnerMobileKeyFromClaims(parseJwtPayload(accessToken));
  };

  const getBusinessFromTokenClaims = () => {
    const accessToken =
      String(getCookie("access_token_auto") || getCookie("access_token") || "").trim();
    return extractBusinessIdentityFromClaims(parseJwtPayload(accessToken));
  };

  const ownerMatchesCurrentMobile = () => {
    const currentMobileOwnerKey = getCurrentMobileOwnerKey();
    const existingOwnerKey = String(getCookie("business_owner_mobile") || "").trim();
    const normalizedCurrent = normalizeOwnerMobileKey(currentMobileOwnerKey);
    const normalizedExisting = normalizeOwnerMobileKey(existingOwnerKey);
    if (!normalizedCurrent) return false;
    if (!normalizedExisting) return true;
    return normalizedExisting === normalizedCurrent;
  };

  const hasSkippedBusinessPromptForCurrentMobile = () => {
    const currentMobileOwnerKey = normalizeOwnerMobileKey(getCurrentMobileOwnerKey());
    const skippedCookie = String(getCookie("user_skipped_biz") || "").trim();
    if (!skippedCookie) return false;

    const legacySkipped =
      skippedCookie.toLowerCase() === "true" ||
      skippedCookie.toLowerCase() === "1" ||
      skippedCookie.toLowerCase() === "yes" ||
      skippedCookie.toLowerCase() === "y";

    if (legacySkipped) {
      // Legacy global skip value: only honor it when current mobile cannot be resolved.
      return !currentMobileOwnerKey;
    }

    const normalizedSkipped = normalizeOwnerMobileKey(skippedCookie);
    if (!normalizedSkipped || !currentMobileOwnerKey) return false;
    return normalizedSkipped === currentMobileOwnerKey;
  };

  const hasRegisteredBusinessFromCookies = () => {
    if (!ownerMatchesCurrentMobile()) return false;
    const registered =
      getCookie("business_registered") === "true" ||
      getCookie("business_register") === "true";
    const businessId = String(getCookie("business_id") || "").trim();
    const branchId = String(getCookie("branch_id") || "").trim();
    const businessName = String(getCookie("business_name") || "").trim();
    return registered || Boolean(businessId) || Boolean(branchId) || Boolean(businessName);
  };

  const syncBusinessStateFromLocal = () => {
    try {
      const verified = getJsonCookie("verified_mobile");
      if (!verified?.country_code || !verified?.mobile_number) return false;

      const key = getBusinessProfileStorageKey(
        verified.country_code,
        verified.mobile_number
      );
      if (!key) return false;

      const profile = getStoredBusinessProfile(key);
      if (!profile?.registered) return false;

      const mobileOwnerKey = getBusinessOwnerMobileKey(
        verified.country_code,
        verified.mobile_number
      );

      setCookie("business_registered", "true", { days: 365 });
      setCookie("business_register", "true", { days: 365 });
      setCookie("has_business_for_mobile", "true", { days: 365 });
      setCookie("dashboard_mode", "dealer", { days: 365 });
      if (profile.business_id) setCookie("business_id", String(profile.business_id), { days: 365 });
      if (profile.branch_id) setCookie("branch_id", String(profile.branch_id), { days: 365 });
      if (profile.business_name) setCookie("business_name", String(profile.business_name), { days: 365 });
      if (mobileOwnerKey && mobileOwnerKey !== "-") {
        setCookie("business_owner_mobile", mobileOwnerKey, { days: 365 });
      }
      persistBusinessProfile(key, {
        registered: true,
        business_id: String(profile.business_id || "").trim(),
        branch_id: String(profile.branch_id || "").trim(),
        business_name: String(profile.business_name || "").trim(),
      });
      return true;
    } catch {
      return false;
    }
  };

  const syncBusinessStateFromToken = () => {
    const tokenBusiness = getBusinessFromTokenClaims();
    if (!tokenBusiness.registered) return false;

    const currentMobileOwnerKey = getCurrentMobileOwnerKey();
    if (!currentMobileOwnerKey) return false;

    setCookie("business_registered", "true", { days: 365 });
    setCookie("business_register", "true", { days: 365 });
    setCookie("has_business_for_mobile", "true", { days: 365 });
    setCookie("dashboard_mode", "dealer", { days: 365 });
    setCookie("business_owner_mobile", currentMobileOwnerKey, { days: 365 });
    if (tokenBusiness.businessId) setCookie("business_id", tokenBusiness.businessId, { days: 365 });
    if (tokenBusiness.branchId) setCookie("branch_id", tokenBusiness.branchId, { days: 365 });
    if (tokenBusiness.businessName) setCookie("business_name", tokenBusiness.businessName, { days: 365 });
    const verified = getJsonCookie("verified_mobile");
    const key = getBusinessProfileStorageKey(
      verified?.country_code,
      verified?.mobile_number
    );
    persistBusinessProfile(key, {
      registered: true,
      business_id: tokenBusiness.businessId || "",
      branch_id: tokenBusiness.branchId || "",
      business_name: tokenBusiness.businessName || "",
    });
    return true;
  };

  const resolveDealerTarget = async () => {
    if (
      hasRegisteredBusinessFromCookies() ||
      syncBusinessStateFromLocal() ||
      syncBusinessStateFromToken()
    ) {
      setCookie("dashboard_mode", "dealer", { days: 365 });
      return "/auth/dealerdash";
    }
    return "/auth/business-reg";
  };

  useEffect(() => {
    let active = true;

    const initDashboardState = async () => {
      let hasBusiness =
        hasRegisteredBusinessFromCookies() ||
        syncBusinessStateFromLocal() ||
        syncBusinessStateFromToken();

      // Re-check from backend source of truth when local business cookies are missing/stale.
      if (!hasBusiness) {
        try {
          const profileRes = await api.get("/v1/profile/me", {
            headers: { "x-product-key": PRODUCT_KEY },
          });
          const payload = profileRes?.data || {};
          const profileData =
            payload?.data && typeof payload.data === "object" ? payload.data : payload;
          const profileRegistered =
            profileData?.is_business_registered === true ||
            profileData?.isBusinessRegistered === true;

          if (profileRegistered) {
            const currentMobileOwnerKey = getCurrentMobileOwnerKey();
            setCookie("business_registered", "true", { days: 365 });
            setCookie("business_register", "true", { days: 365 });
            setCookie("has_business_for_mobile", "true", { days: 365 });
            if (currentMobileOwnerKey) {
              setCookie("business_owner_mobile", currentMobileOwnerKey, { days: 365 });
            }
            hasBusiness = true;
          }
        } catch {
          // keep local fallback behavior on profile endpoint failures
        }
      }

      setCookie("dashboard_mode", "user", { days: 365 });
      const hasSeenDashboard = String(getCookie(USERDASH_SEEN_COOKIE) || "").trim() === "true";
      setCookie(USERDASH_SEEN_COOKIE, "true", { days: 365 });

      // Show onboarding popup only for first-time users without business.
      const shouldShowPrompt =
        !hasBusiness &&
        !hasSeenDashboard &&
        !hasSkippedBusinessPromptForCurrentMobile();

      if (!active) return;
      setShowBizPrompt(shouldShowPrompt);
      setStateResolved(true);
    };

    initDashboardState();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stateResolved) return;

    // Skip product fetch while user is on first-time chooser (business vs normal user).
    if (showBizPrompt) {
      setLoading(false);
      return;
    }

    if (productsFetchedRef.current) {
      setLoading(false);
      return;
    }

    productsFetchedRef.current = true;

    const fetchProducts = async () => {
      try {
        const res = await api.get("/v1/products", {
          params: { product_key: PRODUCT_KEY },
          headers: { "x-product-key": PRODUCT_KEY },
        });
        const data = res.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.data?.products)
          ? data.data.products
          : [];
        setProducts(list);
      } catch (err) {
        if (err?.response?.status === 401) {
          setRedirecting(true);
          router.replace("/auth/login");
        } else {
          setError(err?.response?.data?.message || "Failed to load products");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [router, showBizPrompt, stateResolved]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const result = await getCurrentUserProfile();
        if (!active) return;
        const fullName = String(
          result?.profile?.fullName || result?.displayName || ""
        ).trim();
        const seanebId = String(result?.profile?.seanebId || "").trim();
        setProfileInfo({
          fullName: fullName || "-",
          seanebId: seanebId || "-",
        });
      } catch {
        if (!active) return;
        const fallbackName = String(getCookie("user_display_name") || "").trim();
        setProfileInfo((prev) => ({
          fullName: fallbackName || prev.fullName || "-",
          seanebId: prev.seanebId || "-",
        }));
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  if (loading || redirecting) {
    return <div className="userdash-loading">Loading dashboard...</div>;
  }

  const handleSkipBusiness = () => {
    const currentMobileOwnerKey = getCurrentMobileOwnerKey();
    setRedirecting(true);
    setCookie("user_skipped_biz", currentMobileOwnerKey || "true", { days: 365 });
    setCookie("show_profile_nav", "true", { days: 365 });
    setCookie("dashboard_mode", "user", { days: 365 });
    if (typeof window !== "undefined") {
      window.location.href = `${webAppUrl}/`;
    }
  };

  const goToHomePage = () => {
    if (typeof window !== "undefined") {
      window.location.href = `${webAppUrl}/`;
    }
  };

  const handleLogout = async () => {
    setRedirecting(true);
    try {
      await clearServerSession();
    } catch {
      // best effort only
    }
    clearSession();
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.clear();
      } catch {
        // ignore storage access failures
      }
      window.location.href = `${webAppUrl}/`;
    }
  };

  return (
    <div className="userdash-page pro-dash-bg">
      <div className="userdash-shell">
        <BackButton className="userdash-back" fallbackPath={`${webAppUrl}/`} />

        <div className="userdash-card pro-dash-card-shadow">
          <div className="userdash-hero pro-dash-hero-gradient">
            <div className="userdash-hero-row">
              <div className="userdash-hero-main">
                <p className="userdash-kicker">Seaneb User Console</p>
                <h1 className="userdash-title">User Dashboard</h1>
                <p className="userdash-subtitle">
                  Manage your account mode and explore available products.
                </p>
              </div>
              <ProfileDropdown
                fullName={profileInfo.fullName}
                seanebId={profileInfo.seanebId}
                onLogout={handleLogout}
              />
            </div>
          </div>

          <div className="userdash-body pro-dash-body-gap">
            {showBizPrompt && (
              <div className="userdash-panel userdash-onboard">
                <div className="userdash-onboard-head">
                  <h2 className="userdash-section-title">Choose Your Next Step</h2>
                  <p className="userdash-muted">
                    Start as a buyer now, or register your business to unlock dealer tools.
                  </p>
                </div>
                <div className="userdash-onboard-grid">
                  <button
                    type="button"
                    className="userdash-onboard-option primary"
                    onClick={() => {
                      setRedirecting(true);
                      router.replace("/auth/business-reg");
                    }}
                  >
                    <span className="userdash-onboard-title">Register Business</span>
                  </button>
                  <button
                    type="button"
                    className="userdash-onboard-option"
                    onClick={handleSkipBusiness}
                  >
                    <span className="userdash-onboard-title">Skip and Go Home</span>
                  </button>
                </div>
              </div>
            )}

            {!showBizPrompt && (
              <div className="userdash-panel">
                <h2 className="userdash-section-title">Quick Actions</h2>
                <p className="userdash-muted">
                  {hasRegisteredBusinessFromCookies()
                    ? "Business found. You can move to dealer dashboard."
                    : "No business registration found. Complete business setup to access dealer dashboard."}
                </p>
                <div className="userdash-prompt-actions">
                  <button
                    className="userdash-secondary-btn"
                    onClick={goToHomePage}
                  >
                    Go to Home Page
                  </button>
                  <button
                    className="userdash-primary-btn"
                    onClick={async () => {
                      const target = await resolveDealerTarget();
                      setRedirecting(true);
                      router.replace(target);
                    }}
                  >
                    {hasRegisteredBusinessFromCookies()
                      ? "Move to Dealer Dashboard"
                      : "Register Your Business"}
                  </button>
                </div>
              </div>
            )}

            {!showBizPrompt && (
              <div className="userdash-panel">
                <div className="userdash-products-head">
                  <h2 className="userdash-section-title">Products</h2>
                  <span className="userdash-products-count">{products.length} Available</span>
                </div>

                {error && <p className="userdash-error">{error}</p>}

                {products.length > 0 ? (
                  <div className="userdash-products-grid">
                    {products.map((product) => (
                      <div key={product.product_id} className="userdash-product-card">
                        <h3 className="userdash-product-name">{product.product_name}</h3>
                        <p className="userdash-product-key">Key: {product.product_key}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  !error && <p className="userdash-muted">No products found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
