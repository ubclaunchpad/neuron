-- migrate:up
CREATE TABLE log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    page VARCHAR(30) NOT NULL,
    signoff VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    fk_volunteer_id CHAR(36), 
    fk_class_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,

    FOREIGN KEY (fk_volunteer_id) REFERENCES volunteers(volunteer_id),
    FOREIGN KEY (fk_class_id) REFERENCES class(class_id)
);

-- migrate:down
DROP TABLE IF EXISTS log;
