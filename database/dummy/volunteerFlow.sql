-- The following is a sample set of commands to populate the database with data
use neuron;

-- Create User and Volunteer
INSERT INTO users (user_id, email, password, role) VALUES
('9bead604-6554-4db2-9b88-552d15695481', 'jessie.shang@gmail.com', 'password123', 'volunteer');

INSERT INTO volunteers (volunteer_id, fk_user_id, f_name, l_name, p_name, total_hours, bio, active, email, pronouns, phone_number, city, province, p_time_ctmt) VALUES
('faff8f98-bc68-4fab-a4ca-151b09fc40c1', '9bead604-6554-4db2-9b88-552d15695481', 'Jessie', 'Shang', null, 0, 'I love helping people.', 1, 'jessie.shang@gmail.com', "she/her", "2084248285", "Vancouver", "BC", 10);

-- Set volunteer availability
INSERT INTO availability (fk_volunteer_id, day, start_time, end_time) VALUES
('faff8f98-bc68-4fab-a4ca-151b09fc40c1', 2, '09:00:00', '12:00:00');
INSERT INTO availability (fk_volunteer_id, day, start_time, end_time) VALUES
('faff8f98-bc68-4fab-a4ca-151b09fc40c1', 4, '09:00:00', '12:00:00');

-- Insert data into the instructors table
INSERT INTO instructors (instructor_id, f_name, l_name, email) VALUES
('c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Jane', 'Smith', 'jane.smith@example.com');

-- Insert data into the class table
INSERT INTO class (class_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(1, 'Moving & Breathing with Qi Gong & Tai Chi Principles', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class1', '2024-09-09', '2024-12-13',  'Online Exercise', 'Tai Chi');
INSERT INTO class (class_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(2, 'Chair Yoga', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class2', '2024-09-09', '2024-12-13',  'Online Exercise', 'Yoga');
INSERT INTO class (class_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(3, 'Yoga Foundations', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class3', '2024-09-09', '2024-12-13',  'Online Exercise', 'Yoga');
INSERT INTO class (class_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(4, 'Afternoon Unwind Yoga', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class4', '2024-09-09', '2024-12-13',  'Online Exercise', 'Yoga');
INSERT INTO class (class_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(5, 'Art from the Heart', 'Painting and crafts', 'https://zoom.example.com/class5', '2024-09-09', '2024-12-13',  'Creative & Expressive', '');
INSERT INTO class (class_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(6, 'Artful Living', 'Painting and crafts', 'https://zoom.example.com/class6', '2024-09-09', '2024-12-13',  'Creative & Expressive', '');
INSERT INTO class (class_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(7, 'Brain Wellness Book Club', 'Monthly reads and reviews.', 'https://zoom.example.com/class7', '2024-09-09', '2024-12-13',  'Creative & Expressive', '');
INSERT INTO class (class_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(8, 'Crafters for a Cause', 'Scrapbooking, knitting, and crochetting', 'https://zoom.example.com/class8', '2024-09-09', '2024-12-13',  'Creative & Expressive', '');
INSERT INTO class (class_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(9, 'Gardening & Cooking in Season', 'What grows together goes together', 'https://zoom.example.com/class9', '2024-09-09', '2024-12-13',  'Creative & Expressive', '');

-- Set class schedule 
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, fk_instructor_id) VALUES
(1, 1, 3, '12:00:00', '13:00:00', 'c4336f49-e4bd-4b9f-baac-450e2433f5c5');
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, fk_instructor_id) VALUES
(2, 2, 3, '14:00:00', '15:00:00', 'c4336f49-e4bd-4b9f-baac-450e2433f5c5');
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, fk_instructor_id) VALUES
(3, 3, 3, '09:30:00', '10:30:00', 'c4336f49-e4bd-4b9f-baac-450e2433f5c5');
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, fk_instructor_id) VALUES
(4, 4, 4, '16:00:00', '17:00:00', 'c4336f49-e4bd-4b9f-baac-450e2433f5c5');
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, fk_instructor_id) VALUES
(5, 5, 4, '10:30:00', '12:00:00', 'c4336f49-e4bd-4b9f-baac-450e2433f5c5');
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, fk_instructor_id) VALUES
(6, 5, 4, '12:30:00', '14:15:00', 'c4336f49-e4bd-4b9f-baac-450e2433f5c5');
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, fk_instructor_id) VALUES
(7, 5, 5, '09:00:00', '10:30:00', 'c4336f49-e4bd-4b9f-baac-450e2433f5c5');
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, fk_instructor_id) VALUES
(8, 6, 5, '11:00:00', '12:30:00', 'c4336f49-e4bd-4b9f-baac-450e2433f5c5');
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, fk_instructor_id) VALUES
(9, 7, 6, '10:00:00', '11:00:00', 'c4336f49-e4bd-4b9f-baac-450e2433f5c5');
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, fk_instructor_id) VALUES
(10, 8, 1, '15:30:00', '16:30:00', 'c4336f49-e4bd-4b9f-baac-450e2433f5c5');
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, fk_instructor_id) VALUES
(11, 9, 3, '15:00:00', '16:00:00', 'c4336f49-e4bd-4b9f-baac-450e2433f5c5');

-- Assign volunteer to schedule
INSERT INTO volunteer_schedule (fk_volunteer_id, fk_schedule_id) VALUES
('faff8f98-bc68-4fab-a4ca-151b09fc40c1', 1);

-- For volunteer schedule viewing, monthly view for volunteer_id 1230545b-0505-4909-826c-59359503dae6

-- Insert data into the class table
INSERT INTO class (class_id, class_name, instructions, zoom_link, start_date, end_date) VALUES
(100, 'High Intensity Interval Training', 'Get a sweat on.', 'https://zoom.example.com/class1', '2024-09-09', '2024-12-13');
INSERT INTO class (class_id, class_name, instructions, zoom_link, start_date, end_date) VALUES
(101, 'Art From The Heart', 'Painting and pottery', 'https://zoom.example.com/class1', '2024-09-09', '2024-12-13');
INSERT INTO class (class_id, class_name, instructions, zoom_link, start_date, end_date) VALUES
(102, 'Think, Feel, Dance', 'Move to the music!', 'https://zoom.example.com/class1', '2024-09-09', '2024-12-13');
INSERT INTO class (class_id, class_name, instructions, zoom_link, start_date, end_date) VALUES
(103, 'Higher Intensity Chair Exercise', 'Movement that is easy on the joints', 'https://zoom.example.com/class1', '2024-09-09', '2024-12-13');

-- Set class schedule 
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, frequency) VALUES
(100, 100, 2, '09:30:00', '10:30:00', 'weekly');
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, frequency) VALUES
(101, 101, 4, '11:00:00', '13:00:00', 'weekly');
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, frequency) VALUES
(102, 102, 6, '10:00:00', '11:00:00', 'weekly');
INSERT INTO schedule (schedule_id, fk_class_id, day, start_time, end_time, frequency) VALUES
(103, 103, 6, '14:00:00', '15:00:00', 'weekly');

-- Assign volunteer to class
-- INSERT INTO volunteer_class (fk_volunteer_id, fk_class_id) VALUES
-- ('1230545b-0505-4909-826c-59359503dae6', 100);
-- INSERT INTO volunteer_class (fk_volunteer_id, fk_class_id) VALUES
-- ('e20d262b-8047-4a9a-9202-a97aa0412092', 101);
-- INSERT INTO volunteer_class (fk_volunteer_id, fk_class_id) VALUES
-- ('e20d262b-8047-4a9a-9202-a97aa0412092', 102);
-- INSERT INTO volunteer_class (fk_volunteer_id, fk_class_id) VALUES
-- ('e20d262b-8047-4a9a-9202-a97aa0412092', 103);

-- Create entry in shifts table
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(1, 'faff8f98-bc68-4fab-a4ca-151b09fc40c1', 100, '2024-11-12', 2, false);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(2, 'faff8f98-bc68-4fab-a4ca-151b09fc40c1', 100, '2024-11-19', 2, false);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(3, 'faff8f98-bc68-4fab-a4ca-151b09fc40c1', 100, '2024-11-26', 2, false);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(4, 'faff8f98-bc68-4fab-a4ca-151b09fc40c1', 101, '2024-11-14', 2, false);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(5, 'faff8f98-bc68-4fab-a4ca-151b09fc40c1', 102, '2024-11-16', 1, false);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(6, 'faff8f98-bc68-4fab-a4ca-151b09fc40c1', 103, '2024-11-16', 1, false);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration) VALUES
(7, null, 103, '2024-10-25', 1);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration) VALUES
(8, null, 1, '2024-09-10', 90);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration) VALUES
(9, null, 2, '2024-09-12', 90);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(10, 'd98889b0-2f2e-4172-b753-14cdccdd359c', 4, '2025-01-20', 4, false);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(11, 'd98889b0-2f2e-4172-b753-14cdccdd359c', 2, '2025-01-21', 4, false);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(12, 'd98889b0-2f2e-4172-b753-14cdccdd359c', 3, '2025-01-22', 4, false);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(13, 'd98889b0-2f2e-4172-b753-14cdccdd359c', 5, '2025-01-22', 4, false);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(14, 'd98889b0-2f2e-4172-b753-14cdccdd359c', 6, '2025-01-23', 4, false);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(15, 'd98889b0-2f2e-4172-b753-14cdccdd359c', 7, '2025-01-20', 4, false);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(16, 'd98889b0-2f2e-4172-b753-14cdccdd359c', 8, '2025-01-24', 4, false);
INSERT INTO shifts (shift_id, fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
(17, 'faff8f98-bc68-4fab-a4ca-151b09fc40c1', 103, '2025-01-20', 1, false);

-- Create entry in absence_request table
INSERT INTO absence_request (request_id, fk_shift_id, covered_by)
VALUES (2, 2, NULL);
INSERT INTO absence_request (request_id, fk_shift_id, covered_by)
VALUES (4, 4, NULL);
INSERT INTO absence_request (request_id, fk_shift_id, covered_by)
VALUES (5, 5, NULL);
INSERT INTO absence_request (request_id, fk_shift_id, covered_by)
VALUES (6, 6, NULL);
INSERT INTO absence_request (request_id, fk_shift_id, covered_by)
VALUES (7, 1, 'd98889b0-2f2e-4172-b753-14cdccdd359c');
INSERT INTO absence_request (request_id, fk_shift_id, covered_by)
VALUES (8, 10, null);
INSERT INTO absence_request (request_id, fk_shift_id, covered_by)
VALUES (9, 17, null);

-- pending coverage table
INSERT INTO coverage_request (request_id, volunteer_id)
VALUES (2, 'faff8f98-bc68-4fab-a4ca-151b09fc40c1');
INSERT INTO coverage_request (request_id, volunteer_id)
VALUES (6, 'd98889b0-2f2e-4172-b753-14cdccdd359c');