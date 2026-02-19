"use client";

import Image from "next/image";
import appData from "@/app/jsondata/appSection.json";

export default function AppSection() {
  return (
    <section className="app-section">
      <div className="app-container">
        <div className="app-image">
          <Image
            src={appData.image.src}
            alt={appData.image.alt}
            width={appData.image.width}
            height={appData.image.height}
            priority
          />
        </div>

        <div className="app-content">
          <h2 className="app-title">
            {appData.title} <br />
            <span>{appData.subtitle}</span>
          </h2>

          <p className="app-description">
            {appData.description}
          </p>

          <div className="store-buttons">
            {appData.stores.map((store, index) => (
              <a
                key={index}
                href={store.link}
                target="_blank"
                rel="noopener noreferrer"
                className="store-btn"
              >
                <span className="store-small">{store.nameSmall}</span>
                <span className="store-big">{store.nameBig}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
