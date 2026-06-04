package com.examflow.backend.controller;

import com.examflow.backend.dto.ApiResponse;
import com.examflow.backend.dto.QuestionCreateDto;
import com.examflow.backend.dto.QuestionResponseDto;
import com.examflow.backend.dto.QuestionUpdateDto;
import com.examflow.backend.service.QuestionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<QuestionResponseDto>>> getAll(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer difficulty,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                questionService.findAll(type, categoryId, difficulty, keyword, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionResponseDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(questionService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QuestionResponseDto>> create(
            @Valid @RequestBody QuestionCreateDto dto, Authentication auth) {
        QuestionResponseDto created = questionService.create(dto, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Question created", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionResponseDto>> update(
            @PathVariable Long id, @RequestBody QuestionUpdateDto dto, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Question updated",
                questionService.update(id, dto, auth.getName())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        questionService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Question deleted", null));
    }
}
