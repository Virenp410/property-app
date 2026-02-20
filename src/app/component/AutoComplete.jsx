"use client";

import { useState, useEffect, useRef } from "react";
import { getCities } from "@/app/services/city.services";
import useDebounce from "@/app/hook/useDebaunce";

export default function AutoComplete({
  value,
  onChange,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 2) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      try {
        setLoading(true);
        const list = await getCities(debouncedValue);
        setCities(Array.isArray(list) ? list : []);
      } catch {
        setCities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [debouncedValue]);

  // close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  return (
    <div className="autocomplete" ref={wrapperRef}>
      <input
        type="text"
        className="reg-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />

      {open && (
        <div className="suggestion-box">
          {loading && (
            <div className="suggestion-item">
              Loading...
            </div>
          )}

          {!loading &&
            cities.length === 0 &&
            debouncedValue?.length >= 2 && (
              <div className="suggestion-item">
                No cities found
              </div>
            )}

          {!loading &&
            cities.map((city) => (
              <div
                key={city.place_id}
                className="suggestion-item"
                onMouseDown={() => {
                  onChange({
                    label: `${city.city_name}, ${city.state_name}, ${city.country_name}`,
                    place_id: city.place_id,
                  });
                  setOpen(false);
                }}
              >
                <strong>{city.city_name}</strong>
                {city.state_name &&
                  `, ${city.state_name}`}
                {city.country_name &&
                  `, ${city.country_name}`}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
