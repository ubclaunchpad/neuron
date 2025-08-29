import { AuthProvider } from "@/providers/auth-provider";
import { RouteProvider } from "@/providers/route-provider";
import "@/styles/globals.scss";
import { TRPCReactProvider } from "@/trpc/react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from 'sonner';

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
                <RouteProvider>
                    <TRPCReactProvider>
                        <AuthProvider>
                            <Toaster />
                            {children}
                        </AuthProvider>
                    </TRPCReactProvider>
                </RouteProvider>
            </body>
        </html>
    );
}