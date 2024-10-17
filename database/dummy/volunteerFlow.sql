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
INSERT INTO class (class_id, fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date) VALUES
(1, 'c4336f49-e4bd-4b9f-baac-450e2433f5c5', 'Strength & Balance Level 1', 'You will need 10lb weights and a chair.', 'https://zoom.example.com/class1', '2024-09-09', '2024-12-13');

-- Set class schedule 
INSERT INTO schedule (fk_class_id, day_of_week, start_time, end_time) VALUES
(1, 2, '09:00:00', '10:30:00');
INSERT INTO schedule (fk_class_id, day_of_week, start_time, end_time) VALUES
(1, 4, '09:00:00', '10:30:00');

-- Assign volunteer to class
INSERT INTO volunteer_class (fk_volunteer_id, fk_class_id) VALUES
('faff8f98-bc68-4fab-a4ca-151b09fc40c1', 1);

-- Create entry in shifts table
INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration) VALUES
('faff8f98-bc68-4fab-a4ca-151b09fc40c1', 1, '2024-09-10', 90);
INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration) VALUES
('faff8f98-bc68-4fab-a4ca-151b09fc40c1', 2, '2024-09-12', 90);