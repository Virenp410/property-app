"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AuthLayout from "@/components/AuthLayout";
import useTranslation from "@/hooks/useTranslation";
import useAppLang from "@/hooks/useAppLang";
import AutoComplete from "@/components/AutoComplete";
import DatePicker from "@/components/DatePicker";
import PrimaryButton from "@/components/PrimaryButton";
import CustomDropdown from "@/components/CustomDropdown";
import SeanebIdField from "@/components/SeanebId";
import TermsConditionsModal from "@/components/TermsConditionsModal";

import { signupUser } from "@/services/auth.services";
import { sendEmailOtp, sendOtp } from "@/services/otp.services";
import { setAccessToken } from "@/lib/auth/apiClient";
import { PRODUCT_KEY } from "@/lib/productKey";
import { notifyParentAndClose } from "@/lib/auth/popupAuthBridge";
import { readBridgeToken, resolveWebSsoRedirectUrl } from "@/services/sso.services";
import { getDeviceId, getOrCreateDeviceId } from "@/lib/deviceId";
import {
  getCookie,
  setCookie,
  removeCookie,
  getJsonCookie,
  setJsonCookie,
} from "@/services/cookieStore";

const EMPTY_FORM = {
  firstname: "",
  lastname: "",
  email: "",
  gender: "",
  dob: "",
  hometown: { label: "", place_id: null },
  seanebId: "",
  agree: false,
};

const MINIMUM_REGISTRATION_AGE = 13;
const SEANEB_VERIFIED_COOKIE = "seaneb_id_verified";
const VERIFIED_SEANEB_ID_COOKIE = "verified_seaneb_id";

const parseDobToDate = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  let year = 0;
  let month = 0;
  let day = 0;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parts = raw.split("-");
    year = Number(parts[0]);
    month = Number(parts[1]);
    day = Number(parts[2]);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const parts = raw.split("-");
    day = Number(parts[0]);
    month = Number(parts[1]);
    year = Number(parts[2]);
  } else {
    const fallback = new Date(raw);
    if (Number.isNaN(fallback.getTime())) return null;
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }

  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

const isAtLeastAge = (dobValue, minimumAge) => {
  const dobDate = parseDobToDate(dobValue);
  if (!dobDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threshold = new Date(
    today.getFullYear() - Number(minimumAge || 0),
    today.getMonth(),
    today.getDate()
  );
  threshold.setHours(0, 0, 0, 0);
  return dobDate <= threshold;
};

const getSafeInternalRedirectPath = (value) => {
  const next = String(value || "").trim();
  if (!next) return "";
  if (!next.startsWith("/")) return "";
  if (next.startsWith("//")) return "";
  if (next.startsWith("/auth/login")) return "";
  return next;
};

const REG_SECTION_CLASS =
  "rounded-[14px] border border-[var(--auth-border)] bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-surface-section)_100%)] p-4 shadow-[0_8px_18px_rgba(15,23,42,0.06)]";
const REG_LABEL_CLASS = "mb-1.5 block text-[14px] font-medium text-(--auth-field-label)";
const REG_INPUT_CLASS =
  "h-11 w-full rounded-[10px] border border-(--auth-border) bg-[var(--color-white)] px-3.5 py-3 text-[14px] text-black placeholder:text-(--auth-placeholder) transition-[border-color,box-shadow] duration-200 ease-in-out focus:border-(--auth-border-strong) focus:outline-none focus:[box-shadow:0_0_0_4px_rgba(15,78,201,0.15)]";

const getApiErrorDetails = (err) => {
  const status = Number(err?.response?.status || 0);
  const payload = err?.response?.data || {};
  const code = String(payload?.error?.code || payload?.code || "").trim();
  const message = String(
    payload?.message ||
      payload?.error?.message ||
      err?.message ||
      "Registration failed"
  ).trim();
  return { status, code, message, payload };
};

function RegistrationFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useAppLang(searchParams);
  const t = useTranslation(lang);
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
  ).replace(/\/$/, "");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [emailVerified, setEmailVerified] = useState(false);
  const [seanebVerified, setSeanebVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setMounted(true);

    const fromOtp = getCookie("flow") === "otp_verified";

    if (fromOtp) {
      const saved = getJsonCookie("reg_form_draft");
      if (saved) {
        setForm(saved);
      }

      removeCookie("flow");
    }

    setMobileVerified(getCookie("mobile_verified") === "true");

    const verifiedMobile = getJsonCookie("verified_mobile");
    if (verifiedMobile) {
      try {
        const number = String(verifiedMobile?.mobile_number || "").trim();
        if (number) {
          setMobileVerified(true);
        }
      } catch {
        // ignore invalid cached JSON
      }
    }
  }, [router, searchParams]);

  /* clear draft on refresh */
  useEffect(() => {
    const clearDraftOnRefresh = () => {
      removeCookie("reg_form_draft");
    };

    window.addEventListener("beforeunload", clearDraftOnRefresh);

    return () => {
      window.removeEventListener("beforeunload", clearDraftOnRefresh);
    };
  }, []);

  /* save draft */
  useEffect(() => {
    if (!mounted) return;

    const hasData =
      String(form.firstname || "").trim() ||
      String(form.lastname || "").trim() ||
      String(form.email || "").trim() ||
      String(form.seanebId || "").trim();

    if (hasData) {
      setJsonCookie("reg_form_draft", form);
    }
  }, [form, mounted]);

  /* email verified */
  useEffect(() => {
    if (!mounted) return;

    const verified = getCookie("email_verified");
    const verifiedEmail = String(getCookie("verified_email") || "").trim();

    if (verified === "true" && verifiedEmail === String(form.email || "").trim()) {
      setEmailVerified(true);
    }
  }, [form.email, mounted]);

  /* SeaNeB ID verified */
  useEffect(() => {
    if (!mounted) return;

    const normalizedSeanebId = String(form.seanebId || "").trim().toLowerCase();
    if (!normalizedSeanebId) {
      setSeanebVerified(false);
      return;
    }

    const verified = getCookie(SEANEB_VERIFIED_COOKIE) === "true";
    const verifiedSeanebId = String(getCookie(VERIFIED_SEANEB_ID_COOKIE) || "")
      .trim()
      .toLowerCase();

    if (verified && verifiedSeanebId === normalizedSeanebId) {
      setSeanebVerified(true);
      return;
    }

    setSeanebVerified(false);
    if (verified || verifiedSeanebId) {
      removeCookie(SEANEB_VERIFIED_COOKIE);
      removeCookie(VERIFIED_SEANEB_ID_COOKIE);
    }
  }, [form.seanebId, mounted]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const firstname = String(form.firstname || "").trim();
  const lastname = String(form.lastname || "").trim();
  const email = String(form.email || "").trim();
  const gender = String(form.gender || "").trim();
  const dob = String(form.dob || "").trim();
  const hasEmail = email.length > 0;
  const isValidEmail = emailRegex.test(email);
  const emailStepValid = !hasEmail || (isValidEmail && emailVerified);
  const hasDob = dob.length > 0;
  const isDobEligible = isAtLeastAge(form.dob, MINIMUM_REGISTRATION_AGE);

  const isFormComplete =
    firstname &&
    lastname &&
    emailStepValid &&
    mobileVerified &&
    gender &&
    dob &&
    isDobEligible &&
    form.hometown.place_id &&
    seanebVerified &&
    form.agree;

  const submitBlockers = [];
  if (!firstname) submitBlockers.push("First name is required.");
  if (!lastname) submitBlockers.push("Last name is required.");
  if (!mobileVerified) submitBlockers.push("Mobile number is not verified.");
  if (!gender) submitBlockers.push("Gender is required.");
  if (!hasDob) submitBlockers.push("Date of birth is required.");
  if (hasDob && !isDobEligible)
    submitBlockers.push("Minimum age is 13 years for registration.");
  if (!form.hometown.place_id)
    submitBlockers.push("Select hometown from suggestions.");
  if (!seanebVerified)
    submitBlockers.push("SeaNeB ID verification is required.");
  if (!form.agree) submitBlockers.push("Accept terms and conditions.");
  if (hasEmail && !isValidEmail) submitBlockers.push("Enter a valid email address.");
  if (!emailStepValid)
    submitBlockers.push("Verify email OTP or clear email field.");

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (key === "email") {
      setEmailVerified(false);
      removeCookie("email_verified");
      removeCookie("verified_email");
    }

    if (key === "seanebId") {
      setSeanebVerified(false);
      removeCookie(SEANEB_VERIFIED_COOKIE);
      removeCookie(VERIFIED_SEANEB_ID_COOKIE);
    }
  };

  const setSeanebVerification = (nextVerified) => {
    const isVerified = Boolean(nextVerified);
    setSeanebVerified(isVerified);

    if (isVerified) {
      const normalizedSeanebId = String(form.seanebId || "").trim().toLowerCase();
      if (normalizedSeanebId) {
        setCookie(SEANEB_VERIFIED_COOKIE, "true");
        setCookie(VERIFIED_SEANEB_ID_COOKIE, normalizedSeanebId);
        return;
      }
    }

    removeCookie(SEANEB_VERIFIED_COOKIE);
    removeCookie(VERIFIED_SEANEB_ID_COOKIE);
  };

  const handleHometownTyping = (text) => {
    setForm((prev) => ({
      ...prev,
      hometown: { label: text, place_id: null },
    }));
  };

  const redirectToWebHome = async (authPayload = null) => {
    const bridgeTokenFromPayload = String(readBridgeToken(authPayload) || "").trim();
    const bridgeTokenFromQuery = String(searchParams?.get("bridge_token") || "").trim();
    const bridgeTokenFromStore = String(getCookie("signup_bridge_token") || "").trim();
    const bridgeToken = bridgeTokenFromPayload || bridgeTokenFromQuery || bridgeTokenFromStore;
    const deviceId = getDeviceId();
    const target = await resolveWebSsoRedirectUrl({
      webAppUrl,
      bridgeToken,
      deviceId,
    });
    removeCookie("signup_bridge_token");

    let targetOrigin = "";
    try {
      targetOrigin = new URL(target).origin;
    } catch {
      targetOrigin = "";
    }

    const handedOff = notifyParentAndClose({
      status: "success",
      returnTo: target,
      returnOrigin: targetOrigin,
    });
    if (handedOff) return;

    removeCookie("post_auth_redirect");
    setCookie("dashboard_mode", "user", { days: 365 });
    if (typeof window !== "undefined") {
      window.location.href = target;
      return;
    }
    router.replace(target);
  };

  /* mobile verified */
  const getVerifiedMobile = () => {
    return getJsonCookie("verified_mobile");
  };

  /* submit */
  const handleSubmit = async () => {
    if (!isFormComplete || loading) return;

    const mobileData = getVerifiedMobile();
    if (!mobileData) {
      alert("Mobile number not verified");
      return;
    }

    // Signup API requires OTP verified with signup purpose (0).
    const verifiedPurpose = Number(mobileData?.purpose ?? -1);
    if (verifiedPurpose !== 0) {
      const countryCode = String(mobileData?.country_code || "").trim();
      const mobileNumber = String(mobileData?.mobile_number || "").trim();
      if (!countryCode || !mobileNumber) {
        alert("Mobile verification context is invalid. Please verify OTP again.");
        return;
      }

      const deviceId = getOrCreateDeviceId();
      const otpContext = {
        type: "mobile",
        identifier_type: 0,
        country_code: countryCode,
        mobile_number: mobileNumber,
        purpose: 0,
        via: "whatsapp",
        product_key: PRODUCT_KEY,
        ...(deviceId ? { device_id: deviceId } : {}),
      };

      try {
        setCookie("flow", "otp_verified");
        setJsonCookie("reg_form_draft", form);
        setJsonCookie("otp_context", otpContext);
        setCookie("mobile_verified", "false");
        removeCookie("verified_mobile");

        await sendOtp(otpContext);
        alert("Signup OTP sent. Please verify OTP to continue registration.");
        router.push("/auth/otp");
      } catch (otpErr) {
        const details = getApiErrorDetails(otpErr);
        const statusText = details.status ? ` [HTTP ${details.status}]` : "";
        const codeText = details.code ? ` [${details.code}]` : "";
        alert(`Unable to send signup OTP: ${details.message}${statusText}${codeText}`);
      }
      return;
    }

    try {
      setLoading(true);

      const signupResponse = await signupUser({
        country_code: mobileData.country_code,
        mobile_number: mobileData.mobile_number,
        first_name: firstname,
        last_name: lastname,
        ...(hasEmail ? { email } : {}),
        gender: gender.toLowerCase(),
        dob,
        place_id: form.hometown.place_id,
        seaneb_id: String(form.seanebId || "").trim(),
        product_key: PRODUCT_KEY,
      });

      const accessToken =
        signupResponse?.access_token || signupResponse?.data?.access_token;
      const csrfToken =
        signupResponse?.csrf_token || signupResponse?.data?.csrf_token;

      const hasAccessToken =
        typeof accessToken === "string" && accessToken.length > 10;
      const hasCsrfToken =
        typeof csrfToken === "string" && csrfToken.length > 10;

      if (hasAccessToken) {
        setAccessToken(accessToken);
      }

      const fullName = `${String(form.firstname || "").trim()} ${String(form.lastname || "").trim()}`.trim();
      if (fullName) {
        setCookie("user_display_name", fullName, { days: 365 });
      }

      const signupBridgeToken = readBridgeToken(signupResponse);
      if (signupBridgeToken) {
        setCookie("signup_bridge_token", signupBridgeToken, { days: 1 });
      } else {
        removeCookie("signup_bridge_token");
      }


      /* cleanup AFTER success */
      removeCookie("reg_form_draft");
      removeCookie("email_verified");
      removeCookie("verified_email");
      removeCookie(SEANEB_VERIFIED_COOKIE);
      removeCookie(VERIFIED_SEANEB_ID_COOKIE);
      // Keep verified_mobile/otp_context so dealer business flow can re-send
      // mobile OTP with correct country code.
      await redirectToWebHome(signupResponse);
    } catch (err) {
      const { status, code, message } = getApiErrorDetails(err);

      const statusText = status ? ` [HTTP ${status}]` : "";
      const codeText = code ? ` [${code}]` : "";
      alert(`${message}${statusText}${codeText}`);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const GENDER_OPTIONS = [
    { label: t.select, value: "" },
    { label: t.male, value: "male" },
    { label: t.female, value: "female" },
  ];

  return (
    <AuthLayout
      lang={lang}
      onLangChange={setLang}
      variant="reg"
      showBack={true}
      backFallback="/auth/otp"
    >
      <div className={REG_SECTION_CLASS}>
        <h2 className="m-0 text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-black [@media(max-width:640px)]:text-[26px]">
          {t.completeProfile}
        </h2>
        <p className="mb-0 mt-2 text-[14px] text-(--auth-muted)">{t.profileSubtitle}</p>
      </div>

      <section className={`${REG_SECTION_CLASS} mt-4`}>
        <div className="mb-3">
          <h3 className="m-0 text-[15px] font-semibold text-[var(--color-text-primary)]">Personal details</h3>
          <p className="mb-0 mt-1 text-[12px] text-[var(--color-text-muted)]">
            Use your real details for profile verification.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 [@media(max-width:640px)]:grid-cols-1">
          <div className="min-w-0">
            <label className={REG_LABEL_CLASS}>{t.firstname}</label>
            <input
              className={REG_INPUT_CLASS}
              value={form.firstname}
              onChange={(e) =>
                handleChange("firstname", e.target.value)
              }
            />
          </div>

          <div className="min-w-0">
            <label className={REG_LABEL_CLASS}>{t.lastname}</label>
            <input
              className={REG_INPUT_CLASS}
              value={form.lastname}
              onChange={(e) =>
                handleChange("lastname", e.target.value)
              }
            />
          </div>

          <div className="min-w-0">
            <label className={REG_LABEL_CLASS}>{t.gender}</label>
            <CustomDropdown
              value={form.gender}
              onChange={(val) =>
                handleChange("gender", val)
              }
              options={GENDER_OPTIONS}
              placeholder={t.select}
            />
          </div>

          <div className="min-w-0">
            <label className={REG_LABEL_CLASS}>{t.dob}</label>
            <DatePicker
              value={form.dob}
              onChange={(val) =>
                handleChange("dob", val)
              }
            />
            {hasDob && !isDobEligible && (
              <p className="mt-1.5 text-[12px] text-[#d93025]">
                You must be at least 13 years old to register.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={`${REG_SECTION_CLASS} mt-4`}>
        <div className="mb-3">
          <h3 className="m-0 text-[15px] font-semibold text-[var(--color-text-primary)]">Contact details</h3>
          <p className="mb-0 mt-1 text-[12px] text-[var(--color-text-muted)]">
            Email is optional but should be verified if provided.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 [@media(max-width:640px)]:grid-cols-1">
          <div className="min-w-0">
            <label className={REG_LABEL_CLASS}>
              {String(t.email || "Email").replace(/\s*\*+\s*$/, "")} (Optional)
            </label>
            <div className="relative w-full">
              <input
                type="email"
                className={`${REG_INPUT_CLASS} pr-22.5`}
                value={form.email}
                onChange={(e) =>
                  handleChange("email", e.target.value)
                }
              />

              <button
                type="button"
                className={`absolute right-2.5 top-1/2 h-8 -translate-y-1/2 whitespace-nowrap rounded-md border px-3 text-[12px] font-medium ${
                  emailVerified
                    ? "cursor-default border-(--color-success) bg-(--color-success) text-white"
                    : "border-(--auth-border-light) bg-white text-black hover:bg-(--color-surface-muted)"
                }`}
                disabled={!isValidEmail || sendingOtp}
                onClick={async () => {
                  try {
                    setSendingOtp(true);
                    const email = String(form.email || "").trim();
                    await sendEmailOtp({ email, purpose: 1 });

                    setCookie("flow", "otp_verified");
                    setJsonCookie("otp_context", {
                      type: "email",
                      email,
                      purpose: 1,
                    });
                    router.push("/auth/otp?type=email");
                  } catch (err) {
                    const message =
                      err?.response?.data?.message ||
                      err?.response?.data?.error?.message ||
                      "Failed to send email OTP";
                    alert(message);
                  } finally {
                    setSendingOtp(false);
                  }
                }}
              >
                {emailVerified ? "Verified" : "Verify"}
              </button>
            </div>
          </div>

          <div className="min-w-0">
            <label className={REG_LABEL_CLASS}>{t.hometown}</label>
            <AutoComplete
              value={form.hometown.label}
              onChange={(val) =>
                typeof val === "string"
                  ? handleHometownTyping(val)
                  : handleChange("hometown", val)
              }
            />
          </div>
        </div>
      </section>

      <section className={`${REG_SECTION_CLASS} mt-4`}>
        <div className="mb-3">
          <h3 className="m-0 text-[15px] font-semibold text-[var(--color-text-primary)]">Account ID</h3>
          <p className="mb-0 mt-1 text-[12px] text-[var(--color-text-muted)]">
            Choose and verify your SeaNeB ID before submitting.
          </p>
        </div>
        <SeanebIdField
          value={form.seanebId}
          onChange={(val) =>
            handleChange("seanebId", val)
          }
          verified={seanebVerified}
          setVerified={setSeanebVerification}
          label={t.seanebIdLabel || "SeaNeB ID *"}
          placeholder={t.seanebIdPlaceholder || "username01"}
          verifyLabel={t.seanebIdVerifyLabel || t.verify || "Verify"}
          checkingLabel={t.seanebIdCheckingLabel || t.verifying || "Checking..."}
          verifiedLabel={`${t.seanebIdVerifiedLabel || t.verified || "Verified"} \u2713`}
          editLabel={t.seanebIdEdit || "Edit SeaNeB ID"}
          formatHint={
            t.seanebIdFormatHelper ||
            "6-30 characters. Lowercase letters, numbers, and hyphen (-) only."
          }
          verifiedMessage={t.seanebIdVerifiedMessage || "SeaNeB ID verified."}
          existsMessage={t.seanebIdExistsMessage || "SeaNeB ID already exists."}
          invalidMessage={t.seanebIdInvalidMessage || "Invalid SeaNeB ID format."}
          verifyFailedMessage={t.seanebIdVerifyFailedMessage || "Unable to verify SeaNeB ID."}
          verifyRequiredMessage={
            t.seanebIdVerifyRequired || "Verify SeaNeB ID before submission."
          }
        />
      </section>

      <div className={`${REG_SECTION_CLASS} mt-4`}>
        <label className="flex gap-2.5 text-[14px] text-(--auth-field-label)">
          <input
            type="checkbox"
            className="mt-[2px] h-4 w-4"
            checked={form.agree}
            onChange={(e) =>
              handleChange("agree", e.target.checked)
            }
          />
          <span>
            I agree to the{" "}
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="border-0 bg-transparent p-0 font-semibold text-[#0f4ec9] underline underline-offset-2"
            >
              terms and conditions
            </button>
          </span>
        </label>

        <PrimaryButton
          className="mt-4"
          disabled={!isFormComplete || loading}
          onClick={handleSubmit}
        >
          {loading ? "Please wait..." : t.submit}
        </PrimaryButton>
        {!isFormComplete && submitBlockers.length > 0 && (
          <p className="mt-2 text-[12px] text-[#d93025]">{submitBlockers[0]}</p>
        )}
      </div>

      <TermsConditionsModal
        open={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms and Conditions"
      />
    </AuthLayout>
  );
}

export default function RegistrationForm() {
  return (
    <Suspense fallback={null}>
      <RegistrationFormContent />
    </Suspense>
  );
}
