"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export default function RegistrationForm() {
  const router = useRouter();
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
  }, [router]);

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
    const verifiedEmail = String(getCookie("verified_email") || "").trim();
    const currentEmail = String(form.email || "").trim();

    if (verified === "true" && currentEmail && verifiedEmail === currentEmail) {
      setEmailVerified(true);
    }
  }, [form.email, mounted]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedEmail = String(form.email || "").trim();
  const hasEmail = normalizedEmail.length > 0;
  const isEmailFormatValid = emailRegex.test(normalizedEmail);
  const isEmailRequirementSatisfied =
    !hasEmail || (isEmailFormatValid && emailVerified);

  const isFormComplete =
    form.firstname &&
    form.lastname &&
    isEmailRequirementSatisfied &&
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

      const signupPayload = {
        country_code: mobileData.country_code,
        mobile_number: mobileData.mobile_number,
        first_name: form.firstname,
        last_name: form.lastname,
        gender: form.gender.toLowerCase(),
        dob: form.dob,
        place_id: form.hometown.place_id,
        seaneb_id: form.seanebId,
        product_key: "auto",
      };

      if (hasEmail) {
        signupPayload.email = normalizedEmail;
      }

      const signupResponse = await signupUser(signupPayload);

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

      router.push(`/auth/success?lang=${lang}`);
    } catch (err) {
      alert(err?.response?.data?.message || "Registration failed");
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
      <h2 className="reg-title">{t.completeProfile}</h2>
      <p className="reg-subtitle">{t.profileSubtitle}</p>

      {/* First + Last */}
      <div className="reg-grid">
        <div className="reg-field">
          <label>{t.firstname}</label>
          <input
            className="reg-input"
            value={form.firstname}
            onChange={(e) =>
              handleChange("firstname", e.target.value)
            }
          />
        </div>

        <div className="reg-field">
          <label>{t.lastname}</label>
          <input
            className="reg-input"
            value={form.lastname}
            onChange={(e) =>
              handleChange("lastname", e.target.value)
            }
          />
        </div>
      </div>

      {/* Email + Gender */}
      <div className="reg-grid">
        <div className="reg-field">
          <label>{t.email}</label>
          <div className="verify-input-wrapper">
            <input
              type="email"
              className="reg-input"
              value={form.email}
              onChange={(e) =>
                handleChange("email", e.target.value)
              }
            />

            <button
              type="button"
              className={`verify-btn ${
                emailVerified ? "verified" : ""
              }`}
              disabled={!hasEmail || !isEmailFormatValid || sendingOtp || emailVerified}
              onClick={async () => {
                try {
                  setSendingOtp(true);

                  setCookie("flow", "otp_verified");
                  setJsonCookie("otp_context", {
                    type: "email",
                    email: normalizedEmail,
                    purpose: 1,
                  });

                  await sendEmailOtp({ email: normalizedEmail, purpose: 1 });
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
        <div className="reg-field">
          <label>{t.gender}</label>
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
      <div className="reg-grid">
        <div className="reg-field">
          <label>{t.hometown}</label>
          <AutoComplete
            value={form.hometown.label}
            onChange={(val) =>
              typeof val === "string"
                ? handleHometownTyping(val)
                : handleChange("hometown", val)
            }
          />
        </div>

        <div className="reg-field">
          <label>{t.dob}</label>
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
      />

      <label className="reg-checkbox">
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
