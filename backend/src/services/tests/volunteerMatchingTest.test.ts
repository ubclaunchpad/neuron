import { matchVolunteers } from "../volunteerClassMatching.js";
import { Class, Volunteer, ClassPreference, Availability } from "../../common/generated.js";
import {describe, expect, test} from '@jest/globals';

test("Basic functionality with one class and one volunteer", () => {
    const classes: Class[] = [];
    const preferences: ClassPreference[] = [];
    const availabilities: Availability[] = [];

    const assignments = matchVolunteers(classes, preferences, availabilities);

    expect(assignments).toEqual([{ classId: 1, volunteerId: "v1" }]);
});
