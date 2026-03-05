import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface InvitationEmailProps {
  inviteUrl: string;
  inviterName: string;
  inviterEmail: string;
}

export function InvitationEmail({
  inviteUrl,
  inviterName,
  inviterEmail,
}: InvitationEmailProps) {
  return (
    <EmailLayout preview={`${inviterName} invited you to BC BWP`}>
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        You&apos;re Invited!
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        <strong className="text-foreground">{inviterName}</strong> (
        {inviterEmail}) has invited you to join BC BWP. Click the button below
        to create your account and get started.
      </Text>
      <Section className="my-6 text-center">
        <Button
          href={inviteUrl}
          className="rounded-lg bg-primary px-8 py-3 text-center text-base font-normal text-primary-foreground no-underline"
        >
          Accept Invitation
        </Button>
      </Section>
      <Text className="break-all text-sm leading-relaxed text-muted-foreground">
        Or copy and paste this link: {inviteUrl}
      </Text>
    </EmailLayout>
  );
}

export default InvitationEmail;

export function renderInvitation(props: InvitationEmailProps) {
  return renderEmail(<InvitationEmail {...props} />);
}
