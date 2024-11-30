-- The following is a sample set of commands to populate the database with data
use neuron;

-- Create User and Volunteer
INSERT INTO users (user_id, email, password, role) VALUES
('9bead604-6554-4db2-9b88-552d15695481', 'jessie.shang@gmail.com', 'password123', 'VOLUN');

INSERT INTO volunteers (volunteer_id, fk_user_id, f_name, l_name, total_hours, class_preferences, bio, active, email) VALUES
('faff8f98-bc68-4fab-a4ca-151b09fc40c1', '9bead604-6554-4db2-9b88-552d15695481', 'Jessie', 'Shang', 0, 'Strength & Balance Level 1', 'I love helping people.', 1, 'jessie.shang@gmail.com');

-- Set volunteer availability
INSERT INTO availability (fk_volunteer_id, day_of_week, start_time, end_time) VALUES
('faff8f98-bc68-4fab-a4ca-151b09fc40c1', 2, '09:00:00', '12:00:00');
INSERT INTO availability (fk_volunteer_id, day_of_week, start_time, end_time) VALUES
('faff8f98-bc68-4fab-a4ca-151b09fc40c1', 4, '09:00:00', '12:00:00');

-- Insert data into the instructors table
INSERT INTO instructors (instructor_id, f_name, l_name, email) VALUES
('c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Jane', 'Smith', 'jane.smith@example.com');

-- Insert data into the class table
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(1, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Moving & Breathing with Qi Gong & Tai Chi Principles', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class1', '2024-09-09', '2024-12-13',  'Online Exercise', 'Tai Chi');
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(2, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Chair Yoga', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class2', '2024-09-09', '2024-12-13',  'Online Exercise', 'Yoga');
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(3, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Yoga Foundations', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class3', '2024-09-09', '2024-12-13',  'Online Exercise', 'Yoga');
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(4, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Afternoon Unwind Yoga', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class4', '2024-09-09', '2024-12-13',  'Online Exercise', 'Yoga');
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(5, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Art from the Heart', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class5', '2024-09-09', '2024-12-13',  'Creative & Expressive', '');
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(6, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Artful Living', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class6', '2024-09-09', '2024-12-13',  'Creative & Expressive', '');
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(7, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Brain Wellness Book Club', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class7', '2024-09-09', '2024-12-13',  'Creative & Expressive', '');
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(8, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Crafters for a Cause', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class8', '2024-09-09', '2024-12-13',  'Creative & Expressive', '');
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory) VALUES
(9, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Gardening & Cooking in Season', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class9', '2024-09-09', '2024-12-13',  'Creative & Expressive', '');

-- Set class schedule 
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(1, 1, 3, '12:00:00', '13:00:00');
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(2, 2, 3, '14:00:00', '15:00:00');
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(3, 3, 3, '09:30:00', '10:30:00');
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(4, 4, 4, '16:00:00', '17:00:00');
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(5, 5, 4, '10:30:00', '12:00:00');
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(6, 5, 4, '12:30:00', '14:15:00');
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(7, 5, 5, '09:00:00', '10:30:00');
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(8, 6, 5, '11:00:00', '12:30:00');
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(9, 7, 6, '10:00:00', '11:00:00');
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(10, 8, 1, '15:30:00', '16:30:00');
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(11, 9, 3, '15:00:00', '16:00:00');

-- Assign volunteer to class
INSERT INTO volunteer_class (fk_volunteer_id, fk_class_id) VALUES
('faff8f98-bc68-4fab-a4ca-151b09fc40c1', 1);

-- Create entry in shifts table
INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration) VALUES
('faff8f98-bc68-4fab-a4ca-151b09fc40c1', 1, '2024-09-10', 90);
INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration) VALUES
('faff8f98-bc68-4fab-a4ca-151b09fc40c1', 2, '2024-09-12', 90);

-- For volunteer schedule viewing, monthly view for volunteer_id 1230545b-0505-4909-826c-59359503dae6

-- Insert data into the class table
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date) VALUES
(100, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'High Intensity Interval Training', 'Get a sweat on.', 'https://zoom.example.com/class1', '2024-09-09', '2024-12-13');
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date) VALUES
(101, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Art From The Heart', 'Painting and pottery', 'https://zoom.example.com/class1', '2024-09-09', '2024-12-13');
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date) VALUES
(102, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Think, Feel, Dance', 'Move to the music!', 'https://zoom.example.com/class1', '2024-09-09', '2024-12-13');
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date) VALUES
(103, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Higher Intensity Chair Exercise', 'Movement that is easy on the joints', 'https://zoom.example.com/class1', '2024-09-09', '2024-12-13');

-- Set class schedule 
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(100, 100, 2, '09:30:00', '10:30:00');
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(101, 101, 4, '11:00:00', '13:00:00');
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(102, 102, 6, '10:00:00', '11:00:00');
INSERT INTO schedule (schedule_id, fk_class_id, day_of_week, start_time, end_time) VALUES
(103, 103, 6, '14:00:00', '15:00:00');

-- Assign volunteer to class
INSERT INTO volunteer_class (fk_volunteer_id, fk_class_id) VALUES
('1230545b-0505-4909-826c-59359503dae6', 100);
INSERT INTO volunteer_class (fk_volunteer_id, fk_class_id) VALUES
('e20d262b-8047-4a9a-9202-a97aa0412092', 101);
INSERT INTO volunteer_class (fk_volunteer_id, fk_class_id) VALUES
('e20d262b-8047-4a9a-9202-a97aa0412092', 102);
INSERT INTO volunteer_class (fk_volunteer_id, fk_class_id) VALUES
('e20d262b-8047-4a9a-9202-a97aa0412092', 103);

-- Create entry in shifts table
INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
('1230545b-0505-4909-826c-59359503dae6', 100, '2024-11-12', 2, false);
INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
('1230545b-0505-4909-826c-59359503dae6', 100, '2024-11-19', 2, false);
INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
('1230545b-0505-4909-826c-59359503dae6', 100, '2024-11-26', 2, false);
INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
('e20d262b-8047-4a9a-9202-a97aa0412092', 101, '2024-11-14', 2, false);
INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
('e20d262b-8047-4a9a-9202-a97aa0412092', 102, '2024-11-16', 1, false);
INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
('e20d262b-8047-4a9a-9202-a97aa0412092', 103, '2024-11-16', 1, false);
INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in) VALUES
('e20d262b-8047-4a9a-9202-a97aa0412092', 103, '2024-10-25', 1, false);

-- Create entry in shift_coverage_request table
INSERT INTO shift_coverage_request (request_id, fk_volunteer_id, fk_schedule_id, shift_date, covered_by)
VALUES (100, '1230545b-0505-4909-826c-59359503dae6', 100, '2024-11-19', NULL);
INSERT INTO shift_coverage_request (request_id, fk_volunteer_id, fk_schedule_id, shift_date, covered_by)
VALUES (101, 'e20d262b-8047-4a9a-9202-a97aa0412092', 101, '2024-11-14', NULL);
INSERT INTO shift_coverage_request (request_id, fk_volunteer_id, fk_schedule_id, shift_date, covered_by)
VALUES (102, 'e20d262b-8047-4a9a-9202-a97aa0412092', 102, '2024-11-16', NULL);
INSERT INTO shift_coverage_request (request_id, fk_volunteer_id, fk_schedule_id, shift_date, covered_by)
VALUES (103, 'e20d262b-8047-4a9a-9202-a97aa0412092', 103, '2024-11-16', NULL);
INSERT INTO shift_coverage_request (request_id, fk_volunteer_id, fk_schedule_id, shift_date, covered_by)
VALUES (104, 'e20d262b-8047-4a9a-9202-a97aa0412092', 103, '2024-10-25', '722a20a0-30da-4dc2-bb05-ea26e62824a7');

--pending coverage table
INSERT INTO pending_shift_coverage (request_id, pending_volunteer)
VALUES ('e20d262b-8047-4a9a-9202-a97aa0412092', 103, '2024-10-25', NULL);