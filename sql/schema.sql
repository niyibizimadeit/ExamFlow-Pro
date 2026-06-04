-- ============================================================
-- ExamFlow Pro — Database Schema
-- Course: Java Web Development Capstone
-- Author: Prince Niyibizi | Taizhou University
-- Run: mysql -u root -p < sql/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS examflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE examflow;

-- ----------------------------------------------------------------
-- Table 1: users — all system users (Admin / Teacher / Student)
-- ----------------------------------------------------------------
CREATE TABLE users (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,             -- BCrypt hash
  full_name   VARCHAR(100) NOT NULL,
  role        ENUM('ADMIN','TEACHER','STUDENT') NOT NULL DEFAULT 'STUDENT',
  student_no  VARCHAR(30),                       -- students only
  class_name  VARCHAR(50),                       -- students only
  enabled     TINYINT(1)  NOT NULL DEFAULT 1,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- Table 2: categories — question categories (supports nesting)
-- ----------------------------------------------------------------
CREATE TABLE categories (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  parent_id   BIGINT       REFERENCES categories(id),
  created_by  BIGINT       NOT NULL REFERENCES users(id),
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- Table 3: questions — question bank
-- ----------------------------------------------------------------
CREATE TABLE questions (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  category_id   BIGINT       NOT NULL REFERENCES categories(id),
  type          ENUM('SINGLE','MULTIPLE','TRUEFALSE','FILL') NOT NULL,
  content       TEXT         NOT NULL,
  difficulty    TINYINT      NOT NULL DEFAULT 1,   -- 1=Easy 2=Medium 3=Hard
  default_score DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  explanation   TEXT,
  created_by    BIGINT       NOT NULL REFERENCES users(id),
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- Table 4: question_options — MCQ and True/False choices
-- ----------------------------------------------------------------
CREATE TABLE question_options (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT     NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label       CHAR(1)    NOT NULL,                -- A, B, C, D  or  T, F
  content     TEXT       NOT NULL,
  is_correct  TINYINT(1) NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------
-- Table 5: question_std_answers — Fill-in-blank standard answers
-- ----------------------------------------------------------------
CREATE TABLE question_std_answers (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT       NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text VARCHAR(500) NOT NULL,
  match_mode  ENUM('EXACT','CASE_INSENSITIVE','CONTAINS') NOT NULL DEFAULT 'CASE_INSENSITIVE'
);

-- ----------------------------------------------------------------
-- Table 6: exam_papers — paper metadata
-- ----------------------------------------------------------------
CREATE TABLE exam_papers (
  id            BIGINT       PRIMARY KEY AUTO_INCREMENT,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  created_by    BIGINT       NOT NULL REFERENCES users(id),
  duration_mins INT          NOT NULL DEFAULT 60,
  total_score   DECIMAL(6,2) NOT NULL DEFAULT 100.00,
  pass_score    DECIMAL(6,2) NOT NULL DEFAULT 60.00,
  start_time    DATETIME,
  end_time      DATETIME,
  status        ENUM('DRAFT','PUBLISHED','ENDED') NOT NULL DEFAULT 'DRAFT',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- Table 7: paper_questions — ordered questions within a paper
-- ----------------------------------------------------------------
CREATE TABLE paper_questions (
  id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
  paper_id    BIGINT       NOT NULL REFERENCES exam_papers(id) ON DELETE CASCADE,
  question_id BIGINT       NOT NULL REFERENCES questions(id),
  order_num   INT          NOT NULL DEFAULT 0,
  score       DECIMAL(5,2) NOT NULL,              -- may override default_score
  UNIQUE KEY uq_paper_question (paper_id, question_id)
);

-- ----------------------------------------------------------------
-- Table 8: assembly_rules — rule-based auto-assembly config
-- ----------------------------------------------------------------
CREATE TABLE assembly_rules (
  id            BIGINT       PRIMARY KEY AUTO_INCREMENT,
  paper_id      BIGINT       NOT NULL REFERENCES exam_papers(id) ON DELETE CASCADE,
  question_type ENUM('SINGLE','MULTIPLE','TRUEFALSE','FILL') NOT NULL,
  category_id   BIGINT       REFERENCES categories(id),
  difficulty    TINYINT,                          -- NULL = any difficulty
  count         INT          NOT NULL,
  score_each    DECIMAL(5,2) NOT NULL
);

-- ----------------------------------------------------------------
-- Table 9: exam_sessions — student exam attempts
-- ----------------------------------------------------------------
CREATE TABLE exam_sessions (
  id          BIGINT      PRIMARY KEY AUTO_INCREMENT,
  paper_id    BIGINT      NOT NULL REFERENCES exam_papers(id),
  student_id  BIGINT      NOT NULL REFERENCES users(id),
  start_time  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submit_time DATETIME,
  status      ENUM('IN_PROGRESS','SUBMITTED','GRADED') NOT NULL DEFAULT 'IN_PROGRESS',
  ip_address  VARCHAR(45),
  UNIQUE KEY uq_session (paper_id, student_id)   -- prevent duplicate attempts
);

-- ----------------------------------------------------------------
-- Table 10: student_answers — per-question answers per session
-- ----------------------------------------------------------------
CREATE TABLE student_answers (
  id           BIGINT       PRIMARY KEY AUTO_INCREMENT,
  session_id   BIGINT       NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id  BIGINT       NOT NULL REFERENCES questions(id),
  answer_given TEXT,                             -- comma-separated for MULTIPLE
  is_correct   TINYINT(1),
  score_earned DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  saved_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- Table 11: score_records — final graded summary per session
-- ----------------------------------------------------------------
CREATE TABLE score_records (
  id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
  session_id  BIGINT       NOT NULL UNIQUE REFERENCES exam_sessions(id),
  student_id  BIGINT       NOT NULL REFERENCES users(id),
  paper_id    BIGINT       NOT NULL REFERENCES exam_papers(id),
  score       DECIMAL(6,2) NOT NULL,
  passed      TINYINT(1)   NOT NULL DEFAULT 0,
  graded_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
