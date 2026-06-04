package com.examflow.backend.controller;

import com.examflow.backend.dto.*;
import com.examflow.backend.service.SessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping("/start/{paperId}")
    public ResponseEntity<ApiResponse<SessionResponseDto>> startExam(
            @PathVariable Long paperId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Exam started",
                sessionService.startExam(paperId, auth.getName())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SessionResponseDto>> getState(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(sessionService.getSessionState(id, auth.getName())));
    }

    @PutMapping("/{id}/answers")
    public ResponseEntity<ApiResponse<Void>> saveAnswers(
            @PathVariable Long id, @RequestBody AnswerSaveDto dto, Authentication auth) {
        sessionService.saveAnswers(id, dto, auth.getName());
        return ResponseEntity.ok(ApiResponse.ok("Answers saved", null));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<Void>> submit(
            @PathVariable Long id, Authentication auth) {
        sessionService.submitExam(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.ok("Exam submitted", null));
    }
}
