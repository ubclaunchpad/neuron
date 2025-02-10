use neuron;

-- Paste all 'create' SQL commands here
DROP TABLE IF EXISTS volunteer_schedule;
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS class_preferences;
DROP TABLE IF EXISTS pending_shift_coverage;
DROP TABLE IF EXISTS shift_coverage_request;
DROP TABLE IF EXISTS shifts;
DROP TABLE IF EXISTS volunteers;
DROP TABLE IF EXISTS schedule;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS class;
-- DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS instructors;
DROP TABLE IF EXISTS user_session;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS images;

create table users (
    user_id VARCHAR(255) PRIMARY KEY,
    f_name VARCHAR(60) NOT NULL,
    l_name VARCHAR(60) NOT NULL,
    email VARCHAR(45) UNIQUE NOT NULL,
    fk_image_id VARCHAR(36),
    password VARCHAR(60) NOT NULL,
    role ENUM('volunteer', 'admin', 'instructor') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fk_image_id) REFERENCES images(image_id)
        ON DELETE SET NULL
);

create table instructors (
	instructor_id VARCHAR(255) PRIMARY KEY, 
    -- fk_user_id VARCHAR(255),  -- If instructors can login the the future they will need this     
    f_name VARCHAR(15) NOT NULL,
    l_name VARCHAR(15) NOT NULL,
    email VARCHAR(45) NOT NULL,
    -- FOREIGN KEY (fk_user_id) REFERENCES users(user_id)
);

-- Re-create if we need it in the future
-- create table admins (
-- 	admin_id VARCHAR(255) PRIMARY KEY, 
--     fk_user_id VARCHAR(255),         
--     f_name VARCHAR(15) NOT NULL,
--     l_name VARCHAR(15) NOT NULL,
--     FOREIGN KEY (fk_user_id) REFERENCES users(user_id)
--         ON DELETE CASCADE
-- );

create table class (
	class_id INT PRIMARY KEY AUTO_INCREMENT,
    fk_instructor_id VARCHAR(255) NOT NULL,
    fk_image_id CHAR(36),
    class_name VARCHAR(64) NOT NULL,
    instructions VARCHAR(150),
    zoom_link VARCHAR(3000) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    category VARCHAR(64),
    subcategory VARCHAR(64),
    FOREIGN KEY (fk_instructor_id) REFERENCES instructors(instructor_id),
    FOREIGN KEY (fk_image_id) REFERENCES images(image_id)
        ON DELETE SET NULL
);

create table volunteers (
	volunteer_id VARCHAR(255) PRIMARY KEY, 
    fk_user_id VARCHAR(255),         
    f_name VARCHAR(15) NOT NULL,
    l_name VARCHAR(15) NOT NULL,
    p_name VARCHAR(45),
    total_hours INT NOT NULL DEFAULT 0,
    bio VARCHAR(150),
    active BOOLEAN NOT NULL DEFAULT FALSE,
    email VARCHAR(45) NOT NULL,
    pronouns VARCHAR(15),
    phone_number VARCHAR(15),
    city VARCHAR(15),
    province VARCHAR(15),
    p_time_ctmt INT NOT NULL DEFAULT 0,
    FOREIGN KEY (fk_user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

create table availability (
	availability_id INT PRIMARY KEY AUTO_INCREMENT,
    fk_volunteer_id VARCHAR(255) NOT NULL,
    day INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (fk_volunteer_id) REFERENCES volunteers(volunteer_id)
        ON DELETE CASCADE
);

CREATE TABLE volunteer_schedule (
    fk_volunteer_id VARCHAR(255) NOT NULL,
    fk_schedule_id INT NOT NULL,
    PRIMARY KEY (fk_volunteer_id, fk_schedule_id),
    FOREIGN KEY (fk_volunteer_id) REFERENCES volunteers(volunteer_id)
        ON DELETE CASCADE,
    FOREIGN KEY (fk_schedule_id) REFERENCES schedule(schedule_id)
        ON DELETE CASCADE
);

create table schedule (
	schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    fk_class_id INT NOT NULL,
    day INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (fk_class_id) REFERENCES class(class_id)
        ON DELETE CASCADE
);

CREATE TABLE shifts (
    shift_id INT PRIMARY KEY AUTO_INCREMENT,
    fk_volunteer_id VARCHAR(255) NOT NULL, -- shifts always belong to a volunteer
    fk_schedule_id INT NOT NULL, -- shifts always belong to a schedule
    shift_date DATE NOT NULL,
    duration INT NOT NULL,
    checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (fk_volunteer_id) REFERENCES volunteers(volunteer_id)
        ON DELETE CASCADE,
    FOREIGN KEY (fk_schedule_id) REFERENCES schedule(schedule_id)
        ON DELETE CASCADE
);

CREATE TABLE shift_coverage_request (
    request_id INT PRIMARY KEY AUTO_INCREMENT,                     
    fk_shift_id INT NOT NULL,                       
    covered_by VARCHAR(255),
    FOREIGN KEY (fk_shift_id)
        REFERENCES shifts(shift_id) ON DELETE CASCADE,
    FOREIGN KEY (covered_by)
        REFERENCES volunteers(volunteer_id) ON DELETE SET NULL
);

CREATE TABLE pending_shift_coverage (
    request_id INT NOT NULL,
    pending_volunteer VARCHAR(255) NOT NULL,
    
    PRIMARY KEY (request_id, pending_volunteer),
    FOREIGN KEY (request_id) REFERENCES shift_coverage_request(request_id) 
        ON DELETE CASCADE,
    FOREIGN KEY (pending_volunteer) REFERENCES volunteers(volunteer_id) 
        ON DELETE CASCADE
);

CREATE TABLE class_preferences (
    fk_volunteer_id VARCHAR(255), 
    fk_class_id INT,        
    class_rank INT,     
    FOREIGN KEY (fk_volunteer_id) REFERENCES volunteers(volunteer_id)
        ON DELETE CASCADE,
    FOREIGN KEY (fk_class_id) REFERENCES class(class_id)
        ON DELETE CASCADE
);

create table images (
    image_id VARCHAR(36) PRIMARY KEY,
    image MEDIUMBLOB NOT NULL
);