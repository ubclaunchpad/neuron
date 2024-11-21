export interface User {
  user_id?: string;
  email: string;
  password: string;
  role: "ADMIN" | "VOLUN" | "INSTR";
}

export interface Volunteer {
  volunteer_id?: string;
  fk_user_id?: string;   // Foreign key (optional, since it might be nullable)
  f_name: string;
  l_name: string;
  email: string;
  total_hours: number;
  class_preferences: string;
  bio?: string;
  activate: boolean;
  pronouns?: string;
  phone_number?: string;
  city?: string;
  province?: string;
}

export interface ProfilePic {
  volunteer_id: string,
  profile_picture: string
}

export interface Instructor {
  instructor_id: string;
  fk_user_id?: string;   // Foreign key (optional, since it might be nullable)
  f_name: string;
  l_name: string;
  email: string;
}

export interface Availability {
  day: day_of_week;
  start_time: string; // MySQL uses TIME type, example: '11:12' is recognized as '11:12:00'
  end_time: string;
  availability_id?: string;
}

enum day_of_week {
  Monday = 1,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday
}

export interface Class {
  class_id?: number;
  fk_instructor_id?: string;   // Foreign key (optional, since it might be nullable)
  class_name: string;
  instructions?: string;
  zoom_link?: string;
  start_date: string;
  end_date?: string;
}

export interface Shift {
  fk_volunteer_id: string;
  fk_schedule_id: number;
  shift_date: string;
  duration: number;
}

export interface Instructor {
  instructor_id: string;
  fk_user_id?: string;   // Foreign key (optional, since it might be nullable)
  f_name: string;
  l_name: string;
  email: string;
}


export interface Schedule {
schedule_id: number;
fk_class_id?: number;
day_of_week: number;
start_time: string;
end_time: string;
}