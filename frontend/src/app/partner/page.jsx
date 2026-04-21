import { redirect } from "next/navigation";

const getWebAppUrl = () =>
  String(
    process.env.NEXT_PUBLIC_APP_URL ?? ""
  ).replace(/\/$/, "");

export default function PartnerRoutePage() {
  redirect(`${getWebAppUrl()}/partner`);
}
