-- ============================================================
-- ExamFlow Pro — Test Data (Phase 2 — real BCrypt hashes)
-- Run AFTER schema.sql:  mysql -u root -p examflow < sql/test_data.sql
-- ============================================================

USE examflow;

-- ----------------------------------------------------------------
-- Users — BCrypt hashes (rounds=10):
--   admin123   → $2a$10$qgVj7m4GsT/NDNyUatpwkOyxV8SFbdzffuGOMzqV303Y6mEBAVNuy
--   teacher123 → $2a$10$jN0qstggHNa458kdXZajhu5aFHMJhacqdWAjtcX39X/4/qx0OOWgO
--   student123 → $2a$10$IOLkRgxj0wCKciwX5nkkz./X80yYGcUbY30bZRvzOPXwgBA0zojSm
-- ----------------------------------------------------------------
INSERT INTO users (username, email, password, full_name, role, enabled) VALUES
  ('admin',    'admin@examflow.com',    '$2a$10$qgVj7m4GsT/NDNyUatpwkOyxV8SFbdzffuGOMzqV303Y6mEBAVNuy', 'System Admin',   'ADMIN',   1),
  ('teacher1', 'teacher1@examflow.com', '$2a$10$jN0qstggHNa458kdXZajhu5aFHMJhacqdWAjtcX39X/4/qx0OOWgO', 'Wang Fang',      'TEACHER', 1),
  ('teacher2', 'teacher2@examflow.com', '$2a$10$jN0qstggHNa458kdXZajhu5aFHMJhacqdWAjtcX39X/4/qx0OOWgO', 'Li Ming',        'TEACHER', 1);

INSERT INTO users (username, email, password, full_name, role, student_no, class_name, enabled) VALUES
  ('student1', 'student1@examflow.com', '$2a$10$IOLkRgxj0wCKciwX5nkkz./X80yYGcUbY30bZRvzOPXwgBA0zojSm', 'Chen Wei',    'STUDENT', 'S2021001', 'CS2021A', 1),
  ('student2', 'student2@examflow.com', '$2a$10$IOLkRgxj0wCKciwX5nkkz./X80yYGcUbY30bZRvzOPXwgBA0zojSm', 'Zhang San',   'STUDENT', 'S2021002', 'CS2021A', 1),
  ('student3', 'student3@examflow.com', '$2a$10$IOLkRgxj0wCKciwX5nkkz./X80yYGcUbY30bZRvzOPXwgBA0zojSm', 'Liu Yang',    'STUDENT', 'S2021003', 'CS2021B', 1),
  ('student4', 'student4@examflow.com', '$2a$10$IOLkRgxj0wCKciwX5nkkz./X80yYGcUbY30bZRvzOPXwgBA0zojSm', 'Zhao Lei',    'STUDENT', 'S2021004', 'CS2021B', 1),
  ('student5', 'student5@examflow.com', '$2a$10$IOLkRgxj0wCKciwX5nkkz./X80yYGcUbY30bZRvzOPXwgBA0zojSm', 'Sun Xiaomei', 'STUDENT', 'S2021005', 'CS2021A', 1);
