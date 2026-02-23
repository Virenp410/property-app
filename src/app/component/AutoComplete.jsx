"use client";

import { useState, useEffect, useRef } from "react";
import { getCities } from "@/app/services/city.services";
import useDebounce from "@/app/hook/useDebaunce";

const formatCityLabel = (city) =>
  [city?.city_name, city?.state_name, city?.country_name]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");

export default function AutoComplete({
  value,
  onChange,
  placeholder,
  wrapperClassName = "relative",
  inputClassName = "h-[44px] w-full rounded-[10px] border border-[var(--auth-border)] px-[14px] py-3 text-[14px] text-[var(--color-black)] placeholder:text-[var(--auth-placeholder)] focus:border-[var(--auth-border-strong)] focus:outline-none",
  suggestionBoxClassName = "absolute left-0 top-full z-[60] max-h-[200px] w-full overflow-y-auto rounded-b-[10px] border border-t-0 border-[var(--auth-border)] bg-[var(--color-white)] shadow-[0_10px_25px_rgba(0,0,0,0.12)]",
  suggestionItemClassName = "cursor-pointer px-[14px] py-[10px] text-[14px] text-[var(--color-text-heading)] hover:bg-[var(--color-surface-muted)]",
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
    <div className={wrapperClassName} ref={wrapperRef}>
      <input
        type="text"
        className={inputClassName}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />

      {open && (
        <div className={suggestionBoxClassName}>
          {loading && (
            <div className={suggestionItemClassName}>
              Loading...
            </div>
          )}

          {!loading &&
            cities.length === 0 &&
            debouncedValue?.length >= 2 && (
              <div className={suggestionItemClassName}>
                No cities found
              </div>
            )}

          {!loading &&
            cities.map((city) => (
              <div
                key={`${city.place_id}-${city.city_name}`}
                className={suggestionItemClassName}
                onMouseDown={() => {
                  const label = formatCityLabel(city) || String(city?.city_name || "").trim();
                  onChange({
                    label,
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
