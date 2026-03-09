import enLogin from "@/app/constant/i18n/en/login.json";
import enRegister from "@/app/constant/i18n/en/register.json";
import enBusinessRegister from "@/app/constant/i18n/en/business_register.json";

import hiLogin from "@/app/constant/i18n/hi/login.json";
import hiRegister from "@/app/constant/i18n/hi/register.json";
import hiBusinessRegister from "@/app/constant/i18n/hi/business_register.json";

import guLogin from "@/app/constant/i18n/gu/login.json";
import guRegister from "@/app/constant/i18n/gu/register.json";
import guBusinessRegister from "@/app/constant/i18n/gu/business_register.json";

const translations = {
  en: { ...enLogin, ...enRegister, ...enBusinessRegister },
  hi: { ...hiLogin, ...hiRegister, ...hiBusinessRegister },
  gu: { ...guLogin, ...guRegister, ...guBusinessRegister },
};

function normalizeLang(lang) {
  const value = String(lang || "en").toLowerCase();
  if (value === "guj") return "gu";
  return value;
}

export default function useTranslation(lang) {
  const normalized = normalizeLang(lang);
  return translations[normalized] || translations.en;
}
