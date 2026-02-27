import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
  pixelBasedPreset,
} from "@react-email/components";
import { Tailwind, type TailwindConfig } from "@react-email/tailwind";
import type { ReactNode } from "react";

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

const tailwindConfig = {
  presets: [pixelBasedPreset],
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
        DEFAULT: "10px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "14px",
      },
      maxWidth: {
        email: "560px",
      },
    },
  },
} satisfies TailwindConfig;

const baseUrl = process.env.BASE_URL
  ? `https://${process.env.BASE_URL}`
  : "http://localhost:3000";

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <style>{`
          .email-shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-muted font-body" style={{ colorScheme: "light" }}>
          <Container className="email-shadow mx-auto mb-16 mt-8 max-w-email overflow-hidden rounded-xl border border-solid border-border bg-card">
            <Section className="border-b border-solid border-border px-10 py-6">
              <Row>
                <Column className="w-10">
                  <Img
                    src={`${baseUrl}/assets/logo.png`}
                    width="40"
                    height="38"
                    alt="BC BWP"
                  />
                </Column>
                <Column className="pl-3 align-middle">
                  <Text className="m-0 font-display text-xl font-light text-primary">
                    BC Brain Wellness Program
                  </Text>
                </Column>
              </Row>
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
