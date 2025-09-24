"use client";

export function Loader({
  isLoading,
  fallback = null,
  children,
}: {
  isLoading?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return isLoading ? fallback : children;
}
