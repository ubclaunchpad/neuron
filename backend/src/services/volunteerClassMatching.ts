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

    // Keep track of how many hours each volunteer has been assigned
    private volunteerHours: Record<string, number> = {};

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

        // Initialize volunteerHours to 0 for each volunteer
        for (const v of volunteers) {
            this.volunteerHours[v.volunteer_id] = 0;
        }
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

            // Gather potential volunteers who are available for the date/time of class.
            const potentialVolunteers = this.volunteers.filter((v) =>
                this.isVolunteerAvailableForClass(v.volunteer_id, timeInfo)
            );

            // Then sort by rank if provided (lower rank => higher preference)
            potentialVolunteers.sort((a, b) => {
                const rankA = this.getClassRank(a.volunteer_id, cls.class_id!) ?? 9999;
                const rankB = this.getClassRank(b.volunteer_id, cls.class_id!) ?? 9999;
                return rankA - rankB;
            });

            // Partition volunteers by if they prefer this class
            const [prefersClass, notPrefersClass] = this.partitionByPreferrence(potentialVolunteers, cls.class_id);
            const partitionedByPreference = prefersClass.concat(notPrefersClass);

            // Partition volunteers by if they are over or under their preferred hours
            const [underCap, overCap] = this.partitionByPreferredHours(partitionedByPreference);
            const partitionedByHours = underCap.concat(overCap);

            // Assign volunteers to this class, up to the maxVolunteers limit.
            const maxVolunteers = cls.number_volunteers ?? 1;
            let assignedVolunteers = 0;
            for (const v of partitionedByHours) {
                if (assignedVolunteers < maxVolunteers) {
                    this.assignments.push({
                        fk_volunteer_id: v.volunteer_id,
                        fk_class_id: cls.class_id,
                    });
                    assignedVolunteers++;
                }
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
     * Partition volunteers into two groups:
     *  1) Those who prefer this class
     *  2) Those who do not prefer this class
     */
    private partitionByPreferrence(volunteers: Volunteer[], classId: number): [Volunteer[], Volunteer[]] {
        const prefers: Volunteer[] = [];
        const notPrefers: Volunteer[] = [];

        volunteers.forEach((v) => {
            if (this.isVolunteerPrefersClass(v.volunteer_id, classId)) {
                prefers.push(v);
            } else {
                notPrefers.push(v);
            }
        });
        return [prefers, notPrefers];
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

    /**
  * Partition volunteers into two groups:
  *  1) Under their preferred hour cap
  *  2) At or above their preferred hour cap
  *
  * Then we can assign from group 1 first (priority),
  * and group 2 next if still needed.
  */
    private partitionByPreferredHours(volunteers: Volunteer[]): [Volunteer[], Volunteer[]] {
        const under: Volunteer[] = [];
        const over: Volunteer[] = [];

        for (const v of volunteers) {
            // If no preferred_hours is defined, interpret it as infinite (no cap)
            const cap = v.preferred_hours ?? Infinity;
            const currentHours = this.volunteerHours[v.volunteer_id];

            if (currentHours < cap) {
                under.push(v);
            } else {
                over.push(v);
            }
        }

        return [under, over];
    }
}