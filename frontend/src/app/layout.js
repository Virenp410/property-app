import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "SeaNeB Autos",
    template: "%s | SeaNeB Autos",
  },
  description: "SeaNeB Autos platform for listings and authentication.",
  icons: {
    icon: "/logo/white-logo-2.png?v=3",
    shortcut: "/logo/white-logo-2.png?v=3",
    apple: "/logo/white-logo-2.png?v=3",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
