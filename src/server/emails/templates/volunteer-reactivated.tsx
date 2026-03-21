import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface VolunteerReactivatedEmailProps {
  volunteerName: string;
}

export function VolunteerReactivatedEmail({
  volunteerName,
}: VolunteerReactivatedEmailProps) {
  return (
    <EmailLayout preview="Your volunteer account has been reactivated">
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        Your Account Has Been Reactivated
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        Hi <strong className="text-foreground">{volunteerName}</strong>, your
        volunteer account has been reactivated. You can log in and start signing
        up for shifts again.
      </Text>
      <Section className="my-4 text-center">
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/schedule`}
          className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-white"
        >
          View Schedule
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default VolunteerReactivatedEmail;

export function renderVolunteerReactivated(
  props: VolunteerReactivatedEmailProps,
) {
  return renderEmail(<VolunteerReactivatedEmail {...props} />);
}
