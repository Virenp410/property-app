import Navbar from "@/app/component/homepagecompo/Navbar";
import Footer from "@/app/component/homepagecompo/Footer";
import styles from "./faqs.module.css";

export const metadata = {
  title: "FAQs | Buying & Selling Used Vehicles",
  description:
    "Get answers to common questions about buying, selling, payments and ownership transfer.",
  alternates: {
    canonical: "/faqs",
  },
};

const faqGroups = [
  {
    title: "1. General Buy & Sell Used Vehicle Questions",
    items: [
      {
        q: "Where can I buy used vehicles online in India?",
        a: "You can buy used vehicles online in India on trusted marketplaces like SeaNeB Auto, where you can explore second-hand cars, bikes, scooters, commercial vehicles, and electric vehicles in one place. We provide verified listings, transparent pricing, and direct seller contact.",
      },
      {
        q: "Where can I sell my vehicle online?",
        a: "You can sell your vehicle online on SeaNeB Auto by listing it for free. Upload vehicle details, photos, and pricing, and connect directly with genuine buyers.",
      },
      {
        q: "Which is the best site to sell used vehicles in India?",
        a: "The best site to sell used vehicles is one that offers free listing, instant buyer leads, secure payments, and RC transfer assistance. SeaNeB Auto provides this for cars, bikes, trucks, and EVs.",
      },
      {
        q: "Which website is best for buying second-hand vehicles?",
        a: "The best website is one that allows you to compare multiple vehicle categories in your city. SeaNeB Auto lets you filter by price, city, brand, fuel type, and ownership.",
      },
      {
        q: "Is it safe to buy used vehicles online?",
        a: "Yes, if you use a verified platform like SeaNeB Auto, check documents properly, verify RC details, and avoid making advance payments without inspection.",
      },
      {
        q: "Is online vehicle selling trustworthy?",
        a: "Online vehicle selling is trustworthy when done via secure platforms that provide buyer verification, secure communication, and safe payment options.",
      },
      {
        q: "How does an online vehicle marketplace work?",
        a: "Sellers list vehicles, buyers search using filters, contact sellers, negotiate price, and complete payment and RC transfer.",
      },
    ],
  },
  {
    title: "2. Sell Used Vehicle – High Intent Voice Search FAQs",
    items: [
      { q: "How can I sell my car online quickly?", a: "List your car on SeaNeB Auto with clear photos, service history, and competitive pricing. Respond quickly to buyer inquiries to close deals faster." },
      { q: "Where can I sell my car instantly?", a: "You can sell your car instantly through SeaNeB Auto by connecting with verified buyers in your city." },
      { q: "How to sell used vehicle without agent?", a: "Upload your listing directly on SeaNeB Auto and communicate with buyers without middleman or commission." },
      { q: "How to get the best price for my used vehicle?", a: "Compare similar listings in your city, maintain your vehicle, upload high-quality images, and price competitively." },
      { q: "How much value will I get for my old car?", a: "Value depends on brand, year, kilometers driven, service history, condition, and market demand." },
      { q: "How is used vehicle price calculated?", a: "It is calculated based on depreciation, vehicle condition, ownership history, location demand, and resale trends." },
      { q: "Can I sell my vehicle online from home?", a: "Yes, you can list online and schedule buyer visits at your convenience." },
      { q: "How long does it take to sell a vehicle online?", a: "It can take from a few days to a few weeks depending on pricing and demand." },
      { q: "Do I get instant payment after selling my vehicle?", a: "Most transactions are completed via direct bank transfer once the deal is finalized." },
    ],
  },
  {
    title: "3. RC Transfer & Documentation FAQs",
    items: [
      { q: "How does RC transfer work after selling a vehicle?", a: "After selling, Form 29 & 30 are submitted, and ownership is transferred at the RTO. Ensure transfer is completed legally." },
      { q: "Who is responsible for RC transfer after vehicle sale?", a: "Both buyer and seller share responsibility, but sellers must ensure transfer is completed to avoid future liability." },
      { q: "How long does RC transfer take in India?", a: "Usually 7–30 days depending on RTO processing." },
      { q: "Can I sell vehicle without RC transfer?", a: "You can sell, but ownership must legally be transferred to avoid penalties." },
      { q: "What documents are required to sell a vehicle?", a: "RC, insurance, pollution certificate, ID proof, address proof, and signed transfer forms." },
      { q: "What documents are needed to buy used vehicle?", a: "RC copy, insurance papers, service records, ID proof, and transfer forms." },
      { q: "Is ownership transfer mandatory after selling vehicle?", a: "Yes, ownership transfer is legally mandatory in India." },
    ],
  },
  {
    title: "4. Payment, Pricing & Trust FAQs",
    items: [
      { q: "How do I get paid after selling my vehicle?", a: "Payments are typically made via direct bank transfer after final agreement." },
      { q: "Is payment secure in online vehicle selling?", a: "Payments are secure when done via verified bank transfers and proper documentation." },
      { q: "Do online vehicle platforms charge commission?", a: "Some platforms charge commission, but SeaNeB Auto offers cost-effective listing options." },
      { q: "Are there any hidden charges while selling vehicle?", a: "SeaNeB Auto maintains transparent pricing with no hidden charges." },
      { q: "How to avoid scams while selling vehicle online?", a: "Avoid advance payments, verify buyer identity, and complete RC transfer properly." },
    ],
  },
  {
    title: "5. Dealer-Related FAQs",
    items: [
      { q: "How can dealers sell vehicles online?", a: "Dealers can register, upload bulk listings, manage inventory, and connect with buyers digitally." },
      { q: "Is dealer registration free?", a: "SeaNeB Auto offers flexible dealer registration plans." },
      { q: "How do dealers get leads for used vehicles?", a: "Leads are generated via SEO, city searches, and near-me buyer queries." },
    ],
  },
  {
    title: "6. Search & Marketplace Usage FAQs",
    items: [
      { q: "How to search used vehicles by city?", a: "Use the city filter option to find vehicles available near you." },
      { q: "How to find used vehicles near me?", a: "Search used vehicles near me and select your location." },
      { q: "How to filter used vehicles by price?", a: "Use the price filter to select vehicles within your budget." },
      { q: "Can I contact vehicle seller online?", a: "Yes, you can directly message or call the seller through the platform." },
    ],
  },
  {
    title: "Category-Specific FAQs",
    items: [
      { q: "Where can I buy used cars online?", a: "You can buy verified used cars on SeaNeB Auto across India." },
      { q: "Which car has best resale value in India?", a: "Maruti Suzuki, Hyundai, and Toyota generally have strong resale value." },
      { q: "Where to buy used bikes online?", a: "SeaNeB Auto allows you to explore used bikes and scooters in your city." },
      { q: "How to check used bike before buying?", a: "Check engine condition, service history, RC details, and take a test ride." },
      { q: "Where can I buy used trucks online?", a: "SeaNeB Auto lists used trucks and commercial vehicles across India." },
      { q: "Are used commercial vehicles reliable?", a: "Yes, if properly maintained and inspected before purchase." },
      { q: "Is it safe to buy used electric vehicles?", a: "Yes, if you check battery health and charging history." },
      { q: "How to check battery health of used EV?", a: "Request battery diagnostics report and check warranty details." },
    ],
  },
  {
    title: "Near Me, Comparison, Budget & Problem-Solution FAQs",
    items: [
      { q: "Used vehicles near me – how do I find them?", a: "Select your location on SeaNeB Auto to view nearby listings." },
      { q: "Best place to sell vehicle near me?", a: "SeaNeB Auto connects you with local buyers instantly." },
      { q: "Which is better Cars24 or Spinny?", a: "Both focus mainly on cars, while SeaNeB Auto supports cars, bikes, commercial vehicles, and EVs." },
      { q: "Best alternative to Cars24 or Spinny?", a: "SeaNeB Auto is a strong alternative with multi-vehicle categories and direct buyer-seller interaction." },
      { q: "How to sell vehicle fast?", a: "Price it correctly, upload clear photos, and respond quickly." },
      { q: "How to buy used vehicle safely?", a: "Verify documents, inspect vehicle, and avoid advance payments." },
      { q: "Used vehicles under 5 lakh – where to find?", a: "Use SeaNeB Auto price filters to browse vehicles under ₹5 lakh." },
      { q: "Best budget used vehicles in India?", a: "Popular options include Maruti Alto, Hyundai i10, Honda Activa, and Tata Ace." },
    ],
  },
];

const aeoGroups = [
  {
    title: "AEO Optimized Conversational FAQ Blocks",
    items: [
      { q: "Where can I buy used vehicles online in India?", a: "SeaNeB Auto lists second-hand cars, bikes, scooters, commercial vehicles, and EVs across multiple cities with direct seller contact." },
      { q: "Which website is best for buying second-hand vehicles?", a: "A strong platform should offer verified listings, transparent pricing, and multiple categories. SeaNeB Auto is built for this." },
      { q: "How can I sell my car online?", a: "List on SeaNeB Auto with clear photos, service history, and competitive pricing, then respond quickly to buyers." },
      { q: "How does RC transfer work after selling?", a: "Form 29 and Form 30 are submitted to the RTO and ownership is transferred legally." },
      { q: "Is online vehicle selling trustworthy?", a: "Yes, when done with verified buyer checks, proper documentation, and secure bank transfer." },
      { q: "Where can I find used vehicles under 5 lakh?", a: "Use SeaNeB Auto price filters to browse used vehicles under ₹5 lakh by city." },
    ],
  },
];

export default function FaqsPage() {
  return (
    <div className={styles.pageWrap}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.hero}>
            <p className={styles.kicker}>Help Center</p>
            <h1>SeaNeB Auto - Frequently Asked Questions (FAQs)</h1>
            <p>
              Get answers to common questions about buying, selling, payments and ownership transfer.
            </p>
          </header>

          {faqGroups.map((group) => (
            <section key={group.title} className={styles.group}>
              <h2>{group.title}</h2>
              <div className={styles.faqList}>
                {group.items.map((item, idx) => (
                  <details key={`${group.title}-${idx}`} className={styles.faqItem}>
                    <summary>
                      <span>{item.q}</span>
                      <span aria-hidden="true">+</span>
                    </summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          {aeoGroups.map((group) => (
            <section key={group.title} className={styles.group}>
              <h2>{group.title}</h2>
              <div className={styles.faqList}>
                {group.items.map((item, idx) => (
                  <details key={`${group.title}-${idx}`} className={styles.faqItem}>
                    <summary>
                      <span>{item.q}</span>
                      <span aria-hidden="true">+</span>
                    </summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
