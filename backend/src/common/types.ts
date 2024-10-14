export interface Availability {
  day: day_of_week;
  start_time: string; // MySQL uses TIME type, example: '11:12' is recognized as '11:12:00'
  end_time: string;
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