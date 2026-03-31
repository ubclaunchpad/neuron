import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface CoverageAvailableEmailProps {
  className: string;
  shiftDate: string;
  coverageRequestId: string;
}

export function CoverageAvailableEmail({
  className,
  shiftDate,
  coverageRequestId,
}: CoverageAvailableEmailProps) {
  return (
    <EmailLayout preview={`Coverage opportunity: ${className} on ${shiftDate}`}>
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        Coverage Opportunity
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        A shift for <strong className="text-foreground">{className}</strong> on{" "}
        <strong className="text-foreground">{shiftDate}</strong> needs coverage.
      </Text>
      <Section className="my-4 text-center">
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/coverage?requestId=${coverageRequestId}`}
          className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-white"
        >
          View Coverage Request
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default CoverageAvailableEmail;

export function renderCoverageAvailable(props: CoverageAvailableEmailProps) {
  return renderEmail(<CoverageAvailableEmail {...props} />);
}
