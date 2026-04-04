import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface VolunteerDeactivatedEmailProps {
  volunteerName: string;
}

export function VolunteerDeactivatedEmail({
  volunteerName,
}: VolunteerDeactivatedEmailProps) {
  return (
    <EmailLayout preview="Your volunteer account has been deactivated">
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        Your Account Has Been Deactivated
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        Hi <strong className="text-foreground">{volunteerName}</strong>, your
        volunteer account has been deactivated. If you have any questions, please
        reach out to an administrator.
      </Text>
    </EmailLayout>
  );
}

export default VolunteerDeactivatedEmail;

export function renderVolunteerDeactivated(
  props: VolunteerDeactivatedEmailProps,
) {
  return renderEmail(<VolunteerDeactivatedEmail {...props} />);
}
