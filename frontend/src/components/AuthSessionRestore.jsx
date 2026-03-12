"use client";

import { useEffect } from "react";

import { refreshAccessToken } from "@/lib/auth/apiClient";

export default function AuthSessionRestore() {
  useEffect(() => {
    refreshAccessToken().catch(() => {
      //..
    });
  }, []);

  return null;
}
