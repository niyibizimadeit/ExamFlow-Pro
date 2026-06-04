-- ============================================================
-- ExamFlow Pro — Complete Test Data
-- Run AFTER schema.sql:  mysql -u root -p examflow < sql/test_data.sql
-- ============================================================
USE examflow;

-- Clean all data (respects FK order)
DELETE FROM student_answers;
DELETE FROM score_records;
DELETE FROM exam_sessions;
DELETE FROM assembly_rules;
DELETE FROM paper_questions;
DELETE FROM exam_papers;
DELETE FROM question_std_answers;
DELETE FROM question_options;
DELETE FROM questions;
DELETE FROM categories;
DELETE FROM users;
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE questions AUTO_INCREMENT = 1;

-- ----------------------------------------------------------------
-- Users — BCrypt(password123):
--   admin123   → admin
--   teacher123 → teacher1, teacher2
--   student123 → student1–5
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

-- ----------------------------------------------------------------
-- Categories (5) — created by teacher1 (id=2)
-- ----------------------------------------------------------------
INSERT INTO categories (id, name, description, parent_id, created_by, created_at) VALUES
(1, 'Java Basics',          'Core Java language fundamentals',           NULL, 2, NOW()),
(2, 'Spring Framework',     'Spring Boot, MVC, Data, and Security',      NULL, 2, NOW()),
(3, 'Database & SQL',       'Relational databases, SQL queries, JDBC',   NULL, 2, NOW()),
(4, 'Web Development',      'HTML, CSS, JavaScript, HTTP fundamentals',  NULL, 2, NOW()),
(5, 'Software Engineering', 'Design patterns, testing, Agile',           NULL, 2, NOW());

-- ----------------------------------------------------------------
-- Questions (30 total: 12 SINGLE + 6 MULTIPLE + 6 TRUEFALSE + 6 FILL)
-- ----------------------------------------------------------------
INSERT INTO questions (id, category_id, type, content, difficulty, default_score, explanation, created_by, created_at, updated_at) VALUES
-- SINGLE (12)
(1,  1, 'SINGLE', 'What is the default value of an int variable in Java?',                          1, 2, 'Primitive int defaults to 0. Reference types default to null.', 2, NOW(), NOW()),
(2,  1, 'SINGLE', 'Which keyword is used to inherit a class in Java?',                             1, 2, 'The extends keyword establishes an inheritance relationship.', 2, NOW(), NOW()),
(3,  1, 'SINGLE', 'Which collection allows duplicate elements?',                                    2, 2, 'List implementations like ArrayList allow duplicate elements. Set does not.', 2, NOW(), NOW()),
(4,  1, 'SINGLE', 'What does JVM stand for?',                                                      1, 2, 'JVM (Java Virtual Machine) executes Java bytecode on any platform.', 2, NOW(), NOW()),
(5,  2, 'SINGLE', 'Which annotation marks a class as a Spring Boot REST controller?',              1, 2, '@RestController combines @Controller and @ResponseBody.', 2, NOW(), NOW()),
(6,  2, 'SINGLE', 'What is the default scope of a Spring Bean?',                                   2, 2, 'Singleton is the default scope — one instance per Spring container.', 2, NOW(), NOW()),
(7,  2, 'SINGLE', 'Which annotation is used for dependency injection in Spring?',                  1, 2, '@Autowired wires dependencies automatically.', 2, NOW(), NOW()),
(8,  3, 'SINGLE', 'Which SQL keyword is used to retrieve data from a database?',                   1, 2, 'SELECT retrieves rows from tables. FROM specifies the table.', 2, NOW(), NOW()),
(9,  3, 'SINGLE', 'What does ACID stand for in database transactions?',                            2, 2, 'Atomicity, Consistency, Isolation, Durability.', 2, NOW(), NOW()),
(10, 4, 'SINGLE', 'Which HTTP method is used to create a new resource?',                           1, 2, 'POST creates new resources. PUT updates/replaces existing ones.', 2, NOW(), NOW()),
(11, 4, 'SINGLE', 'What does CSS stand for?',                                                      1, 2, 'Cascading Style Sheets define the visual presentation of HTML.', 2, NOW(), NOW()),
(12, 5, 'SINGLE', 'Which design pattern ensures a class has only one instance?',                   2, 2, 'Singleton pattern restricts instantiation to a single object.', 2, NOW(), NOW()),
-- MULTIPLE (6)
(13, 1, 'MULTIPLE', 'Which of the following are primitive data types in Java? (Select all that apply)',             1, 2, 'int, boolean, and double are primitives. String is a reference type.', 2, NOW(), NOW()),
(14, 2, 'MULTIPLE', 'Which are valid Spring Boot starters? (Select all that apply)',                                2, 2, 'All three are official Spring Boot starter dependencies.', 2, NOW(), NOW()),
(15, 2, 'MULTIPLE', 'Which annotations are used for request mapping in Spring MVC? (Select all that apply)',        2, 2, 'All four are valid Spring MVC request mapping annotations.', 2, NOW(), NOW()),
(16, 3, 'MULTIPLE', 'Which of the following are SQL aggregate functions? (Select all that apply)',                  1, 2, 'COUNT, SUM, and AVG are aggregate functions. WHERE is a clause.', 2, NOW(), NOW()),
(17, 5, 'MULTIPLE', 'Which are SOLID principles? (Select all that apply)',                                          3, 2, 'Single Responsibility, Open/Closed, Dependency Inversion are SOLID.', 2, NOW(), NOW()),
(18, 5, 'MULTIPLE', 'Which of the following are Agile methodologies? (Select all that apply)',                      2, 2, 'Scrum, Kanban, and XP are Agile. Waterfall is traditional.', 2, NOW(), NOW()),
-- TRUEFALSE (6)
(19, 1, 'TRUEFALSE', 'Java is a platform-independent language.',                                  1, 1, 'Java bytecode runs on any platform with a JVM — "Write Once, Run Anywhere".', 2, NOW(), NOW()),
(20, 1, 'TRUEFALSE', 'A Java interface can contain method implementations.',                      2, 1, 'Since Java 8, interfaces can have default and static method implementations.', 2, NOW(), NOW()),
(21, 2, 'TRUEFALSE', 'Spring Boot automatically configures beans based on classpath dependencies.',1, 1, 'Auto-configuration is a core Spring Boot feature.', 2, NOW(), NOW()),
(22, 3, 'TRUEFALSE', 'A primary key can contain NULL values.',                                    1, 1, 'Primary keys must be unique and NOT NULL by definition.', 2, NOW(), NOW()),
(23, 4, 'TRUEFALSE', 'HTTP is a stateless protocol.',                                             1, 1, 'Each HTTP request is independent.', 2, NOW(), NOW()),
(24, 5, 'TRUEFALSE', 'Unit tests should depend on external systems like databases.',              1, 1, 'Unit tests should be isolated and fast — external deps should be mocked.', 2, NOW(), NOW()),
-- FILL (6)
(25, 1, 'FILL', 'The keyword used to create a new object in Java is ____.',                       1, 2, 'The "new" keyword allocates memory and calls the constructor.', 2, NOW(), NOW()),
(26, 1, 'FILL', 'The parent class of all Java classes is ____.',                                  2, 2, 'java.lang.Object is the root of the Java class hierarchy.', 2, NOW(), NOW()),
(27, 2, 'FILL', 'The Spring annotation used to mark the main configuration class is @____.',      2, 2, '@SpringBootApplication enables auto-configuration and component scanning.', 2, NOW(), NOW()),
(28, 3, 'FILL', 'The SQL command to remove all rows from a table without logging is ____.',       3, 2, 'TRUNCATE is faster than DELETE as it does not log individual row deletions.', 2, NOW(), NOW()),
(29, 4, 'FILL', 'The HTML tag for the largest heading is ____.',                                  1, 2, '<h1> defines the most important heading.', 2, NOW(), NOW()),
(30, 5, 'FILL', 'The development methodology emphasizing iterative delivery and collaboration is ____.', 2, 2, 'Agile values individuals, working software, customer collaboration.', 2, NOW(), NOW());

-- ----------------------------------------------------------------
-- Question Options (for SINGLE / MULTIPLE / TRUEFALSE)
-- ----------------------------------------------------------------
INSERT INTO question_options (question_id, label, content, is_correct) VALUES
-- Q1 (SINGLE)
(1,'A','0',1), (1,'B','null',0), (1,'C','-1',0), (1,'D','undefined',0),
-- Q2 (SINGLE)
(2,'A','implements',0), (2,'B','extends',1), (2,'C','inherits',0), (2,'D','super',0),
-- Q3 (SINGLE)
(3,'A','Set',0), (3,'B','List',1), (3,'C','Map',0), (3,'D','All of the above',0),
-- Q4 (SINGLE)
(4,'A','Java Virtual Machine',1), (4,'B','Java Variable Method',0), (4,'C','Just Very Modern',0), (4,'D','Java Version Manager',0),
-- Q5 (SINGLE)
(5,'A','@Controller',0), (5,'B','@RestController',1), (5,'C','@Service',0), (5,'D','@Component',0),
-- Q6 (SINGLE)
(6,'A','Prototype',0), (6,'B','Singleton',1), (6,'C','Request',0), (6,'D','Session',0),
-- Q7 (SINGLE)
(7,'A','@Autowired',1), (7,'B','@Inject',0), (7,'C','@Wire',0), (7,'D','@Bean',0),
-- Q8 (SINGLE)
(8,'A','GET',0), (8,'B','SELECT',1), (8,'C','FETCH',0), (8,'D','QUERY',0),
-- Q9 (SINGLE)
(9,'A','Atomicity, Consistency, Isolation, Durability',1), (9,'B','Automated, Consistent, Isolated, Durable',0), (9,'C','Atomic, Concurrent, Isolated, Distributed',0), (9,'D','Asynchronous, Consistent, Integrated, Durable',0),
-- Q10 (SINGLE)
(10,'A','GET',0), (10,'B','POST',1), (10,'C','DELETE',0), (10,'D','PATCH',0),
-- Q11 (SINGLE)
(11,'A','Computer Style Sheets',0), (11,'B','Cascading Style Sheets',1), (11,'C','Creative Style System',0), (11,'D','Colorful Style Sheets',0),
-- Q12 (SINGLE)
(12,'A','Factory',0), (12,'B','Observer',0), (12,'C','Singleton',1), (12,'D','Strategy',0),
-- Q13 (MULTIPLE)
(13,'A','int',1), (13,'B','boolean',1), (13,'C','String',0), (13,'D','double',1),
-- Q14 (MULTIPLE)
(14,'A','spring-boot-starter-web',1), (14,'B','spring-boot-starter-data-jpa',1), (14,'C','spring-boot-starter-security',1), (14,'D','spring-boot-starter-log4j',0),
-- Q15 (MULTIPLE)
(15,'A','@GetMapping',1), (15,'B','@PostMapping',1), (15,'C','@PutMapping',1), (15,'D','@DeleteMapping',1),
-- Q16 (MULTIPLE)
(16,'A','COUNT',1), (16,'B','SUM',1), (16,'C','WHERE',0), (16,'D','AVG',1),
-- Q17 (MULTIPLE)
(17,'A','Single Responsibility',1), (17,'B','Open/Closed',1), (17,'C','Iterator',0), (17,'D','Dependency Inversion',1),
-- Q18 (MULTIPLE)
(18,'A','Scrum',1), (18,'B','Waterfall',0), (18,'C','Kanban',1), (18,'D','Extreme Programming',1),
-- Q19-24 (TRUEFALSE)
(19,'T','True',1), (19,'F','False',0),
(20,'T','True',1), (20,'F','False',0),
(21,'T','True',1), (21,'F','False',0),
(22,'T','True',0), (22,'F','False',1),
(23,'T','True',1), (23,'F','False',0),
(24,'T','True',0), (24,'F','False',1);

-- ----------------------------------------------------------------
-- Standard Answers (for FILL questions)
-- ----------------------------------------------------------------
INSERT INTO question_std_answers (question_id, answer_text, match_mode) VALUES
(25, 'new',                 'EXACT'),
(26, 'Object',              'CASE_INSENSITIVE'),
(26, 'java.lang.Object',    'CASE_INSENSITIVE'),
(27, 'SpringBootApplication','CASE_INSENSITIVE'),
(28, 'TRUNCATE',            'CASE_INSENSITIVE'),
(28, 'TRUNCATE TABLE',      'CASE_INSENSITIVE'),
(29, 'h1',                  'CASE_INSENSITIVE'),
(29, '<h1>',                'EXACT'),
(30, 'Agile',               'CASE_INSENSITIVE'),
(30, 'agile methodology',   'CASE_INSENSITIVE');

SELECT '=== Test data seeded! ===' AS status;
SELECT 'users' AS tbl, COUNT(*) AS cnt FROM users
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'questions', COUNT(*) FROM questions
UNION ALL SELECT 'question_options', COUNT(*) FROM question_options
UNION ALL SELECT 'question_std_answers', COUNT(*) FROM question_std_answers;
