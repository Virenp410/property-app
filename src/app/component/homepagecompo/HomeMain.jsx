/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import homeData from "@/app/jsondata/homePage.json";
import blogsData from "@/app/jsondata/blogsPage.json";
import countries from "@/app/constant/country.json";

export default function HomeMain() {
  const router = useRouter();
  const blogPreview = blogsData.posts.slice(0, 4);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  const handleSearch = (countryObj) => {
    if (!countryObj?.code) return;
    router.push(`/${String(countryObj.code).toLowerCase()}`);
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (!value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const filtered = countries.filter((country) =>
      String(country?.name || "")
        .toLowerCase()
        .includes(value.toLowerCase())
    );

    setSuggestions(filtered.slice(0, 6));
    setShowDropdown(true);
  };

  const handleEnter = (e) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      handleSearch(suggestions[0]);
    }
  };

  useEffect(() => {
    const handleOutside = (event) => {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);
  const heroStats = [
    { value: "25K+", label: "Monthly Active Buyers" },
    { value: "3.2K+", label: "Verified Sellers" },
    { value: "120+", label: "Cities Covered" },
  ];
  const heroTags = [
    "Verified Listings",
    "Direct Buyer-Seller Contact",
    "Location-Based Discovery",
  ];

  return (
    <main className="homepro-page">
      <section className="hero-section homepro-hero">
        <div className="homepro-hero-bg">
          <Image
            src={homeData.hero.backgroundImage}
            alt="SeaNeB Autos background"
            fill
            priority
          />
        </div>
        <div className="homepro-overlay" />
        <div className="homepro-container homepro-hero-content">
          <div className="homepro-hero-panel">
            <p className="homepro-eyebrow">{homeData.hero.eyebrow}</p>
            <h1>{homeData.hero.title}</h1>
            <p className="homepro-subtitle">{homeData.hero.subtitle}</p>
            <div className="homepro-hero-actions">
              <Link href={homeData.hero.primaryCta.href} className="homepro-btn homepro-btn-solid">
                {homeData.hero.primaryCta.label}
              </Link>
              <Link href={homeData.hero.secondaryCta.href} className="homepro-btn homepro-btn-outline">
                {homeData.hero.secondaryCta.label}
              </Link>
            </div>
            <div className="homepro-search-wrap" ref={searchRef}>
              <div className="homepro-search-box">
                <input
                  type="text"
                  value={query}
                  onChange={handleChange}
                  onKeyDown={handleEnter}
                  onFocus={() => query.trim() && setShowDropdown(true)}
                  placeholder="Search country to explore local listings"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (suggestions.length > 0) {
                      handleSearch(suggestions[0]);
                    }
                  }}
                >
                  Search
                </button>
              </div>

              {showDropdown && suggestions.length > 0 && (
                <div className="homepro-search-dropdown">
                  {suggestions.map((country) => (
                    <button
                      key={`${country.code}-${country.name}`}
                      type="button"
                      className="homepro-search-item"
                      onClick={() => handleSearch(country)}
                    >
                      <img src={country.flag} alt={country.name} width={18} height={12} />
                      <span>{country.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="homepro-hero-tags">
              {heroTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="homepro-hero-stats">
              {heroStats.map((item) => (
                <article key={item.label}>
                  <h3>{item.value}</h3>
                  <p>{item.label}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="homepro-countries">
        <div className="homepro-container">
          <h2>Countries We Serve</h2>
          <div className="homepro-country-grid">
            {homeData.countries.map((country) => (
              <Link key={country.code} href={country.href} className="homepro-country-card">
                <span>{country.code}</span>
                <p>{country.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="homepro-links">
        <div className="homepro-container">
          <div className="homepro-links-head">
            <p className="homepro-links-kicker">Platform Navigation</p>
            <h2>Explore Platform Sections</h2>
            <p className="homepro-links-subtitle">
              Jump directly into key SeaNeB modules with fast access for buyers, providers, and support.
            </p>
          </div>
          <div className="homepro-link-grid">
            {homeData.quickLinks.map((item, index) => (
              <article key={item.title} className="homepro-link-card">
                <div className="homepro-link-meta">
                  <span className="homepro-link-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="homepro-link-tag">Section</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Link href={item.href}>
                  {item.cta}
                  <span aria-hidden="true"> -</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="homepro-highlights">
        <div className="homepro-container homepro-highlights-grid">
          <div>
            <h2>Why SeaNeB Works</h2>
            <ul>
              {homeData.featureHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="homepro-highlight-image">
            <Image src="/HomeCar.jpg" alt="SeaNeB highlights" width={520} height={340} />
          </div>
        </div>
      </section>

      <section className="homepro-segments">
        <div className="homepro-container homepro-segment-grid">
          {homeData.sectionCards.map((card) => (
            <article key={card.title} className="homepro-segment-card">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <Link href={card.href}>Learn More</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="homepro-partner-strip">
        <div className="homepro-container homepro-partner-row">
          <div>
            <h3>{homeData.partnerStrip.title}</h3>
            <p>{homeData.partnerStrip.subtitle}</p>
          </div>
          <Link href={homeData.partnerStrip.buttonHref} className="homepro-btn homepro-btn-light">
            {homeData.partnerStrip.buttonLabel}
          </Link>
        </div>
      </section>

      <section className="homepro-faq">
        <div className="homepro-container homepro-faq-grid">
          <div>
            <h2>{homeData.faqPreview.title}</h2>
            <p>{homeData.faqPreview.subtitle}</p>
          </div>
          <div className="homepro-faq-list">
            {homeData.faqPreview.items.map((item, index) => {
              const question = typeof item === "string" ? item : item.q;
              const answer =
                typeof item === "string"
                  ? "Please contact support for more details."
                  : item.a;
              const isOpen = openFaqIndex === index;

              return (
                <article key={question} className={`homepro-faq-item ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="homepro-faq-trigger"
                    onClick={() => setOpenFaqIndex((prev) => (prev === index ? -1 : index))}
                    aria-expanded={isOpen}
                  >
                    <span>{question}</span>
                    <span className="homepro-faq-icon" aria-hidden="true">
                      {isOpen ? "-" : "+"}
                    </span>
                  </button>
                  {isOpen && <p className="homepro-faq-answer">{answer}</p>}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="homepro-blogs">
        <div className="homepro-container">
          <div className="homepro-head-row">
            <h2>Our Blogs</h2>
            <Link href="/blogs">See all</Link>
          </div>
          <div className="homepro-blog-grid">
            {blogPreview.map((post) => (
              <article key={post.id} className="homepro-blog-card">
                <Image src={post.image} alt={post.title} width={320} height={190} />
                <div>
                  <p>{post.date}</p>
                  <h3>{post.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
