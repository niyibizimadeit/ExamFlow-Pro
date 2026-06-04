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
    public ResponseEntity<ApiResponse<List<ScoreResponseDto>>> paperScores(@PathVariable Long paperId) {
        return ResponseEntity.ok(ApiResponse.ok(gradingService.getPaperScores(paperId)));
    }

    @GetMapping("/stats/{paperId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> paperStats(@PathVariable Long paperId) {
        return ResponseEntity.ok(ApiResponse.ok(gradingService.getPaperStats(paperId)));
    }

    @GetMapping("/detail/{sessionId}")
    public ResponseEntity<ApiResponse<ScoreDetailDto>> scoreDetail(@PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(gradingService.getScoreDetail(sessionId)));
    }
}
