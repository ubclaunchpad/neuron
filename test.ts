import type { ScheduleRuleInput } from "@/models/api/schedule";
import { Temporal } from "@js-temporal/polyfill";
import { exit } from "process";
import { createRequestScope } from "./src/server/api/di-container";

const ctx = createRequestScope();
const termService = ctx.cradle.termService;
const classService = ctx.cradle.classService;

const classes = [
    {
        termId: "1fb6a66a-0564-433e-8ff2-64af1d29cd29",
        name: "Virtually Together in Song",
        description:
            "Group singing in a low-latency virtual studio with movement, music learning, and supportive dialogue. Instructor: Cynthia Friesen.",
        category: "Creative & Expressive",
        schedules: [
            {
                localStartTime: Temporal.PlainTime.from(Temporal.PlainTime.from("15:00:00")),
                localEndTime: Temporal.PlainTime.from("16:00:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "weekly", weekday: "MO", interval: 1 } satisfies ScheduleRuleInput,
            },
        ],
    },
    {
        termId: "1fb6a66a-0564-433e-8ff2-64af1d29cd29",
        name: "Artful Living",
        description:
            "Show & Tell plus deep dives into an artist’s life and inspirations; conversation-driven creativity. Instructor: Jean Ward.",
        category: "Creative & Expressive",
        schedules: [
            {
                localStartTime: Temporal.PlainTime.from("11:00:00"),
                localEndTime: Temporal.PlainTime.from("12:30:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "weekly", weekday: "FR", interval: 1 } satisfies ScheduleRuleInput,
            },
        ],
    },
    {
        termId: "1fb6a66a-0564-433e-8ff2-64af1d29cd29",
        name: "Art From the Heart",
        description:
            "Supportive visual-arts classes (scribble drawing, mandalas, music-led painting, intuitive works). Instructor: Mady Mooney (Art Therapist).",
        category: "Creative & Expressive",
        schedules: [
            {
                localStartTime: Temporal.PlainTime.from("10:30:00"),
                localEndTime: Temporal.PlainTime.from("12:00:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "weekly", weekday: "TH", interval: 1 } satisfies ScheduleRuleInput,
            },
            {
                localStartTime: Temporal.PlainTime.from("12:30:00"),
                localEndTime: Temporal.PlainTime.from("14:15:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "weekly", weekday: "TH", interval: 1 } satisfies ScheduleRuleInput,
            },
            {
                localStartTime: Temporal.PlainTime.from("09:00:00"),
                localEndTime: Temporal.PlainTime.from("10:30:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "weekly", weekday: "FR", interval: 1 } satisfies ScheduleRuleInput,
            },
        ],
    },
    {
        termId: "1fb6a66a-0564-433e-8ff2-64af1d29cd29",
        name: "Mindfulness",
        description: "MBSR-based practices for focus, calm, and well-being.",
        category: "Creative & Expressive",
        schedules: [
            {
                localStartTime: Temporal.PlainTime.from("14:30:00"),
                localEndTime: Temporal.PlainTime.from("16:00:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "weekly", weekday: "TH", interval: 1 } satisfies ScheduleRuleInput,
            },
        ],
    },
    {
        termId: "1fb6a66a-0564-433e-8ff2-64af1d29cd29",
        name: "Gardening and Cooking in Season",
        description: "Explore seasonal gardening and cooking; all levels welcome.",
        category: "Creative & Expressive",
        schedules: [
            {
                localStartTime: Temporal.PlainTime.from("15:00:00"),
                localEndTime: Temporal.PlainTime.from("16:15:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "weekly", weekday: "WE", interval: 1 } satisfies ScheduleRuleInput,
            },
        ],
    },
    {
        termId: "1fb6a66a-0564-433e-8ff2-64af1d29cd29",
        name: "Crafters for a Cause",
        description: "Monthly maker meet-up to create items for community organizations; occasional guest speakers. Instructor: Elaine Book.",
        category: "Creative & Expressive",
        schedules: [
            {
                localStartTime: Temporal.PlainTime.from("15:30:00"),
                localEndTime: Temporal.PlainTime.from("16:30:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "monthly", weekday: "MO", nth: 4 } satisfies ScheduleRuleInput,
            },
        ],
    },
    {
        termId: "1fb6a66a-0564-433e-8ff2-64af1d29cd29",
        name: "Brain Wellness Book Club",
        description: "Monthly discussion group (member-chosen books). Fall picks: Sep—The Children Act; Oct—Revenge of the Tipping Point; Nov—My Friends",
        category: "Creative & Expressive",
        schedules: [
            {
                localStartTime: Temporal.PlainTime.from("10:00:00"),
                localEndTime: Temporal.PlainTime.from("11:00:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "monthly", weekday: "SA", nth: 2 } satisfies ScheduleRuleInput,
            },
        ],
    },
    {
        termId: "1fb6a66a-0564-433e-8ff2-64af1d29cd29",
        name: "Improv for Brain Health",
        description: "Improvisation games to build presence, listening, spontaneity, and connection.",
        category: "Creative & Expressive",
        schedules: [
            {
                localStartTime: Temporal.PlainTime.from("12:30:00"),
                localEndTime: Temporal.PlainTime.from("14:00:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "weekly", weekday: "TU", interval: 1 } satisfies ScheduleRuleInput,
            },
        ],
    },
    {
        termId: "1fb6a66a-0564-433e-8ff2-64af1d29cd29",
        name: "Healing From Within: Pain Reprocessing Therapy & Emotion Education",
        description: "Explore PRT tools to reframe neuroplastic pain, reduce fear, and strengthen brain–body connection.",
        category: "Creative & Expressive",
        schedules: [
            {
                localStartTime: Temporal.PlainTime.from("12:30:00"),
                localEndTime: Temporal.PlainTime.from("13:30:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "weekly", weekday: "MO", interval: 1 } satisfies ScheduleRuleInput,
            },
        ],
    },
    {
        termId: "1fb6a66a-0564-433e-8ff2-64af1d29cd29",
        name: "SongShine",
        description: "Breath, diction, articulation, and singing to reclaim and strengthen voices affected by neurological conditions.",
        category: "Creative & Expressive",
        schedules: [
            {
                localStartTime: Temporal.PlainTime.from("13:00:00"),
                localEndTime: Temporal.PlainTime.from("14:00:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "weekly", weekday: "WE", interval: 1 } satisfies ScheduleRuleInput,
            },
        ],
    },
    {
        termId: "1fb6a66a-0564-433e-8ff2-64af1d29cd29",
        name: "Word Wellness",
        description: "Gentle, themed writing exercises to build a sustainable personal writing practice for brain health.",
        category: "Creative & Expressive",
        schedules: [
            {
                localStartTime: Temporal.PlainTime.from("14:00:00"),
                localEndTime: Temporal.PlainTime.from("15:30:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "weekly", weekday: "TU", interval: 1 } satisfies ScheduleRuleInput,
            },
        ],
    },
    {
        termId: "1fb6a66a-0564-433e-8ff2-64af1d29cd29",
        name: "Zentangle: Playing With Patterns",
        description: "Certified Zentangle method—structured, relaxing pattern drawing with no prior art experience needed.",
        category: "Creative & Expressive",
        schedules: [
            {
                localStartTime: Temporal.PlainTime.from("16:00:00"),
                localEndTime: Temporal.PlainTime.from("17:00:00"),
                tzid: "America/Vancouver",
                volunteerUserIds: [] as string[],
                instructorUserIds: [] as string[],
                rule: { type: "weekly", weekday: "MO", interval: 2 } satisfies ScheduleRuleInput,
            },
        ],
    },
];

async function main(): Promise<number> {
    await classService.createClass(classes[0]!).then(x => console.log(x));
    await classService.getClassesForRequest({ term: "current" }).then(x => console.log(x));
    return 1;
}

main().then((exitcode) => {
    exit(exitcode);
});