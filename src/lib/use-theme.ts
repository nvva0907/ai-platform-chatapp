"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "chat_theme";

/** Manual dark/light toggle. Initial state read from `.dark` class already
 * applied by the inline FOUC-prevention script in layout.tsx (OS preference
 * or stored override) — this hook only handles user-triggered toggling. */
export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  return { dark, toggle };
}
