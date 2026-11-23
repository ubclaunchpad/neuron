import { Button, Heading, Section, Text } from "@react-email/components";

import { renderEmail } from "../render";
import { EmailLayout } from "./components/email-layout";

interface ScheduleAssignmentEmailProps {
  volunteerName: string;
  className: string;
  scheduleDescription: string;
  scheduleUrl: string;
  change: "added" | "removed";
}

export function ScheduleAssignmentEmail({
  volunteerName,
  className,
  scheduleDescription,
  scheduleUrl,
  change,
}: ScheduleAssignmentEmailProps) {
  const isAdded = change === "added";

  return (
    <EmailLayout
      preview={
        isAdded
          ? `You have been added to ${className}`
          : `You have been removed from ${className}`
      }
    >
      <Heading
        as="h2"
        className="m-0 mb-2 font-display text-xl font-semibold text-foreground"
      >
        {isAdded ? "New Schedule Assignment" : "Schedule Assignment Removed"}
      </Heading>
      <Text className="mt-0 text-base leading-relaxed text-muted-foreground">
        Hi {volunteerName},
      </Text>
      <Text className="text-base leading-relaxed text-muted-foreground">
        You have been {isAdded ? "added as" : "removed as"} a volunteer for{" "}
        <strong className="text-foreground">{className}</strong>.
      </Text>
      <Section className="my-4 rounded-lg bg-muted p-4">
        <Text className="m-0 text-sm font-medium text-foreground">
          {isAdded ? "Your schedule" : "Removed schedule"}
        </Text>
        <Text className="m-0 mt-1 text-sm text-muted-foreground">
          {scheduleDescription}
        </Text>
      </Section>
      <Section className="my-4 text-center">
        <Button
          href={scheduleUrl}
          className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-white"
        >
          View Schedule
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default ScheduleAssignmentEmail;

export function renderScheduleAssignment(props: ScheduleAssignmentEmailProps) {
  return renderEmail(<ScheduleAssignmentEmail {...props} />);
}
