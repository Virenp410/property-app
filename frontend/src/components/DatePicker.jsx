"use client";

import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function DatePicker({
  value,
  onChange,
  inputClassName = "h-[44px] w-full rounded-[10px] border border-[var(--auth-border)] px-[14px] py-3 text-[14px] text-[var(--color-black)] placeholder:text-[var(--auth-placeholder)] focus:border-[var(--auth-border-strong)] focus:outline-none",
}) {
  const today = new Date();

  return (
    <ReactDatePicker
      selected={value ? new Date(value) : null}
      onChange={(date) => {
        if (!date) {
          onChange("");
          return;
        }

        const formatted = date.toISOString().split("T")[0];
        onChange(formatted);
      }}
      maxDate={today}
      dateFormat="dd-MM-yyyy"
      placeholderText="DD / MM / YYYY"
      className={inputClassName}
      wrapperClassName="w-full"
      popperClassName="z-[9999]"
      popperPlacement="bottom-start"
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
    />
  );
}
