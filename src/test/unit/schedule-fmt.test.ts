import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatCompressedDateList,
  formatScheduleRecurrence,
} from "@/lib/schedule-fmt";

describe("schedule date formatting", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("keeps date-only values on the same calendar day west of UTC", () => {
    vi.stubEnv("TZ", "America/Vancouver");

    expect(formatCompressedDateList(["2026-09-21", "2026-10-05"])).toBe(
      "Sep 21, Oct 5",
    );
    expect(
      formatScheduleRecurrence(
        { type: "single", extraDates: ["2026-09-21"] },
        { style: "short" },
      ),
    ).toBe("Sep 21");
  });
});
