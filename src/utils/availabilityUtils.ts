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
