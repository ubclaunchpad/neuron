import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface CoverageRequestedEmailProps {
  className: string;
  shiftDate: string;
  requestingVolunteerName: string;
  reason: string;
}

export function CoverageRequestedEmail({
  className,
  shiftDate,
  requestingVolunteerName,
  reason,
}: CoverageRequestedEmailProps) {
  return (
    <EmailLayout preview={`Coverage needed: ${className} on ${shiftDate}`}>
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        Coverage Needed
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        <strong className="text-foreground">{requestingVolunteerName}</strong>{" "}
        is requesting coverage for{" "}
        <strong className="text-foreground">{className}</strong> on{" "}
        <strong className="text-foreground">{shiftDate}</strong>.
      </Text>
      <Section className="my-4 rounded-lg bg-muted p-4">
        <Text className="m-0 text-sm font-medium text-foreground">Reason</Text>
        <Text className="m-0 mt-1 text-sm text-muted-foreground">{reason}</Text>
      </Section>
    </EmailLayout>
  );
}

export default CoverageRequestedEmail;

export function renderCoverageRequested(props: CoverageRequestedEmailProps) {
  return renderEmail(<CoverageRequestedEmail {...props} />);
}
