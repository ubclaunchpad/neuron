import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface ForgotPasswordEmailProps {
  url: string;
  userName?: string;
}

export function ForgotPasswordEmail({
  url,
  userName,
}: ForgotPasswordEmailProps) {
  return (
    <EmailLayout preview="Reset your password">
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        Reset Your Password
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        Hi{userName ? ` ${userName}` : ""},
      </Text>
      <Text className="text-base leading-relaxed text-muted-foreground">
        We received a request to reset the password for your account. Use the
        button below to set a new password. This link is only valid for a
        limited time.
      </Text>
      <Section className="my-6 text-center">
        <Button
          href={url}
          className="rounded-lg bg-primary px-8 py-3 text-center text-base font-normal text-primary-foreground no-underline"
        >
          Reset Password
        </Button>
      </Section>
      <Text className="text-sm leading-relaxed text-muted-foreground">
        If you did not request a password reset, you can disregard this email.
      </Text>
    </EmailLayout>
  );
}

export default ForgotPasswordEmail;

export function renderForgotPassword(props: ForgotPasswordEmailProps) {
  return renderEmail(<ForgotPasswordEmail {...props} />);
}
