import "./globals.css";
import Script from "next/script";
import AuthSessionRestore from "@/components/AuthSessionRestore";

export const metadata = {
  title: {
    default: "SeaNeB Autos",
    template: "%s | SeaNeB Autos",
  },
  description:
    "Discover your perfect used car with SeaNeB Autos. Our user-friendly platform connects buyers and sellers, offering a wide selection of quality pre-owned vehicles. Experience seamless transactions, transparent pricing, and trusted reviews. Find your next car today with SeaNeB Autos.",
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
