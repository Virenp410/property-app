"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function PostRegisterRedirectContent() {
  const router = useRouter();
  const webAppUrl = String(process.env.NEXT_PUBLIC_WEB_APP_URL || "").replace(/\/$/, "");

  useEffect(() => {
    const target = `${webAppUrl}/`;
    if (typeof window !== "undefined") {
      window.location.replace(target);
      return;
    }
    router.replace(target);
  }, [router, webAppUrl]);

  return null;
}

export default function PostRegisterPage() {
  return (
    <Suspense fallback={null}>
      <PostRegisterRedirectContent />
    </Suspense>
  );
}

