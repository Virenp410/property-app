import { Noto_Sans } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "SeaNeB Autos",
    template: "%s | SeaNeB Autos",
  },
  description: "SeaNeB Autos platform for listings and authentication.",
  icons: {
    icon: "/favicon.png?v=5",
    shortcut: "/favicon.png?v=5",
    apple: "/favicon.png?v=5",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${notoSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
