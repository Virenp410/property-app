import { redirect } from "next/navigation";

export default function SolutionRoutePage() {
  const webAppUrl = String(
    process.env.NEXT_PUBLIC_APP_URL ?? ""
  ).replace(/\/$/, "");

  redirect(`${webAppUrl}/solution`);
}
