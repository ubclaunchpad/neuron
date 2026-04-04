import { AVAILABILITY_SLOTS, SLOTS_PER_DAY } from "@/constants";
import { formatAvailabilityByDay } from "@/utils/availabilityUtils";
import { describe, expect, it } from "vitest";

const emptyAvailability = "0".repeat(AVAILABILITY_SLOTS);

function withSlots(slotIndexes: number[]) {
  const bits = emptyAvailability.split("");
  slotIndexes.forEach((index) => {
    bits[index] = "1";
  });
  return bits.join("");
}

describe("formatAvailabilityByDay", () => {
  it("returns Unavailable for invalid or empty input", () => {
    expect(formatAvailabilityByDay(undefined)).toBe("Unavailable");
    expect(formatAvailabilityByDay("101")).toBe("Unavailable");
    expect(formatAvailabilityByDay(emptyAvailability)).toBe("Unavailable");
  });

  it("formats a single contiguous range for a day", () => {
    // Monday 09:00-12:00 (slots 18-23 inclusive)
    const availability = withSlots(
      Array.from({ length: 6 }, (_, i) => 18 + i),
    );

    const formatted = formatAvailabilityByDay(availability);

    expect(formatted).toContain("Mon 09:00-12:00");
    expect(formatted).toContain("Tue None");
    expect(formatted).not.toBe("Unavailable");
  });

  it("formats multiple ranges and multiple days", () => {
    // Monday 00:00-01:00 (slots 0-1) and 14:00-15:30 (slots 28-30)
    // Wednesday 18:00-20:00 (slots offset by 2 days)
    const mondaySlots = [0, 1, 28, 29, 30];
    const wednesdayOffset = SLOTS_PER_DAY * 2;
    const wednesdaySlots = [wednesdayOffset + 36, wednesdayOffset + 37];

    const availability = withSlots([...mondaySlots, ...wednesdaySlots]);

    const formatted = formatAvailabilityByDay(availability);

    expect(formatted).toContain("Mon 00:00-01:00; 14:00-15:30");
    expect(formatted).toContain("Wed 18:00-19:00");
    expect(formatted).toContain("Sun None");
  });
});
