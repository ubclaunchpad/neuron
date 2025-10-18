"use client";

import { useEffect } from "react";

export default function HydrationGate() {
  useEffect(() => {
    // on next frame, avoid enabling transitions mid-paint
    requestAnimationFrame(() => {
      document.documentElement.classList.add("hydrated");
    });
    return () => document.documentElement.classList.remove("hydrated");
  }, []);
  return null;
}
