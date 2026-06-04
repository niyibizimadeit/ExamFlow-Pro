package com.examflow.backend.controller;

import com.examflow.backend.dto.*;
import com.examflow.backend.service.GradingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

    private final GradingService gradingService;

    public ScoreController(GradingService gradingService) {
        this.gradingService = gradingService;
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ScoreResponseDto>>> myScores(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(gradingService.getMyScores(auth.getName())));
    }

    @GetMapping("/paper/{paperId}")
    public ResponseEntity<ApiResponse<List<ScoreResponseDto>>> paperScores(
            @PathVariable Long paperId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(gradingService.getPaperScores(paperId, auth.getName())));
    }

    @GetMapping("/stats/{paperId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> paperStats(
            @PathVariable Long paperId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(gradingService.getPaperStats(paperId, auth.getName())));
    }

    @GetMapping("/detail/{sessionId}")
    public ResponseEntity<ApiResponse<ScoreDetailDto>> scoreDetail(
            @PathVariable Long sessionId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(gradingService.getScoreDetail(sessionId, auth.getName())));
    }

    @GetMapping("/wrong/{sessionId}")
    public ResponseEntity<ApiResponse<List<ScoreDetailDto.AnswerDetailDto>>> wrongAnswers(
            @PathVariable Long sessionId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(gradingService.getWrongAnswers(sessionId, auth.getName())));
    }

    @GetMapping("/wrong/all")
    public ResponseEntity<ApiResponse<List<ScoreDetailDto.AnswerDetailDto>>> allWrongAnswers(
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(gradingService.getAllWrongAnswers(auth.getName())));
    }
}
