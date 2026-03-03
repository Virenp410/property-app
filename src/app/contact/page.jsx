import { redirect } from "next/navigation";

const getWebAppUrl = () =>
  String(process.env.NEXT_PUBLIC_WEB_APP_URL || "").replace(/\/$/, "");

export default function ContactRoutePage() {
  redirect(`${getWebAppUrl()}/contact-us`);
}
