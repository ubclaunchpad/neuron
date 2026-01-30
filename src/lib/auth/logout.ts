"use client";

import { authClient } from "./client";

let isLoggingOut = false;

/**
 * Signs the user out and redirects to the login page.
 * Guarded to avoid repeated calls when multiple requests fail at once.
 */
export async function forceLogout() {
  if (typeof window === "undefined" || isLoggingOut) return;
  isLoggingOut = true;

  try {
    await authClient.signOut();
  } catch (error) {
    console.warn("Failed to sign out cleanly:", error);
  }

  window.location.replace("/auth/login");
}
