"use client";

import { useEffect, useRef, useState } from "react";

export default function ProfileDropdown({
  fullName,
  seanebId,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onOutsideClick = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const displayName = String(fullName || "").trim() || "Profile";
  const displaySeanebId = String(seanebId || "").trim() || "-";

  return (
    <div className="nav-profile-wrap dash-navbar-profile" ref={menuRef}>
      <button
        type="button"
        className="btn-solid nav-profile-btn dash-navbar-profile-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {displayName}
      </button>

      {open && (
        <div className="nav-profile-menu dash-navbar-profile-menu">
          <div className="nav-profile-grid">
            <ProfileRow label="Full Name" value={displayName} />
            <ProfileRow label="SeaNeB ID" value={displaySeanebId} />
          </div>
          <div className="nav-profile-actions">
            <button
              type="button"
              className="nav-profile-logout"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="nav-profile-row">
      <span>{label}</span>
      <strong>{String(value || "-")}</strong>
    </div>
  );
}
