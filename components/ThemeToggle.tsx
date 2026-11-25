"use client";

import { useEffect, useState } from "react";

function systemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function currentlyDark() {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr ? attr === "dark" : systemDark();
}

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(currentlyDark());
  }, []);

  function toggle() {
    const next = currentlyDark() ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("kole-theme", next);
    } catch {}
    setDark(next === "dark");
  }

  return (
    <button className="theme" type="button" onClick={toggle} aria-label="Switch colour theme">
      {dark === null ? "Theme" : dark ? "Light" : "Dark"}
    </button>
  );
}
