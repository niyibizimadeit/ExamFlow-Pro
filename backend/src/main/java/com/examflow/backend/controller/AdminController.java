package com.examflow.backend.controller;

import com.examflow.backend.dto.ApiResponse;
import com.examflow.backend.entity.ScoreRecord;
import com.examflow.backend.entity.User;
import com.examflow.backend.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepo;
    private final ExamPaperRepository paperRepo;
    private final ExamSessionRepository sessionRepo;
    private final ScoreRecordRepository scoreRepo;

    public AdminController(UserRepository userRepo, ExamPaperRepository paperRepo,
                           ExamSessionRepository sessionRepo, ScoreRecordRepository scoreRepo) {
        this.userRepo = userRepo;
        this.paperRepo = paperRepo;
        this.sessionRepo = sessionRepo;
        this.scoreRepo = scoreRepo;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepo.count());
        stats.put("totalTeachers", userRepo.countByRole(User.Role.TEACHER));
        stats.put("totalStudents", userRepo.countByRole(User.Role.STUDENT));
        stats.put("totalPapers", paperRepo.count());
        stats.put("totalSessions", sessionRepo.count());
        stats.put("totalGraded", scoreRepo.count());

        List<ScoreRecord> allScores = scoreRepo.findAll();
        if (!allScores.isEmpty()) {
            double avg = allScores.stream().mapToDouble(s -> s.getScore().doubleValue()).average().orElse(0);
            stats.put("systemAvgScore", Math.round(avg * 100.0) / 100.0);
            stats.put("passRate", (double) allScores.stream().filter(ScoreRecord::getPassed).count() / allScores.size());
        } else {
            stats.put("systemAvgScore", 0);
            stats.put("passRate", 0);
        }

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> users() {
        List<Map<String, Object>> users = userRepo.findAll().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("email", u.getEmail());
            m.put("fullName", u.getFullName());
            m.put("role", u.getRole().name());
            m.put("enabled", u.getEnabled());
            m.put("createdAt", u.getCreatedAt());
            return m;
        }).toList();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }
}
