"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">

      {/* CTA STRIP */}
      {/* <div className="footer-cta">
        <div className="container footer-cta-container">
          <p>
            Join us today and get new customers from nearby locality.
          </p>
          <button className="footer-cta-btn">
            Partner With Us
          </button>
        </div>
      </div> */}

      {/* MAIN FOOTER */}
      <div className="container footer-container">

        <div className="footer-column">
          <div className="footer-brand-logo" aria-label="SeaNeB Autos">
            <Image
              src="/logo/white-logo-2.png"
              alt="SeaNeB"
              width={170}
              height={52}
            />
          </div>
          <p>
            Welcome to our online car marketplace. Browse and discover
            second-hand cars easily.
          </p>
        </div>

        <div className="footer-column">
          <h4>About</h4>
          <ul>
            <li>About SeaNeB</li>
            <li>News & Blogs</li>
            <li>Our Services</li>
            <li>Career</li>
            <li>
              <Link href="/faqs">FAQs</Link>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Policies</h4>
          <ul>
            <li>
              <Link href="/terms-and-conditions">Terms & Conditions</Link>
            </li>
            <li>Privacy Policy</li>
            <li>Refund Policy</li>
            <li>Cookie Policy</li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Contact</h4>
          <ul>
            <li>Help & Support</li>
            <li>Partner with us</li>
            <li>Report a Bug</li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        2026 | All rights reserved.
      </div>

    </footer>
  );
}
