"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AuthLayout from "@/app/component/AuthLayout";
import useTranslation from "@/app/hook/useTranslation";
import AutoComplete from "@/app/component/AutoComplete";
import DatePicker from "@/app/component/DatePicker";
import PrimaryButton from "@/app/component/PrimaryButton";
import CustomDropdown from "@/app/component/CustomDropdown";
import SeanebIdField from "@/app/component/SeanebId";

import { signupUser } from "@/app/services/auth.services";
import { sendEmailOtp } from "@/app/services/otp.services";
import { setSessionTokens } from "@/app/services/api";
import { PRODUCT_KEY } from "@/app/services/productKey";
import {
  getCookie,
  setCookie,
  removeCookie,
  getJsonCookie,
  setJsonCookie,
} from "@/app/services/cookieStore";

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

const getSafeInternalRedirectPath = (value) => {
  const next = String(value || "").trim();
  if (!next) return "";
  if (!next.startsWith("/")) return "";
  if (next.startsWith("//")) return "";
  if (next.startsWith("/auth/login")) return "";
  return next;
};

function RegistrationFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState("en");
  const t = useTranslation(lang);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [emailVerified, setEmailVerified] = useState(false);
  const [seanebVerified, setSeanebVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setMounted(true);

    const queryLang = String(searchParams?.get("lang") || "").trim().toLowerCase();
    if (queryLang) {
      setLang(queryLang);
    }

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
      form.firstname ||
      form.lastname ||
      form.email ||
      form.seanebId;

    if (hasData) {
      setJsonCookie("reg_form_draft", form);
    }
  }, [form, mounted]);

  /* email verified */
  useEffect(() => {
    if (!mounted) return;

    const verified = getCookie("email_verified");
    const verifiedEmail = getCookie("verified_email");

    if (verified === "true" && verifiedEmail === form.email) {
      setEmailVerified(true);
    }
  }, [form.email, mounted]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasEmail = String(form.email || "").trim().length > 0;
  const isValidEmail = emailRegex.test(form.email);
  const emailStepValid = !hasEmail || (isValidEmail && emailVerified);

  const isFormComplete =
    form.firstname &&
    form.lastname &&
    emailStepValid &&
    mobileVerified &&
    form.gender &&
    form.dob &&
    form.hometown.place_id &&
    seanebVerified &&
    form.agree;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (key === "email") {
      setEmailVerified(false);
      removeCookie("email_verified");
      removeCookie("verified_email");
    }

    if (key === "seanebId") {
      setSeanebVerified(false);
    }
  };

  const handleHometownTyping = (text) => {
    setForm((prev) => ({
      ...prev,
      hometown: { label: text, place_id: null },
    }));
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

    try {
      setLoading(true);

            const signupResponse = await signupUser({
        country_code: mobileData.country_code,
        mobile_number: mobileData.mobile_number,
        first_name: form.firstname,
        last_name: form.lastname,
        ...(hasEmail ? { email: form.email } : {}),
        gender: form.gender.toLowerCase(),
        dob: form.dob,
        place_id: form.hometown.place_id,
        seaneb_id: form.seanebId,
        product_key: PRODUCT_KEY,
      });

      const accessToken =
        signupResponse?.access_token || signupResponse?.data?.access_token;
      const csrfToken =
        signupResponse?.csrf_token || signupResponse?.data?.csrf_token;

      if (
        typeof accessToken === "string" &&
        accessToken.length > 10 &&
        typeof csrfToken === "string" &&
        csrfToken.length > 10
      ) {
        setSessionTokens({
          access_token: accessToken,
          csrf_token: csrfToken,
        });
      }

      const fullName = `${String(form.firstname || "").trim()} ${String(form.lastname || "").trim()}`.trim();
      if (fullName) {
        setCookie("user_display_name", fullName, { days: 365 });
      }


      /* cleanup AFTER success */
      removeCookie("reg_form_draft");
      removeCookie("email_verified");
      removeCookie("verified_email");
      // Keep verified_mobile/otp_context so dealer business flow can re-send
      // mobile OTP with correct country code.
      const redirectFromQuery = searchParams?.get("redirect_to");
      const redirectFromCookie = getCookie("post_auth_redirect");
      const postAuthRedirect =
        getSafeInternalRedirectPath(redirectFromQuery) ||
        getSafeInternalRedirectPath(redirectFromCookie);
      if (postAuthRedirect) {
        setCookie("post_auth_redirect", postAuthRedirect, { days: 1 });
        router.push(
          `/auth/success?lang=${lang}&redirect_to=${encodeURIComponent(postAuthRedirect)}`
        );
        return;
      }
      router.push(`/auth/success?lang=${lang}`);
    } catch (err) {
      alert(err?.response?.data?.message || "Registration failed" || response?.data?.error?.message);
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
      <h2 className="text-[26px] font-semibold text-black">{t.completeProfile}</h2>
      <p className="mt-1.5 text-[14px] text-(--auth-muted)">{t.profileSubtitle}</p>

      {/* First + Last */}
      <div className="mb-5 mt-5.5 grid grid-cols-2 gap-5.5 [@media(max-width:640px)]:grid-cols-1">
        <div className="min-w-0">
          <label className="mb-1.5 block text-[14px] text-(--auth-field-label)">{t.firstname}</label>
          <input
            className="h-11 w-full rounded-[10px] border border-(--auth-border) px-3.5 py-3 text-[14px] text-black placeholder:text-(--auth-placeholder) focus:border-(--auth-border-strong) focus:outline-none"
            value={form.firstname}
            onChange={(e) =>
              handleChange("firstname", e.target.value)
            }
          />
        </div>

        <div className="min-w-0">
          <label className="mb-1.5 block text-[14px] text-(--auth-field-label)">{t.lastname}</label>
          <input
            className="h-11 w-full rounded-[10px] border border-(--auth-border) px-3.5 py-3 text-[14px] text-black placeholder:text-(--auth-placeholder) focus:border-(--auth-border-strong) focus:outline-none"
            value={form.lastname}
            onChange={(e) =>
              handleChange("lastname", e.target.value)
            }
          />
        </div>
      </div>

      {/* Email + Gender */}
      <div className="mb-5 mt-5.5 grid grid-cols-2 gap-5.5 [@media(max-width:640px)]:grid-cols-1">
        <div className="min-w-0">
          <label className="mb-1.5 block text-[14px] text-(--auth-field-label)">{t.email} (Optional)</label>
          <div className="relative w-full">
            <input
              type="email"
              className="h-11 w-full rounded-[10px] border border-(--auth-border) px-3.5 py-3 pr-22.5 text-[14px] text-black placeholder:text-(--auth-placeholder) focus:border-(--auth-border-strong) focus:outline-none"
              value={form.email}
              onChange={(e) =>
                handleChange("email", e.target.value)
              }
            />

            <button
              type="button"
              className={`absolute right-2.5 top-1/2 h-8 -translate-y-1/2 whitespace-nowrap rounded-md border px-3 text-[12px] ${
                emailVerified
                  ? "cursor-default border-(--color-success) bg-(--color-success) text-white"
                  : "border-(--auth-border-light) bg-white text-black hover:bg-(--color-surface-muted)"
              }`}
              disabled={!isValidEmail || sendingOtp}
              onClick={async () => {
                try {
                  setSendingOtp(true);

                  setCookie("flow", "otp_verified");
                  setJsonCookie("otp_context", {
                    type: "email",
                    email: form.email,
                    purpose: 1,
                  });

                  await sendEmailOtp({ email: form.email, purpose: 1 });
                  router.push(`/auth/otp?type=email&lang=${lang}`);
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
          <label className="mb-1.5 block text-[14px] text-(--auth-field-label)">{t.gender}</label>
          <CustomDropdown
            value={form.gender}
            onChange={(val) =>
              handleChange("gender", val)
            }
            options={GENDER_OPTIONS}
            placeholder={t.select}
          />
        </div>
      </div>

      {/* Hometown */}
      <div className="mb-5 mt-5.5 grid grid-cols-2 gap-5.5 [@media(max-width:640px)]:grid-cols-1">
        <div className="min-w-0">
          <label className="mb-1.5 block text-[14px] text-(--auth-field-label)">{t.hometown}</label>
          <AutoComplete
            value={form.hometown.label}
            onChange={(val) =>
              typeof val === "string"
                ? handleHometownTyping(val)
                : handleChange("hometown", val)
            }
          />
        </div>

        <div className="min-w-0">
          <label className="mb-1.5 block text-[14px] text-(--auth-field-label)">{t.dob}</label>
          <DatePicker
            value={form.dob}
            onChange={(val) =>
              handleChange("dob", val)
            }
          />
        </div>
      </div>

      <SeanebIdField
        value={form.seanebId}
        onChange={(val) =>
          handleChange("seanebId", val)
        }
        verified={seanebVerified}
        setVerified={setSeanebVerified}
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

      <label className="mt-5.5 flex gap-2.5 text-[14px] text-(--auth-field-label)">
        <input
          type="checkbox"
          checked={form.agree}
          onChange={(e) =>
            handleChange("agree", e.target.checked)
          }
        />
        {t.terms}
      </label>

      <PrimaryButton
        disabled={!isFormComplete || loading}
        onClick={handleSubmit}
      >
        {loading ? "Please wait..." : t.submit}
      </PrimaryButton>
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

