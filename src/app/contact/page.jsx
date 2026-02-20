import { redirect } from "next/navigation";

export default function ContactRoutePage() {
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  redirect(`${webAppUrl}/contact`);
}
