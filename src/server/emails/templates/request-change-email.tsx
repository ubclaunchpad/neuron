import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface RequestChangeEmailProps {
  url: string;
  userName?: string;
}

export function RequestChangeEmail({
  url,
  userName,
}: RequestChangeEmailProps) {
  return (
    <EmailLayout preview="Update your email address">
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        Update Your Email Address
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        Hi{userName ? ` ${userName}` : ""},
      </Text>
      <Text className="text-base leading-relaxed text-muted-foreground">
        We received a request to change the email address for your account to this inbox. Use the
        button below to confirm the change. This link is only valid for a
        limited time.
      </Text>
      <Section className="my-6 text-center">
        <Button
          href={url}
          className="rounded-lg bg-primary px-8 py-3 text-center text-base font-normal text-primary-foreground no-underline"
        >
          Confirm Change
        </Button>
      </Section>
      <Text className="break-all text-sm leading-relaxed text-muted-foreground">
        Or copy and paste this link: {url}
      </Text>
      <Text className="text-sm leading-relaxed text-muted-foreground">
        If you did not request a change, you can disregard this email.
      </Text>
    </EmailLayout>
  );
}

export default RequestChangeEmail;

export function renderRequestChangeEmail(props: RequestChangeEmailProps) {
  return renderEmail(<RequestChangeEmail {...props} />);
}
