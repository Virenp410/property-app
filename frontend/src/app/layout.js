import { Noto_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import AuthSessionRestore from "@/components/AuthSessionRestore";
 
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});
 
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
     
      {/* Google Tag Manager Script */}
      <Script id="gtm-script" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-NSJ9HFCJ');
        `}
      </Script>
 
      <body
        className={`${notoSans.variable} [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NSJ9HFCJ"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
 
        <AuthSessionRestore />
        {children}
      </body>
    </html>
  );
}
