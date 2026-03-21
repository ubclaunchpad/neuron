import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface ShiftNoCheckinEmailProps {
  className: string;
  shiftDate: string;
  volunteerNames: string;
  volunteerCount: number;
}

export function ShiftNoCheckinEmail({
  className,
  shiftDate,
  volunteerNames,
  volunteerCount,
}: ShiftNoCheckinEmailProps) {
  return (
    <EmailLayout
      preview={`Missed check-in: ${className} on ${shiftDate}`}
    >
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        Missed Check-in
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        {volunteerCount} volunteer{volunteerCount !== 1 ? "s" : ""} did not
        check in for{" "}
        <strong className="text-foreground">{className}</strong> on{" "}
        <strong className="text-foreground">{shiftDate}</strong>.
      </Text>
      <Section className="my-4 rounded-lg bg-muted p-4">
        <Text className="m-0 text-sm font-medium text-foreground">
          Missing Volunteers
        </Text>
        <Text className="m-0 mt-1 text-sm text-muted-foreground">
          {volunteerNames}
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default ShiftNoCheckinEmail;

export function renderShiftNoCheckin(props: ShiftNoCheckinEmailProps) {
  return renderEmail(<ShiftNoCheckinEmail {...props} />);
}
