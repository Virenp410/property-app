"use client";

import CustomDropdown from "./CustomDropdown";

const LANG_OPTIONS = [
  { label: "ENG", value: "en" },
  { label: "HIN", value: "hi" },
  { label: "GUJ", value: "gu" },
];

export default function LangSelect({ value, onChange, variant = "lang" }) {
  const normalizedValue = value === "guj" ? "gu" : value;

  return (
    <CustomDropdown
      value={normalizedValue}
      onChange={onChange}
      options={LANG_OPTIONS}
      variant={variant}
    />
  );
}
