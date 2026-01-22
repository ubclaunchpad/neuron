import { CoverageStatus, CoverageRequestCategory } from "@/models/api/coverage";
import { ShiftStatus } from "@/models/shift";
import { addDays, setHours, setMinutes } from "date-fns";

const now = new Date();

const createDate = (daysAdd: number, hour: number, minute: number) => {
  return setMinutes(setHours(addDays(now, daysAdd), hour), minute);
};

export type MockCoverageItem = {
  id: string; // Shift ID
  startAt: Date;
  endAt: Date;
  className: string;
  classDescription: string | null;
  coverageRequestId: string;
  coverageStatus: CoverageStatus;
  category: CoverageRequestCategory;
  details: string;
  requestingVolunteer: {
    id: string;
    name: string;
    lastName: string;
    image?: string;
  };
  coveringVolunteer?: {
    id: string;
    name: string;
    lastName: string;
    image?: string;
  };
  instructor: {
      name: string;
      lastName: string;
  };
  volunteers: Array<{
      name: string;
      lastName: string;
  }>;
  requestedFor: string;
  requestedOn: Date;
};

export const getMockCoverageRequests = (currentUserId: string): MockCoverageItem[] => {
  const items: MockCoverageItem[] = [
    {
      id: "shift-1",
      startAt: createDate(1, 14, 0), // Tomorrow 2pm
      endAt: createDate(1, 16, 0),
      className: "Introduction to Python",
      classDescription: "Basic concepts of Python programming",
      coverageRequestId: "req-1",
      coverageStatus: CoverageStatus.open,
      category: CoverageRequestCategory.conflict,
      details: "I have a dentist appointment.",
      requestingVolunteer: {
        id: "other-user-1",
        name: "Alice",
        lastName: "Smith",
      },
      instructor: { name: "Amy", lastName: "Freedman" },
      volunteers: [{ name: "Bonnie", lastName: "Lu" }, { name: "Martin", lastName: "Uy" }],
      requestedFor: "This session only",
      requestedOn: new Date(),
    },
    {
      id: "shift-2",
      startAt: createDate(2, 10, 0), // Day after tomorrow 10am
      endAt: createDate(2, 12, 0),
      className: "Advanced React",
      classDescription: "Deep dive into hooks and context",
      coverageRequestId: "req-2",
      coverageStatus: CoverageStatus.open,
      category: CoverageRequestCategory.health,
      details: "Not feeling well.",
      requestingVolunteer: {
        id: "other-user-2",
        name: "Bob",
        lastName: "Jones",
      },
      instructor: { name: "Amy", lastName: "Freedman" },
      volunteers: [{ name: "Bonnie", lastName: "Lu" }, { name: "Bob", lastName: "Jones" }],
      requestedFor: "This session only",
      requestedOn: new Date(),
    },
    {
      id: "shift-3",
      startAt: createDate(3, 9, 0),
      endAt: createDate(3, 11, 0),
      className: "Data Structures",
      classDescription: null,
      coverageRequestId: "req-3",
      coverageStatus: CoverageStatus.resolved,
      category: CoverageRequestCategory.transportation,
      details: "Car broke down.",
      requestingVolunteer: {
        id: currentUserId, // Current user requested this
        name: "Me",
        lastName: "Myself",
      },
      coveringVolunteer: {
        id: "other-user-3",
        name: "Charlie",
        lastName: "Brown",
      },
      instructor: { name: "Jerry", lastName: "Freedman" },
      volunteers: [{ name: "Me", lastName: "Myself" }, { name: "Martin", lastName: "Uy" }],
      requestedFor: "This session and future recurring sessions",
      requestedOn: addDays(new Date(), -1),
    },
    {
        id: "shift-4",
        startAt: createDate(5, 13, 0),
        endAt: createDate(5, 15, 0),
        className: "Machine Learning",
        classDescription: "Intro to ML",
        coverageRequestId: "req-4",
        coverageStatus: CoverageStatus.withdrawn,
        category: CoverageRequestCategory.other,
        details: "Changed my mind.",
        requestingVolunteer: {
            id: "other-user-4",
            name: "David",
            lastName: "Wilson",
        },
        instructor: { name: "Amy", lastName: "Freedman" },
        volunteers: [{ name: "Bonnie", lastName: "Lu" }, { name: "David", lastName: "Wilson" }],
        requestedFor: "This session only",
        requestedOn: addDays(new Date(), -2),
    },
    {
        id: "shift-5",
        startAt: createDate(4, 15, 0),
        endAt: createDate(4, 17, 0),
        className: "Web Development",
        classDescription: "HTML & CSS",
        coverageRequestId: "req-5",
        coverageStatus: CoverageStatus.open,
        category: CoverageRequestCategory.emergency,
        details: "Family emergency",
        requestingVolunteer: {
            id: currentUserId,
            name: "Me",
            lastName: "Myself",
        },
        instructor: { name: "Jerry", lastName: "Freedman" },
        volunteers: [{ name: "Me", lastName: "Myself" }],
        requestedFor: "This session only",
        requestedOn: new Date(),
    }

  ];

  return items;
};
