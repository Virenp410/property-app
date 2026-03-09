import { redirect } from "next/navigation";

const getWebAppUrl = () =>
  String(
    process.env.NEXT_PUBLIC_WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
  ).replace(/\/$/, "");

export default function BlogsRoutePage() {
  redirect(`${getWebAppUrl()}/blogs`);
}
