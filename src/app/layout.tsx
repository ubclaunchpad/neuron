import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Montserrat, Roboto } from "next/font/google";

import HydrationGate from "@/components/utils/hydration-gate";
import { Toaster } from "@/components/utils/toaster";
import { AuthProvider } from "@/providers/auth-provider";
import { NavigateEventProvider } from "@/providers/navigate-event-provider";
import { RouteProvider } from "@/providers/route-provider";
import { TRPCReactProvider } from "@/trpc/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const fontBody = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const fontDisplay = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
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
    <html lang="en" className={`${fontBody.variable} ${fontDisplay.variable} scroll-smooth`}>
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
