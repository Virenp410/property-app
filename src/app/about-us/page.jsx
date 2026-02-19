import Navbar from "@/app/component/homepagecompo/Navbar";
import AboutPage from "@/app/component/navpage/AboutPage";
import Footer from "@/app/component/homepagecompo/Footer";
import aboutData from "@/app/jsondata/aboutPage.json";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(/\/$/, "");
const canonical = `${siteUrl}${aboutData.seo.slug}`;

export const metadata = {
  title: aboutData.seo.title,
  description: aboutData.seo.description,
  alternates: {
    canonical,
  },
  openGraph: {
    title: aboutData.seo.title,
    description: aboutData.seo.description,
    url: canonical,
    type: "website",
    siteName: "Seaneb Autos",
    images: [
      {
        url: `${siteUrl}/HomeCar.jpg`,
        width: 1200,
        height: 630,
        alt: "Seaneb Autos used vehicle marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: aboutData.seo.title,
    description: aboutData.seo.description,
    images: [`${siteUrl}/HomeCar.jpg`],
  },
};

export default function AboutUsRoutePage() {
  return (
    <div>
      <Navbar />
      <AboutPage />
      <Footer />
    </div>
  );
}

