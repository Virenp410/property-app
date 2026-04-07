import "./globals.css";
import Script from "next/script";
import AuthSessionRestore from "@/components/AuthSessionRestore";

export const metadata = {
  title: {
    default: "SeaNeB Realty",
    template: "%s | SeaNeB Realty",
  },
  description:
    "SeaNeB Realty is India's trusted hyperlocal real estate platform. Discover verified listings, transparent pricing, and local market clarity to buy, sell, or rent with confidence.",
  icons: {
    icon: "/favicon.png?v=5",
    shortcut: "/favicon.png?v=5",
    apple: "/favicon.png?v=5",
  },
};
 
export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="[-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]">
        <AuthSessionRestore />
        <Script
          src="https://sdk.cashfree.com/js/v3/cashfree.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
