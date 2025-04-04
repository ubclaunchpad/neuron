import { RowDataPacket } from "mysql2";

/*
* This file was generated by a tool.
* Rerun sql-ts to regenerate this file.
*/
export interface AbsenceRequestDB extends RowDataPacket {
  'approved'?: any;
  'category': 'emergency' | 'health' | 'conflict' | 'transportation' | 'other';
  'comments'?: string | null;
  'covered_by'?: string | null;
  'details': string;
  'fk_shift_id': number;
  'request_id'?: number;
}
export interface AvailabilityDB extends RowDataPacket {
  'availability_id'?: number;
  'day': number;
  'end_time': string;
  'fk_volunteer_id': string;
  'start_time': string;
}
export interface ClassDB extends RowDataPacket {
  'category'?: string | null;
  'class_id'?: number;
  'class_name': string;
  'end_date': string;
  'fk_image_id'?: string | null;
  'instructions'?: string | null;
  'start_date': string;
  'subcategory'?: string | null;
  'zoom_link': string;
}
export interface ClassPreferenceDB extends RowDataPacket {
  'class_rank'?: number | null;
  'fk_schedule_id'?: number | null;
  'fk_volunteer_id'?: string | null;
}
export interface CoverageRequestDB extends RowDataPacket {
  'request_id': number;
  'volunteer_id': string;
}
export interface ImageDB extends RowDataPacket {
  'image': Buffer;
  'image_id': string;
}
export interface InstructorDB extends RowDataPacket {
  'instructor_id'?: string;
  'email': string;
  'f_name': string;
  'l_name': string;
}
export interface LogDB extends RowDataPacket {
  'created_at'?: Date;
  'description': string;
  'fk_class_id'?: number | null;
  'fk_volunteer_id'?: string | null;
  'request_id'?: number;
  'signoff': string;
}
export interface PendingShiftCoverageDB extends RowDataPacket {
  'pending_volunteer': string;
  'request_id': number;
}
export interface ScheduleDB extends RowDataPacket {
  'active'?: any;
  'day': number;
  'end_time': string;
  'fk_class_id': number;
  'fk_instructor_id'?: string | null;
  'frequency'?: string;
  'schedule_id'?: number;
  'start_time': string;
}
export interface ShiftCoverageRequestDB extends RowDataPacket {
  'covered_by'?: string | null;
  'fk_shift_id': number;
  'request_id'?: number;
}
export interface ShiftDB extends RowDataPacket {
  'checked_in'?: any;
  'duration': number;
  'fk_schedule_id': number;
  'fk_volunteer_id': string;
  'shift_date': string;
  'shift_id'?: number;
}
export interface UserDB extends RowDataPacket {
  'created_at'?: Date | null;
  'email': string;
  'f_name': string;
  'fk_image_id'?: string | null;
  'l_name': string;
  'password': string;
  'role': 'volunteer' | 'admin' | 'instructor';
  'user_id': string;
}
export interface VolunteerClassDB extends RowDataPacket {
  'fk_class_id': number;
  'fk_volunteer_id': string;
}
export interface VolunteerScheduleDB extends RowDataPacket {
  'fk_schedule_id': number;
  'fk_volunteer_id': string;
}
export interface VolunteerDB extends RowDataPacket {
  'status'?: any;
  'bio'?: string | null;
  'city'?: string | null;
  'existing'?: number;
  'fk_user_id'?: string | null;
  'p_name'?: string | null;
  'p_time_ctmt'?: number;
  'phone_number'?: string | null;
  'pronouns'?: string | null;
  'province'?: string | null;
  'total_hours'?: number;
  'volunteer_id': string;
}
