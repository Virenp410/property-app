import Navbar from "@/app/component/homepagecompo/Navbar";
import Footer from "@/app/component/homepagecompo/Footer";
import Link from "next/link";
import styles from "./terms.module.css";

export const metadata = {
  title: "Terms & Conditions | SeaNeB Auto",
  description:
    "Read the Terms & Conditions for using the SeaNeB Auto application and services.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className={styles.pageWrap}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <Link href="/about-us" className={styles.backButton}>
            ← Back to About Page
          </Link>
          <header className={styles.hero}>
            <p className={styles.badge}>Legal</p>
            <h1>Terms &amp; Conditions</h1>
            <p className={styles.lead}>
              Please read these terms carefully before using the SeaNeB Auto application.
              By downloading or using the app, you agree to be bound by these terms.
            </p>
            <p className={styles.meta}>Effective date: February 16, 2026</p>
          </header>

          <section className={styles.sectionCard}>
            <h2>General Terms</h2>
            <p>
              These terms and conditions apply to the SeaNeB Auto app (hereby referred to as
              "Application") for mobile devices that was created by SeaNeB (hereby referred to as
              "Service Provider") as a Free service.
            </p>
            <p>
              Upon downloading or utilizing the Application, you are automatically agreeing to the
              following terms. It is strongly advised that you thoroughly read and understand these
              terms prior to using the Application.
            </p>
          </section>

          <section className={styles.sectionCard}>
            <h2>Intellectual Property</h2>
            <p>
              Unauthorized copying, modification of the Application, any part of the Application, or
              our trademarks is strictly prohibited. Any attempts to extract the source code of the
              Application, translate the Application into other languages, or create derivative
              versions are not permitted.
            </p>
            <p>
              All trademarks, copyrights, database rights, and other intellectual property rights
              related to the Application remain the property of the Service Provider.
            </p>
          </section>

          <section className={styles.sectionCard}>
            <h2>Service Changes &amp; Charges</h2>
            <p>
              The Service Provider is dedicated to ensuring that the Application is as beneficial and
              efficient as possible. As such, they reserve the right to modify the Application or
              charge for their services at any time and for any reason.
            </p>
            <p>
              The Service Provider assures you that any charges for the Application or its services
              will be clearly communicated to you.
            </p>
          </section>

          <section className={styles.sectionCard}>
            <h2>Data, Security &amp; Device Responsibility</h2>
            <p>
              The Application stores and processes personal data that you have provided to the Service
              Provider in order to provide the Service. It is your responsibility to maintain the
              security of your phone and access to the Application.
            </p>
            <p>
              The Service Provider strongly advise against jail breaking or rooting your phone.
              Such actions may expose your device to malware, viruses, and security vulnerabilities
              and may result in the Application not functioning correctly or at all.
            </p>
          </section>

          <section className={styles.sectionCard}>
            <h2>Connectivity &amp; Network Usage</h2>
            <p>
              Some functions of the Application require an active internet connection. The Service
              Provider cannot be held responsible if the Application does not function at full
              capacity due to lack of access to Wi-Fi or if you have exhausted your data allowance.
            </p>
            <p>
              If you use the application outside Wi-Fi, your mobile provider terms still apply.
              You may incur mobile data or roaming charges, and by using the application, you accept
              responsibility for such charges.
            </p>
          </section>

          <section className={styles.sectionCard}>
            <h2>Liability Limitations</h2>
            <p>
              It is your responsibility to ensure that your device remains charged and usable.
              If your device runs out of battery and you are unable to access the Service, the
              Service Provider cannot be held responsible.
            </p>
            <p>
              While the Service Provider aims to keep content accurate and updated, they rely on
              third-party data sources and accept no liability for direct or indirect losses caused
              by reliance on this functionality.
            </p>
          </section>

          <section className={styles.sectionCard}>
            <h2>Updates, Compatibility &amp; Termination</h2>
            <p>
              The Service Provider may update the application over time. Device operating system
              requirements may change, and you may need to install updates to continue use.
            </p>
            <p>
              The Service Provider may cease providing the application and terminate usage at any
              time without prior notice. Upon termination, rights granted to you under these terms
              end, and you must stop using and, if necessary, delete the application.
            </p>
          </section>

          <section className={styles.sectionCard}>
            <h2>Changes to These Terms and Conditions</h2>
            <p>
              The Service Provider may periodically update these terms. You are advised to review
              this page regularly for changes. Updates will be posted on this page.
            </p>
          </section>

          <section className={styles.sectionCard}>
            <h2>Contact Us</h2>
            <p>
              If you have any questions or suggestions about the Terms and Conditions, please
              contact the Service Provider at{" "}
              <a href="mailto:auto@seaneb.net">auto@seaneb.net</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
