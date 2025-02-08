import { VolunteerClassMatcher } from "../volunteerClassMatching.js";
import { Class, Volunteer, ClassPreference, Availability } from "../../common/generated.js";
import { describe, expect, test } from '@jest/globals';

describe("VolunteerClassMatcher Tests", () => {
  test("Test 1: Basic functionality with one class and one volunteer", () => {
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

  test("Test 2: No available volunteers", () => {
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

  test("Test 3: Multiple volunteers, pick highest preference", () => {
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

  test("Test 4: Two classes at same time, two volunteers available", () => {
    const classes: Class[] = [
      {
        class_id: 1,
        class_name: "Math 101",
        end_date: "2025-02-06T11:00:00",
        fk_instructor_id: "inst1",
        instructions: null,
        start_date: "2025-02-06T10:00:00",
        subcategory: null,
        zoom_link: "z-link-101",
        category: null
      },
      {
        class_id: 2,
        class_name: "Physics 101",
        end_date: "2025-02-06T11:00:00",
        fk_instructor_id: "inst2",
        instructions: null,
        start_date: "2025-02-06T10:00:00",
        subcategory: null,
        zoom_link: "z-link-102",
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
        l_name: "Test"
      }
    ];

    const availabilities: Availability[] = [
      {
        availability_id: 1,
        fk_volunteer_id: "v1",
        day: 4,
        start_time: "09:00",
        end_time: "12:00"
      },
      {
        availability_id: 2,
        fk_volunteer_id: "v2",
        day: 4,
        start_time: "09:00",
        end_time: "12:00"
      }
    ];

    const preferences: ClassPreference[] = [
      {
        fk_class_id: 1,
        fk_volunter_id: "v1",
        class_rank: 1
      },
      {
        fk_class_id: 2,
        fk_volunter_id: "v1",
        class_rank: 2
      },
      {
        fk_class_id: 1,
        fk_volunter_id: "v2",
        class_rank: 2
      },
      {
        fk_class_id: 2,
        fk_volunter_id: "v2",
        class_rank: 1
      }
    ];

    const matcher = new VolunteerClassMatcher(volunteers, availabilities, preferences, classes);
    const assignments = matcher.matchVolunteers();

    // Each volunteer should get their top choice
    expect(assignments).toEqual([
      { fk_class_id: 1, fk_volunteer_id: "v1" },
      { fk_class_id: 2, fk_volunteer_id: "v2" }
    ]);
  });

  test("Test 5: Three classes, three volunteers (each with different top preference)", () => {
    const classes: Class[] = [
      {
        class_id: 1,
        class_name: "Morning Class",
        end_date: "2025-02-06T09:00:00",
        fk_instructor_id: "inst1",
        instructions: null,
        start_date: "2025-02-06T08:00:00",
        subcategory: null,
        zoom_link: "z-link-101",
        category: null
      },
      {
        class_id: 2,
        class_name: "Afternoon Class",
        end_date: "2025-02-06T15:00:00",
        fk_instructor_id: "inst2",
        instructions: null,
        start_date: "2025-02-06T14:00:00",
        subcategory: null,
        zoom_link: "z-link-102",
        category: null
      },
      {
        class_id: 3,
        class_name: "Evening Class",
        end_date: "2025-02-06T19:00:00",
        fk_instructor_id: "inst3",
        instructions: null,
        start_date: "2025-02-06T18:00:00",
        subcategory: null,
        zoom_link: "z-link-103",
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
        l_name: "Test"
      },
      {
        volunteer_id: "v3",
        email: "v3@example.com",
        f_name: "Charlie",
        l_name: "Test"
      }
    ];

    // Complex availability patterns
    const availabilities: Availability[] = [
      // V1 has split morning/evening availability
      {
        availability_id: 1,
        fk_volunteer_id: "v1",
        day: 4,
        start_time: "07:00",
        end_time: "10:00"
      },
      {
        availability_id: 2,
        fk_volunteer_id: "v1",
        day: 4,
        start_time: "17:00",
        end_time: "20:00"
      },
      // V2 is only available afternoons
      {
        availability_id: 3,
        fk_volunteer_id: "v2",
        day: 4,
        start_time: "13:00",
        end_time: "16:00"
      },
      // V3 is available all day but has different preferences
      {
        availability_id: 4,
        fk_volunteer_id: "v3",
        day: 4,
        start_time: "07:00",
        end_time: "20:00"
      }
    ];

    const preferences: ClassPreference[] = [
      // V1 prefers morning then evening
      {
        fk_class_id: 1,
        fk_volunter_id: "v1",
        class_rank: 1
      },
      {
        fk_class_id: 3,
        fk_volunter_id: "v1",
        class_rank: 2
      },
      {
        fk_class_id: 2,
        fk_volunter_id: "v1",
        class_rank: 3
      },
      // V2 only wants afternoon
      {
        fk_class_id: 2,
        fk_volunter_id: "v2",
        class_rank: 1
      },
      {
        fk_class_id: 3,
        fk_volunter_id: "v2",
        class_rank: 2
      },
      {
        fk_class_id: 1,
        fk_volunter_id: "v2",
        class_rank: 3
      },
      // V3 prefers evening, then morning, then afternoon
      {
        fk_class_id: 3,
        fk_volunter_id: "v3",
        class_rank: 1
      },
      {
        fk_class_id: 1,
        fk_volunter_id: "v3",
        class_rank: 2
      },
      {
        fk_class_id: 2,
        fk_volunter_id: "v3",
        class_rank: 3
      }
    ];

    const matcher = new VolunteerClassMatcher(volunteers, availabilities, preferences, classes);
    const assignments = matcher.matchVolunteers();

    // Expect optimal assignments based on availability and preferences
    expect(assignments).toEqual([
      { fk_class_id: 1, fk_volunteer_id: "v1" },
      { fk_class_id: 2, fk_volunteer_id: "v2" },
      { fk_class_id: 3, fk_volunteer_id: "v3" }
    ]);
  });

  // TODO: is this the expected behaviour?
  test("Test 6: Edge case: Volunteer available for a shift but no preferences inputted (no matching?)", () => {
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

    const availabilities: Availability[] = [
      {
        availability_id: 1,
        fk_volunteer_id: "v1",
        day: 4,
        start_time: "09:00",
        end_time: "12:00"
      }
    ];

    // Empty preferences array
    const preferences: ClassPreference[] = [];

    const matcher = new VolunteerClassMatcher(volunteers, availabilities, preferences, classes);
    const assignments = matcher.matchVolunteers();

    // Expect no assignments since volunteer hasn't expressed any preferences
    expect(assignments).toEqual([]);
  });

  // currently not passing - matching with the wrong class
  test("Test 7: Two classes at same time, only one volunteer available", () => {
    const classes: Class[] = [
      {
        class_id: 1,
        class_name: "Math 101",
        end_date: "2025-02-06T11:00:00",
        fk_instructor_id: "inst1",
        instructions: null,
        start_date: "2025-02-06T10:00:00",
        subcategory: null,
        zoom_link: "z-link-101",
        category: null
      },
      {
        class_id: 2,
        class_name: "Physics 101",
        end_date: "2025-02-06T11:00:00",
        fk_instructor_id: "inst2",
        instructions: null,
        start_date: "2025-02-06T10:00:00",
        subcategory: null,
        zoom_link: "z-link-102",
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

    const availabilities: Availability[] = [
      {
        availability_id: 1,
        fk_volunteer_id: "v1",
        day: 4,
        start_time: "09:00",
        end_time: "12:00"
      }
    ];

    const preferences: ClassPreference[] = [
      {
        fk_class_id: 1,
        fk_volunter_id: "v1",
        class_rank: 1
      },
      {
        fk_class_id: 2,
        fk_volunter_id: "v1",
        class_rank: 2
      }
    ];

    const matcher = new VolunteerClassMatcher(volunteers, availabilities, preferences, classes);
    const assignments = matcher.matchVolunteers();

    // v1 should be matched to top choice (class 1)
    expect(assignments).toEqual([
      { fk_class_id: 1, fk_volunteer_id: "v1" }
    ]);
  });

  // currently not passing - v1 matching with both classes
  test("Test 8: Two classes, two volunteers, one is only available for one class", () => {
    const classes: Class[] = [
      {
        class_id: 1,
        class_name: "Morning Class",
        end_date: "2025-02-06T09:00:00",
        fk_instructor_id: "inst1",
        instructions: null,
        start_date: "2025-02-06T08:00:00",
        subcategory: null,
        zoom_link: "z-link-101",
        category: null
      },
      {
        class_id: 2,
        class_name: "Afternoon Class",
        end_date: "2025-02-06T15:00:00",
        fk_instructor_id: "inst2",
        instructions: null,
        start_date: "2025-02-06T14:00:00",
        subcategory: null,
        zoom_link: "z-link-102",
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
        l_name: "Test"
      }
    ];

    // Complex availability patterns
    const availabilities: Availability[] = [
      // V1 has split morning/afternoon availability
      {
        availability_id: 1,
        fk_volunteer_id: "v1",
        day: 4,
        start_time: "07:00",
        end_time: "10:00"
      },
      {
        availability_id: 2,
        fk_volunteer_id: "v1",
        day: 4,
        start_time: "13:00",
        end_time: "16:00"
      },
      // V2 is only available afternoons
      {
        availability_id: 3,
        fk_volunteer_id: "v2",
        day: 4,
        start_time: "13:00",
        end_time: "16:00"
      }
    ];

    const preferences: ClassPreference[] = [
      // V1 prefers afternoon then morning
      {
        fk_class_id: 2,
        fk_volunter_id: "v1",
        class_rank: 1
      },
      {
        fk_class_id: 1,
        fk_volunter_id: "v1",
        class_rank: 2
      },
      // V2 only wants afternoon (only available then)
      {
        fk_class_id: 2,
        fk_volunter_id: "v2",
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

    // Expect v2 match with afternoon, v1 with morning, becauase v2 is only available in the afternoon
    expect(assignments).toEqual([
      { fk_class_id: 1, fk_volunteer_id: "v1" },
      { fk_class_id: 2, fk_volunteer_id: "v2" }
    ]);
  });

  test("Test 9: Six volunteers and classes, testing optimal solution finding", () => {
    const classes: Class[] = [
      {
        class_id: 1,
        class_name: "Class 1",
        end_date: "2025-02-06T11:00:00",
        fk_instructor_id: "inst1",
        instructions: null,
        start_date: "2025-02-06T10:00:00",
        subcategory: null,
        zoom_link: "z-link-1",
        category: null
      },
      {
        class_id: 2,
        class_name: "Class 2",
        end_date: "2025-02-06T11:00:00",
        fk_instructor_id: "inst2",
        instructions: null,
        start_date: "2025-02-06T10:00:00",
        subcategory: null,
        zoom_link: "z-link-2",
        category: null
      },
      {
        class_id: 3,
        class_name: "Class 3",
        end_date: "2025-02-06T11:00:00",
        fk_instructor_id: "inst3",
        instructions: null,
        start_date: "2025-02-06T10:00:00",
        subcategory: null,
        zoom_link: "z-link-3",
        category: null
      },
      {
        class_id: 4,
        class_name: "Class 4",
        end_date: "2025-02-06T11:00:00",
        fk_instructor_id: "inst4",
        instructions: null,
        start_date: "2025-02-06T10:00:00",
        subcategory: null,
        zoom_link: "z-link-4",
        category: null
      },
      {
        class_id: 5,
        class_name: "Class 5",
        end_date: "2025-02-06T11:00:00",
        fk_instructor_id: "inst5",
        instructions: null,
        start_date: "2025-02-06T10:00:00",
        subcategory: null,
        zoom_link: "z-link-5",
        category: null
      },
      {
        class_id: 6,
        class_name: "Class 6",
        end_date: "2025-02-06T11:00:00",
        fk_instructor_id: "inst6",
        instructions: null,
        start_date: "2025-02-06T10:00:00",
        subcategory: null,
        zoom_link: "z-link-6",
        category: null
      }
    ];
  
    const volunteers: Volunteer[] = [
      {
        volunteer_id: "v1",
        email: "v1@example.com",
        f_name: "Volunteer",
        l_name: "One"
      },
      {
        volunteer_id: "v2",
        email: "v2@example.com",
        f_name: "Volunteer",
        l_name: "Two"
      },
      {
        volunteer_id: "v3",
        email: "v3@example.com",
        f_name: "Volunteer",
        l_name: "Three"
      },
      {
        volunteer_id: "v4",
        email: "v4@example.com",
        f_name: "Volunteer",
        l_name: "Four"
      },
      {
        volunteer_id: "v5",
        email: "v5@example.com",
        f_name: "Volunteer",
        l_name: "Five"
      },
      {
        volunteer_id: "v6",
        email: "v6@example.com",
        f_name: "Volunteer",
        l_name: "Six"
      }
    ];
  
    // All volunteers available for all shifts
    const availabilities: Availability[] = volunteers.map((v, index) => ({
      availability_id: index + 1,
      fk_volunteer_id: v.volunteer_id,
      day: 4, // Thursday
      start_time: "09:00",
      end_time: "12:00"
    }));
  
    // Complex preference chain
    const preferences: ClassPreference[] = [
      // V1: prefers 1, then 6, then others
      { fk_class_id: 1, fk_volunter_id: "v1", class_rank: 1 },
      { fk_class_id: 6, fk_volunter_id: "v1", class_rank: 2 },
      { fk_class_id: 2, fk_volunter_id: "v1", class_rank: 3 },
      { fk_class_id: 3, fk_volunter_id: "v1", class_rank: 4 },
      { fk_class_id: 4, fk_volunter_id: "v1", class_rank: 5 },
      { fk_class_id: 5, fk_volunter_id: "v1", class_rank: 6 },
  
      // V2: prefers 1, then 2, then others
      { fk_class_id: 1, fk_volunter_id: "v2", class_rank: 1 },
      { fk_class_id: 2, fk_volunter_id: "v2", class_rank: 2 },
      { fk_class_id: 3, fk_volunter_id: "v2", class_rank: 3 },
      { fk_class_id: 4, fk_volunter_id: "v2", class_rank: 4 },
      { fk_class_id: 5, fk_volunter_id: "v2", class_rank: 5 },
      { fk_class_id: 6, fk_volunter_id: "v2", class_rank: 6 },
  
      // V3: prefers 1, then 3, then others
      { fk_class_id: 1, fk_volunter_id: "v3", class_rank: 1 },
      { fk_class_id: 3, fk_volunter_id: "v3", class_rank: 2 },
      { fk_class_id: 2, fk_volunter_id: "v3", class_rank: 3 },
      { fk_class_id: 4, fk_volunter_id: "v3", class_rank: 4 },
      { fk_class_id: 5, fk_volunter_id: "v3", class_rank: 5 },
      { fk_class_id: 6, fk_volunter_id: "v3", class_rank: 6 },
  
      // V4: prefers 1, then 4, then others
      { fk_class_id: 1, fk_volunter_id: "v4", class_rank: 1 },
      { fk_class_id: 4, fk_volunter_id: "v4", class_rank: 2 },
      { fk_class_id: 2, fk_volunter_id: "v4", class_rank: 3 },
      { fk_class_id: 3, fk_volunter_id: "v4", class_rank: 4 },
      { fk_class_id: 5, fk_volunter_id: "v4", class_rank: 5 },
      { fk_class_id: 6, fk_volunter_id: "v4", class_rank: 6 },
  
      // V5: prefers 1, then 5, then others
      { fk_class_id: 1, fk_volunter_id: "v5", class_rank: 1 },
      { fk_class_id: 5, fk_volunter_id: "v5", class_rank: 2 },
      { fk_class_id: 2, fk_volunter_id: "v5", class_rank: 3 },
      { fk_class_id: 3, fk_volunter_id: "v5", class_rank: 4 },
      { fk_class_id: 4, fk_volunter_id: "v5", class_rank: 5 },
      { fk_class_id: 6, fk_volunter_id: "v5", class_rank: 6 },
  
      // V6: prefers 6, then 1, then others
      { fk_class_id: 6, fk_volunter_id: "v6", class_rank: 1 },
      { fk_class_id: 1, fk_volunter_id: "v6", class_rank: 2 },
      { fk_class_id: 2, fk_volunter_id: "v6", class_rank: 3 },
      { fk_class_id: 3, fk_volunter_id: "v6", class_rank: 4 },
      { fk_class_id: 4, fk_volunter_id: "v6", class_rank: 5 },
      { fk_class_id: 5, fk_volunter_id: "v6", class_rank: 6 }
    ];
  
    const matcher = new VolunteerClassMatcher(volunteers, availabilities, preferences, classes);
    const assignments = matcher.matchVolunteers();
  
    // The optimal matching should give v6 their first choice (class 6),
    // which frees up class 1 for v1, allowing everyone to get their first or second choice
    expect(assignments).toEqual([
      { fk_class_id: 1, fk_volunteer_id: "v1" },
      { fk_class_id: 2, fk_volunteer_id: "v2" },
      { fk_class_id: 3, fk_volunteer_id: "v3" },
      { fk_class_id: 4, fk_volunteer_id: "v4" },
      { fk_class_id: 5, fk_volunteer_id: "v5" },
      { fk_class_id: 6, fk_volunteer_id: "v6" }
    ]);
  });

});



/**
(will delete later)
Tests written
- One class and one volunteer, timing+preference match
- One class and one volunteer, volunteer is not available at correct time
- One class and two volunteers, volunteer with higher preference chosen
- Two classes at the same time, two volunteers available - select based on preference
- Three classes and three volunteers, each volunteer has a different top preference and is available for that shift
- One shift and one volunteer, no preferences updated (TODO: is there any chance of this happening?)
- Two classes at the same time, only one volunteer available
- Two classes and two volunteers, one is only available for shift A, other prefers shift A + is available for both

Tests to write
- are there multi-day classes? (e.g. Tuesdays and Thursdays) - should add test cases
    where volunteers are only free for one of the two days, if that exists
- Time boundary cases: volunteer availability covers part of a class time
- Preference edge cases:
    - Multiple volunteers with exact same preference rank for same class
    - Volunteer with no preference but is available (Test 6 - would this happen?)
- Availability patterns
    - Volunteers available on wrong day but right time
- Scale testing
    - Many classes at the same time
    - Many volunteers available for the same slot
    - Large preference lists for any given volunteer
    - Many volunteers with preference for one class - Test 9
- Special cases
    - No classes
    - No volunteers
    - No availability
- Priority handling
    - Situation where best total match requires giving someone their second choice

Questions
- is there a specific way we want to handle priority handling
- is there a requirement that every class be ranked by every volunteer? can you have multiple
    classes have the same rank? (i.e. tied) - I feel like at some point we had an answer to this but
    idk if it changed
- how do we test situations which have multiple reasonable outcomes?
 */