import { Class, Volunteer, ClassPreference, Availability, VolunteerClass } from "../common/generated.js";


interface ClassTimeInfo {
    dayNumber: number; // 1=Monday, 2=Tuesday, ..., 7=Sunday
    startTime: string; // "HH:mm" extracted from start_date
    endTime: string;   // "HH:mm" extracted from end_date
}

export class VolunteerClassMatcher {
    private volunteers: Volunteer[];
    private availabilities: Availability[];
    private preferences: ClassPreference[];
    private classes: Class[];

    // Final volunteer->class assignments.
    private assignments: VolunteerClass[] = [];

    constructor(
        volunteers: Volunteer[],
        availabilities: Availability[],
        preferences: ClassPreference[],
        classes: Class[]
    ) {
        this.volunteers = volunteers;
        this.availabilities = availabilities;
        this.preferences = preferences;
        this.classes = classes;
    }

    /**
     * Entry point to run the matching process.
     * Returns an array of volunteer->class assignments.
     */
    public matchVolunteers(): VolunteerClass[] {
        this.assignments = [];

        // For each class in the system, try to assign exactly 1 volunteer.
        // If you need more than one volunteer per class, you can adjust.
        for (const cls of this.classes) {
            if (!cls.class_id) {
                throw new Error(`Class is missing class_id: ${JSON.stringify(cls)}`);
            }

            // Extract day/time from the Class's start_date/end_date.
            const timeInfo = this.parseClassDateTime(cls);
            if (!timeInfo) {
                throw new Error(`Failed to parse class date/time for class_id=${cls.class_id}`);
            }

            // Gather potential volunteers who meet constraints:
            // 1) Are available for that day/time.
            // 2) Have indicated a preference for that class.
            const potentialVolunteers = this.volunteers.filter((v) =>
                this.isVolunteerAvailableForClass(v.volunteer_id, timeInfo) &&
                this.isVolunteerPrefersClass(v.volunteer_id, cls.class_id!)
            );

            // Sort by rank if provided (lower rank => higher preference)
            potentialVolunteers.sort((a, b) => {
                const rankA = this.getClassRank(a.volunteer_id, cls.class_id!) ?? 9999;
                const rankB = this.getClassRank(b.volunteer_id, cls.class_id!) ?? 9999;
                return rankA - rankB;
            });

            // Simple: assign the top candidate if available.
            if (potentialVolunteers.length > 0) {
                const chosen = potentialVolunteers[0];
                this.assignments.push({
                    fk_volunteer_id: chosen.volunteer_id,
                    fk_class_id: cls.class_id,
                });
            }
        }

        return this.assignments;
    }

    /**
     * Attempt to parse day/time from start_date/end_date.
     * Returns dayNumber (1=Monday..7=Sunday), startTime, endTime.
     * If the class crosses days, we only handle the start_date's day.
     */
    private parseClassDateTime(cls: Class): ClassTimeInfo | null {
        try {
            const start = new Date(cls.start_date);
            const end = new Date(cls.end_date);

            let weekday = start.getDay(); // 0=Sunday..6=Saturday
            if (weekday === 0) weekday = 7;

            const startHour = String(start.getHours()).padStart(2, "0");
            const startMin = String(start.getMinutes()).padStart(2, "0");
            const endHour = String(end.getHours()).padStart(2, "0");
            const endMin = String(end.getMinutes()).padStart(2, "0");

            return {
                dayNumber: weekday,
                startTime: `${startHour}:${startMin}`,
                endTime: `${endHour}:${endMin}`,
            };
        } catch {
            return null;
        }
    }

    /**
     * Check if volunteer has availability covering the specified day/time range.
     */
    private isVolunteerAvailableForClass(volunteerId: string, timeInfo: ClassTimeInfo): boolean {
        const volunteerAvail = this.availabilities.filter((av) => av.fk_volunteer_id === volunteerId);

        // We require an availability slot with the same dayNumber that covers start->end time.
        return volunteerAvail.some((av) => {
            if (av.day !== timeInfo.dayNumber) return false;
            // Compare times as strings: "HH:mm"
            return av.start_time <= timeInfo.startTime && av.end_time >= timeInfo.endTime;
        });
    }

    /**
     * Check if volunteer's ClassPreference includes this class.
     */
    private isVolunteerPrefersClass(volunteerId: string, classId: number): boolean {
        return this.preferences.some((pref) => {
            return (
                pref.fk_volunter_id === volunteerId &&
                pref.fk_class_id === classId
            );
        });
    }

    /**
     * Retrieve the preference rank from ClassPreference, if available.
     */
    private getClassRank(volunteerId: string, classId: number): number | null {
        const pref = this.preferences.find(
            (p) => p.fk_volunter_id === volunteerId && p.fk_class_id === classId
        );
        return pref?.class_rank ?? null;
    }
}