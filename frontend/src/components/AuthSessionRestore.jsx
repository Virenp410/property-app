"use client";

import { useEffect } from "react";

import { refreshAccessToken } from "@/lib/auth/apiClient";

export default function AuthSessionRestore() {
  useEffect(() => {
    let isMounted = true;
    let timer;

    const isSso =
      typeof window !== "undefined" &&
      new URL(window.location.href).searchParams.has("bridge_token");

    const runRefresh = async () => {
      if (!isMounted) return;
      try {
        await refreshAccessToken();
      } catch {
        // best effort
      }
    };

    if (isSso) {
      runRefresh();
    } else {
      timer = setTimeout(() => {
        if (isMounted) runRefresh();
      }, 300);
    }

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
