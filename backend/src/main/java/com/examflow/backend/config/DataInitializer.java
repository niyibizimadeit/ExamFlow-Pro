package com.examflow.backend.config;

import com.examflow.backend.entity.User;
import com.examflow.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Seeds default demo accounts on first startup if the users table is empty.
 * This ensures the app is usable out-of-the-box without manually running SQL scripts.
 *
 * Default accounts:
 *   admin@examflow.com    / admin123   (ADMIN)
 *   teacher1@examflow.com / teacher123 (TEACHER)
 *   student1@examflow.com / student123 (STUDENT)
 */
@Configuration
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already contains {} users — skipping seed.", userRepository.count());
            return;
        }

        log.info("No users found — seeding default demo accounts...");

        User admin = new User();
        admin.setUsername("admin");
        admin.setEmail("admin@examflow.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setFullName("System Admin");
        admin.setRole(User.Role.ADMIN);
        admin.setEnabled(true);
        userRepository.save(admin);

        User teacher = new User();
        teacher.setUsername("teacher1");
        teacher.setEmail("teacher1@examflow.com");
        teacher.setPassword(passwordEncoder.encode("teacher123"));
        teacher.setFullName("Wang Fang");
        teacher.setRole(User.Role.TEACHER);
        teacher.setEnabled(true);
        userRepository.save(teacher);

        User student = new User();
        student.setUsername("student1");
        student.setEmail("student1@examflow.com");
        student.setPassword(passwordEncoder.encode("student123"));
        student.setFullName("Chen Wei");
        student.setRole(User.Role.STUDENT);
        student.setStudentNo("S2021001");
        student.setClassName("CS2021A");
        student.setEnabled(true);
        userRepository.save(student);

        log.info("Seeded 3 demo accounts: admin, teacher1, student1 — all passwords are 'admin123', 'teacher123', 'student123' respectively.");
    }
}
