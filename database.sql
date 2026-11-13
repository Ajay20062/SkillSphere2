CREATE DATABASE IF NOT EXISTS skillsphere
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE skillsphere;

-- Spring Data JPA creates and updates the application tables at startup.
-- This file creates the database and can also be used to inspect the tables.

-- The application manages tables through Spring Data JPA.
-- Existing installations receive questions.display_order automatically via
-- spring.jpa.hibernate.ddl-auto=update. For manual schema reference only:
-- ALTER TABLE questions ADD COLUMN display_order INT NOT NULL DEFAULT 0;
