package com.examflow.backend.controller;

import com.examflow.backend.dto.*;
import com.examflow.backend.service.PaperService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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
        boolean isStudentOnly = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_STUDENT"))
                && auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .noneMatch(a -> a.equals("ROLE_TEACHER") || a.equals("ROLE_ADMIN"));
        if (isStudentOnly) {
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
            @PathVariable Long id, @Valid @RequestBody PaperCreateDto dto, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Paper updated", paperService.updatePaper(id, dto, auth.getName())));
    }

    @PostMapping("/{id}/questions")
    public ResponseEntity<ApiResponse<PaperResponseDto>> addQuestions(
            @PathVariable Long id, @RequestBody AddQuestionsDto dto, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Questions added", paperService.addQuestions(id, dto, auth.getName())));
    }

    @DeleteMapping("/{id}/questions/{questionId}")
    public ResponseEntity<ApiResponse<Void>> removeQuestion(
            @PathVariable Long id, @PathVariable Long questionId, Authentication auth) {
        paperService.removeQuestion(id, questionId, auth.getName());
        return ResponseEntity.ok(ApiResponse.ok("Question removed", null));
    }

    @PutMapping("/{id}/rules")
    public ResponseEntity<ApiResponse<PaperResponseDto>> saveRules(
            @PathVariable Long id, @RequestBody List<AssemblyRuleDto> rules, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Rules saved", paperService.saveAssemblyRules(id, rules, auth.getName())));
    }

    @PostMapping("/{id}/assemble")
    public ResponseEntity<ApiResponse<PaperResponseDto>> assemble(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Assembly complete", paperService.assemble(id, auth.getName())));
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<PaperResponseDto>> publish(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Paper published", paperService.publish(id, auth.getName())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication auth) {
        paperService.deletePaper(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.ok("Paper deleted", null));
    }
}
