"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DealerDashSettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/dealerdash?tab=settings");
  }, [router]);

  return (
    <div className="p-8 text-center text-[var(--color-text-muted)]">
      Opening settings...
    </div>
  );
}

