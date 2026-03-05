import enLogin from "@/constants/i18n/en/login.json";
import enOtp from "@/constants/i18n/en/otp.json";
import enRegister from "@/constants/i18n/en/register.json";
import enBusinessRegister from "@/constants/i18n/en/business_register.json";

import hiLogin from "@/constants/i18n/hi/login.json";
import hiOtp from "@/constants/i18n/hi/otp.json";
import hiRegister from "@/constants/i18n/hi/register.json";
import hiBusinessRegister from "@/constants/i18n/hi/business_register.json";

import guLogin from "@/constants/i18n/gu/login.json";
import guOtp from "@/constants/i18n/gu/otp.json";
import guRegister from "@/constants/i18n/gu/register.json";
import guBusinessRegister from "@/constants/i18n/gu/business_register.json";

const EN_TRANSLATIONS = {
  ...enLogin,
  ...enOtp,
  ...enRegister,
  ...enBusinessRegister,
};

const HI_TRANSLATIONS = {
  ...hiLogin,
  ...hiOtp,
  ...hiRegister,
  ...hiBusinessRegister,
};

const GU_TRANSLATIONS = {
  ...guLogin,
  ...guOtp,
  ...guRegister,
  ...guBusinessRegister,
};

const TRANSLATIONS_BY_LANG = {
  en: EN_TRANSLATIONS,
  hi: HI_TRANSLATIONS,
  gu: GU_TRANSLATIONS,
};

function normalizeLang(lang) {
  const value = String(lang || "en").toLowerCase();
  if (value === "guj") {
    return "gu";
  }
  return value;
}

export default function useTranslation(lang) {
  const langCode = normalizeLang(lang);
  const selectedTranslations = TRANSLATIONS_BY_LANG[langCode];

  if (selectedTranslations) {
    return selectedTranslations;
  }

  return EN_TRANSLATIONS;
}
