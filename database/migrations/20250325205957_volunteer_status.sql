-- migrate:up

ALTER TABLE volunteers
ADD COLUMN temp_status ENUM('active', 'inactive', 'unverified') NOT NULL DEFAULT 'unverified';

SET SQL_SAFE_UPDATES = 0;

UPDATE volunteers
SET temp_status = CASE
     WHEN active = 1 then 'active'
     WHEN active = 0 then 'unverified'
     ELSE 'inactive'
END;

SET SQL_SAFE_UPDATES = 1;

ALTER TABLE volunteers
DROP COLUMN active;

ALTER TABLE volunteers
RENAME COLUMN temp_status to status;

-- migrate:down

ALTER TABLE volunteers
ADD COLUMN temp_active TINYINT(1) NOT NULL DEFAULT 0;

SET SQL_SAFE_UPDATES = 0;

UPDATE volunteers
SET temp_active = CASE
     WHEN status = 'active' then 1
     ELSE 0
END;

SET SQL_SAFE_UPDATES = 1;

ALTER TABLE volunteers
DROP COLUMN status;

ALTER TABLE volunteers
RENAME COLUMN temp_active to active;
