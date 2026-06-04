package com.examflow.backend.controller;

import com.examflow.backend.dto.*;
import com.examflow.backend.service.PaperService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/papers")
public class PaperController {

    private final PaperService paperService;

    public PaperController(PaperService paperService) {
        this.paperService = paperService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PaperResponseDto>>> getAll(Authentication auth) {
        // Role-based: teachers see their own, students see published
        String role = auth.getAuthorities().stream()
                .findFirst().map(Object::toString).orElse("");
        if (role.contains("STUDENT") && !role.contains("TEACHER") && !role.contains("ADMIN")) {
            return ResponseEntity.ok(ApiResponse.ok(paperService.getStudentPapers()));
        }
        return ResponseEntity.ok(ApiResponse.ok(paperService.getTeacherPapers(auth.getName())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaperResponseDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(paperService.getPaper(id)));
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<ApiResponse<PaperResponseDto>> preview(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(paperService.getPreview(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PaperResponseDto>> create(
            @Valid @RequestBody PaperCreateDto dto, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Paper created", paperService.createPaper(dto, auth.getName())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PaperResponseDto>> update(
            @PathVariable Long id, @RequestBody PaperCreateDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Paper updated", paperService.updatePaper(id, dto)));
    }

    @PostMapping("/{id}/questions")
    public ResponseEntity<ApiResponse<PaperResponseDto>> addQuestions(
            @PathVariable Long id, @RequestBody AddQuestionsDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Questions added", paperService.addQuestions(id, dto)));
    }

    @DeleteMapping("/{id}/questions/{questionId}")
    public ResponseEntity<ApiResponse<Void>> removeQuestion(
            @PathVariable Long id, @PathVariable Long questionId) {
        paperService.removeQuestion(id, questionId);
        return ResponseEntity.ok(ApiResponse.ok("Question removed", null));
    }

    @PostMapping("/{id}/assemble")
    public ResponseEntity<ApiResponse<PaperResponseDto>> assemble(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Assembly complete", paperService.assemble(id)));
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<PaperResponseDto>> publish(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Paper published", paperService.publish(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        paperService.deletePaper(id);
        return ResponseEntity.ok(ApiResponse.ok("Paper deleted", null));
    }
}
