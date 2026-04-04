import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface ShiftReminderEmailProps {
  className: string;
  shiftDate: string;
  shiftTime: string;
  shiftId: string;
}

export function ShiftReminderEmail({
  className,
  shiftDate,
  shiftTime,
  shiftId,
}: ShiftReminderEmailProps) {
  return (
    <EmailLayout preview={`Shift reminder: ${className} on ${shiftDate}`}>
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        Shift Reminder
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        Your shift for{" "}
        <strong className="text-foreground">{className}</strong> starts at{" "}
        <strong className="text-foreground">{shiftTime}</strong> on{" "}
        <strong className="text-foreground">{shiftDate}</strong>.
      </Text>
      <Section className="my-4 text-center">
        <Button
          href={`${process.env.NEXT_PUBLIC_APP_URL}/schedule?shiftId=${shiftId}`}
          className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-white"
        >
          View Shift
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default ShiftReminderEmail;

export function renderShiftReminder(props: ShiftReminderEmailProps) {
  return renderEmail(<ShiftReminderEmail {...props} />);
}
