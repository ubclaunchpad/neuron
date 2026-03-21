import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface CoverageFilledEmailProps {
  className: string;
  shiftDate: string;
  coveredByVolunteerName: string;
  requestingVolunteerName: string;
}

export function CoverageFilledEmail({
  className,
  shiftDate,
  coveredByVolunteerName,
  requestingVolunteerName,
}: CoverageFilledEmailProps) {
  return (
    <EmailLayout preview={`Coverage filled: ${className} on ${shiftDate}`}>
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        Coverage Filled
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        <strong className="text-foreground">{coveredByVolunteerName}</strong>{" "}
        has picked up the shift for{" "}
        <strong className="text-foreground">{className}</strong> on{" "}
        <strong className="text-foreground">{shiftDate}</strong> (originally
        requested by{" "}
        <strong className="text-foreground">{requestingVolunteerName}</strong>).
      </Text>
    </EmailLayout>
  );
}

export default CoverageFilledEmail;

export function renderCoverageFilled(props: CoverageFilledEmailProps) {
  return renderEmail(<CoverageFilledEmail {...props} />);
}
