import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface VerifyEmailProps {
  url: string;
  userName?: string;
}

export function VerifyEmail({ url, userName }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Verify your email address">
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        Verify Your Email
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        Hi{userName ? ` ${userName}` : ""},
      </Text>
      <Text className="text-base leading-relaxed text-muted-foreground">
        Welcome to the BC Brain Wellness Program! To get started, please confirm
        your email address by clicking the button below.
      </Text>
      <Section className="my-6 text-center">
        <Button
          href={url}
          className="rounded-lg bg-primary px-8 py-3 text-center text-base font-normal text-primary-foreground no-underline"
        >
          Verify Email Address
        </Button>
      </Section>
      <Text className="text-sm leading-relaxed text-muted-foreground">
        If you did not create an account, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default VerifyEmail;

export function renderVerifyEmail(props: VerifyEmailProps) {
  return renderEmail(<VerifyEmail {...props} />);
}
