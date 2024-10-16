-- Paste all 'create' SQL commands here

create table users (
    user_id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(45) NOT NULL,
    password VARCHAR(45) NOT NULL,
    role VARCHAR(5) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

create table user_session (
    id VARCHAR(255) PRIMARY KEY,
    expires_at DATETIME NOT NULL,
    fk_user_id VARCHAR(255) NOT NULL,
    FOREIGN KEY (fk_user_id) REFERENCES users(user_id)
);

create table instructors (
	instructor_id VARCHAR(255) PRIMARY KEY, 
    fk_user_id VARCHAR(255),         
    f_name VARCHAR(15) NOT NULL,
    l_name VARCHAR(15) NOT NULL,
    FOREIGN KEY (fk_user_id) REFERENCES users(user_id)
);

create table class (
	class_id INT PRIMARY KEY AUTO_INCREMENT,
    fk_instructor_id VARCHAR(255) NOT NULL,
    class_name VARCHAR(64) NOT NULL,
    instructions VARCHAR(150),
    zoom_link VARCHAR(3000) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    FOREIGN KEY (fk_instructor_id) REFERENCES instructors(instructor_id)
);

create table volunteers (
	volunteer_id VARCHAR(255) PRIMARY KEY, 
    fk_user_id VARCHAR(255),         
    f_name VARCHAR(15) NOT NULL,
    l_name VARCHAR(15) NOT NULL,
    total_hours INT NOT NULL,
    class_preferences VARCHAR(256) NOT NULL,
    bio VARCHAR(150),
    active BOOLEAN,
    email VARCHAR(45) NOT NULL,
    FOREIGN KEY (fk_user_id) REFERENCES users(user_id)
);

create table admins (
	admin_id VARCHAR(255) PRIMARY KEY, 
    fk_user_id VARCHAR(255),         
    f_name VARCHAR(15) NOT NULL,
    l_name VARCHAR(15) NOT NULL,
    FOREIGN KEY (fk_user_id) REFERENCES users(user_id)
);

create table availability (
	availability_id INT PRIMARY KEY AUTO_INCREMENT,
    fk_volunteer_id VARCHAR(255) NOT NULL,
    day_of_week INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (fk_volunteer_id) REFERENCES volunteers(volunteer_id)
);

create table volunteer_class (
	fk_volunteer_id VARCHAR(255) REFERENCES volunteers(volunteer_id),
    fk_class_id VARCHAR(255) REFERENCES class(class_id),
    PRIMARY KEY (fk_volunteer_id, fk_class_id)
);

create table schedule (
	schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    fk_class_id INT NOT NULL,
    day_of_week INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (fk_class_id) REFERENCES class(class_id)
);

create table shifts (
	fk_volunteer_id VARCHAR(255) REFERENCES volunteers(volunteer_id),
    fk_schedule_id INT REFERENCES schedule(schedule_id),
    shift_date DATE NOT NULL,
    duration INT NOT NULL,
    PRIMARY KEY (fk_volunteer_id, fk_schedule_id, shift_date)
);

CREATE TABLE shift_coverage_request (
    request_id VARCHAR(255) PRIMARY KEY,                     
    fk_volunteer_id VARCHAR(255) NOT NULL,                   
    fk_schedule_id INT NOT NULL,
    shift_date DATE NOT NULL,                       
    covered_by VARCHAR(255) NOT NULL,
    fulfilled BOOLEAN,
    FOREIGN KEY (fk_volunteer_id, fk_schedule_id, shift_date)
        REFERENCES shifts(fk_volunteer_id, fk_schedule_id, shift_date),
    FOREIGN KEY (covered_by)
        REFERENCES volunteers(volunteer_id)
);

