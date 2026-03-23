"use client";

import { useEffect } from "react";

export default function TermsConditionsModal({
  open,
  onClose,
  title = "Terms and Conditions",
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-[rgba(7,20,44,0.72)] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[760px] rounded-[18px] border border-[#c6d8ef] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] shadow-[0_30px_60px_rgba(6,25,67,0.3)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#d7e4f5] px-5 py-4">
          <h3 className="m-0 text-[20px] font-semibold text-[#0f2b5f]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-[10px] border border-[#bed0e8] bg-white px-3 text-[14px] font-semibold text-[#234a84] transition-colors duration-200 hover:bg-[#edf5ff]"
          >
            Close
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4 text-[14px] leading-[1.65] text-[#35557f]">
          <p className="m-0 font-semibold text-[#0f2b5f]">Terms &amp; Conditions</p>
          <p className="mt-3">
            These terms and conditions apply to the SeaNeB Auto app (hereby referred to as
            &quot;Application&quot; for mobile devices that was created by SeaNeB (hereby
            referred to as &quot;Service Provider&quot;) as a Free service.
          </p>
          <p className="mt-3">
            Upon downloading or utilizing the Application, you are automatically agreeing to
            the following terms. It is strongly advised that you thoroughly read and
            understand these terms prior to using the Application.
          </p>
          <p className="mt-3">
            Unauthorized copying, modification of the Application, any part of the Application,
            or our trademarks is strictly prohibited. Any attempts to extract the source code of
            the Application, translate the Application into other languages, or create derivative
            versions are not permitted. All trademarks, copyrights, database rights, and other
            intellectual property rights related to the Application remain the property of the
            Service Provider.
          </p>
          <p className="mt-3">
            The Service Provider is dedicated to ensuring that the Application is as beneficial
            and efficient as possible. As such, they reserve the right to modify the Application
            or charge for their services at any time and for any reason. The Service Provider
            assures you that any charges for the Application or its services will be clearly
            communicated to you.
          </p>
          <p className="mt-3">
            The Application stores and processes personal data that you have provided to the
            Service Provider in order to provide the Service. It is your responsibility to
            maintain the security of your phone and access to the Application. The Service
            Provider strongly advise against jail breaking or rooting your phone, which
            involves removing software restrictions and limitations imposed by the official
            operating system of your device. Such actions could expose your phone to
            malware, viruses, malicious programs, compromise your phone&apos;s security features,
            and may result in the Application not functioning correctly or at all.
          </p>
          <p className="mt-3">
            Please be aware that the Service Provider does not assume responsibility for
            certain aspects. Some functions of the Application require an active internet
            connection, which can be Wi-Fi or provided by your mobile network provider. The
            Service Provider cannot be held responsible if the Application does not function at
            full capacity due to lack of access to Wi-Fi or if you have exhausted your data
            allowance.
          </p>
          <p className="mt-3">
            If you are using the application outside of a Wi-Fi area, please be aware that your
            mobile network provider&apos;s agreement terms still apply. Consequently, you may
            incur charges from your mobile provider for data usage during the connection to
            the application, or other third-party charges. By using the application, you accept
            responsibility for any such charges, including roaming data charges if you use the
            application outside of your home territory (i.e., region or country) without disabling
            data roaming. If you are not the bill payer for the device on which you are using
            the application, they assume that you have obtained permission from the bill
            payer.
          </p>
          <p className="mt-3">
            Similarly, the Service Provider cannot always assume responsibility for your usage
            of the application. For instance, it is your responsibility to ensure that your device
            remains charged. If your device runs out of battery and you are unable to access
            the Service, the Service Provider cannot be held responsible.
          </p>
          <p className="mt-3">
            In terms of the Service Provider&apos;s responsibility for your use of the application, it is
            important to note that while they strive to ensure that it is updated and accurate
            at all times, they do rely on third parties to provide information to them so that
            they can make it available to you. The Service Provider accepts no liability for any
            loss, direct or indirect, that you experience as a result of relying entirely on this
            functionality of the application.
          </p>
          <p className="mt-3">
            The Service Provider may wish to update the application at some point. The
            application is currently available as per the requirements for the operating system
            (and for any additional systems they decide to extend the availability of the
            application to) may change, and you will need to download the updates if you
            want to continue using the application. The Service Provider does not guarantee
            that it will always update the application so that it is relevant to you and/or
            compatible with the particular operating system version installed on your device.
          </p>
          <p className="mt-3">
            However, you agree to always accept updates to the application when offered to
            you. The Service Provider may also wish to cease providing the application and
            may terminate its use at any time without providing termination notice to you.
            Unless they inform you otherwise, upon any termination, (a) the rights and
            licenses granted to you in these terms will end; (b) you must cease using the
            application, and (if necessary) delete it from your device.
          </p>
          <p className="mt-4 font-semibold text-[#0f2b5f]">Changes to These Terms and Conditions</p>
          <p className="mt-3">
            The Service Provider may periodically update their Terms and Conditions.
            Therefore, you are advised to review this page regularly for any changes. The
            Service Provider will notify you of any changes by posting the new Terms and
            Conditions on this page.
          </p>
          <p className="mt-3">
            These terms and conditions are effective as of 2026-02-16
          </p>
          <p className="mt-4 font-semibold text-[#0f2b5f]">Contact Us</p>
          <p className="mt-3">
            If you have any questions or suggestions about the Terms and Conditions, please
            do not hesitate to contact the Service Provider at auto@seaneb.net.
          </p>
        </div>
      </div>
    </div>
  );
}
