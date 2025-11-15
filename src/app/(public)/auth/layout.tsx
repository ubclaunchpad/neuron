"use client";

import Logo from "@public/assets/logo.svg";
import * as React from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[100dvh] w-[100dvw] flex">
      {/* Sidebar (desktop and up) */}
      <aside className="hidden md:flex w-[clamp(80px,40%,596px)] h-full p-12 flex-col justify-center items-center gap-12 flex-none bg-sidebar border-r-2 border-outline overflow-hidden">
        <div className="w-full flex flex-col text-center items-center gap-12">
          <div className="w-[15rem] h-auto">
            <Logo className="w-full h-auto" />
          </div>
          <div className="text-primary font-light leading-tight text-2xl">
            BC Brain Wellness <br /> Program
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <main className="w-full h-full flex flex-col justify-center items-center min-h-max">
          {/* Inline header (mobile only) */}
          <div className="md:hidden w-full pt-12 px-8 flex flex-row items-center justify-between gap-4 max-w-md">
            <div className="w-[7.5rem] h-auto shrink-0">
              <Logo className="w-full h-auto" />
            </div>
            <div className="text-primary font-light text-lg leading-tight text-center">
              BC Brain Wellness Program
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
