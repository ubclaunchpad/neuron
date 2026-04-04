import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import { renderEmail } from "../render";

interface ShiftCancelledEmailProps {
  className: string;
  shiftDate: string;
  cancelReason: string;
  cancelledByName: string;
}

export function ShiftCancelledEmail({
  className,
  shiftDate,
  cancelReason,
  cancelledByName,
}: ShiftCancelledEmailProps) {
  return (
    <EmailLayout preview={`Shift cancelled: ${className} on ${shiftDate}`}>
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        Shift Cancelled
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        A shift for{" "}
        <strong className="text-foreground">{className}</strong> on{" "}
        <strong className="text-foreground">{shiftDate}</strong> has been
        cancelled by {cancelledByName}.
      </Text>
      <Section className="my-4 rounded-lg bg-muted p-4">
        <Text className="m-0 text-sm font-medium text-foreground">Reason</Text>
        <Text className="m-0 mt-1 text-sm text-muted-foreground">
          {cancelReason}
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default ShiftCancelledEmail;

export function renderShiftCancelled(props: ShiftCancelledEmailProps) {
  return renderEmail(<ShiftCancelledEmail {...props} />);
}
