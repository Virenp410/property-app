import { redirect } from "next/navigation";

export const metadata = {
  title: "About SeaNeB Realty | India's Trusted Hyperlocal Real Estate Platform",
};

const getWebAppUrl = () =>
  String(
    process.env.NEXT_PUBLIC_APP_URL ?? ""
  ).replace(/\/$/, "");

export default function AboutUsRoutePage() {
  redirect(`${getWebAppUrl()}/about-us`);
}
