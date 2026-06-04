# ExamFlow Pro — Instructions & System Design Guide

> Complete developer guide: environment setup, architecture decisions, API contracts, database design, and implementation patterns.

---

## Part 1: Environment Setup (macOS M1)

You are working on a MacBook Pro M1 2020. All tools need to be ARM-compatible. Follow these steps exactly before writing any code.

### 1.1 Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 1.2 Install Java 17 (ARM build)
```bash
brew install openjdk@17
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
java -version   # should show: openjdk 17.x.x
```

### 1.3 Install Maven
```bash
brew install maven
mvn -version
```

### 1.4 Install MySQL 8
```bash
brew install mysql
brew services start mysql
mysql_secure_installation   # set root password
mysql -u root -p            # test connection
```

### 1.5 Install Node.js (LTS)
```bash
brew install node
node -v && npm -v
```

### 1.6 Recommended IDE Setup
- **Backend:** IntelliJ IDEA Community (free) — Spring Boot plugin pre-installed
- **Frontend:** VS Code with extensions: ESLint, Tailwind CSS IntelliSense, Next.js snippets
- **DB client:** TablePlus (free tier) or MySQL Workbench

### 1.7 Create Spring Boot Project

Use Spring Initializr (start.spring.io) with:
- Project: Maven | Language: Java | Spring Boot: 3.2.x
- Java: 17 | Packaging: Jar
- Dependencies: Spring Web, Spring Data JPA, MySQL Driver, Spring Security, Lombok, Validation

```bash
# Or via curl:
curl https://start.spring.io/starter.zip \
  -d dependencies=web,data-jpa,mysql,security,lombok,validation \
  -d javaVersion=17 -d bootVersion=3.2.0 \
  -d artifactId=examflow-backend -o backend.zip
unzip backend.zip -d backend
```

### 1.8 Create Next.js Project
```bash
npx create-next-app@14 frontend --typescript --tailwind --eslint --app
cd frontend
npm install axios jwt-decode recharts lucide-react
npm run dev   # http://localhost:3000
```

---

## Part 2: Database Design

### 2.1 Database Creation
```sql
CREATE DATABASE examflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE examflow;
```

### 2.2 Complete Schema (11 Tables)

**Table 1: users** — all system users
```sql
CREATE TABLE users (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  username    VARCHAR(50) NOT NULL UNIQUE,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,             -- BCrypt hash
  full_name   VARCHAR(100) NOT NULL,
  role        ENUM('ADMIN','TEACHER','STUDENT') NOT NULL DEFAULT 'STUDENT',
  student_no  VARCHAR(30),                       -- for students
  class_name  VARCHAR(50),                       -- for students
  enabled     TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Table 2: categories** — question categories (supports nesting)
```sql
CREATE TABLE categories (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  parent_id   BIGINT REFERENCES categories(id),
  created_by  BIGINT NOT NULL REFERENCES users(id),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Table 3: questions** — question bank
```sql
CREATE TABLE questions (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  category_id   BIGINT NOT NULL REFERENCES categories(id),
  type          ENUM('SINGLE','MULTIPLE','TRUEFALSE','FILL') NOT NULL,
  content       TEXT NOT NULL,
  difficulty    TINYINT NOT NULL DEFAULT 1,       -- 1=Easy 2=Medium 3=Hard
  default_score DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  explanation   TEXT,
  created_by    BIGINT NOT NULL REFERENCES users(id),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Table 4: question_options** — MCQ and True/False choices
```sql
CREATE TABLE question_options (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label       CHAR(1) NOT NULL,                  -- A, B, C, D or T, F
  content     TEXT NOT NULL,
  is_correct  TINYINT(1) NOT NULL DEFAULT 0
);
```

**Table 5: question_std_answers** — Fill-in-blank standard answers
```sql
CREATE TABLE question_std_answers (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text VARCHAR(500) NOT NULL,
  match_mode  ENUM('EXACT','CASE_INSENSITIVE','CONTAINS') NOT NULL DEFAULT 'CASE_INSENSITIVE'
);
```

**Table 6: exam_papers** — paper metadata
```sql
CREATE TABLE exam_papers (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  created_by    BIGINT NOT NULL REFERENCES users(id),
  duration_mins INT NOT NULL DEFAULT 60,
  total_score   DECIMAL(6,2) NOT NULL DEFAULT 100.00,
  pass_score    DECIMAL(6,2) NOT NULL DEFAULT 60.00,
  start_time    DATETIME,
  end_time      DATETIME,
  status        ENUM('DRAFT','PUBLISHED','ENDED') NOT NULL DEFAULT 'DRAFT',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Table 7: paper_questions** — ordered questions in a paper
```sql
CREATE TABLE paper_questions (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  paper_id    BIGINT NOT NULL REFERENCES exam_papers(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id),
  order_num   INT NOT NULL DEFAULT 0,
  score       DECIMAL(5,2) NOT NULL,             -- may override default_score
  UNIQUE KEY uq_paper_question (paper_id, question_id)
);
```

**Table 8: assembly_rules** — rule-based auto-assembly config
```sql
CREATE TABLE assembly_rules (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  paper_id      BIGINT NOT NULL REFERENCES exam_papers(id) ON DELETE CASCADE,
  question_type ENUM('SINGLE','MULTIPLE','TRUEFALSE','FILL') NOT NULL,
  category_id   BIGINT REFERENCES categories(id),
  difficulty    TINYINT,                         -- NULL = any difficulty
  count         INT NOT NULL,
  score_each    DECIMAL(5,2) NOT NULL
);
```

**Table 9: exam_sessions** — student exam attempts
```sql
CREATE TABLE exam_sessions (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  paper_id    BIGINT NOT NULL REFERENCES exam_papers(id),
  student_id  BIGINT NOT NULL REFERENCES users(id),
  start_time  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submit_time DATETIME,
  status      ENUM('IN_PROGRESS','SUBMITTED','GRADED') NOT NULL DEFAULT 'IN_PROGRESS',
  ip_address  VARCHAR(45),
  UNIQUE KEY uq_session (paper_id, student_id)   -- prevent duplicates
);
```

**Table 10: student_answers** — per-question answers
```sql
CREATE TABLE student_answers (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id   BIGINT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id  BIGINT NOT NULL REFERENCES questions(id),
  answer_given TEXT,                             -- comma-sep for multiple choice
  is_correct   TINYINT(1),
  score_earned DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  saved_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Table 11: score_records** — final graded summary
```sql
CREATE TABLE score_records (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id   BIGINT NOT NULL UNIQUE REFERENCES exam_sessions(id),
  student_id   BIGINT NOT NULL REFERENCES users(id),
  paper_id     BIGINT NOT NULL REFERENCES exam_papers(id),
  total_score  DECIMAL(6,2) NOT NULL,
  passed       TINYINT(1) NOT NULL,
  graded_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## Part 3: Backend API Contracts

### 3.1 Auth Endpoints

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login → returns JWT token |
| POST | `/api/auth/register` | Public | Register new student account |
| GET | `/api/auth/me` | All | Get current user profile |
| PUT | `/api/auth/me` | All | Update own profile/password |

### 3.2 Admin Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users with filters |
| POST | `/api/admin/users` | Create teacher/admin account |
| PUT | `/api/admin/users/{id}` | Update any user |
| DELETE | `/api/admin/users/{id}` | Disable user account |
| GET | `/api/admin/stats` | System-wide statistics |

### 3.3 Question Bank Endpoints

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/questions` | Admin, Teacher | List questions (filter: type, category, difficulty, keyword) |
| POST | `/api/questions` | Teacher | Create new question with options |
| GET | `/api/questions/{id}` | Admin, Teacher | Get question detail |
| PUT | `/api/questions/{id}` | Teacher (own) | Update question |
| DELETE | `/api/questions/{id}` | Teacher (own) | Delete question |
| GET | `/api/categories` | All | List all categories |
| POST | `/api/categories` | Teacher | Create category |

### 3.4 Exam Paper Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/papers` | Teacher: own papers. Student: published, available papers |
| POST | `/api/papers` | Create exam paper (Teacher) |
| PUT | `/api/papers/{id}` | Update paper metadata (Teacher, DRAFT only) |
| POST | `/api/papers/{id}/questions` | Add questions manually (Teacher) |
| POST | `/api/papers/{id}/assemble` | Rule-based auto-assembly (Teacher) |
| PUT | `/api/papers/{id}/publish` | Publish paper (changes status to PUBLISHED) |
| GET | `/api/papers/{id}/preview` | Preview all questions (Teacher) |

### 3.5 Exam Session Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sessions/start/{paperId}` | Student starts exam → creates session, returns questions |
| GET | `/api/sessions/{id}` | Get current session state (for reconnect) |
| PUT | `/api/sessions/{id}/answers` | Auto-save answers (called every 30s) |
| POST | `/api/sessions/{id}/submit` | Final submit → triggers grading |

### 3.6 Score & Analysis Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/scores/my` | Student: own score history |
| GET | `/api/scores/paper/{paperId}` | Teacher: all scores for a paper |
| GET | `/api/scores/stats/{paperId}` | Stats: avg, max, min, distribution, per-question rates |
| GET | `/api/scores/wrong/{sessionId}` | Student: wrong answers with explanations |

---

## Part 4: Frontend Page Structure

| Route | Role | Page Name | Key Components |
|---|---|---|---|
| `/login` | Public | Login Page | Email/password form, role redirect after JWT decode |
| `/admin/dashboard` | Admin | Admin Dashboard | User counts, exam stats, quick links |
| `/admin/users` | Admin | User Management | Data table, create/edit/disable users |
| `/teacher/dashboard` | Teacher | Teacher Home | My papers, recent activity, stats |
| `/teacher/questions` | Teacher | Question Bank | Filterable list, create/edit modals |
| `/teacher/questions/new` | Teacher | Create Question | Form: type selector, option builder |
| `/teacher/papers` | Teacher | My Papers | Paper list, status badges, create button |
| `/teacher/papers/[id]/build` | Teacher | Paper Builder | Manual pick + rule-based assembly tabs |
| `/teacher/papers/[id]/results` | Teacher | Score Analysis | Charts: histogram, per-question rates |
| `/student/dashboard` | Student | Student Home | Available exams, my scores, notebook link |
| `/student/exam/[paperId]` | Student | Take Exam | Countdown, Q navigator, answer panel |
| `/student/results` | Student | My Results | Score history table |
| `/student/wrong-answers` | Student | Wrong Answers | Notebook: questions + correct answers |
| `/student/profile` | Student | My Profile | Edit name, password, class info |

### 4.1 JWT Auth Flow

```typescript
// lib/auth.ts
export function getToken() { return localStorage.getItem('examflow_token'); }
export function setToken(t: string) { localStorage.setItem('examflow_token', t); }
export function decodeRole(token: string): 'ADMIN' | 'TEACHER' | 'STUDENT' {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.role;
}

// middleware.ts — protect routes
export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.redirect('/login');
  const role = decodeRole(token);
  if (req.nextUrl.pathname.startsWith('/admin') && role !== 'ADMIN')
    return NextResponse.redirect('/login');
}
```

### 4.2 Exam Countdown Timer Component

```typescript
// components/ExamTimer.tsx
export function ExamTimer({ durationSeconds, onExpire }) {
  const [remaining, setRemaining] = useState(durationSeconds);
  useEffect(() => {
    const t = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(t); onExpire(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(remaining / 60), s = remaining % 60;
  return (
    <div className={remaining < 300 ? 'text-red-600' : 'text-green-700'}>
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  );
}
```

### 4.3 Auto-Save Implementation

```typescript
// Auto-save answers every 30 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    await axios.put(`/api/sessions/${sessionId}/answers`, { answers });
  }, 30000);
  return () => clearInterval(interval);
}, [answers]);
```

---

## Part 5: Grading Engine Logic

### 5.1 Grading Algorithm (Java)

```java
public ScoreRecord gradeSession(Long sessionId) {
  ExamSession session = sessionRepo.findById(sessionId);
  List<StudentAnswer> answers = answerRepo.findBySession(session);
  double total = 0;

  for (StudentAnswer ans : answers) {
    Question q = ans.getQuestion();
    PaperQuestion pq = paperQuestionRepo.find(session.getPaper(), q);
    boolean correct = false;

    switch (q.getType()) {
      case SINGLE, TRUEFALSE -> {
        String correctOpt = getCorrectLabel(q);  // e.g. 'A'
        correct = correctOpt.equals(ans.getAnswerGiven());
      }
      case MULTIPLE -> {
        Set<String> correctSet = getCorrectLabels(q);
        Set<String> givenSet = Set.of(ans.getAnswerGiven().split(","));
        correct = correctSet.equals(givenSet);
      }
      case FILL -> {
        List<StdAnswer> stdAnswers = stdAnswerRepo.findByQuestion(q);
        correct = stdAnswers.stream().anyMatch(sa ->
          matchAnswer(sa.getMatchMode(), sa.getAnswerText(), ans.getAnswerGiven()));
      }
    }
    ans.setIsCorrect(correct);
    ans.setScoreEarned(correct ? pq.getScore() : 0);
    total += ans.getScoreEarned();
  }
  answerRepo.saveAll(answers);
  session.setStatus(GRADED);
  return scoreRecordRepo.save(new ScoreRecord(session, total));
}
```

### 5.2 Rule-Based Assembly Algorithm

```java
public void assembleByRules(Long paperId) {
  List<AssemblyRule> rules = ruleRepo.findByPaper(paperId);
  int orderNum = 0;
  for (AssemblyRule rule : rules) {
    List<Question> pool = questionRepo.findByTypeAndDifficulty(
        rule.getQuestionType(), rule.getDifficulty(), rule.getCategoryId());
    Collections.shuffle(pool);   // random selection
    List<Question> selected = pool.subList(0, Math.min(rule.getCount(), pool.size()));
    for (Question q : selected) {
      paperQuestionRepo.save(
        new PaperQuestion(paperId, q.getId(), ++orderNum, rule.getScoreEach()));
    }
  }
}
```

---

## Part 6: Testing Requirements (12 Test Cases)

| TC# | Category | Test Case Name | Input | Expected Result |
|---|---|---|---|---|
| TC01 | Login | Valid student login | correct email+password | JWT returned, redirect to /student/dashboard |
| TC02 | Login | Invalid password | wrong password | 401 error, 'Invalid credentials' message |
| TC03 | Permission | Student access /teacher/* | student JWT to /teacher/questions | 403 forbidden, redirect to /login |
| TC04 | Permission | Teacher access /admin/* | teacher JWT to /admin/users | 403 forbidden |
| TC05 | Question CRUD | Create single-choice question | valid question form | Question saved, appears in list |
| TC06 | Question CRUD | Delete question linked to paper | delete used question | Error: 'Cannot delete, in use by papers' |
| TC07 | Assembly | Rule-based assembly | rules: 10 single, 5 MCQ, 5 T/F | Paper created with 20 correct questions |
| TC08 | Exam | Student takes exam | start exam, answer questions | Session created, countdown running |
| TC09 | Exam | Auto-submit on timer | let timer expire | Session status → SUBMITTED, grading triggered |
| TC10 | Exam | Duplicate submission guard | submit already-submitted session | Error: 'Exam already submitted' |
| TC11 | Grading | Auto-grade objective | submit filled exam | score_records row created, correct total |
| TC12 | Stats | Teacher score analysis | view paper stats | avg, max, min, distribution chart rendered |

> Each test case must be documented with: precondition, steps, actual result, pass/fail, and screenshot or recording timestamp.

---

## Part 7: Security Implementation

### 7.1 Spring Security JWT Filter

```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String header = req.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      if (jwtUtils.validateToken(token)) {
        UsernamePasswordAuthenticationToken auth =
          new UsernamePasswordAuthenticationToken(
            jwtUtils.getUsername(token), null,
            List.of(new SimpleGrantedAuthority("ROLE_" + jwtUtils.getRole(token))));
        SecurityContextHolder.getContext().setAuthentication(auth);
      }
    }
    chain.doFilter(req, res);
  }
}
```

### 7.2 CORS Configuration

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
      .allowedOrigins("http://localhost:3000")
      .allowedMethods("GET", "POST", "PUT", "DELETE")
      .allowedHeaders("*")
      .allowCredentials(true);
  }
}
```