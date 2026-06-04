package com.examflow.backend.controller;

import com.examflow.backend.dto.ApiResponse;
import com.examflow.backend.dto.CategoryDto;
import com.examflow.backend.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(
            @Valid @RequestBody CategoryDto dto, Authentication auth) {
        Map<String, Object> created = categoryService.create(dto, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Category created", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> update(
            @PathVariable Long id, @Valid @RequestBody CategoryDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Category updated", categoryService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Category deleted", null));
    }
}
