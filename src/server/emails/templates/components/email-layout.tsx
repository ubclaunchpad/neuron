import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import type { ReactNode } from "react";

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        primary: "#1a7db7",
        "primary-foreground": "#fafafa",
        foreground: "#0a0a0a",
        muted: "#f5f5f5",
        "muted-foreground": "#737373",
        border: "#d9d9d9",
        card: "#ffffff",
      },
      fontFamily: {
        body: [
          "Roboto",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Montserrat",
          "Roboto",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        DEFAULT: "0.625rem",
      },
    },
  },
};

const baseUrl = process.env.BASE_URL
  ? `https://${process.env.BASE_URL}`
  : "http://localhost:3000";

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-muted font-body">
          <Container className="mx-auto mb-16 mt-8 max-w-140 rounded-xl border border-solid border-border bg-card shadow-sm overflow-hidden">
            <Section className="border-b border-solid border-border px-10 py-6  flex items-center-safe">
              <div className="flex items-center-safe">
                <Img
                  src={`${baseUrl}/assets/logo.png`}
                  width="40"
                  height="38"
                  alt="BC BWP"
                  className="inline-block"
                />
                <Text className="m-0 ml-3 inline-block align-middle font-display text-xl font-light text-primary">
                  BC Brain Wellness Program
                </Text>
              </div>
            </Section>
            <Section className="px-10 py-8">{children}</Section>
            <Section className="border-t border-solid border-border bg-muted px-10 py-6">
              <Text className="m-0 text-xs leading-5 text-muted-foreground">
                This is an automated message from BC BWP. If you have any
                questions, please reach out to your program coordinator.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
