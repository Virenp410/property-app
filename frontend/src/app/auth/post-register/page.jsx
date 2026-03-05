"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resolveWebSsoRedirectUrl } from "@/services/sso.services";

function PostRegisterRedirectContent() {
  const router = useRouter();
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
  ).replace(/\/$/, "");

  useEffect(() => {
    const run = async () => {
      const target = await resolveWebSsoRedirectUrl({ webAppUrl });
      if (typeof window !== "undefined") {
        window.location.replace(target);
        return;
      }
      router.replace(target);
    };

    run();
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

