package com.examflow.backend.controller;

import com.examflow.backend.dto.ApiResponse;
import com.examflow.backend.dto.UpdateProfileRequest;
import com.examflow.backend.entity.User;
import com.examflow.backend.exception.BusinessException;
import com.examflow.backend.exception.ResourceNotFoundException;
import com.examflow.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("email", user.getEmail());
        profile.put("fullName", user.getFullName());
        profile.put("role", user.getRole().name());
        profile.put("studentNo", user.getStudentNo());
        profile.put("className", user.getClassName());
        profile.put("enabled", user.getEnabled());

        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            Authentication auth,
            @RequestBody UpdateProfileRequest req) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getStudentNo() != null) user.setStudentNo(req.getStudentNo());
        if (req.getClassName() != null) user.setClassName(req.getClassName());

        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (req.getCurrentPassword() == null ||
                    !passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
                throw new BusinessException("Current password is incorrect");
            }
            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        }

        userRepository.save(user);

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("email", user.getEmail());
        profile.put("fullName", user.getFullName());
        profile.put("role", user.getRole().name());

        return ResponseEntity.ok(ApiResponse.ok("Profile updated", profile));
    }
}
