import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface VerifyNewEmailProps {
  url: string;
  userName?: string;
}

export function VerifyNewEmail({ url, userName }: VerifyNewEmailProps) {
  return (
    <EmailLayout preview="Verify your new email address">
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        Verify Your New Email Address
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        Hi{userName ? ` ${userName}` : ""},
      </Text>
      <Text className="text-base leading-relaxed text-muted-foreground">
        You recently requested to change the email address associated with your
        BC Brain Wellness Program account. Please verify this new email address
        by clicking the button below.
      </Text>
      <Section className="my-6 text-center">
        <Button
          href={url}
          className="rounded-lg bg-primary px-8 py-3 text-center text-base font-normal text-primary-foreground no-underline"
        >
          Verify New Email Address
        </Button>
      </Section>
      <Text className="break-all text-sm leading-relaxed text-muted-foreground">
        Or copy and paste this link: {url}
      </Text>
      <Text className="text-sm leading-relaxed text-muted-foreground">
        If you did not request this change, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default VerifyNewEmail;

export function renderVerifyNewEmail(props: VerifyNewEmailProps) {
  return renderEmail(<VerifyNewEmail {...props} />);
}
