# Online Exam, Question Bank & Intelligent Test Assembly System

> **ExamFlow Pro** — A full-stack web application for online examination management

---

## Project Overview

ExamFlow Pro is a comprehensive online examination platform supporting three user roles (Administrator, Teacher, Student). The system provides intelligent test assembly, automatic grading, real-time exam sessions with countdown timers, and detailed score analysis. Built with Spring Boot (REST API) and Next.js (frontend), it fulfills all requirements for the Java Web Development course capstone.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend API | Spring Boot 3.x + Java 17 | RESTful API, business logic, JWT auth |
| Frontend | Next.js 14 + React 18 | Role-based UI, countdown timer, charts |
| Database | MySQL 8.x | Persistent storage (11 tables) |
| Auth | JWT + Spring Security | Stateless auth, role-based access |
| ORM | Spring Data JPA / Hibernate | Entity management, query DSL |
| Styling | Tailwind CSS | Responsive, utility-first design |
| Charts | Recharts | Score distribution, correct rate charts |
| Build | Maven (backend), npm (frontend) | Dependency management |

---

## System Architecture

The system follows a decoupled architecture: Next.js frontend communicates with Spring Boot via JSON REST APIs, secured by JWT Bearer tokens. MySQL stores all persistent data across 11 normalized tables.

```
┌─────────────────────┐    HTTP/REST     ┌──────────────────────┐
│  Next.js (Port 3000) │ ◄──────────────► │ Spring Boot (Port 8080)│
│  Role-based routing  │   JSON + JWT     │  @RestController      │
│  /admin, /teacher    │                  │  @Service, @Repository│
│  /student, /exam     │                  └──────────┬────────────┘
└─────────────────────┘                             │
                                               ┌─────▼──────┐
                                               │  MySQL 8   │
                                               │ 11 Tables  │
                                               └────────────┘
```

---

## User Roles

| Role | Access Level | Key Capabilities |
|---|---|---|
| Administrator | Full system access | Manage all users, view all exams, system config |
| Teacher | Content + results | Question bank, create papers, view class analytics |
| Student | Exam + personal | Take exams, view scores, wrong answer notebook |

---

## Core Features

### 1. Question Bank Management
- 4 question types: Single Choice, Multiple Choice, True/False, Fill-in-the-Blank
- Category tagging with nested sub-categories
- Difficulty levels: Easy (1), Medium (2), Hard (3)
- Per-question score weighting and explanations
- Full CRUD with conditional search (type, category, difficulty, keyword)

### 2. Exam Paper Management
- Manual question selection with drag-and-drop ordering
- Rule-based intelligent test assembly (auto-select by type, difficulty, count)
- Configurable: start/end time, duration, total score, pass threshold
- Paper preview before publishing

### 3. Online Exam Session
- Real-time countdown timer with auto-submit on expiry
- Auto-save answers every 30 seconds (localStorage + API)
- Anti-duplicate submission guard (session status check)
- Question navigation panel showing answered/unanswered

### 4. Automatic Grading
- Instant grading for Single Choice, Multiple Choice, True/False
- Fill-in-the-blank: exact match + case-insensitive match against standard answers
- Auto-calculate total score and pass/fail determination

### 5. Score Analysis
- Student: personal score history, ranking, wrong answer notebook
- Teacher: class average, highest, lowest, score distribution histogram
- Per-question correct rate — identify difficult questions
- Score range statistics (0–59, 60–74, 75–89, 90–100)

---

## Database Schema (11 Tables)

| Table | Description | Key Relations |
|---|---|---|
| `users` | All system users with role | PK: id |
| `categories` | Question categories (tree) | FK: parent_id → categories.id |
| `questions` | Question bank | FK: category_id, created_by |
| `question_options` | MCQ options with is_correct flag | FK: question_id |
| `question_std_answers` | Fill-in-blank standard answers | FK: question_id |
| `exam_papers` | Exam paper metadata | FK: created_by (teacher) |
| `paper_questions` | Questions in a paper (ordered) | FK: paper_id, question_id |
| `assembly_rules` | Rule-based assembly config | FK: paper_id |
| `exam_sessions` | Student exam attempts | FK: paper_id, student_id |
| `student_answers` | Answers per session | FK: session_id, question_id |
| `score_records` | Final graded scores | FK: session_id, student_id, paper_id |

---

## Project Structure

```
examflow-pro/
├── backend/                    # Spring Boot project
│   ├── src/main/java/
│   │   ├── controller/         # REST controllers
│   │   ├── service/            # Business logic
│   │   ├── repository/         # JPA repositories
│   │   ├── entity/             # JPA entities
│   │   ├── dto/                # Request/Response DTOs
│   │   ├── security/           # JWT filter, config
│   │   └── exception/          # Global exception handler
│   └── src/main/resources/
│       ├── application.yml     # DB config, JWT secret
│       └── db/                 # schema.sql, data.sql
├── frontend/                   # Next.js project
│   ├── app/
│   │   ├── (auth)/             # Login page
│   │   ├── admin/              # Admin dashboard
│   │   ├── teacher/            # Teacher portal
│   │   └── student/            # Student portal + exam
│   ├── components/             # Reusable UI components
│   ├── lib/                    # API client, auth hooks
│   └── public/
├── docs/                       # README, instructions, todo
├── sql/                        # schema.sql, test_data.sql
└── README.md
```

---

## 10-Phase Development Plan

| Phase | Name | Duration | Key Output |
|---|---|---|---|
| Phase 1 | Environment & DB Design | Day 1 | MySQL schema, Spring Boot scaffold |
| Phase 2 | Auth System | Day 1–2 | JWT login, 3-role access, middleware |
| Phase 3 | Question Bank API | Day 2–3 | Full CRUD, 4 question types |
| Phase 4 | Question Bank UI | Day 3–4 | Teacher question management pages |
| Phase 5 | Exam Paper Management | Day 4–5 | Manual + rule-based assembly |
| Phase 6 | Online Exam Session | Day 5–6 | Countdown, save, anti-dup |
| Phase 7 | Auto-Grading Engine | Day 6–7 | Grading logic, score records |
| Phase 8 | Score Analysis | Day 7–8 | Charts, stats, class overview |
| Phase 9 | Wrong Answer Notebook | Day 8–9 | Student review, explanations |
| Phase 10 | Testing & Polish | Day 9–10 | 12 test cases, SQL files, demo |

---

## Submission Materials Checklist

- [ ] Project source code (backend + frontend)
- [ ] `schema.sql` — all 11 CREATE TABLE statements
- [ ] `test_data.sql` — sample users, questions, papers, exam records
- [ ] System design document (this README + instructions.md)
- [ ] Test cases and results (minimum 12 cases with video)
- [ ] Practice/lab report
- [ ] Defense presentation (PPT)
- [ ] System demonstration video

---

## Quick Start (After Setup)

### Backend
```bash
cd backend
# Configure application.yml with your MySQL credentials
mvn spring-boot:run
# API runs at http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:3000
```

### Database
```bash
mysql -u root -p < sql/schema.sql
mysql -u root -p examflow < sql/test_data.sql
```

---

## Author & Course Info

| Field | Value |
|---|---|
| Project Name | ExamFlow Pro — Online Exam & Intelligent Test Assembly System |
| Course | Java Web Development Capstone |
| Difficulty | Difficult (Full-featured, 10-phase, 11 DB tables) |
| Author | Prince Niyibizi |
| University | Taizhou University |
| GitHub | https://github.com/niyibizimadeit |