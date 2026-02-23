/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import countries from "@/app/constant/country.json";
import AuthLayout from "@/app/component/AuthLayout";
import AutoComplete from "@/app/component/AutoComplete";
import PrimaryButton from "@/app/component/PrimaryButton";
import useTranslation from "@/app/hook/useTranslation";
import useDebounce from "@/app/hook/useDebaunce";
import api from "@/app/services/api";
import { sendEmailOtp, sendOtp, verifyEmailOtp } from "@/app/services/otp.services";
import {
  ensureDefaultProductAuto,
  getBusinessAutocomplete,
  registerBusiness,
  verifyPanForBranch as verifyPan,
  verifyGstForBranch as verifyGstin,
} from "@/app/services/business.services";
import { checkSeanebId } from "@/app/services/auth.services";
import { getCategories } from "@/app/services/category.services";
import {
  getCookie,
  setCookie,
  removeCookie,
  getJsonCookie,
  setJsonCookie,
} from "@/app/services/cookieStore";
import { PRODUCT_KEY } from "@/app/services/productKey";

const EMPTY_FORM = {
  country_code: "91",
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
const normalizeCountryCode = (value) => String(value || "").replace("+", "").trim();
const getCountryByCode = (code) => {
  const normalized = normalizeCountryCode(code);
  return (
    countries.find((country) => normalizeCountryCode(country?.dialCode) === normalized) ||
    countries[0]
  );
};

const BIZ_INPUT_CLASS =
  "h-[46px] w-full rounded-[11px] border border-[#d9e1ec] bg-[var(--color-white)] px-[14px] text-[14px] text-[var(--color-text-primary)] placeholder:text-[#94a3b8] transition-[border-color,box-shadow,transform] duration-200 ease-in-out focus:border-[#0f4ec9] focus:outline-none focus:[box-shadow:0_0_0_4px_rgba(15,78,201,0.18)]";
const BIZ_TEXTAREA_CLASS =
  "h-auto min-h-[112px] w-full resize-y rounded-[11px] border border-[#d9e1ec] bg-[var(--color-white)] px-[14px] py-[11px] text-[14px] leading-[1.5] text-[var(--color-text-primary)] placeholder:text-[#94a3b8] transition-[border-color,box-shadow,transform] duration-200 ease-in-out focus:border-[#0f4ec9] focus:outline-none focus:[box-shadow:0_0_0_4px_rgba(15,78,201,0.18)]";
const BIZ_AUTOCOMPLETE_WRAPPER_CLASS = "relative";
const BIZ_SUGGESTION_BOX_CLASS =
  "absolute left-0 top-full z-[60] max-h-[200px] w-full overflow-y-auto rounded-b-[10px] border border-t-0 border-[#d9e1ec] bg-[var(--color-white)] shadow-[0_14px_28px_rgba(15,23,42,0.12)]";
const BIZ_SUGGESTION_ITEM_CLASS =
  "cursor-pointer px-[14px] py-[10px] text-[14px] text-[var(--color-text-heading)] hover:bg-[var(--color-surface-muted)]";
const BIZ_VERIFY_WRAPPER_CLASS = "relative w-full";
const BIZ_VERIFY_BUTTON_BASE_CLASS =
  "absolute right-[10px] top-1/2 h-8 -translate-y-1/2 whitespace-nowrap rounded-[6px] border border-[var(--auth-border-light)] bg-[var(--color-white)] px-3 text-[12px] text-[var(--color-black)] transition-colors duration-200 ease-in-out hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60";
const BIZ_VERIFY_BUTTON_VERIFIED_CLASS =
  "absolute right-[10px] top-1/2 h-8 -translate-y-1/2 cursor-default whitespace-nowrap rounded-[6px] border border-[var(--color-success)] bg-[var(--color-success)] px-3 text-[12px] text-[var(--color-white)]";
const BIZ_VERIFY_OTP_ROW_CLASS =
  "mt-[10px] grid grid-cols-[1fr_120px] gap-2 [@media(max-width:640px)]:grid-cols-1";
const BIZ_VERIFY_OTP_BUTTON_CLASS =
  "h-[44px] cursor-pointer rounded-[10px] border border-[#0f4ec9] bg-[var(--color-btn-secondary-hover)] text-[13px] font-semibold text-[#0f4ec9] disabled:cursor-not-allowed disabled:opacity-60";
const BIZ_HELPER_CLASS = "mt-[7px] text-[12px] text-[var(--color-text-muted)]";
const BIZ_HELPER_ERROR_CLASS =
  "mt-[7px] text-[12px] font-medium text-[var(--color-danger)]";
const BIZ_HELPER_SUCCESS_CLASS =
  "mt-[7px] text-[12px] text-[var(--color-success-strong)]";

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
  const [editingSeanebId, setEditingSeanebId] = useState(true);
  const [seanebIdMessage, setSeanebIdMessage] = useState("");
  const [seanebIdMessageType, setSeanebIdMessageType] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [businessCheckDone, setBusinessCheckDone] = useState(false);
  const [country, setCountry] = useState(() => getCountryByCode("91"));
  const [showCountries, setShowCountries] = useState(false);
  const submitLockRef = useRef(false);
  const businessAutocompleteRef = useRef(null);
  const countryDropdownRef = useRef(null);
  const debouncedBusinessName = useDebounce(form.business_name, 350);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10,15}$/;
  const seanebRegex = /^[a-z0-9-]{6,30}$/;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  const isValidEmail = emailRegex.test(form.business_email);
  const isValidPrimaryNumber = phoneRegex.test(form.primary_number.trim());
  const hasBusinessEmail = String(form.business_email || "").trim().length > 0;
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

  const isBusinessEmailStepValid =
    !hasBusinessEmail || (isValidEmail && emailVerified);

  const requiredChecks = [
    form.business_name.trim(),
    form.display_name.trim(),
    form.business_type !== "",
    form.seaneb_id.trim(),
    isValidPrimaryNumber,
    mobileVerified,
    isBusinessEmailStepValid,
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
    isBusinessEmailStepValid &&
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
      setEditingSeanebId(true);
      setSeanebIdMessage("");
      setSeanebIdMessageType("");
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const parsed = getJsonCookie("business_reg_draft");
      if (parsed && typeof parsed === "object") {
        setForm((prev) => ({
          ...prev,
          ...parsed,
          country_code:
            normalizeCountryCode(parsed?.country_code) || prev.country_code,
          place:
            parsed?.place && typeof parsed.place === "object"
              ? parsed.place
              : prev.place,
        }));

        const draftCountry = getCountryByCode(parsed?.country_code);
        setCountry(draftCountry);
        return;
      }

      const verifiedMobile = getJsonCookie("verified_mobile");
      const verifiedCountryCode = normalizeCountryCode(verifiedMobile?.country_code);
      if (verifiedCountryCode) {
        setCountry(getCountryByCode(verifiedCountryCode));
        setForm((prev) => ({ ...prev, country_code: verifiedCountryCode }));
      }
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
      const verifiedCountryCode = normalizeCountryCode(verified?.country_code);
      const selectedCountryCode = normalizeCountryCode(form.country_code);
      const businessMobileVerified =
        getCookie("business_mobile_verified") === "true";
      setMobileVerified(
        Boolean(
          verifiedNumber &&
            verifiedNumber === mobile &&
            verifiedPurpose === 2 &&
            (!selectedCountryCode || verifiedCountryCode === selectedCountryCode) &&
            businessMobileVerified
        )
      );
    } catch {
      setMobileVerified(false);
    }
  }, [form.primary_number, form.country_code]);

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

  const handleCountrySelect = (selectedCountry) => {
    const selectedCode = normalizeCountryCode(selectedCountry?.dialCode);
    setCountry(selectedCountry || countries[0]);
    setShowCountries(false);
    setForm((prev) => ({ ...prev, country_code: selectedCode || prev.country_code }));
    setMobileVerified(false);
    removeCookie("business_mobile_verified");
  };

  useEffect(() => {
    let active = true;

    const checkExistingBusiness = async () => {
      try {
        if (!active) return;

        const profileRes = await api.get("/v1/profile/me", {
          params: {
            _t: Date.now(),
          },
          headers: { "x-product-key": PRODUCT_KEY },
        });
        const profilePayload = profileRes?.data || {};
        const profileData =
          profilePayload?.data && typeof profilePayload.data === "object"
            ? profilePayload.data
            : profilePayload;
        const profileRegistered =
          profileData?.is_business_registered === true ||
          profileData?.isBusinessRegistered === true;

        if (profileRegistered) {
          setCookie("dashboard_mode", "dealer", { days: 365 });
          router.replace("/auth/dealerdash");
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
  }, [router]);

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

      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target)
      ) {
        setShowCountries(false);
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
    if (!isValidEmail || sendingEmailOtp || emailVerified) return;

    try {
      setSendingEmailOtp(true);
      await sendEmailOtp({ email: form.business_email.trim(), purpose: 3 });
      setEmailOtpSent(true);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || t.emailOtpSendFailed);
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyBusinessEmailOtp = async () => {
    if (!emailOtp || emailOtp.length < 4 || verifyingEmailOtp) return;

    try {
      setVerifyingEmailOtp(true);
      await verifyEmailOtp({
        email: form.business_email.trim(),
        otp: emailOtp.trim(),
        purpose: 3,
      });
      setEmailVerified(true);
      setCookie("business_email_verified", "true");
      setCookie("verified_business_email", form.business_email.trim());
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
    let countryCode = normalizeCountryCode(form.country_code || country?.dialCode);

    if (!countryCode) {
      try {
        const verifiedMobile =
          typeof window !== "undefined" ? getJsonCookie("verified_mobile") : null;
        countryCode = normalizeCountryCode(verifiedMobile?.country_code);
      } catch {
        countryCode = "";
      }
    }

    if (!countryCode) {
      setErrorMessage("Please select a country code.");
      return;
    }

    const otpContext = {
      type: "mobile",
      identifier_type: 0,
      country_code: countryCode,
      mobile_number: mobile,
      purpose: 2,
      via: "whatsapp",
      product_key: PRODUCT_KEY,
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
      setErrorMessage(getErrorMessage(err, t.panVerifyFailed));
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
      setErrorMessage(getErrorMessage(err, t.gstinVerifyFailed));
    } finally {
      setVerifyingGst(false);
    }
  };

  const handleVerifySeanebId = async () => {
    if (!isValidSeaneb || checkingSeanebId || (seanebVerified && !editingSeanebId)) return;

    try {
      setCheckingSeanebId(true);
      setSeanebIdMessage("");
      setSeanebIdMessageType("");
      await checkSeanebId(form.seaneb_id.trim().toLowerCase());
      setSeanebVerified(true);
      setEditingSeanebId(false);
      setSeanebIdMessage(t.seanebIdVerifiedMessage || "SeaNeB ID verified.");
      setSeanebIdMessageType("success");
      setErrorMessage("");
    } catch (err) {
      setSeanebVerified(false);
      setEditingSeanebId(true);
      const status = Number(err?.response?.status || 0);
      setSeanebIdMessageType("error");
      if (status === 409) {
        setSeanebIdMessage(t.seanebIdExistsMessage || "SeaNeB ID already exists.");
      } else if (status === 400) {
        setSeanebIdMessage(t.seanebIdInvalidMessage || "Invalid SeaNeB ID format.");
      } else {
        setSeanebIdMessage(t.seanebIdVerifyFailedMessage || "Unable to verify SeaNeB ID.");
      }
    } finally {
      setCheckingSeanebId(false);
    }
  };

  const handleEditSeanebId = () => {
    setSeanebVerified(false);
    setEditingSeanebId(true);
    setSeanebIdMessage("");
    setSeanebIdMessageType("");
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
      country_code: normalizeCountryCode(form.country_code),
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
      payload.business_email = form.business_email.trim();
    }

    if (form.pan_number.trim()) {
      payload.pan = { pan_number: form.pan_number.trim() };
    }

    if (form.gstin.trim()) {
      payload.gst = { gstin: form.gstin.trim() };
    }

    try {
      const response = await registerBusiness(payload);
      const data = response?.data || {};
      const branch = String(data?.branch_id || data?.default_branch_id || "");
      if (branch) setBranchId(branch);

      setSuccessMessage(t.businessRegisterSuccess);
      removeCookie("business_reg_draft");
      setCookie("dashboard_mode", "dealer", { days: 365 });
      setCookie("profile_completed", "true", { days: 365 });

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
      <div>
        <div className="mb-3.5">
          <div className="mb-2.5">
            <h2 className="mb-1.5 mt-0.5 text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-(--color-text-primary) [@media(max-width:900px)]:text-[30px] [@media(max-width:640px)]:text-[32px]">
              {t.businessRegTitle}
            </h2>
            <p className="mb-4.5 mt-2 max-w-[64ch] text-[15px] leading-normal text-(--color-text-muted) [@media(max-width:900px)]:mb-3.5 [@media(max-width:900px)]:text-[14px]">
              {t.businessRegSubtitle}
            </p>
          </div>

          <div className="mb-3.5 mt-2">
            <div className="mb-1.5 flex items-center justify-between text-[13px] text-(--color-text-muted-strong)">
              <span>Form completion</span>
              <strong className="text-(--color-text-primary)">{completionPercent}%</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-(--color-border-soft)">
              <span
                className="block h-full rounded-full bg-[linear-gradient(90deg,var(--color-btn-primary-bg)_0%,var(--color-btn-primary-hover)_100%)]"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          <div className="mb-1.5 grid grid-cols-4 gap-2.5 [@media(max-width:900px)]:grid-cols-2">
            <div
              className={`flex flex-col gap-[3px] rounded-[12px] border px-3 py-[10px] ${
                mobileVerified
                  ? "border-[var(--color-bizpro-pill-verified-border)] bg-[var(--color-bizpro-pill-verified-bg)]"
                  : "border-[var(--color-border-bizpro)] bg-[var(--color-surface-section)]"
              }`}
            >
              <span className="text-[12px] text-[var(--color-text-muted)]">Mobile</span>
              <strong
                className={`text-[13px] ${
                  mobileVerified
                    ? "text-[var(--color-bizpro-pill-verified-text)]"
                    : "text-[var(--color-text-primary)]"
                }`}
              >
                {mobileVerified ? "Verified" : "Pending"}
              </strong>
            </div>
            <div
              className={`flex flex-col gap-0.75 rounded-xl border px-3 py-2.5 ${
                emailVerified
                  ? "border-(--color-bizpro-pill-verified-border) bg-(--color-bizpro-pill-verified-bg)"
                  : "border-(--color-border-bizpro) bg-(--color-surface-section)"
              }`}
            >
              <span className="text-[12px] text-(--color-text-muted)">Email</span>
              <strong
                className={`text-[13px] ${
                  emailVerified
                    ? "text-(--color-bizpro-pill-verified-text)"
                    : "text-(--color-text-primary)"
                }`}
              >
                {emailVerified ? "Verified" : "Pending"}
              </strong>
            </div>
            <div
              className={`flex flex-col gap-0.75 rounded-xl border px-3 py-2.5 ${
                form.place.place_id
                  ? "border-(--color-bizpro-pill-verified-border) bg-(--color-bizpro-pill-verified-bg)"
                  : "border-(--color-border-bizpro) bg-(--color-surface-section)"
              }`}
            >
              <span className="text-[12px] text-(--color-text-muted)">Location</span>
              <strong
                className={`text-[13px] ${
                  form.place.place_id
                    ? "text-(--color-bizpro-pill-verified-text)"
                    : "text-(--color-text-primary)"
                }`}
              >
                {form.place.place_id ? "Selected" : "Pending"}
              </strong>
            </div>
            <div
              className={`flex flex-col gap-0.75 rounded-xl border px-3 py-2.5 ${
                branchId
                  ? "border-(--color-bizpro-pill-verified-border) bg-(--color-bizpro-pill-verified-bg)"
                  : "border-(--color-border-bizpro) bg-(--color-surface-section)"
              }`}
            >
              <span className="text-[12px] text-(--color-text-muted)">Branch</span>
              <strong
                className={`text-[13px] ${
                  branchId
                    ? "text-(--color-bizpro-pill-verified-text)"
                    : "text-(--color-text-primary)"
                }`}
              >
                {branchId ? "Created" : "New"}
              </strong>
            </div>
          </div>
        </div>

        {errorMessage && (
          <p className={BIZ_HELPER_ERROR_CLASS} style={{ marginBottom: 12 }}>
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className={BIZ_HELPER_SUCCESS_CLASS} style={{ marginBottom: 12 }}>
            {successMessage}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="grid gap-3.5"
        >
          <section className="rounded-2xl border border-(--color-border-bizpro) bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-surface-section)_100%)] p-4.5 shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
            <div>
              <h3 className="m-0 text-[16px] text-(--color-text-primary)">{t.businessInfoSection}</h3>
              <p className="mb-0 mt-1.25 text-[13px] text-(--color-text-muted)">
                Core identity details visible to your customers.
              </p>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-3.5 [@media(max-width:640px)]:grid-cols-1">
              <Field label={t.businessName}>
                <div className={BIZ_AUTOCOMPLETE_WRAPPER_CLASS} ref={businessAutocompleteRef}>
                  <input
                    className={BIZ_INPUT_CLASS}
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
                    <div className={BIZ_SUGGESTION_BOX_CLASS}>
                      {businessLoading && (
                        <div className={BIZ_SUGGESTION_ITEM_CLASS}>{t.loadingSuggestions}</div>
                      )}

                      {!businessLoading && businessSuggestionError && (
                        <div className={BIZ_SUGGESTION_ITEM_CLASS}>{businessSuggestionError}</div>
                      )}

                      {!businessLoading &&
                        !businessSuggestionError &&
                        businessFetchedOnce &&
                        businessSuggestions.length === 0 &&
                        form.business_name.trim().length >= MIN_BUSINESS_AUTOCOMPLETE_CHARS && (
                          <div className={BIZ_SUGGESTION_ITEM_CLASS}>{t.noBusinessSuggestions}</div>
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
                              className={BIZ_SUGGESTION_ITEM_CLASS}
                              onMouseDown={() => {
                                handleChange("business_name", businessLabel);
                                if (!form.display_name.trim()) {
                                  handleChange("display_name", businessLabel.split("-")[0].trim());
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
                  className={BIZ_INPUT_CLASS}
                  value={form.display_name}
                  onChange={(e) => handleChange("display_name", e.target.value)}
                  placeholder={t.displayNamePlaceholder}
                />
              </Field>

              <Field label="Business Type *">
                <select
                  className={BIZ_INPUT_CLASS}
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
                  className={BIZ_INPUT_CLASS}
                  value={form.main_category_id}
                  disabled={categoriesLoading || categories.length === 0}
                  onChange={(e) => handleChange("main_category_id", e.target.value)}
                >
                  <option value="">
                    {categoriesLoading ? "Loading categories..." : "Select a category"}
                  </option>
                  {categories.map((category) => {
                    const catId = category.main_category_id || category.id || "";
                    const catName = category.main_category_name || category.name || "Unnamed";
                    return (
                      <option key={catId} value={catId}>
                        {catName}
                      </option>
                    );
                  })}
                </select>
                {!categoriesLoading && categories.length === 0 && (
                  <p className={BIZ_HELPER_ERROR_CLASS}>
                    Categories not available right now. Please try again in a moment.
                  </p>
                )}
              </Field>

              <Field label={t.seanebBranchId}>
                <div className={BIZ_VERIFY_WRAPPER_CLASS}>
                  <input
                    className={BIZ_INPUT_CLASS}
                    value={form.seaneb_id}
                    onChange={(e) =>
                      handleChange("seaneb_id", e.target.value.toLowerCase())
                    }
                    placeholder={t.seanebBranchPlaceholder}
                    autoComplete="off"
                    disabled={seanebVerified && !editingSeanebId}
                  />
                  <button
                    type="button"
                    className={
                      seanebVerified && !editingSeanebId
                        ? BIZ_VERIFY_BUTTON_VERIFIED_CLASS
                        : BIZ_VERIFY_BUTTON_BASE_CLASS
                    }
                    disabled={
                      !isValidSeaneb ||
                      checkingSeanebId ||
                      (seanebVerified && !editingSeanebId)
                    }
                    onClick={handleVerifySeanebId}
                  >
                    {checkingSeanebId
                      ? t.seanebIdCheckingLabel || t.verifying || "Checking..."
                      : seanebVerified && !editingSeanebId
                      ? `${t.seanebIdVerifiedLabel || t.verified || "Verified"} \u2713`
                      : t.seanebIdVerifyLabel || t.verify || "Verify"}
                  </button>
                </div>

                {seanebVerified && !editingSeanebId && (
                  <button
                    type="button"
                    className="mt-2 cursor-pointer rounded-lg border border-(--color-border-default) bg-(--color-surface-section) px-2.5 py-1.5 text-[12px] font-semibold text-(--color-link-primary) transition-colors duration-200 ease-in-out hover:border-(--color-border-brand-soft) hover:bg-(--color-btn-secondary-hover)"
                    onClick={handleEditSeanebId}
                  >
                    {t.seanebIdEdit || "Edit SeaNeB ID"}
                  </button>
                )}

                {form.seaneb_id && !isValidSeaneb && (
                  <p className={BIZ_HELPER_ERROR_CLASS}>
                    {t.seanebIdFormatHelper ||
                      "6-30 characters. Use lowercase letters, numbers and hyphen (-)."}
                  </p>
                )}

                {!form.seaneb_id || isValidSeaneb ? (
                  seanebIdMessage ? (
                    <p
                      className={
                        seanebIdMessageType === "error"
                          ? BIZ_HELPER_ERROR_CLASS
                          : BIZ_HELPER_SUCCESS_CLASS
                      }
                    >
                      {seanebIdMessage}
                    </p>
                  ) : isValidSeaneb && !seanebVerified ? (
                    <p className={BIZ_HELPER_ERROR_CLASS}>
                      {t.seanebIdVerifyRequired || "Verify SeaNeB ID before submission."}
                    </p>
                  ) : null
                ) : null}
              </Field>
            </div>
          </section>

          <section className="rounded-[16px] border border-[var(--color-border-bizpro)] bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-surface-section)_100%)] p-[18px] shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
            <div>
              <h3 className="m-0 text-[16px] text-[var(--color-text-primary)]">{t.contactSection}</h3>
              <p className="mb-0 mt-[5px] text-[13px] text-[var(--color-text-muted)]">
                Numbers and email used for branch communication and verification.
              </p>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-3.5 [@media(max-width:640px)]:grid-cols-1">
              <Field label="Country Code *">
                <div className="relative" ref={countryDropdownRef}>
                  <button
                    type="button"
                    className="flex h-[46px] w-full items-center justify-between rounded-[11px] border border-[#d9e1ec] bg-[var(--color-white)] px-[12px] text-left transition-[border-color,box-shadow,transform] duration-200 ease-in-out hover:border-[#9fb8de] focus:border-[#0f4ec9] focus:outline-none focus:[box-shadow:0_0_0_4px_rgba(15,78,201,0.18)]"
                    onClick={() => setShowCountries((prev) => !prev)}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <img
                        src={country.flag}
                        alt={country.name}
                        className="h-[16px] w-[24px] rounded-[2px] object-cover"
                      />
                      <span className="truncate text-[14px] text-[var(--color-text-primary)]">
                        {country.name}
                      </span>
                    </span>
                    <span className="ml-2 shrink-0 text-[13px] font-semibold text-[var(--color-text-muted-strong)]">
                      {country.dialCode} {"\u25BE"}
                    </span>
                  </button>

                  {showCountries && (
                    <div className="absolute left-0 top-[50px] z-[70] max-h-[260px] w-full overflow-y-auto rounded-[12px] border border-[#d9e1ec] bg-[var(--color-white)] shadow-[0_14px_28px_rgba(15,23,42,0.12)]">
                      {countries.map((item) => (
                        <button
                          type="button"
                          key={`${item.code}-${item.dialCode}`}
                          className="flex w-full items-center gap-[10px] border-b border-[var(--color-border-brand-soft)] px-3 py-[10px] text-left text-[14px] text-[var(--color-text-primary)] last:border-b-0 hover:bg-[var(--color-surface-muted)]"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleCountrySelect(item);
                          }}
                        >
                          <img
                            src={item.flag}
                            alt={item.name}
                            className="h-4 w-[22px] rounded-[2px] object-cover"
                          />
                          <span className="flex-1 truncate">{item.name}</span>
                          <span className="text-[13px] text-[var(--color-text-muted-strong)]">
                            {item.dialCode}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              <Field label={t.primaryNumber}>
                <div className={BIZ_VERIFY_WRAPPER_CLASS}>
                  <input
                    className={BIZ_INPUT_CLASS}
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
                    className={
                      mobileVerified
                        ? BIZ_VERIFY_BUTTON_VERIFIED_CLASS
                        : BIZ_VERIFY_BUTTON_BASE_CLASS
                    }
                    disabled={!isValidPrimaryNumber || sendingMobileOtp || mobileVerified}
                    onClick={handleSendBusinessMobileOtp}
                  >
                    {sendingMobileOtp ? t.sendingOtp : mobileVerified ? t.verified : t.sendOtp}
                  </button>
                </div>
                {!isValidPrimaryNumber && form.primary_number.length > 0 && (
                  <p className={BIZ_HELPER_ERROR_CLASS}>{t.primaryNumberHelper}</p>
                )}
                {isValidPrimaryNumber && !mobileVerified && (
                  <p className={BIZ_HELPER_ERROR_CLASS}>Verify primary number before submission.</p>
                )}
              </Field>

              <Field label={t.whatsappNumber}>
                <input
                  className={BIZ_INPUT_CLASS}
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
                  <p className={BIZ_HELPER_ERROR_CLASS}>{t.whatsappNumberHelper}</p>
                )}
              </Field>

              <Field label={`${t.businessEmail} (Optional)`} hint="If provided, email must be verified.">
                <div className={BIZ_VERIFY_WRAPPER_CLASS}>
                  <input
                    type="email"
                    className={BIZ_INPUT_CLASS}
                    value={form.business_email}
                    onChange={(e) => handleChange("business_email", e.target.value)}
                    autoComplete="email"
                    placeholder={t.businessEmailPlaceholder}
                  />
                  <button
                    type="button"
                    className={
                      emailVerified
                        ? BIZ_VERIFY_BUTTON_VERIFIED_CLASS
                        : BIZ_VERIFY_BUTTON_BASE_CLASS
                    }
                    disabled={!isValidEmail || sendingEmailOtp || emailVerified}
                    onClick={requestBusinessEmailOtp}
                  >
                    {sendingEmailOtp ? t.sendingOtp : emailVerified ? t.verified : t.sendOtp}
                  </button>
                </div>

                {emailOtpSent && !emailVerified && (
                  <div className={BIZ_VERIFY_OTP_ROW_CLASS}>
                    <input
                      className={BIZ_INPUT_CLASS}
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
                      className={BIZ_VERIFY_OTP_BUTTON_CLASS}
                      disabled={emailOtp.length < 4 || verifyingEmailOtp}
                      onClick={handleVerifyBusinessEmailOtp}
                    >
                      {verifyingEmailOtp ? t.verifying : t.verifyOtp}
                    </button>
                  </div>
                )}

                <p
                  className={
                    emailVerified || !form.business_email.trim()
                      ? BIZ_HELPER_CLASS
                      : BIZ_HELPER_ERROR_CLASS
                  }
                >
                  {emailVerified
                    ? t.emailVerifiedSuccess
                    : !form.business_email.trim()
                    ? "Email is optional."
                    : t.emailVerifyHelper}
                </p>
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-(--color-border-bizpro) bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-surface-section)_100%)] p-[18px] shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
            <div>
              <h3 className="m-0 text-[16px] text-(--color-text-primary)">{t.locationSection}</h3>
              <p className="mb-0 mt-1.25 text-[13px] text-(--color-text-muted)">
                Add accurate location details for discovery and operations.
              </p>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-3.5 [@media(max-width:640px)]:grid-cols-1">
              <Field label={t.address}>
                <input
                  className={BIZ_INPUT_CLASS}
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder={t.addressPlaceholder}
                  autoComplete="street-address"
                />
              </Field>

              <Field label={t.landmark}>
                <input
                  className={BIZ_INPUT_CLASS}
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
                  wrapperClassName={BIZ_AUTOCOMPLETE_WRAPPER_CLASS}
                  inputClassName={BIZ_INPUT_CLASS}
                  suggestionBoxClassName={BIZ_SUGGESTION_BOX_CLASS}
                  suggestionItemClassName={BIZ_SUGGESTION_ITEM_CLASS}
                />
              </Field>

              <Field label={t.aboutBranch}>
                <textarea
                  className={BIZ_TEXTAREA_CLASS}
                  value={form.about_branch}
                  onChange={(e) => handleChange("about_branch", e.target.value)}
                  placeholder={t.aboutBranchPlaceholder}
                  rows={4}
                />
                <p className={hasBranchSummary ? BIZ_HELPER_CLASS : BIZ_HELPER_ERROR_CLASS}>
                  {hasBranchSummary
                    ? t.aboutBranchHelper
                    : `Minimum 20 characters needed (${form.about_branch.trim().length}/20)`}
                </p>
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-(--color-border-bizpro) bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-surface-section)_100%)] p-[18px] shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
            <div>
              <h3 className="m-0 text-[16px] text-[var(--color-text-primary)]">{t.complianceSection}</h3>
              <p className="mb-0 mt-[5px] text-[13px] text-[var(--color-text-muted)]">
                You can verify PAN and GST now or after branch creation.
              </p>
            </div>

            <div className="mt-[14px] grid grid-cols-2 gap-[14px] [@media(max-width:640px)]:grid-cols-1">
              <Field label={t.panNumberOptional}>
                <div className={BIZ_VERIFY_WRAPPER_CLASS}>
                  <input
                    className={BIZ_INPUT_CLASS}
                    value={form.pan_number}
                    onChange={(e) => handleChange("pan_number", e.target.value.toUpperCase())}
                    maxLength={10}
                    placeholder={t.panPlaceholder}
                  />
                  <button
                    type="button"
                    className={
                      panVerified
                        ? BIZ_VERIFY_BUTTON_VERIFIED_CLASS
                        : BIZ_VERIFY_BUTTON_BASE_CLASS
                    }
                    disabled={!form.pan_number.trim() || !isPanFormatValid || panVerified || verifyingPan}
                    onClick={handleVerifyPan}
                  >
                    {verifyingPan ? t.verifying : panVerified ? t.verified : t.verify}
                  </button>
                </div>
                {hasPan && !isPanFormatValid && (
                  <p className={BIZ_HELPER_ERROR_CLASS}>{t.panFormatHelper}</p>
                )}
              </Field>

              <Field label={t.gstinOptional}>
                <div className={BIZ_VERIFY_WRAPPER_CLASS}>
                  <input
                    className={BIZ_INPUT_CLASS}
                    value={form.gstin}
                    onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                    maxLength={15}
                    placeholder={t.gstinPlaceholder}
                  />
                  <button
                    type="button"
                    className={
                      gstVerified
                        ? BIZ_VERIFY_BUTTON_VERIFIED_CLASS
                        : BIZ_VERIFY_BUTTON_BASE_CLASS
                    }
                    disabled={!form.gstin.trim() || !isGstinFormatValid || gstVerified || verifyingGst}
                    onClick={handleVerifyGst}
                  >
                    {verifyingGst ? t.verifying : gstVerified ? t.verified : t.verify}
                  </button>
                </div>
                {hasGstin && !isGstinFormatValid && (
                  <p className={BIZ_HELPER_ERROR_CLASS}>{t.gstinFormatHelper}</p>
                )}
              </Field>
            </div>
          </section>

          <div className="rounded-[14px] border border-[var(--color-border-bizpro)] bg-[var(--color-white)] p-[14px]">
            <label className="mb-3 flex items-center gap-[10px] text-[14px] text-[var(--color-text-body-strong)]">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={form.agree}
                onChange={(e) => handleChange("agree", e.target.checked)}
              />
              <span>I agree to the business terms and conditions</span>
            </label>

            <PrimaryButton
              className="mt-[18px] min-h-12 rounded-[12px] text-[15px] font-bold tracking-[0.01em]"
              activeClassName="cursor-pointer bg-[linear-gradient(135deg,#0f4ec9_0%,#0b3ea2_100%)] text-[var(--color-white)] shadow-[0_12px_24px_rgba(15,78,201,0.32)] hover:translate-y-[-1px] hover:shadow-[0_14px_30px_rgba(15,78,201,0.40)]"
              disabledClassName="cursor-not-allowed bg-[var(--color-btn-disabled-bg)] text-[var(--color-btn-disabled-text)]"
              disabled={!isFormComplete || loading}
            >
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
    <div className="min-w-0">
      <label className="mb-[7px] block text-[13px] font-semibold text-[var(--color-text-form-label)]">
        {label}
      </label>
      {children}
      {hint && <p className="mt-[7px] text-[12px] text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}
