import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface CoverageFilledPersonalEmailProps {
  className: string;
  shiftDate: string;
  coveredByVolunteerName: string;
}

export function CoverageFilledPersonalEmail({
  className,
  shiftDate,
  coveredByVolunteerName,
}: CoverageFilledPersonalEmailProps) {
  return (
    <EmailLayout
      preview={`Your coverage request was filled: ${className} on ${shiftDate}`}
    >
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        Your Coverage Request Was Filled
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        Good news!{" "}
        <strong className="text-foreground">{coveredByVolunteerName}</strong>{" "}
        has picked up your shift for{" "}
        <strong className="text-foreground">{className}</strong> on{" "}
        <strong className="text-foreground">{shiftDate}</strong>. You no longer
        need to attend this shift.
      </Text>
    </EmailLayout>
  );
}

export default CoverageFilledPersonalEmail;

export function renderCoverageFilledPersonal(
  props: CoverageFilledPersonalEmailProps,
) {
  return renderEmail(<CoverageFilledPersonalEmail {...props} />);
}
