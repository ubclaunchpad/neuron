import { VolunteerClassMatcher } from "../volunteerClassMatching.js";
import { Class, Volunteer, ClassPreference, Availability } from "../../common/generated.js";
import { describe, expect, test } from '@jest/globals';

describe("VolunteerClassMatcher Tests", () => {
  test("Basic functionality with one class and one volunteer", () => {
    const classes: Class[] = [
      {
        class_id: 1,
        class_name: "Test Class",
        end_date: "2025-02-06T11:00:00",
        fk_instructor_id: "inst1",
        instructions: null,
        start_date: "2025-02-06T10:00:00",
        subcategory: null,
        zoom_link: "z-link-101",
        category: null
      }
    ];

    const volunteers: Volunteer[] = [
      {
        volunteer_id: "v1",
        email: "v1@example.com",
        f_name: "Alice",
        l_name: "Test"
      }
    ];

    // This volunteer is available exactly during the class time
    const availabilities: Availability[] = [
      {
        availability_id: 1,
        fk_volunteer_id: "v1",
        day: 4, // Suppose 4 = Thursday
        start_time: "09:00",
        end_time: "12:00"
      }
    ];

    // They prefer this class
    const preferences: ClassPreference[] = [
      {
        fk_class_id: 1,
        fk_volunter_id: "v1",
        class_rank: 1
      }
    ];

    // Create instance of your matcher (rename as needed)
    const matcher = new VolunteerClassMatcher(volunteers, availabilities, preferences, classes);
    const assignments = matcher.matchVolunteers();

    expect(assignments).toEqual([
      { fk_class_id: 1, fk_volunteer_id: "v1" }
    ]);
  });

  test("No available volunteers", () => {
    const classes: Class[] = [
      {
        class_id: 1,
        class_name: "Class With No Volunteers",
        end_date: "2025-02-06T11:00:00",
        fk_instructor_id: "inst1",
        instructions: null,
        start_date: "2025-02-06T10:00:00",
        subcategory: null,
        zoom_link: "z-link-101",
        category: null
      }
    ];

    const volunteers: Volunteer[] = [
      {
        volunteer_id: "v1",
        email: "v1@example.com",
        f_name: "Alice",
        l_name: "Test"
      }
    ];

    // Volunteer is not available on the correct day/time
    const availabilities: Availability[] = [
      {
        availability_id: 1,
        fk_volunteer_id: "v1",
        day: 3, // e.g., Wednesday
        start_time: "09:00",
        end_time: "10:00"
      }
    ];

    // They prefer this class, but won't match day/time
    const preferences: ClassPreference[] = [
      {
        fk_class_id: 1,
        fk_volunter_id: "v1",
        class_rank: 1
      }
    ];

    const matcher = new VolunteerClassMatcher(volunteers, availabilities, preferences, classes);
    const assignments = matcher.matchVolunteers();

    // Expect an empty array because no one is available
    expect(assignments).toEqual([]);
  });

  test("Multiple volunteers, pick highest preference", () => {
    const classes: Class[] = [
      {
        class_id: 1,
        class_name: "Example Class",
        end_date: "2025-02-07T11:00:00",
        fk_instructor_id: "inst1",
        instructions: null,
        start_date: "2025-02-07T10:00:00",
        subcategory: null,
        zoom_link: "z-link-101",
        category: null
      }
    ];

    const volunteers: Volunteer[] = [
      {
        volunteer_id: "v1",
        email: "v1@example.com",
        f_name: "Alice",
        l_name: "Test"
      },
      {
        volunteer_id: "v2",
        email: "v2@example.com",
        f_name: "Bob",
        l_name: "Tester"
      }
    ];

    // Both are available on the same day/time
    const availabilities: Availability[] = [
      {
        availability_id: 1,
        fk_volunteer_id: "v1",
        day: 5, // Suppose 5 = Friday
        start_time: "09:00",
        end_time: "12:00"
      },
      {
        availability_id: 2,
        fk_volunteer_id: "v2",
        day: 5, // Friday
        start_time: "09:00",
        end_time: "12:00"
      }
    ];

    // Both volunteers prefer the class, but v1 has a higher priority (lower rank number)
    const preferences: ClassPreference[] = [
      {
        fk_class_id: 1,
        fk_volunter_id: "v1",
        class_rank: 1
      },
      {
        fk_class_id: 1,
        fk_volunter_id: "v2",
        class_rank: 2
      }
    ];

    const matcher = new VolunteerClassMatcher(volunteers, availabilities, preferences, classes);
    const assignments = matcher.matchVolunteers();

    // Expect to assign v1 because they have rank 1 (higher priority)
    expect(assignments).toEqual([
      { fk_class_id: 1, fk_volunteer_id: "v1" }
    ]);
  });
});
