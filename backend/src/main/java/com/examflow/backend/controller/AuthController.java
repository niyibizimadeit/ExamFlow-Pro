package com.examflow.backend.controller;

import com.examflow.backend.dto.*;
import com.examflow.backend.entity.User;
import com.examflow.backend.entity.User.Role;
import com.examflow.backend.repository.UserRepository;
import com.examflow.backend.security.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password"));
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getFullName());

        AuthResponse resp = new AuthResponse(token, user.getRole().name(), user.getFullName(), user.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Login successful", resp));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setFullName(req.getFullName());
        user.setRole(Role.STUDENT);  // self-registration always creates student
        user.setStudentNo(req.getStudentNo());
        user.setClassName(req.getClassName());
        user.setEnabled(true);

        userRepository.save(user);

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getFullName());
        AuthResponse resp = new AuthResponse(token, user.getRole().name(), user.getFullName(), user.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registration successful", resp));
    }
}
