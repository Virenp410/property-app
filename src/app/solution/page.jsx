import { redirect } from "next/navigation";

export default function SolutionRoutePage() {
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:1003"
  ).replace(/\/$/, "");

  redirect(`${webAppUrl}/solution`);
}
