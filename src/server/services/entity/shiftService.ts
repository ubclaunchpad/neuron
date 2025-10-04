import type { ListRequest } from "@/models/api/common";
import { buildShift, type Shift } from "@/models/shift";
import type { ListResponse } from "@/models/list-response";
import { type Drizzle } from "@/server/db";
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { shiftAttendance, shift } from "@/server/db/schema";


export class ShiftService {
    private readonly db: Drizzle;
    constructor(db: Drizzle) {
        this.db = db;
    }

    async getVolunteerShifts(volunteerId: string): Promise<Shift[] | undefined> {
        const resultsShifts = await this.db
            .select()
            .from(shift)
            .innerJoin(shiftAttendance, eq(shift.id, shiftAttendance.shiftId))
            .where(eq(shiftAttendance.userId, volunteerId));
        return resultsShifts.map(({ shift }) => buildShift(shift))  
    }
}