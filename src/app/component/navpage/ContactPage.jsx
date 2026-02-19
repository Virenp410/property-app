"use client";

import { useState } from "react";
import contactData from "@/app/jsondata/contactPage.json";

const initialFormState = {
  name: "",
  phone: "",
  email: "",
  company: "",
  subject: "",
  question: "",
};

export default function ContactPage() {
  const [form, setForm] = useState(initialFormState);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <main className="contactautos-page">
      <section className="contactautos-hero">
        <div className="contactautos-container">
          <h1>{contactData.hero.title}</h1>
          <p>{contactData.hero.subtitle}</p>
        </div>
      </section>

      <section className="contactautos-channels">
        <div className="contactautos-container">
          <h2>{contactData.channels.title}</h2>
          <div className="contactautos-channel-grid">
            {contactData.channels.cards.map((card) => (
              <article key={card.title} className="contactautos-channel-card">
                <div className="contactautos-channel-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <a href={`mailto:${card.email}`}>{card.email}</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="contactautos-form-section">
        <div className="contactautos-wave" />
        <div className="contactautos-container">
          <div className="contactautos-form-wrap">
            <h2>{contactData.form.title}</h2>
            <p>{contactData.form.subtitle}</p>

            <form className="contactautos-form" onSubmit={handleSubmit}>
              {contactData.form.fields.map((field) => (
                <label
                  key={field.name}
                  className={`contactautos-field contactautos-field--${field.name}`}
                >
                  <span>{field.label} *</span>
                  {field.type === "textarea" ? (
                    <textarea
                      value={form[field.name]}
                      placeholder={field.placeholder}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={form[field.name]}
                      placeholder={field.placeholder}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                    />
                  )}
                </label>
              ))}
              <button type="submit" className="contactautos-submit">
                {contactData.form.submit}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="contactautos-social">
        <div className="contactautos-overlay" />
        <div className="contactautos-container">
          <h2>{contactData.social.title}</h2>
          <div className="contactautos-social-list">
            {contactData.social.items.map((item) => (
              <a
                key={item.name}
                href="#"
                title={item.name}
                className="contactautos-social-item"
                aria-label={item.name}
              >
                {item.abbr}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="contactautos-cta-strip">
        <div className="contactautos-container contactautos-cta-row">
          <div>
            <h3>{contactData.cta.title}</h3>
            <p>{contactData.cta.subtitle}</p>
          </div>
          <button type="button">{contactData.cta.button}</button>
        </div>
      </section>

      <section className="contactautos-faq">
        <div className="contactautos-container contactautos-faq-grid">
          <div>
            <h2>{contactData.faq.title}</h2>
            <p>{contactData.faq.subtitle}</p>
          </div>
          <div className="contactautos-faq-list">
            {contactData.faq.items.map((item) => (
              <details key={item.q} className="contactautos-faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
