"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { clearServerSession, clearSession } from "@/app/services/api";
import BackButton from "@/app/component/BackButton";
import ProfileDropdown from "@/app/component/ProfileDropdown";
import { getCookie, getJsonCookie, setCookie, setJsonCookie } from "@/app/services/cookieStore";
import { getCurrentUserProfile } from "@/app/services/user.services";

const getSessionValue = (key) => String(getCookie(key) || "").trim();

const isTruthyCookie = (key) => {
  const raw = String(getCookie(key) || "").trim().toLowerCase();
  const normalized = raw.replace(/^"+|"+$/g, "");
  return ["true", "1", "yes", "y"].includes(normalized);
};

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

export default function DealerDashboardPage() {
  const router = useRouter();
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [profileInfo, setProfileInfo] = useState({ fullName: "-", seanebId: "-" });

  const accessToken = isClient
    ? getSessionValue("access_token_auto") || getSessionValue("access_token")
    : "";
  const cookieBusinessName = isClient ? getSessionValue("business_name") : "";
  const cookieBranchId = isClient ? getSessionValue("branch_id") : "";
  const cookieBusinessId = isClient ? getSessionValue("business_id") : "";

  const tokenBusinessIdentity = useMemo(
    () => extractBusinessIdentityFromClaims(parseJwtPayload(accessToken)),
    [accessToken]
  );

  const currentMobileOwnerKey = useMemo(() => {
    if (!isClient) return "";
    const verified = getJsonCookie("verified_mobile");
    const fromVerified = getBusinessOwnerMobileKey(
      verified?.country_code,
      verified?.mobile_number
    );
    if (fromVerified) return fromVerified;
    return extractOwnerMobileKeyFromClaims(parseJwtPayload(accessToken));
  }, [accessToken, isClient]);

  const ownerMatches = useMemo(() => {
    if (!isClient) return false;
    const existingOwnerKey = String(getCookie("business_owner_mobile") || "").trim();
    const normalizedCurrent = normalizeOwnerMobileKey(currentMobileOwnerKey);
    const normalizedExisting = normalizeOwnerMobileKey(existingOwnerKey);
    if (!normalizedCurrent) return false;
    if (!normalizedExisting) return true;
    return normalizedExisting === normalizedCurrent;
  }, [currentMobileOwnerKey, isClient]);

  const hasBusinessForMobile = useMemo(() => {
    if (!isClient || !ownerMatches) return false;
    return String(getCookie("has_business_for_mobile") || "").trim().toLowerCase() === "true";
  }, [isClient, ownerMatches]);

  const hasBusinessFromCookies = useMemo(() => {
    if (!isClient || !ownerMatches) return false;
    const registered =
      String(getCookie("business_registered") || "").trim().toLowerCase() === "true" ||
      String(getCookie("business_register") || "").trim().toLowerCase() === "true";
    return (
      registered ||
      Boolean(cookieBusinessId) ||
      Boolean(cookieBranchId) ||
      Boolean(cookieBusinessName)
    );
  }, [cookieBranchId, cookieBusinessId, cookieBusinessName, isClient, ownerMatches]);

  const hasLocalBusinessProfile = useMemo(() => {
    try {
      const verified = getJsonCookie("verified_mobile");
      if (!verified?.country_code || !verified?.mobile_number) return false;

      const key = getBusinessProfileStorageKey(
        verified.country_code,
        verified.mobile_number
      );
      if (!key) return false;

      const profile = getStoredBusinessProfile(key);
      return Boolean(profile?.registered);
    } catch {
      return false;
    }
  }, []);

  const isRegisteredBusinessUser = useMemo(() => {
    return (
      hasBusinessFromCookies ||
      hasBusinessForMobile ||
      tokenBusinessIdentity.registered ||
      hasLocalBusinessProfile
    );
  }, [hasBusinessForMobile, hasBusinessFromCookies, hasLocalBusinessProfile, tokenBusinessIdentity.registered]);

  useEffect(() => {
    if (isClient && !accessToken) {
      router.replace("/auth/login");
    }
  }, [accessToken, isClient, router]);

  useEffect(() => {
    if (!isClient || !accessToken) return;

    if (isRegisteredBusinessUser) {
      const verified = getJsonCookie("verified_mobile");
      const key = getBusinessProfileStorageKey(
        verified?.country_code,
        verified?.mobile_number
      );
      if (hasLocalBusinessProfile) {
        const profile = key ? getStoredBusinessProfile(key) : null;
        const mobileOwnerKey = getBusinessOwnerMobileKey(
          verified?.country_code,
          verified?.mobile_number
        );
        setCookie("business_registered", "true", { days: 365 });
        setCookie("business_register", "true", { days: 365 });
        setCookie("has_business_for_mobile", "true", { days: 365 });
        if (profile?.business_id) {
          setCookie("business_id", String(profile.business_id), { days: 365 });
        }
        if (profile?.branch_id) {
          setCookie("branch_id", String(profile.branch_id), { days: 365 });
        }
        if (profile?.business_name) {
          setCookie("business_name", String(profile.business_name), { days: 365 });
        }
        if (mobileOwnerKey && mobileOwnerKey !== "-") {
          setCookie("business_owner_mobile", mobileOwnerKey, { days: 365 });
        }
        persistBusinessProfile(key, {
          registered: true,
          business_id: String(profile?.business_id || "").trim(),
          branch_id: String(profile?.branch_id || "").trim(),
          business_name: String(profile?.business_name || "").trim(),
        });
      }
      setCookie("dashboard_mode", "dealer", { days: 365 });
      if (tokenBusinessIdentity.businessId) {
        setCookie("business_id", tokenBusinessIdentity.businessId, { days: 365 });
      }
      if (tokenBusinessIdentity.branchId) {
        setCookie("branch_id", tokenBusinessIdentity.branchId, { days: 365 });
      }
      if (tokenBusinessIdentity.businessName) {
        setCookie("business_name", tokenBusinessIdentity.businessName, { days: 365 });
      }
      if (tokenBusinessIdentity.registered) {
        setCookie("business_registered", "true", { days: 365 });
        setCookie("business_register", "true", { days: 365 });
        setCookie("has_business_for_mobile", "true", { days: 365 });
        persistBusinessProfile(key, {
          registered: true,
          business_id:
            tokenBusinessIdentity.businessId || String(getCookie("business_id") || "").trim(),
          branch_id:
            tokenBusinessIdentity.branchId || String(getCookie("branch_id") || "").trim(),
          business_name:
            tokenBusinessIdentity.businessName || String(getCookie("business_name") || "").trim(),
        });
      }
      return;
    }

    router.replace("/auth/business-reg");
  }, [
    accessToken,
    hasLocalBusinessProfile,
    isClient,
    isRegisteredBusinessUser,
    router,
    tokenBusinessIdentity,
  ]);

  useEffect(() => {
    if (!isClient || !accessToken) return;
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
  }, [accessToken, isClient]);

  const dashboardBusinessName = cookieBusinessName || "Your Business";
  const dashboardBranchId = cookieBranchId || "Pending";

  const handleLogout = async () => {
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

  if (!isClient || !accessToken || !isRegisteredBusinessUser) {
    return <div className="dealer-loading">Loading dealer dashboard...</div>;
  }

  return (
    <div className="dealer-page">
      <div className="dealer-shell">
        <BackButton className="dealer-back" fallbackPath="/auth/userdash" />

        <div className="dealer-card">
          <div className="dealer-hero">
            <div className="dealer-hero-row">
              <div className="userdash-hero-main">
                <p className="dealer-kicker">Seaneb Dealer Console</p>
                <h1 className="dealer-title">Dealer Dashboard</h1>
                <p className="dealer-subtitle">
                  Manage your business profile and dealer operations from one place.
                </p>
              </div>
              <ProfileDropdown
                fullName={profileInfo.fullName}
                seanebId={profileInfo.seanebId}
                onLogout={handleLogout}
              />
            </div>
          </div>

          <div className="dealer-body">
            <div className="dealer-metrics">
              <div className="dealer-metric dealer-metric--wide">
                <p className="dealer-metric-label">Business Name</p>
                <p className="dealer-metric-value">{dashboardBusinessName}</p>
              </div>

              <div className="dealer-metric">
                <p className="dealer-metric-label">Branch ID</p>
                <p className="dealer-metric-value">{dashboardBranchId}</p>
              </div>

              <div className="dealer-metric">
                <p className="dealer-metric-label">Account Mode</p>
                <p className="dealer-metric-value">Dealer</p>
              </div>
            </div>

            <div className="dealer-panels">
              <div className="dealer-panel dealer-panel--actions">
                <h2 className="dealer-panel-title">Quick Actions</h2>
                <div className="dealer-actions">
                  <button
                    type="button"
                    className="dealer-action dealer-action--primary"
                    onClick={() => router.push("/auth/business-reg")}
                  >
                    <span className="dealer-action-title">Edit Business Profile</span>
                  </button>

                  <button
                    type="button"
                    className="dealer-action dealer-action--ghost"
                    onClick={() => {
                      setCookie("dashboard_mode", "user", { days: 365 });
                      router.push("/auth/userdash");
                    }}
                  >
                    <span className="dealer-action-title">Switch to User Dashboard</span>
                  </button>

                  <button
                    type="button"
                    className="dealer-action dealer-action--ghost"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.location.href = `${webAppUrl}/`;
                      }
                    }}
                  >
                    <span className="dealer-action-title">Go to Home Page</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
