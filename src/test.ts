import "dotenv/config";
import { exit } from "process";
import { createRequestScope } from "./server/api/di-container";

const ctx = createRequestScope();
// const termService = ctx.cradle.termService;
const shiftService = ctx.cradle.shiftService;

async function main(): Promise<number> {
    try {
        // You can replace this with any backend call you want to test
        const testShift = {
            courseId: "b63a1a9e-225f-4b8e-9a56-83d77a7f35a7",
            scheduleId: "407207f2-ea84-4ebc-8b71-4d023ca014cd",
            date: new Date().toISOString(),
            startAt: new Date("2025-10-05T09:00:00Z").toISOString(),
            endAt: new Date("2025-10-05T10:00:00Z").toISOString(),
        };


        console.log("creating shift");
        const newShiftId = await shiftService.createShift(testShift);
        console.log("shift created:", newShiftId);

        console.log("deleting shift");
        await shiftService.deleteShift({ shiftId: newShiftId });
        console.log("shift deleted");

        return 0;

    } catch (err) {
        console.error("error: ", err);

        return 1;
    }
}

void main().then((exitcode) => {
    exit(exitcode);
});
