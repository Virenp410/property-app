"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import AuthLayout from "@/app/component/AuthLayout";
import AutoComplete from "@/app/component/AutoComplete";
import PrimaryButton from "@/app/component/PrimaryButton";
import useTranslation from "@/app/hook/useTranslation";
import useDebounce from "@/app/hook/useDebaunce";
import { sendEmailOtp, sendOtp, verifyEmailOtp } from "@/app/services/otp.services";
import {
  createBusiness,
  ensureDefaultProductAuto,
  getBusinessAutocomplete,
  verifyPanForBranch as verifyPan,
  verifyGstForBranch as verifyGstin,
} from "@/app/services/business.services";
import { checkSeanebId } from "@/app/services/auth.services";
import { getCategories } from "@/app/services/category.services";
import { getCurrentUserProfile } from "@/app/services/user.services";
import {
  getCookie,
  setCookie,
  removeCookie,
  getJsonCookie,
  setJsonCookie,
} from "@/app/services/cookieStore";

const EMPTY_FORM = {
  business_name: "",
  display_name: "",
  business_type: "",
  seaneb_id: "",
  primary_number: "",
  whatsapp_number: "",
  business_email: "",
  about_branch: "",
  address: "",
  landmark: "",
  place: { label: "", place_id: null },
  pan_number: "",
  gstin: "",
  main_category_id: "",
  agree: false,
};

const AUTO_BUSINESS_TYPE_OPTIONS = [
  { value: "0", label: "Individual Car Dealer" },
  { value: "1", label: "Dealership Showroom" },
  { value: "2", label: "Used Car Broker" },
  { value: "3", label: "Multi-Brand Auto Hub" },
];

const AUTO_MAIN_CATEGORY_FALLBACK = [
  { id: "auto_used_cars", name: "Used Cars" },
  { id: "auto_new_cars", name: "New Cars" },
  { id: "auto_suv", name: "SUV & MUV" },
  { id: "auto_hatchback", name: "Hatchback Cars" },
  { id: "auto_sedan", name: "Sedan Cars" },
  { id: "auto_luxury", name: "Luxury Cars" },
  { id: "auto_electric", name: "Electric Vehicles" },
  { id: "auto_commercial", name: "Commercial Vehicles" },
  { id: "auto_parts", name: "Auto Parts & Accessories" },
  { id: "auto_service", name: "Service & Maintenance" },
];

const MIN_BUSINESS_AUTOCOMPLETE_CHARS = 3;
const normalizeBusinessLabel = (value) =>
  String(value || "")
    .split(",")[0]
    .trim()
    .slice(0, 30);
const getErrorMessage = (err, fallback) =>
  err?.response?.data?.error?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;
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

export default function BusinessRegistrationPage() {
  const router = useRouter();
  const [lang, setLang] = useState("en");
  const t = useTranslation(lang);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [businessSuggestions, setBusinessSuggestions] = useState([]);
  const [showBusinessSuggestions, setShowBusinessSuggestions] = useState(false);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessSuggestionError, setBusinessSuggestionError] = useState("");
  const [businessFetchedOnce, setBusinessFetchedOnce] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [verifyingPan, setVerifyingPan] = useState(false);
  const [verifyingGst, setVerifyingGst] = useState(false);
  const [checkingSeanebId, setCheckingSeanebId] = useState(false);
  const [seanebVerified, setSeanebVerified] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [businessCheckDone, setBusinessCheckDone] = useState(false);
  const [forceNewBusinessFlow, setForceNewBusinessFlow] = useState(null);
  const submitLockRef = useRef(false);
  const businessAutocompleteRef = useRef(null);
  const debouncedBusinessName = useDebounce(form.business_name, 350);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = new URLSearchParams(window.location.search || "");
    setForceNewBusinessFlow(String(query.get("new_business") || "").trim() === "1");
  }, []);

  useEffect(() => {
    if (forceNewBusinessFlow !== true) return;
    removeCookie("business_reg_draft");
    setSeanebVerified(false);
    setForm((prev) => ({
      ...prev,
      business_name: "",
      display_name: "",
      seaneb_id: "",
    }));
  }, [forceNewBusinessFlow]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10,15}$/;
  const seanebRegex = /^[a-z0-9-]{6,30}$/;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  const normalizedBusinessEmail = form.business_email.trim();
  const hasBusinessEmail = normalizedBusinessEmail.length > 0;
  const isBusinessEmailFormatValid = emailRegex.test(normalizedBusinessEmail);
  const isEmailRequirementSatisfied =
    !hasBusinessEmail || (isBusinessEmailFormatValid && emailVerified);
  const isValidPrimaryNumber = phoneRegex.test(form.primary_number.trim());
  const isValidSeaneb = seanebRegex.test(form.seaneb_id.trim());
  const isValidWhatsapp =
    !form.whatsapp_number.trim() || phoneRegex.test(form.whatsapp_number.trim());
  const hasBranchSummary = form.about_branch.trim().length >= 20;
  const hasPan = form.pan_number.trim().length > 0;
  const hasGstin = form.gstin.trim().length > 0;
  const isPanFormatValid = !hasPan || panRegex.test(form.pan_number.trim());
  const isGstinFormatValid = !hasGstin || gstRegex.test(form.gstin.trim());
  const isPanReady = form.seaneb_id.trim() && panRegex.test(form.pan_number.trim());
  const isGstinReady = form.seaneb_id.trim() && gstRegex.test(form.gstin.trim());

  const requiredChecks = [
    form.business_name.trim(),
    form.display_name.trim(),
    form.business_type !== "",
    form.seaneb_id.trim(),
    isValidPrimaryNumber,
    mobileVerified,
    isEmailRequirementSatisfied,
    form.address.trim(),
    form.place.place_id,
    form.main_category_id,
    form.agree,
  ];

  const completionPercent = Math.round(
    (requiredChecks.filter(Boolean).length / requiredChecks.length) * 100
  );

  const isFormComplete =
    form.business_name.trim() &&
    form.display_name.trim() &&
    form.business_type !== "" &&
    form.seaneb_id.trim() &&
    seanebVerified &&
    isValidPrimaryNumber &&
    mobileVerified &&
    isValidWhatsapp &&
    isEmailRequirementSatisfied &&
    hasBranchSummary &&
    form.address.trim() &&
    form.place.place_id &&
    form.main_category_id &&
    isPanFormatValid &&
    isGstinFormatValid &&
    form.agree;

  const handleChange = (key, value) => {
    if (key === "business_email") {
      setEmailVerified(false);
      setEmailOtpSent(false);
      setEmailOtp("");
      removeCookie("business_email_verified");
      removeCookie("verified_business_email");
    }

    if (key === "pan_number") {
      setPanVerified(false);
    }

    if (key === "gstin") {
      setGstVerified(false);
    }

    if (key === "primary_number") {
      setMobileVerified(false);
      if (typeof window !== "undefined") {
        removeCookie("business_mobile_verified");
      }
    }

    if (key === "seaneb_id") {
      setSeanebVerified(false);
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const parsed = getJsonCookie("business_reg_draft");
      if (!parsed || typeof parsed !== "object") return;
      setForm((prev) => ({
        ...prev,
        ...parsed,
        place:
          parsed?.place && typeof parsed.place === "object"
            ? parsed.place
            : prev.place,
      }));
    } catch {
      // ignore malformed draft
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mobile = String(form.primary_number || "").trim();
    if (!mobile) {
      setMobileVerified(false);
      return;
    }

    try {
      const verified = getJsonCookie("verified_mobile");
      const verifiedNumber = String(verified?.mobile_number || "").trim();
      const verifiedPurpose = Number(verified?.purpose ?? 0);
      const businessMobileVerified =
        getCookie("business_mobile_verified") === "true";
      setMobileVerified(
        Boolean(
          verifiedNumber &&
            verifiedNumber === mobile &&
            verifiedPurpose === 2 &&
            businessMobileVerified
        )
      );
    } catch {
      setMobileVerified(false);
    }
  }, [form.primary_number]);

  useEffect(() => {
    const normalizedName = normalizeBusinessLabel(form.business_name);
    if (!normalizedName) return;
    setForm((prev) => {
      if (prev.display_name.trim()) return prev;
      return { ...prev, display_name: normalizedName };
    });
  }, [form.business_name]);

  const handlePlaceChange = (value) => {
    if (typeof value === "string") {
      setForm((prev) => ({
        ...prev,
        place: { label: value, place_id: null },
      }));
      return;
    }
    setForm((prev) => ({ ...prev, place: value }));
  };

  useEffect(() => {
    let active = true;

    const checkExistingBusiness = async () => {
      try {
        if (!active) return;
        if (forceNewBusinessFlow === null) return;
        if (forceNewBusinessFlow) return;

        const verified = getJsonCookie("verified_mobile");
        const fromVerified = getBusinessOwnerMobileKey(
          verified?.country_code,
          verified?.mobile_number
        );
        const accessToken = String(
          getCookie("access_token_auto") || getCookie("access_token") || ""
        ).trim();
        const claims = parseJwtPayload(accessToken);
        const currentMobileOwnerKey =
          fromVerified || extractOwnerMobileKeyFromClaims(claims);
        const existingOwnerKey = String(getCookie("business_owner_mobile") || "").trim();
        const normalizedCurrent = normalizeOwnerMobileKey(currentMobileOwnerKey);
        const normalizedExisting = normalizeOwnerMobileKey(existingOwnerKey);
        const ownerMatches =
          Boolean(normalizedCurrent) &&
          (!normalizedExisting || normalizedExisting === normalizedCurrent);

        let profile = null;
        try {
          const profileResponse = await getCurrentUserProfile();
          profile = profileResponse?.profile || null;
        } catch (profileErr) {
          if (Number(profileErr?.response?.status || 0) === 401) {
            setSessionExpired(true);
            return;
          }
        }

        if (profile) {
          if (profile.isBusinessRegistered) {
            setCookie("business_registered", "true", { days: 365 });
            setCookie("business_register", "true", { days: 365 });
            setCookie("has_business_for_mobile", "true", { days: 365 });
            setCookie("dashboard_mode", "dealer", { days: 365 });
            if (currentMobileOwnerKey) {
              setCookie("business_owner_mobile", currentMobileOwnerKey, { days: 365 });
            }
            router.replace("/auth/dealerdash");
            return;
          }
        }

        const isBusinessRegistered =
          getCookie("business_register") === "true" ||
          getCookie("business_registered") === "true";
        const hasBusinessName = Boolean(String(getCookie("business_name") || "").trim());
        const hasBusinessId = Boolean(String(getCookie("business_id") || "").trim());
        const hasBranchId = Boolean(String(getCookie("branch_id") || "").trim());
        const hasBusinessForMobile =
          String(getCookie("has_business_for_mobile") || "").trim().toLowerCase() ===
          "true";

        const tokenBusiness = extractBusinessIdentityFromClaims(
          claims
        );

        if (
          ownerMatches &&
          (isBusinessRegistered ||
            hasBusinessName ||
            hasBusinessId ||
            hasBranchId ||
            hasBusinessForMobile)
        ) {
          setCookie("business_registered", "true", { days: 365 });
          setCookie("business_register", "true", { days: 365 });
          setCookie("has_business_for_mobile", "true", { days: 365 });
          setCookie("dashboard_mode", "dealer", { days: 365 });
          if (currentMobileOwnerKey) {
            setCookie("business_owner_mobile", currentMobileOwnerKey, { days: 365 });
          }
          router.replace("/auth/dealerdash");
          return;
        }

        if (tokenBusiness.registered) {
          setCookie("business_registered", "true", { days: 365 });
          setCookie("business_register", "true", { days: 365 });
          setCookie("has_business_for_mobile", "true", { days: 365 });
          setCookie("dashboard_mode", "dealer", { days: 365 });
          if (tokenBusiness.businessId) {
            setCookie("business_id", tokenBusiness.businessId, { days: 365 });
          }
          if (tokenBusiness.branchId) {
            setCookie("branch_id", tokenBusiness.branchId, { days: 365 });
          }
          if (tokenBusiness.businessName) {
            setCookie("business_name", tokenBusiness.businessName, { days: 365 });
          }
          if (currentMobileOwnerKey) {
            setCookie("business_owner_mobile", currentMobileOwnerKey, { days: 365 });
          }
          router.replace("/auth/dealerdash");
          return;
        }

        const key = getBusinessProfileStorageKey(
          verified?.country_code,
          verified?.mobile_number
        );

        if (key) {
          const profile = getStoredBusinessProfile(key);
          if (profile?.registered) {
            setCookie("business_registered", "true", { days: 365 });
            setCookie("business_register", "true", { days: 365 });
            setCookie("has_business_for_mobile", "true", { days: 365 });
            setCookie("dashboard_mode", "dealer", { days: 365 });
            if (profile.business_id) {
              setCookie("business_id", String(profile.business_id), { days: 365 });
            }
            if (profile.branch_id) {
              setCookie("branch_id", String(profile.branch_id), { days: 365 });
            }
            if (profile.business_name) {
              setCookie("business_name", String(profile.business_name), { days: 365 });
            }
            if (currentMobileOwnerKey) {
              setCookie("business_owner_mobile", currentMobileOwnerKey, { days: 365 });
            }
            router.replace("/auth/dealerdash");
            return;
          }
        }
      } catch (err) {
        if (Number(err?.response?.status || 0) === 401) {
          setSessionExpired(true);
          return;
        }
      } finally {
        if (active) setBusinessCheckDone(true);
      }
    };

    checkExistingBusiness();
    return () => {
      active = false;
    };
  }, [router, forceNewBusinessFlow]);

  useEffect(() => {
    let active = true;
    const ensureDefaultProduct = async () => {
      try {
        await ensureDefaultProductAuto();
      } catch {
        // Silent by design: we keep default "auto" in payload and avoid noisy UI errors.
      } finally {
        if (!active) return;
      }
    };

    ensureDefaultProduct();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (sessionExpired) {
      setBusinessSuggestions([]);
      setBusinessSuggestionError("Session expired. Please login again.");
      return;
    }

    if (
      !debouncedBusinessName ||
      debouncedBusinessName.trim().length < MIN_BUSINESS_AUTOCOMPLETE_CHARS
    ) {
      setBusinessSuggestions([]);
      setBusinessSuggestionError("");
      setBusinessFetchedOnce(false);
      return;
    }

    const fetchBusinessSuggestions = async () => {
      try {
        setBusinessLoading(true);
        setBusinessSuggestionError("");
        const data = await getBusinessAutocomplete(debouncedBusinessName.trim());
        const suggestions = Array.isArray(data)
          ? data
          : Array.isArray(data?.businesses)
          ? data.businesses
          : Array.isArray(data?.data?.businesses)
          ? data.data.businesses
          : Array.isArray(data?.result?.businesses)
          ? data.result.businesses
          : [];
        setBusinessSuggestions(suggestions);
        setBusinessFetchedOnce(true);
      } catch (err) {
        const message = String(err?.message || "").toLowerCase();
        if (message.includes("session expired") || message.includes("login again")) {
          setSessionExpired(true);
          setBusinessSuggestions([]);
          setBusinessSuggestionError("Session expired. Please login again.");
          return;
        }
        setBusinessSuggestions([]);
        setBusinessSuggestionError(t.suggestionFetchFailed);
        setBusinessFetchedOnce(true);
      } finally {
        setBusinessLoading(false);
      }
    };

    fetchBusinessSuggestions();
  }, [debouncedBusinessName, t, sessionExpired]);

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (
        businessAutocompleteRef.current &&
        !businessAutocompleteRef.current.contains(event.target)
      ) {
        setShowBusinessSuggestions(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await getCategories();
        const categoryList = Array.isArray(data?.categories)
          ? data.categories
          : Array.isArray(data?.data?.categories)
          ? data.data.categories
          : Array.isArray(data?.result?.categories)
          ? data.result.categories
          : [];
        setCategories(categoryList);
      } catch (err) {
        if (Number(err?.response?.status || 0) === 401) {
          setSessionExpired(true);
        }
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!sessionExpired) return;
    setErrorMessage("Session expired. Please login again.");
    const timer = setTimeout(() => {
      router.replace("/auth/login");
    }, 900);
    return () => clearTimeout(timer);
  }, [sessionExpired, router]);

  const requestBusinessEmailOtp = async () => {
    if (!hasBusinessEmail || !isBusinessEmailFormatValid || sendingEmailOtp || emailVerified) return;

    try {
      setSendingEmailOtp(true);
      await sendEmailOtp({ email: normalizedBusinessEmail, purpose: 3 });
      setEmailOtpSent(true);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || t.emailOtpSendFailed);
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyBusinessEmailOtp = async () => {
    if (!hasBusinessEmail || !isBusinessEmailFormatValid || !emailOtp || emailOtp.length < 4 || verifyingEmailOtp) return;

    try {
      setVerifyingEmailOtp(true);
      await verifyEmailOtp({
        email: normalizedBusinessEmail,
        otp: emailOtp.trim(),
        purpose: 3,
      });
      setEmailVerified(true);
      setCookie("business_email_verified", "true");
      setCookie("verified_business_email", normalizedBusinessEmail);
      setErrorMessage("");
    } catch (err) {
      setEmailVerified(false);
      removeCookie("business_email_verified");
      removeCookie("verified_business_email");
      setErrorMessage(err?.response?.data?.message || t.emailOtpVerifyFailed);
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const handleSendBusinessMobileOtp = async () => {
    if (!isValidPrimaryNumber || sendingMobileOtp || mobileVerified) return;

    const mobile = form.primary_number.trim();
    let countryCode = "";

    try {
      const verifiedMobile =
        typeof window !== "undefined" ? getJsonCookie("verified_mobile") : null;
      countryCode = String(verifiedMobile?.country_code || "").trim();
    } catch {
      countryCode = "";
    }

    if (!countryCode && typeof window !== "undefined") {
      try {
        const otpContext = getJsonCookie("otp_context");
        countryCode = String(otpContext?.country_code || "").trim();
      } catch {
        countryCode = "";
      }
    }

    if (!countryCode) {
      setErrorMessage("Country code missing. Please login again.");
      return;
    }

    const otpContext = {
      type: "mobile",
      identifier_type: 0,
      country_code: countryCode.replace("+", ""),
      mobile_number: mobile,
      purpose: 2,
      via: "whatsapp",
      product_key: "auto",
      redirect_to: "/auth/business-reg",
    };

    try {
      setSendingMobileOtp(true);
      setErrorMessage("");
      setJsonCookie("business_reg_draft", form);
      removeCookie("business_mobile_verified");
      setJsonCookie("otp_context", otpContext);
      await sendOtp(otpContext);
      router.push(`/auth/otp?lang=${lang}`);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Failed to send mobile OTP"));
    } finally {
      setSendingMobileOtp(false);
    }
  };

  const handleVerifyPan = async () => {
    if (!isPanReady || verifyingPan) return;
    if (!branchId) {
      setErrorMessage("PAN verification will be available after business creation.");
      return;
    }

    try {
      setVerifyingPan(true);
      await verifyPan({
        pan: form.pan_number.trim(),
        branch_id: branchId,
      });
      setPanVerified(true);
      setErrorMessage("");
    } catch (err) {
      setPanVerified(false);
      setErrorMessage(err?.response?.data?.message || t.panVerifyFailed);
    } finally {
      setVerifyingPan(false);
    }
  };

  const handleVerifyGst = async () => {
    if (!isGstinReady || verifyingGst) return;
    if (!branchId) {
      setErrorMessage("GSTIN verification will be available after business creation.");
      return;
    }

    try {
      setVerifyingGst(true);
      await verifyGstin({
        gstin: form.gstin.trim(),
        branch_id: branchId,
      });
      setGstVerified(true);
      setErrorMessage("");
    } catch (err) {
      setGstVerified(false);
      setErrorMessage(err?.response?.data?.message || t.gstinVerifyFailed);
    } finally {
      setVerifyingGst(false);
    }
  };

  const handleVerifySeanebId = async () => {
    if (!isValidSeaneb || checkingSeanebId) return;

    try {
      setCheckingSeanebId(true);
      await checkSeanebId(form.seaneb_id.trim().toLowerCase());
      setSeanebVerified(true);
      setErrorMessage("");
    } catch (err) {
      setSeanebVerified(false);
      const status = Number(err?.response?.status || 0);
      if (status === 409) {
        setErrorMessage("SeaNeB ID already exists.");
      } else if (status === 400) {
        setErrorMessage("Invalid SeaNeB ID format.");
      } else {
        setErrorMessage("Unable to verify SeaNeB ID.");
      }
    } finally {
      setCheckingSeanebId(false);
    }
  };

  const handleSubmit = async () => {
    if (!isFormComplete || loading || submitLockRef.current) return;
    submitLockRef.current = true;

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const normalizedBusinessName = normalizeBusinessLabel(form.business_name);
    const normalizedDisplayName = normalizeBusinessLabel(
      form.display_name || form.business_name
    );

    const payload = {
      business_name: normalizedBusinessName,
      display_name: normalizedDisplayName,
      business_type: Number(form.business_type),
      seaneb_id: form.seaneb_id.trim(),
      primary_number: form.primary_number.trim(),
      whatsapp_number:
        form.whatsapp_number.trim() || form.primary_number.trim(),
      about_branch: form.about_branch.trim(),
      address: form.address.trim(),
      landmark: form.landmark.trim(),
      place_id: form.place.place_id,
      main_category_id: form.main_category_id,
    };

    if (hasBusinessEmail) {
      payload.business_email = normalizedBusinessEmail;
    }

    if (form.pan_number.trim()) {
      payload.pan = { pan_number: form.pan_number.trim() };
    }

    if (form.gstin.trim()) {
      payload.gst = { gstin: form.gstin.trim() };
    }

    try {
      const response = await createBusiness(payload);
      const data = response?.data || {};
      const branch = String(data?.branch_id || data?.default_branch_id || "");
      const businessId = String(data?.business_id || data?.id || "");
      const registeredName = normalizedBusinessName || form.business_name.trim();
      if (branch) setBranchId(branch);

      setSuccessMessage(t.businessRegisterSuccess);
      removeCookie("business_reg_draft");
      // Set all business cookies for robust detection (matches working app)
      setCookie("business_registered", "true", { days: 365 });
      setCookie("business_register", "true", { days: 365 });
      setCookie("has_business_for_mobile", "true", { days: 365 });
      setCookie("dashboard_mode", "dealer", { days: 365 });
      setCookie("profile_completed", "true", { days: 365 });
      if (businessId) setCookie("business_id", businessId, { days: 365 });
      if (branch) setCookie("branch_id", branch, { days: 365 });
      if (registeredName) setCookie("business_name", registeredName, { days: 365 });
      const verifiedMobile = getJsonCookie("verified_mobile");
      const mobileOwnerKey = getBusinessOwnerMobileKey(
        verifiedMobile?.country_code,
        verifiedMobile?.mobile_number
      );
      if (mobileOwnerKey && mobileOwnerKey !== "-") {
        setCookie("business_owner_mobile", mobileOwnerKey, { days: 365 });
      }
      if (emailVerified) {
        setCookie("business_email_verified", "true", { days: 365 });
        setCookie("verified_business_email", normalizedBusinessEmail, { days: 365 });
      }

      try {
        const verified = getJsonCookie("verified_mobile");
        const storageKey = getBusinessProfileStorageKey(
          verified?.country_code,
          verified?.mobile_number
        );
        if (storageKey) {
          persistBusinessProfile(storageKey, {
            registered: true,
            business_id: businessId || "",
            branch_id: branch || "",
            business_name: registeredName || "",
          });
        }
      } catch {
        // ignore local storage errors
      }

      router.replace("/auth/dealerdash");
    } catch (err) {
      setErrorMessage(getErrorMessage(err, t.businessRegisterError));
    } finally {
      setLoading(false);
      submitLockRef.current = false;
    }
  };

  if (!businessCheckDone) return null;

  return (
    <AuthLayout
      lang={lang}
      onLangChange={setLang}
      variant="reg"
      showBack={true}
      backFallback="/auth/userdash"
    >
      <div className="bizreg-form bizreg-form-pro">
        <div className="business-register-top">
          <div className="business-register-header">
            <h2 className="reg-title">{t.businessRegTitle}</h2>
            <p className="reg-subtitle">{t.businessRegSubtitle}</p>
          </div>

          <div className="business-register-progress">
            <div className="business-register-progress-meta">
              <span>Form completion</span>
              <strong>{completionPercent}%</strong>
            </div>
            <div className="business-register-progress-track">
              <span style={{ width: `${completionPercent}%` }} />
            </div>
          </div>

          <div className="business-status-grid">
            <div className={`business-status-pill ${mobileVerified ? "verified" : ""}`}>
              <span>Mobile</span>
              <strong>{mobileVerified ? "Verified" : "Pending"}</strong>
            </div>
            <div className={`business-status-pill ${emailVerified ? "verified" : ""}`}>
              <span>Email</span>
              <strong>{emailVerified ? "Verified" : "Pending"}</strong>
            </div>
            <div className={`business-status-pill ${form.place.place_id ? "verified" : ""}`}>
              <span>Location</span>
              <strong>{form.place.place_id ? "Selected" : "Pending"}</strong>
            </div>
            <div className={`business-status-pill ${branchId ? "verified" : ""}`}>
              <span>Branch</span>
              <strong>{branchId ? "Created" : "New"}</strong>
            </div>
          </div>
        </div>

        {errorMessage && (
          <p className="field-helper error" style={{ marginBottom: 12 }}>
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="field-helper" style={{ marginBottom: 12, color: "#16a34a" }}>
            {successMessage}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="business-form business-form--pro"
        >
          <section className="business-section-card">
            <div className="business-section-head">
              <h3>{t.businessInfoSection}</h3>
              <p>Core identity details visible to your customers.</p>
            </div>

            <div className="business-grid business-grid--2">
              <Field label={t.businessName}>
                <div className="autocomplete" ref={businessAutocompleteRef}>
                  <input
                    className="reg-input"
                    value={form.business_name}
                    onChange={(e) => {
                      handleChange("business_name", e.target.value);
                      setShowBusinessSuggestions(true);
                    }}
                    onFocus={() => setShowBusinessSuggestions(true)}
                    placeholder={t.businessNamePlaceholder}
                    autoComplete="organization"
                  />

                  {showBusinessSuggestions && (
                    <div className="suggestion-box">
                      {businessLoading && (
                        <div className="suggestion-item">{t.loadingSuggestions}</div>
                      )}

                      {!businessLoading && businessSuggestionError && (
                        <div className="suggestion-item">{businessSuggestionError}</div>
                      )}

                      {!businessLoading &&
                        !businessSuggestionError &&
                        businessFetchedOnce &&
                        businessSuggestions.length === 0 &&
                        form.business_name.trim().length >= MIN_BUSINESS_AUTOCOMPLETE_CHARS && (
                          <div className="suggestion-item">{t.noBusinessSuggestions}</div>
                        )}

                      {!businessLoading &&
                        businessSuggestions.map((business, idx) => {
                          const businessLabel =
                            business.description ||
                            business.business_name ||
                            business.name ||
                            "";

                          return (
                            <div
                              key={`${business.place_id || "biz"}-${idx}`}
                              className="suggestion-item"
                              onMouseDown={() => {
                                handleChange("business_name", businessLabel);
                                if (!form.display_name.trim()) {
                                  handleChange("display_name", normalizeBusinessLabel(businessLabel));
                                }
                                setShowBusinessSuggestions(false);
                              }}
                            >
                              {businessLabel}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </Field>

              <Field label={t.displayName}>
                <input
                  className="reg-input"
                  value={form.display_name}
                  onChange={(e) => handleChange("display_name", e.target.value)}
                  placeholder={t.displayNamePlaceholder}
                />
              </Field>

              <Field label="Business Type *">
                <select
                  className="reg-input"
                  value={form.business_type}
                  onChange={(e) => handleChange("business_type", e.target.value)}
                >
                  <option value="">Select business type</option>
                  {AUTO_BUSINESS_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Main Category *">
                <select
                  className="reg-input"
                  value={form.main_category_id}
                  disabled={categoriesLoading}
                  onChange={(e) => handleChange("main_category_id", e.target.value)}
                >
                  <option value="">
                    {categoriesLoading ? "Loading categories..." : "Select a category"}
                  </option>
                  {(categories.length ? categories : AUTO_MAIN_CATEGORY_FALLBACK).map(
                    (category) => {
                    const catId = category.main_category_id || category.id || "";
                    const catName = category.main_category_name || category.name || "Unnamed";
                    return (
                      <option key={catId} value={catId}>
                        {catName}
                      </option>
                    );
                    }
                  )}
                </select>
              </Field>

              <Field label={t.seanebBranchId}>
                <div className="verify-input-wrapper">
                  <input
                    className="reg-input"
                    value={form.seaneb_id}
                    onChange={(e) =>
                      handleChange("seaneb_id", e.target.value.toLowerCase())
                    }
                    placeholder={t.seanebBranchPlaceholder}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className={`verify-btn ${seanebVerified ? "verified" : ""}`}
                    disabled={!isValidSeaneb || checkingSeanebId}
                    onClick={handleVerifySeanebId}
                  >
                    {checkingSeanebId ? "Checking..." : seanebVerified ? "Verified" : "Verify"}
                  </button>
                </div>
                {form.seaneb_id && !isValidSeaneb && (
                  <p className="field-helper error">
                    6-30 characters. Use lowercase letters, numbers and hyphen (-).
                  </p>
                )}
                {isValidSeaneb && !seanebVerified && (
                  <p className="field-helper error">Verify SeaNeB ID before submission.</p>
                )}
              </Field>
            </div>
          </section>

          <section className="business-section-card">
            <div className="business-section-head">
              <h3>{t.contactSection}</h3>
              <p>Numbers and email used for branch communication and verification.</p>
            </div>

            <div className="business-grid business-grid--2">
              <Field label={t.primaryNumber}>
                <div className="verify-input-wrapper">
                  <input
                    className="reg-input"
                    value={form.primary_number}
                    onChange={(e) =>
                      handleChange("primary_number", e.target.value.replace(/\D/g, ""))
                    }
                    inputMode="numeric"
                    maxLength={15}
                    placeholder={t.primaryNumberPlaceholder}
                    autoComplete="tel"
                  />
                  <button
                    type="button"
                    className={`verify-btn ${mobileVerified ? "verified" : ""}`}
                    disabled={!isValidPrimaryNumber || sendingMobileOtp || mobileVerified}
                    onClick={handleSendBusinessMobileOtp}
                  >
                    {sendingMobileOtp ? t.sendingOtp : mobileVerified ? t.verified : t.sendOtp}
                  </button>
                </div>
                {!isValidPrimaryNumber && form.primary_number.length > 0 && (
                  <p className="field-helper error">{t.primaryNumberHelper}</p>
                )}
                {isValidPrimaryNumber && !mobileVerified && (
                  <p className="field-helper error">Verify primary number before submission.</p>
                )}
              </Field>

              <Field label={t.whatsappNumber}>
                <input
                  className="reg-input"
                  value={form.whatsapp_number}
                  onChange={(e) =>
                    handleChange("whatsapp_number", e.target.value.replace(/\D/g, ""))
                  }
                  inputMode="numeric"
                  maxLength={15}
                  placeholder={t.whatsappNumberPlaceholder}
                  autoComplete="tel"
                />
                {!isValidWhatsapp && (
                  <p className="field-helper error">{t.whatsappNumberHelper}</p>
                )}
              </Field>

              <Field label={t.businessEmail} hint="Email is optional. If entered, verify it with OTP.">
                <div className="verify-input-wrapper">
                  <input
                    type="email"
                    className="reg-input"
                    value={form.business_email}
                    onChange={(e) => handleChange("business_email", e.target.value)}
                    autoComplete="email"
                    placeholder={t.businessEmailPlaceholder}
                  />
                  <button
                    type="button"
                    className={`verify-btn ${emailVerified ? "verified" : ""}`}
                    disabled={!hasBusinessEmail || !isBusinessEmailFormatValid || sendingEmailOtp || emailVerified}
                    onClick={requestBusinessEmailOtp}
                  >
                    {sendingEmailOtp ? t.sendingOtp : emailVerified ? t.verified : t.sendOtp}
                  </button>
                </div>

                {emailOtpSent && !emailVerified && (
                  <div className="verify-otp-row">
                    <input
                      className="reg-input"
                      value={emailOtp}
                      onChange={(e) =>
                        setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      inputMode="numeric"
                      maxLength={6}
                      placeholder={t.emailOtpPlaceholder}
                    />
                    <button
                      type="button"
                      className="verify-otp-btn"
                      disabled={
                        !hasBusinessEmail ||
                        !isBusinessEmailFormatValid ||
                        emailOtp.length < 4 ||
                        verifyingEmailOtp
                      }
                      onClick={handleVerifyBusinessEmailOtp}
                    >
                      {verifyingEmailOtp ? t.verifying : t.verifyOtp}
                    </button>
                  </div>
                )}

                {!hasBusinessEmail && (
                  <p className="field-helper">Email is optional for business registration.</p>
                )}
                {hasBusinessEmail && !isBusinessEmailFormatValid && (
                  <p className="field-helper error">Enter a valid email address.</p>
                )}
                {hasBusinessEmail && isBusinessEmailFormatValid && (
                  <p className={`field-helper ${emailVerified ? "" : "error"}`}>
                    {emailVerified ? t.emailVerifiedSuccess : t.emailVerifyHelper}
                  </p>
                )}
              </Field>
            </div>
          </section>

          <section className="business-section-card">
            <div className="business-section-head">
              <h3>{t.locationSection}</h3>
              <p>Add accurate location details for discovery and operations.</p>
            </div>

            <div className="business-grid business-grid--2">
              <Field label={t.address}>
                <input
                  className="reg-input"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder={t.addressPlaceholder}
                  autoComplete="street-address"
                />
              </Field>

              <Field label={t.landmark}>
                <input
                  className="reg-input"
                  value={form.landmark}
                  onChange={(e) => handleChange("landmark", e.target.value)}
                  placeholder={t.landmarkPlaceholder}
                />
              </Field>

              <Field label={t.place}>
                <AutoComplete
                  value={form.place.label}
                  onChange={handlePlaceChange}
                  placeholder={t.placePlaceholder}
                />
              </Field>

              <Field label={t.aboutBranch}>
                <textarea
                  className="reg-input reg-textarea"
                  value={form.about_branch}
                  onChange={(e) => handleChange("about_branch", e.target.value)}
                  placeholder={t.aboutBranchPlaceholder}
                  rows={4}
                />
                <p className={`field-helper ${hasBranchSummary ? "" : "error"}`}>
                  {hasBranchSummary
                    ? t.aboutBranchHelper
                    : `Minimum 20 characters needed (${form.about_branch.trim().length}/20)`}
                </p>
              </Field>
            </div>
          </section>

          <section className="business-section-card">
            <div className="business-section-head">
              <h3>{t.complianceSection}</h3>
              <p>You can verify PAN and GST now or after branch creation.</p>
            </div>

            <div className="business-grid business-grid--2">
              <Field label={t.panNumberOptional}>
                <div className="verify-input-wrapper">
                  <input
                    className="reg-input"
                    value={form.pan_number}
                    onChange={(e) => handleChange("pan_number", e.target.value.toUpperCase())}
                    maxLength={10}
                    placeholder={t.panPlaceholder}
                  />
                  <button
                    type="button"
                    className={`verify-btn ${panVerified ? "verified" : ""}`}
                    disabled={!form.pan_number.trim() || !isPanFormatValid || panVerified || verifyingPan}
                    onClick={handleVerifyPan}
                  >
                    {verifyingPan ? t.verifying : panVerified ? t.verified : t.verify}
                  </button>
                </div>
                {hasPan && !isPanFormatValid && (
                  <p className="field-helper error">{t.panFormatHelper}</p>
                )}
              </Field>

              <Field label={t.gstinOptional}>
                <div className="verify-input-wrapper">
                  <input
                    className="reg-input"
                    value={form.gstin}
                    onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                    maxLength={15}
                    placeholder={t.gstinPlaceholder}
                  />
                  <button
                    type="button"
                    className={`verify-btn ${gstVerified ? "verified" : ""}`}
                    disabled={!form.gstin.trim() || !isGstinFormatValid || gstVerified || verifyingGst}
                    onClick={handleVerifyGst}
                  >
                    {verifyingGst ? t.verifying : gstVerified ? t.verified : t.verify}
                  </button>
                </div>
                {hasGstin && !isGstinFormatValid && (
                  <p className="field-helper error">{t.gstinFormatHelper}</p>
                )}
              </Field>
            </div>
          </section>

          <div className="business-submit-panel">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(e) => handleChange("agree", e.target.checked)}
              />
              <span>I agree to the business terms and conditions</span>
            </label>

            <PrimaryButton disabled={!isFormComplete || loading}>
              {loading ? t.submitting : t.registerBusiness}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="business-form-group">
      <label className="business-form-label">{label}</label>
      {children}
      {hint && <p className="business-form-hint">{hint}</p>}
    </div>
  );
}
