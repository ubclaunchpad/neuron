import type { CreateShiftInput, ShiftIdInput } from "@/models/api/shift";
import { type Drizzle } from "@/server/db";
import { schedule } from "@/server/db/schema/schedule";
import { shift } from "@/server/db/schema/shift";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { eq } from "drizzle-orm";

export class ShiftService {
  private readonly db: Drizzle;

  constructor(db: Drizzle) {
    this.db = db;
  }

  async createShift(input: CreateShiftInput): Promise<string> {
    const scheduleRow = await this.db.query.schedule.findFirst({
      where: eq(schedule.id, input.scheduleId),
      columns: {
        id: true,
        courseId: true,
      },
    });

    if (!scheduleRow) {
      throw new NeuronError(`Schedule with id ${input.scheduleId} was not found`, NeuronErrorCodes.NOT_FOUND);
    }

    if (scheduleRow.courseId !== input.courseId) {
      throw new NeuronError(
        "Schedule does not belong to the provided class",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    const [row] = await this.db
      .insert(shift)
      .values({
        courseId: scheduleRow.courseId,
        scheduleId: input.scheduleId,
        date: input.date,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
      })
      .returning({ id: shift.id });

    return row!.id;
  }

  async deleteShift(input: ShiftIdInput): Promise<void> {
    const [deletedRow] = await this.db
      .delete(shift)
      .where(eq(shift.id, input.shiftId))
      .returning({ id: shift.id });

    if (!deletedRow) {
      throw new NeuronError(
        `Shift with id ${input.shiftId} was not found`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }
  }
}
