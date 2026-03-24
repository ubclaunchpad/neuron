import { AVAILABILITY_SLOTS, DAYS_PER_WEEK, SLOTS_PER_DAY } from "@/constants";

/**
 * Validates that a bitstring is the correct format for availability
 */
export function isValidAvailabilityBitstring(bitstring: string): boolean {
  return bitstring?.length === AVAILABILITY_SLOTS && /^[01]+$/.test(bitstring);
}

function assertValidDayIndex(dayIndex: number): void {
  if (dayIndex < 0 || dayIndex >= DAYS_PER_WEEK) {
    throw new Error(`Invalid day index: ${dayIndex}. Must be 0-6.`);
  }
}

function assertValidTimeSlotIndex(timeSlotIndex: number): void {
  if (timeSlotIndex < 0 || timeSlotIndex >= SLOTS_PER_DAY) {
    throw new Error(`Invalid time slot index: ${timeSlotIndex}. Must be 0-17.`);
  }
}

/**
 * Converts day index and time slot index to bitstring index
 */
export function getSlotIndex(dayIndex: number, timeSlotIndex: number): number {
  assertValidDayIndex(dayIndex);
  assertValidTimeSlotIndex(timeSlotIndex);
  return dayIndex * SLOTS_PER_DAY + timeSlotIndex;
}

/**
 * Converts bitstring index back to day and time slot indices
 */
export function getSlotPosition(bitIndex: number): {
  dayIndex: number;
  timeSlotIndex: number;
} {
  assertValidDayIndex(bitIndex);
  const dayIndex = Math.floor(bitIndex / SLOTS_PER_DAY);
  const timeSlotIndex = bitIndex % SLOTS_PER_DAY;
  return { dayIndex, timeSlotIndex };
}

/**
 * Checks if a specific time slot is available
 */
export function isSlotAvailable(
  bitstring: string | string[],
  dayIndex: number,
  timeSlotIndex: number,
): boolean {
  // Dont validate bitstring, it's expensive to join and split
  assertValidDayIndex(dayIndex);
  assertValidTimeSlotIndex(timeSlotIndex);
  const index = getSlotIndex(dayIndex, timeSlotIndex);
  return bitstring[index] === "1";
}

/**
 * Sets availability for a specific time slot
 */
export function setSlotAvailability(
  bitstring: string | string[],
  dayIndex: number,
  timeSlotIndex: number,
  available: boolean,
): string {
  // Dont validate bitstring, it's expensive to join and split
  assertValidDayIndex(dayIndex);
  assertValidTimeSlotIndex(timeSlotIndex);
  const index = getSlotIndex(dayIndex, timeSlotIndex);
  const bits = Array.isArray(bitstring) ? bitstring : bitstring.split("");
  bits[index] = available ? "1" : "0";
  return bits.join("");
}

/**
 * Toggles availability for a specific time slot
 */
export function toggleSlotAvailability(
  bitstring: string | string[],
  dayIndex: number,
  timeSlotIndex: number,
): string {
  // Dont validate bitstring, it's expensive to join and split
  assertValidDayIndex(dayIndex);
  assertValidTimeSlotIndex(timeSlotIndex);
  const currentlyAvailable = isSlotAvailable(
    bitstring,
    dayIndex,
    timeSlotIndex,
  );
  return setSlotAvailability(
    bitstring,
    dayIndex,
    timeSlotIndex,
    !currentlyAvailable,
  );
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function formatTime(slotIndex: number): string {
  const minutes = slotIndex * 30;
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

/**
 * Format a bitstring into human-friendly daily ranges.
 * Example: "Mon 09:00-12:00; 14:00-16:30 | Tue None | Wed 18:00-20:00"
 */
export function formatAvailabilityByDay(
  bitstring: string | undefined,
  dayLabels: readonly string[] = DAY_LABELS,
): string {
  if (!bitstring || !isValidAvailabilityBitstring(bitstring)) {
    return "Unavailable";
  }

  const dayStrings: string[] = [];
  let hasAnyAvailability = false;

  for (let day = 0; day < DAYS_PER_WEEK; day++) {
    const start = day * SLOTS_PER_DAY;
    const end = start + SLOTS_PER_DAY;
    const dayBits = bitstring.slice(start, end);

    const ranges: string[] = [];
    let rangeStart: number | null = null;

    for (let i = 0; i <= SLOTS_PER_DAY; i++) {
      const bit = dayBits[i] ?? "0";
      const isAvailable = bit === "1";

      if (isAvailable && rangeStart === null) {
        rangeStart = i;
      }

      if (rangeStart !== null && (!isAvailable || i === SLOTS_PER_DAY)) {
        ranges.push(`${formatTime(rangeStart)}-${formatTime(i)}`);
        rangeStart = null;
      }
    }

    if (ranges.length > 0) {
      hasAnyAvailability = true;
      dayStrings.push(`${dayLabels[day] ?? `Day ${day + 1}` } ${ranges.join("; ")}`);
    } else {
      dayStrings.push(`${dayLabels[day] ?? `Day ${day + 1}` } None`);
    }
  }

  if (!hasAnyAvailability) {
    return "Unavailable";
  }

  return dayStrings.join(" | ");
}
