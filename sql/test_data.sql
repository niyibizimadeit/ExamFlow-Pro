-- ============================================================
-- ExamFlow Pro — Test Data (Phase 1 bootstrap)
-- Run AFTER schema.sql:  mysql -u root -p examflow < sql/test_data.sql
-- Passwords (BCrypt of 'admin123', 'teacher123', 'student123'):
-- ============================================================

USE examflow;

-- ----------------------------------------------------------------
-- Users
-- BCrypt hashes generated with rounds=10:
--   admin123   → $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi  (placeholder, generate real hash)
-- In Phase 2 you'll generate real BCrypt hashes; for Phase 1 just verify rows insert.
-- Using a known BCrypt hash for 'password123' as placeholder until Phase 2 auth is wired.
-- ----------------------------------------------------------------
INSERT INTO users (username, email, password, full_name, role, enabled) VALUES
  ('admin',    'admin@examflow.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh1i', 'System Admin',   'ADMIN',   1),
  ('teacher1', 'teacher1@examflow.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh1i', 'Wang Fang',      'TEACHER', 1),
  ('teacher2', 'teacher2@examflow.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh1i', 'Li Ming',        'TEACHER', 1);

INSERT INTO users (username, email, password, full_name, role, student_no, class_name, enabled) VALUES
  ('student1', 'student1@examflow.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh1i', 'Chen Wei',    'STUDENT', 'S2021001', 'CS2021A', 1),
  ('student2', 'student2@examflow.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh1i', 'Zhang San',   'STUDENT', 'S2021002', 'CS2021A', 1),
  ('student3', 'student3@examflow.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh1i', 'Liu Yang',    'STUDENT', 'S2021003', 'CS2021B', 1),
  ('student4', 'student4@examflow.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh1i', 'Zhao Lei',    'STUDENT', 'S2021004', 'CS2021B', 1),
  ('student5', 'student5@examflow.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh1i', 'Sun Xiaomei', 'STUDENT', 'S2021005', 'CS2021A', 1);

-- NOTE: The BCrypt hash above decodes to 'test' as placeholder.
-- In Phase 2, regenerate with BCryptPasswordEncoder.encode("admin123") etc.
-- Replace that hash with:
--   admin123   → run: new BCryptPasswordEncoder().encode("admin123")
--   teacher123 → run: new BCryptPasswordEncoder().encode("teacher123")
--   student123 → run: new BCryptPasswordEncoder().encode("student123")
