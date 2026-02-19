/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import countries from "@/app/constant/country.json";
import heroData from "@/app/jsondata/homeHero.json";

export default function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  /* ========================================
     ?? Handle Typing
  ======================================== */
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (!value) {
      setSuggestions([]);
      return;
    }

    const filtered = countries.filter((country) =>
      country.name.toLowerCase().includes(value.toLowerCase())
    );

    setSuggestions(filtered.slice(0, 6));
    setShowDropdown(true);
  };

  /* ========================================
     ?? Handle Search (IMPORTANT FIX)
     Use country.code instead of name
  ======================================== */
  const handleSearch = (countryObj) => {
    if (!countryObj) return;

    router.push(`/${countryObj.code.toLowerCase()}`);
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  /* ========================================
     ?? Enter Key Search
  ======================================== */
  const handleEnter = (e) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      handleSearch(suggestions[0]);
    }
  };

  return (
    <section
      className="hero-section"
      style={{ backgroundImage: `url('${heroData.backgroundImage}')` }}
    >
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h2 className="hero-subtitle">{heroData.subtitle}</h2>
        <h1 className="hero-title">{heroData.title}</h1>

        <div className="search-box-wrapper">
          <div className="search-box">
            <input
              type="text"
              placeholder={heroData.searchPlaceholder}
              value={query}
              onChange={handleChange}
              onKeyDown={handleEnter}
              onFocus={() => setShowDropdown(true)}
            />
            <button
              onClick={() => {
                if (suggestions.length > 0) {
                  handleSearch(suggestions[0]);
                }
              }}
            >
              {heroData.searchButtonText}
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((country) => (
                <div
                  key={country.code}
                  className="suggestion-item"
                  onClick={() => handleSearch(country)}
                >
                  <img
                    src={country.flag}
                    alt={country.name}
                    width={20}
                  />
                  {country.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
