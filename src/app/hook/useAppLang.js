"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  getServerLangSnapshot,
  getStoredLang,
  normalizeLang,
  setStoredLang,
  subscribeLang,
} from "@/app/services/langStore";

export default function useAppLang(searchParams) {
  const lang = useSyncExternalStore(
    subscribeLang,
    getStoredLang,
    getServerLangSnapshot
  );
  const queryLang = normalizeLang(searchParams?.get("lang"));

  useEffect(() => {
    if (queryLang && queryLang !== lang) {
      setStoredLang(queryLang);
    }
  }, [lang, queryLang]);

  const setLang = useCallback((value) => {
    setStoredLang(value);
  }, []);

  return [lang, setLang];
}
