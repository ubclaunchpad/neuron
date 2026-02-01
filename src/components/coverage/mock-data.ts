import { CoverageStatus } from "@/models/api/coverage";
import { addDays, setHours, setMinutes } from "date-fns";
import { type Volunteer } from "@/models/volunteer";
import { type CoverageRequest } from "@/models/coverage";
import type { Role } from "@/models/interfaces";
import type { User } from "@/models/user";

const now = new Date();

const createDate = (daysAdd: number, hour: number, minute: number) => {
  return setMinutes(setHours(addDays(now, daysAdd), hour), minute);
};

const makeVolunteer = (
  id: string,
  name: string,
  lastName: string,
): Volunteer => ({
  id,
  role: "volunteer",
  name,
  lastName,
  email: `${name.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
  status: "active",
  createdAt: now,
  updatedAt: now,
  emailVerified: true,
});

const makeUser = (
  id: string,
  name: string,
  lastName: string,
  role: Role = "instructor",
): User => ({
  id,
  name,
  lastName,
  email: `${name.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
  status: "active",
  role,
  createdAt: now,
  updatedAt: now,
});

/** Reusable instructors */
const instructors = {
  sarah: makeUser("u-1", "Sarah", "Johnson"),
  alex: makeUser("u-2", "Alex", "Miller"),
  priya: makeUser("u-3", "Priya", "Shah"),
  daniel: makeUser("u-4", "Daniel", "Ng"),
  emma: makeUser("u-5", "Emma", "Wilson"),
};

export const mockCoverageRequests: CoverageRequest[] = [
  {
    id: "cr-1",
    status: CoverageStatus.open,
    category: "conflict",
    details: "I have a scheduling conflict.",
    requestingVolunteer: makeVolunteer("1e6d65c5-fe73-4f62-9b7b-cc784c1edff6", "Alice", "Smith"),
    shift: {
      id: "s-1",
      date: "2026-01-31",
      startAt: new Date(2026, 0, 31, 9, 0),
      endAt: new Date(2026, 0, 31, 11, 0),
      class: {
        id: "c-1",
        name: "Introduction to Python",
        termId: "term-2026-winter",
        image: null,
        description: "Learn Python basics",
        meetingURL: null,
        category: "Programming",
        subcategory: "Python",
      },
      instructors: [instructors.sarah],
    },
  },

  {
    id: "cr-2",
    status: CoverageStatus.open,
    category: "health",
    details: "Not feeling well.",
    requestingVolunteer: makeVolunteer("v-2", "Bob", "Jones"),
    shift: {
      id: "s-2",
      date: "2026-02-12",
      startAt: new Date(2026, 1, 12, 10, 0),
      endAt: new Date(2026, 1, 12, 12, 0),
      class: {
        id: "c-2",
        name: "Advanced React",
        termId: "term-2026-winter",
        image: null,
        description: "Hooks and context",
        meetingURL: "https://zoom.us/react",
        category: "Web Development",
        subcategory: "React",
      },
      instructors: [instructors.alex, instructors.priya],
    },
  },

  {
    id: "cr-3",
    status: CoverageStatus.resolved,
    category: "transportation",
    details: "Car broke down.",
    requestingVolunteer: makeVolunteer("v-3", "Charlie", "Brown"),
    coveringVolunteer: makeVolunteer("v-4", "Dana", "White"),
    shift: {
      id: "s-3",
      date: "2026-02-21",
      startAt: new Date(2026, 1, 21, 13, 0),
      endAt: new Date(2026, 1, 21, 15, 0),
      class: {
        id: "c-3",
        name: "Data Structures",
        termId: "term-2026-winter",
        image: null,
        description: "Trees and graphs",
        meetingURL: null,
        category: "Computer Science",
        subcategory: null,
      },
      instructors: [instructors.daniel],
    },
  },

  {
    id: "cr-4",
    status: CoverageStatus.open,
    category: "emergency",
    details: "Family emergency.",
    requestingVolunteer: makeVolunteer("v-5", "Emily", "Clark"),
    shift: {
      id: "s-4",
      date: "2026-03-10",
      startAt: new Date(2026, 2, 10, 8, 30),
      endAt: new Date(2026, 2, 10, 10, 0),
      class: {
        id: "c-4",
        name: "Machine Learning",
        termId: "term-2026-spring",
        image: null,
        description: "Intro to ML",
        meetingURL: null,
        category: "AI",
        subcategory: "Machine Learning",
      },
      instructors: [instructors.emma],
    },
  },

  {
    id: "cr-5",
    status: CoverageStatus.withdrawn,
    category: "other",
    details: "Request no longer needed.",
    requestingVolunteer: makeVolunteer("v-6", "Frank", "Wilson"),
    shift: {
      id: "s-5",
      date: "2026-01-31",
      startAt: new Date(2026, 0, 31, 14, 0),
      endAt: new Date(2026, 0, 31, 16, 0),
      class: {
        id: "c-5",
        name: "Web Development",
        termId: "term-2026-winter",
        image: null,
        description: "HTML & CSS basics",
        meetingURL: null,
        category: "Web Development",
        subcategory: "Frontend",
      },
      instructors: [instructors.alex],
    },
  },

  {
    id: "cr-6",
    status: CoverageStatus.open,
    category: "conflict",
    details: "Overlapping commitment.",
    requestingVolunteer: makeVolunteer("v-7", "Grace", "Lee"),
    shift: {
      id: "s-6",
      date: "2026-02-12",
      startAt: new Date(2026, 1, 12, 16, 0),
      endAt: new Date(2026, 1, 12, 18, 0),
      class: {
        id: "c-6",
        name: "Databases 101",
        termId: "term-2026-winter",
        image: null,
        description: "Relational databases",
        meetingURL: null,
        category: "Data",
        subcategory: "Databases",
      },
      instructors: [instructors.daniel],
    },
  },

  {
    id: "cr-7",
    status: CoverageStatus.resolved,
    category: "health",
    details: "Recovered and covered.",
    requestingVolunteer: makeVolunteer("v-8", "Henry", "Nguyen"),
    coveringVolunteer: makeVolunteer("v-9", "Isabel", "Martinez"),
    shift: {
      id: "s-7",
      date: "2026-02-21",
      startAt: new Date(2026, 1, 21, 9, 0),
      endAt: new Date(2026, 1, 21, 11, 0),
      class: {
        id: "c-7",
        name: "Algorithms",
        termId: "term-2026-winter",
        image: null,
        description: "Sorting and searching",
        meetingURL: null,
        category: "Computer Science",
        subcategory: "Algorithms",
      },
      instructors: [instructors.sarah],
    },
  },

  {
    id: "cr-8",
    status: CoverageStatus.open,
    category: "other",
    details: "Personal reasons.",
    requestingVolunteer: makeVolunteer("v-10", "Julia", "Kim"),
    shift: {
      id: "s-8",
      date: "2026-03-10",
      startAt: new Date(2026, 2, 10, 12, 0),
      endAt: new Date(2026, 2, 10, 14, 0),
      class: {
        id: "c-8",
        name: "UI/UX Basics",
        termId: "term-2026-spring",
        image: null,
        description: "Design fundamentals",
        meetingURL: null,
        category: "Design",
        subcategory: "UX",
      },
      instructors: [instructors.emma],
    },
  },

  {
    id: "cr-9",
    status: CoverageStatus.open,
    category: "emergency",
    details: "Unexpected situation.",
    requestingVolunteer: makeVolunteer("v-11", "Kevin", "ONeil"),
    shift: {
      id: "s-9",
      date: "2026-01-31",
      startAt: new Date(2026, 0, 31, 18, 0),
      endAt: new Date(2026, 0, 31, 20, 0),
      class: {
        id: "c-9",
        name: "Evening JavaScript",
        termId: "term-2026-winter",
        image: null,
        description: "JS for beginners",
        meetingURL: null,
        category: "Programming",
        subcategory: "JavaScript",
      },
      instructors: [instructors.alex],
    },
  },

  {
    id: "cr-10",
    status: CoverageStatus.resolved,
    category: "conflict",
    details: "Travel conflict.",
    requestingVolunteer: makeVolunteer("v-12", "Laura", "Perez"),
    coveringVolunteer: makeVolunteer("v-13", "Michael", "Chen"),
    shift: {
      id: "s-10",
      date: "2026-03-10",
      startAt: new Date(2026, 2, 10, 15, 0),
      endAt: new Date(2026, 2, 10, 17, 0),
      class: {
        id: "c-10",
        name: "Cloud Computing",
        termId: "term-2026-spring",
        image: null,
        description: "Intro to cloud services",
        meetingURL: null,
        category: "Infrastructure",
        subcategory: "Cloud",
      },
      instructors: [instructors.priya],
    },
  },
];
