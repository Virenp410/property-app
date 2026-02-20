"use client";

import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function DatePicker({ value, onChange }) {
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
      className="reg-input date-input"
      wrapperClassName="date-picker-wrapper"
      popperClassName="date-picker-popper"
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
    />
  );
}