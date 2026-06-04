# ExamFlow Pro  10-Phase Development TODO

> Each phase has clear backend, frontend, and database tasks. Check off items as completed. A phase is complete **only** when its acceptance criteria is met.

---

## Phase Overview

| # | Phase Name | Day(s) | Primary Output | Status |
|---|---|---|---|---|
| 1 | Environment & DB Setup | Day 1 (AM) | MySQL DB created, Spring Boot runs, Next.js runs | ✅ |
| 2 | Authentication System | Day 1 PM – Day 2 AM | JWT login works for all 3 roles | ✅ |
| 3 | Question Bank — Backend | Day 2 PM – Day 3 AM | Full CRUD APIs for questions + categories | ✅ |
| 4 | Question Bank — Frontend | Day 3 PM – Day 4 AM | Teacher can manage questions in the browser | ✅ |
| 5 | Exam Paper Management | Day 4 PM – Day 5 AM | Manual + rule-based paper creation works | ✅ |
| 6 | Online Exam Session | Day 5 PM – Day 6 AM | Student can start exam, countdown runs, auto-saves | ✅ |
| 7 | Auto-Grading Engine | Day 6 PM – Day 7 AM | All question types graded, score record created | ✅ |
| 8 | Score Analysis & Charts | Day 7 PM – Day 8 AM | Teacher sees class stats with charts | ✅ |
| 9 | Wrong Answer Notebook | Day 8 PM – Day 9 AM | Student sees wrong Qs with correct answers | ✅ |
| 10 | Testing, Polish & Submission | Day 9 PM – Day 10 | 12 test cases pass, all SQL files ready, video done | ☐ |

---

## PHASE 1: Environment & Database Setup
**Day 1 — Morning (3–4 hours)**
> 🎯 Get both projects running locally and database schema created

### Backend
- [x] Generate Spring Boot project at start.spring.io (deps: Web, JPA, MySQL, Security, Lombok, Validation)
- [x] Configure `application.yml`: datasource URL, username, password, JPA `ddl-auto=validate`
- [x] Create all 11 JPA Entity classes matching the schema
- [x] Create all Repository interfaces (extends `JpaRepository`)
- [x] Write `ExamflowApplication.java` and confirm `mvn spring-boot:run` starts
- [x] Create `GlobalExceptionHandler` with `@RestControllerAdvice`
- [x] Create standard `ApiResponse<T>` wrapper DTO

### Frontend
- [x] Run: `npx create-next-app@14 frontend --typescript --tailwind --eslint --app`
- [x] Install: `npm install axios jwt-decode recharts lucide-react`
- [x] Create `/lib/api.ts` — Axios instance with Authorization header interceptor
- [x] Create `/lib/auth.ts` — `getToken`, `setToken`, `clearToken`, `decodeRole` helpers
- [x] Create skeleton layouts for `/admin`, `/teacher`, `/student` route groups
- [x] Create a placeholder home page that redirects to `/login`

### Database
- [x] Create database: `CREATE DATABASE examflow CHARACTER SET utf8mb4;`
- [x] Run `schema.sql` — all 11 CREATE TABLE statements
- [x] Verify all tables exist: `SHOW TABLES;` and `DESCRIBE users;`
- [x] Insert 1 test admin user manually to verify connectivity

**✅ Phase Done When:** Spring Boot starts without error. Next.js dev server shows homepage. All 11 tables exist in MySQL.

---

## PHASE 2: Authentication System
**Day 1 PM – Day 2 AM (4–5 hours)**
> 🎯 JWT-based login/register with role-based access control for all 3 roles

### Backend
- [x] Add `jjwt` dependency to `pom.xml` (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`)
- [x] Create `JwtUtils`: `generateToken(user)`, `validateToken(token)`, `getUsername`, `getRole`
- [x] Create `JwtAuthFilter` extends `OncePerRequestFilter`
- [x] Configure `SecurityConfig`: permit `/api/auth/**`, require auth on all others, stateless session
- [x] Create `UserDetailsServiceImpl` — load user by email from DB
- [x] Create `AuthController`: `POST /api/auth/login`, `POST /api/auth/register`
- [x] Create `UserController`: `GET /api/auth/me`, `PUT /api/auth/me`
- [x] Password hashing with `BCryptPasswordEncoder`
- [x] Return role in JWT payload claims
- [x] Configure CORS for `http://localhost:3000`

### Frontend
- [x] Create `/app/login/page.tsx` — login form (email + password)
- [x] On login success: save JWT to localStorage, decode role, redirect by role
- [x] Create `middleware.ts` — protect `/admin`, `/teacher`, `/student` routes by JWT role
- [x] Create `useAuth()` hook: returns `{ user, token, logout }`
- [x] Create `NavBar` component with logout button and username display
- [x] Create skeleton dashboard pages: `/admin/dashboard`, `/teacher/dashboard`, `/student/dashboard`
- [x] Test: login as admin → goes to `/admin/dashboard`, as student → `/student/dashboard`

### Database
- [x] Insert test data: 1 admin, 2 teachers, 5 students (BCrypt hashed passwords)
- [x] Passwords for test data: `admin123`, `teacher123`, `student123`

**✅ Phase Done When:** All 3 role logins work, wrong role gets 403 or redirect, JWT is attached on all API calls, logout clears token.

---

## PHASE 3: Question Bank — Backend APIs
**Day 2 PM – Day 3 AM (4 hours)**
> 🎯 REST APIs for creating, reading, updating, and deleting all question types and categories

### Backend
- [x] Create `CategoryController`: `GET /api/categories`, `POST`, `PUT`, `DELETE`
- [x] Create `QuestionController`: `GET /api/questions` (paginated, filterable), `POST`, `GET/{id}`, `PUT/{id}`, `DELETE/{id}`
- [x] Implement question filter: `?type=SINGLE&categoryId=1&difficulty=2&keyword=java`
- [x] Handle question type variants: `SINGLE/MULTIPLE/TRUEFALSE` save options, `FILL` saves std answers
- [x] Create `QuestionService` with `createQuestion(dto)`, `updateQuestion(id, dto)`, `deleteQuestion(id)`
- [x] On delete: check if question is used in any `paper_questions` — if so, throw error
- [x] Use DTOs: `QuestionCreateDto`, `QuestionUpdateDto`, `QuestionResponseDto` (with options/answers embedded)
- [x] Validate: question must have ≥2 options for `SINGLE/MULTIPLE/TRUEFALSE`
- [x] Create `CategoryService` with full CRUD
- [x] Return paginated `Page<QuestionResponseDto>` for list endpoint

### Frontend
- [x] No frontend work this phase — focus purely on API. Use Postman or curl to test all endpoints.

### Database
- [x] Seed 5 categories and 30+ questions (mix of all 4 types) into `test_data.sql`
- [x] Ensure at least 10 SINGLE, 5 MULTIPLE, 5 TRUEFALSE, 5 FILL questions for assembly testing
- [x] Mark correct options in `question_options` with `is_correct=1`
- [x] Add std answers in `question_std_answers` for all FILL questions

**✅ Phase Done When:** All 7 question/category API endpoints return correct data, filters work, validation returns proper error messages.

---

## PHASE 4: Question Bank — Teacher Frontend
**Day 3 PM – Day 4 AM (4–5 hours)**
> 🎯 Teacher can browse, create, edit, and delete questions through the browser UI

### Backend
- [ ] No new backend work — all APIs done in Phase 3

### Frontend
- [ ] Create `/teacher/questions/page.tsx` — question list table: content preview, type badge, difficulty stars, category, actions
- [ ] Add filter bar: dropdowns for type, category, difficulty + keyword text search
- [ ] Create `/teacher/questions/new/page.tsx` — create question form
- [ ] Question form: type selector changes visible fields (shows option inputs for MCQ, text inputs for fill-in)
- [ ] Option builder for MCQ: add/remove options, radio/checkbox to mark correct answer(s)
- [ ] Edit question: pre-fill form from `GET /api/questions/{id}`
- [ ] Delete with confirmation dialog
- [ ] Create `/teacher/questions/categories/page.tsx` — category management (simple list + create/delete)
- [ ] Add difficulty display: 1=⭐ Easy, 2=⭐⭐ Medium, 3=⭐⭐⭐ Hard
- [ ] Add question type color badges: SINGLE=blue, MULTIPLE=purple, TRUEFALSE=green, FILL=orange
- [ ] Pagination controls (page 1/2/3…)
- [ ] Toast notifications on create/update/delete success or error

### Database
- [ ] No DB changes this phase

**✅ Phase Done When:** Teacher can log in, see all questions in a filterable table, create a new question of each type, edit it, and delete it.

---

## PHASE 5: Exam Paper Management
**Day 4 PM – Day 5 AM (5 hours)**
> 🎯 Teacher creates exam papers — both manual question selection and rule-based intelligent assembly

### Backend
- [ ] Create `PaperController`: `GET /api/papers`, `POST`, `PUT/{id}`, `DELETE/{id}`
- [ ] Create `POST /api/papers/{id}/questions` — add array of `{questionId, score}` manually
- [ ] Create `DELETE /api/papers/{id}/questions/{questionId}` — remove from paper
- [ ] Create `POST /api/papers/{id}/assemble` — accepts array of `AssemblyRuleDto`, runs assembly logic
- [ ] Assembly logic: for each rule, query question pool by type+difficulty+category, shuffle, pick N, insert into `paper_questions`
- [ ] Create `PUT /api/papers/{id}/publish` — validate paper has ≥1 question, set `status=PUBLISHED`
- [ ] Create `GET /api/papers/{id}/preview` — returns paper with all questions (teacher only)
- [ ] Students `GET /api/papers` only see PUBLISHED papers where `now()` is between `start_time` and `end_time`
- [ ] Create `AssemblyRuleService` with pool validation (check enough questions available)

### Frontend
- [ ] Create `/teacher/papers/page.tsx` — paper list with status badges (DRAFT=gray, PUBLISHED=green, ENDED=red)
- [ ] Create `/teacher/papers/new/page.tsx` — paper metadata form: title, description, duration, scores, start/end times
- [ ] Create `/teacher/papers/[id]/build/page.tsx` — Paper Builder with two tabs:
  - [ ] Tab 1 (Manual): searchable question list on left, paper question list on right, drag to reorder, score per question input
  - [ ] Tab 2 (Assembly): rule form — add row per type (select type, difficulty, count, score_each), click Assemble
- [ ] Show total score auto-calculated as sum of all question scores
- [ ] Publish button with confirmation: "Once published, questions cannot be changed"
- [ ] Paper preview modal showing all questions as students would see them

### Database
- [ ] Seed 2–3 exam papers (1 DRAFT, 1 PUBLISHED) with assembly rules in `test_data.sql`

**✅ Phase Done When:** Teacher can create paper, add 10 single+5 MCQ+5 T/F via assembly rules, publish it, and preview it.

---

## PHASE 6: Online Exam Session
**Day 5 PM – Day 6 AM (5 hours)**
> 🎯 Students can enter, navigate, and answer an exam with real-time countdown and auto-save

### Backend
- [ ] Create `SessionController`: `POST /api/sessions/start/{paperId}`, `GET /api/sessions/{id}`
- [ ] On start: check paper is PUBLISHED and within time window, check no existing session (UNIQUE key guard), create `exam_session`, return paper questions **without** correct answers
- [ ] Create `PUT /api/sessions/{id}/answers` — saves/updates `student_answers` (upsert by session+question)
- [ ] Create `POST /api/sessions/{id}/submit` — validates not already submitted, sets `status=SUBMITTED`, triggers grading
- [ ] Create `SessionService.getSessionState()` — returns remaining time, answered count, session status
- [ ] Security: student can only access their own session (`session.studentId == authenticated user`)
- [ ] Handle race condition: if student submits and timer fires simultaneously — idempotent submit

### Frontend
- [ ] Create `/student/dashboard/page.tsx` — list of available exams (title, duration, start/end time, status)
- [ ] Create `/student/exam/[paperId]/page.tsx` — the exam interface:
  - [ ] Left panel: question navigator (numbered buttons, green=answered, gray=unanswered)
  - [ ] Center: current question content + answer input (radio for SINGLE, checkboxes for MULTIPLE, radio T/F, text for FILL)
  - [ ] Right panel: countdown timer component (red when < 5 min)
  - [ ] Bottom: Previous / Next / Submit buttons
- [ ] Auto-save: `useEffect` interval every 30s calling `PUT /api/sessions/{id}/answers`
- [ ] On timer expire: auto-call `POST /api/sessions/{id}/submit`, redirect to results page
- [ ] On manual submit: confirmation dialog "X questions unanswered. Submit anyway?"
- [ ] Guard: if session status is already SUBMITTED, redirect away immediately
- [ ] Reconnect: on page reload, fetch `GET /api/sessions/{id}` to restore answers and remaining time

### Database
- [ ] Seed 2 exam sessions (one IN_PROGRESS, one SUBMITTED) in `test_data.sql`

**✅ Phase Done When:** Student can start exam, see countdown, answer questions, auto-save works, submit redirects to score page, revisiting the exam URL shows "already submitted".

---

## PHASE 7: Auto-Grading Engine
**Day 6 PM – Day 7 AM (4 hours)**
> 🎯 Automatic grading of all question types immediately on submission, score record created

### Backend
- [ ] Create `GradingService.gradeSession(sessionId)` — runs after submit
- [ ] `SINGLE / TRUEFALSE` grading: compare `ans.answerGiven` to the option with `is_correct=1`
- [ ] `MULTIPLE` grading: split comma-separated given vs full set of correct options — must match exactly
- [ ] `FILL` grading: check against all std answers using the `match_mode` (EXACT, CASE_INSENSITIVE, CONTAINS)
- [ ] Save `is_correct` and `score_earned` on each `student_answer` row
- [ ] Sum total score, compare to `pass_score`, create `score_records` entry
- [ ] Update session status to GRADED
- [ ] Handle edge case: unanswered questions get `is_correct=false`, `score_earned=0`
- [ ] Create `ScoreController`: `GET /api/scores/my`, `GET /api/scores/paper/{paperId}`, `GET /api/scores/stats/{paperId}`
- [ ] Stats endpoint returns: `{ avg, max, min, count, distribution: [{range, count}], questionStats: [{questionId, correctRate}] }`

### Frontend
- [ ] Create `/student/results/page.tsx` — list of `score_records` for current student: paper title, score, passed badge, date
- [ ] Create `/student/results/[sessionId]/page.tsx` — detailed result: per-question breakdown (your answer, correct answer, earned score)
- [ ] Show overall pass/fail banner at top of result page

### Database
- [ ] Seed complete exam sessions with graded answers and `score_records` in `test_data.sql`

**✅ Phase Done When:** After submitting exam, score is immediately calculated, `score_record` row exists, student can see their score and per-question results.

---

## PHASE 8: Score Analysis & Charts
**Day 7 PM – Day 8 AM (4 hours)**
> 🎯 Teacher sees full class statistics with visual charts; admin sees system-wide stats

### Backend
- [ ] Enhance `GET /api/scores/stats/{paperId}`: avg, max, min, pass rate, score distribution (0–59, 60–74, 75–89, 90–100), per-question correct rates
- [ ] Create `GET /api/admin/stats`: total users by role, total papers, total exams taken, system avg score
- [ ] Ensure only the teacher who owns the paper (or admin) can access paper stats
- [ ] Add class filter: `?class=CS2024` (filter `score_records` by student `class_name`)

### Frontend
- [ ] Create `/teacher/papers/[id]/results/page.tsx` — Score Analysis Dashboard:
  - [ ] Summary cards: Average Score, Highest Score, Lowest Score, Pass Rate
  - [ ] Score distribution bar chart (Recharts `BarChart`) — X: score range, Y: number of students
  - [ ] Per-question correct rate horizontal bar chart — sorted ascending (hardest first)
  - [ ] Student results data table: name, score, pass/fail, submission time
  - [ ] Export to CSV button (optional bonus)
- [ ] Create `/admin/dashboard/page.tsx` — admin overview with system stats cards
- [ ] Create `/admin/users/page.tsx` — paginated user management table with search, role filter, enable/disable
- [ ] All charts responsive using Recharts `ResponsiveContainer`

### Database
- [ ] Ensure `test_data.sql` has ≥5 student score records per paper for charts to be meaningful

**✅ Phase Done When:** Teacher opens a paper's results page and sees all charts rendering with real data, average/max/min cards are correct.

---

## PHASE 9: Wrong Answer Notebook
**Day 8 PM – Day 9 AM (3 hours)**
> 🎯 Students can review all incorrectly answered questions with correct answers and explanations

### Backend
- [ ] Create `GET /api/scores/wrong/{sessionId}` — returns all `student_answers` where `is_correct=false`, with full question detail, correct answer(s), and explanation
- [ ] Create `GET /api/scores/wrong/all` — returns all wrong answers across all sessions for current student (deduplicated by question)

### Frontend
- [ ] Create `/student/wrong-answers/page.tsx` — Wrong Answer Notebook:
  - [ ] Group by exam paper
  - [ ] Each question card shows: question content, student's answer (red), correct answer (green), explanation (collapsible)
  - [ ] Filter by paper, question type, category
  - [ ] Show question count in header: "You have 12 wrong answers"
- [ ] Create `/student/profile/page.tsx` — edit name, class, password (current + new + confirm)

### Database
- [ ] No DB changes this phase

**✅ Phase Done When:** Student can navigate to Wrong Answers, see all incorrectly answered questions, correct answers, and explanations.

---

## PHASE 10: Testing, Polish & Submission Prep
**Day 9 PM – Day 10 (Full day)**
> 🎯 All 12 test cases pass, all submission materials ready, demo video recorded

### Backend
- [ ] Fix any bugs found during testing
- [ ] Add input validation on all `POST/PUT` endpoints (`@Valid` + custom messages)
- [ ] Add proper HTTP status codes: 201 Created, 404 Not Found, 409 Conflict, 400 Bad Request
- [ ] Review all SQL for injection safety (JPA parameterized queries)
- [ ] Write at least 5 unit tests for `GradingService` (JUnit + Mockito)

### Frontend
- [ ] Mobile responsiveness check on all key pages
- [ ] Error state UI: show error messages when API calls fail (not just `console.error`)
- [ ] Loading spinners on all data fetching operations
- [ ] Empty states: "No questions found. Create your first question." etc.
- [ ] 404 page for unknown routes
- [ ] Test all 8 required pages exist and work correctly

### Database
- [ ] Finalize `schema.sql` — clean, commented, runnable from scratch
- [ ] Finalize `test_data.sql` — includes admin/teacher/student users, 30+ questions, 2+ papers, 5+ sessions, graded scores
- [ ] Run both SQL files on a fresh DB to confirm they work end-to-end

**✅ Phase Done When:** All 12 TC pass (with documented results), `schema.sql` + `test_data.sql` run cleanly, demo video recorded (5–10 min), defense PPT ready.

---

## Submission Checklist

| Item | File/Location | Done? |
|---|---|---|
| Source code — backend | `backend/` (zip or GitHub) | ☐ |
| Source code — frontend | `frontend/` (zip or GitHub) | ☐ |
| Database schema SQL | `sql/schema.sql` | ☐ |
| Test data SQL | `sql/test_data.sql` | ☐ |
| System design document | `docs/README.md` + `docs/INSTRUCTIONS.md` | ☐ |
| Test cases + results | `docs/test_cases.xlsx` or `.docx` (12 cases) | ☐ |
| Practice/lab report | `docs/lab_report.docx` | ☐ |
| Defense PPT | `docs/defense.pptx` | ☐ |
| Demo video (5–10 min) | `video/demo.mp4` | ☐ |

---

## Quick Reference: Required Pages

| Page Requirement | Route | Role |
|---|---|---|
| Login page | `/login` | Public |
| Homepage / main page | `/[role]/dashboard` | All |
| Data list page | `/teacher/questions` | Teacher |
| Add and edit pages | `/teacher/questions/new` + `/teacher/questions/[id]/edit` | Teacher |
| Query / search page | `/teacher/questions` (filter bar) | Teacher |
| Statistics display page | `/teacher/papers/[id]/results` | Teacher |
| Personal info / records page | `/student/profile` + `/student/results` | Student |
| Admin management page | `/admin/users` | Admin |