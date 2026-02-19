"use client";

import { useState } from "react";

export default function LocationDetector() {
  const [location, setLocation] = useState("Location");
  const [loading, setLoading] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch location");
          }

          const data = await response.json();

          const city =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.village ||
            data?.address?.municipality ||
            data?.address?.county ||
            data?.address?.suburb ||
            data?.address?.state_district ||
            "";

          const state = data?.address?.state || "";

          const fullLocation =
            city && state ? `${city}, ${state}` : city || state || "Your Location";

          setLocation(fullLocation);
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setLocation("Location Found");
        }

        setLoading(false);
      },
      (error) => {
        if (error.code === 1) {
          alert("Location permission denied. Please enable it.");
        } else if (error.code === 2) {
          alert("Location unavailable.");
        } else if (error.code === 3) {
          alert("Location request timed out.");
        }

        console.error(error);
        setLoading(false);
      }
    );
  };

  return (
    <button className="location-pill desktop-location" onClick={detectLocation}>
      <span className="location-dot" aria-hidden="true"></span>
      {loading ? "Detecting..." : location}
    </button>
  );
}
