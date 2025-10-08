import "@/styles/globals.scss";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import HydrationGate from "@/components/utils/HydrationGate";
import { Toaster } from "@/components/utils/Toaster";
import { AuthProvider } from "@/providers/auth-provider";
import { NavigateEventProvider } from "@/providers/navigate-event-provider";
import { RouteProvider } from "@/providers/route-provider";
import { TRPCReactProvider } from "@/trpc/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Neuron",
  description: "TODO",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body>
        <Toaster />
        <HydrationGate/>
        <RouteProvider>
          <NuqsAdapter>
            <TRPCReactProvider>
              <AuthProvider>
                <NavigateEventProvider>{children}</NavigateEventProvider>
              </AuthProvider>
            </TRPCReactProvider>
          </NuqsAdapter>
        </RouteProvider>
      </body>
    </html>
  );
}
