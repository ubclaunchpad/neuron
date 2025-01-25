import { Class, Volunteer, ClassPreference, Availability } from "../common/generated.js";

interface VolunteerAssignment {
    classId: number;
    volunteerId: string;
  }
  
  function matchVolunteers(
    classes: Class[],
    preferences: ClassPreference[],
    availabilities: Availability[]
  ): VolunteerAssignment[] {
    const assignments: VolunteerAssignment[] = [];
  
    const availabilityMap = new Map<string, Availability[]>();
    availabilities.forEach((availability) => {
      if (!availabilityMap.has(availability.fk_volunteer_id)) {
        availabilityMap.set(availability.fk_volunteer_id, []);
      }
      availabilityMap.get(availability.fk_volunteer_id)?.push(availability);
    });
  
    const preferenceMap = new Map<number, string[]>();
    preferences.forEach((pref) => {
      if (pref.fk_class_id && pref.fk_volunter_id) {
        if (!preferenceMap.has(pref.fk_class_id)) {
          preferenceMap.set(pref.fk_class_id, []);
        }
        preferenceMap.get(pref.fk_class_id)?.push(pref.fk_volunter_id);
      }
    });
  
    const domains: Map<number, string[]> = new Map();
    classes.forEach((cls) => {
      const classId = cls.class_id!;
      const preferredVolunteers = preferenceMap.get(classId) || [];
      domains.set(classId, preferredVolunteers);
    });
  
    function backtrack(assignments: VolunteerAssignment[]): boolean {
      if (assignments.length === classes.length) return true;
  
      const unassignedClasses = classes.filter(
        (cls) => !assignments.some((a) => a.classId === cls.class_id)
      );
  
      if (unassignedClasses.length === 0) return true;
  
      const currentClass = unassignedClasses[0];
      const domain = domains.get(currentClass.class_id!) || [];
  
      for (const volunteerId of domain) {
        const isAvailable = availabilityMap
          .get(volunteerId)
          ?.some((avail) => avail.fk_volunteer_id === volunteerId);
  
        const hasConflict = assignments.some(
          (a) => a.volunteerId === volunteerId
        );
  
        if (isAvailable && !hasConflict) {
          assignments.push({ classId: currentClass.class_id!, volunteerId });
          if (backtrack(assignments)) return true;
          assignments.pop();
        }
      }
  
      return false;
    }
  
    backtrack(assignments);
  
    return assignments;
  }

export { matchVolunteers };