package com.examflow.backend.controller;

import com.examflow.backend.dto.*;
import com.examflow.backend.entity.User;
import com.examflow.backend.entity.User.Role;
import com.examflow.backend.exception.BusinessException;
import com.examflow.backend.repository.UserRepository;
import com.examflow.backend.security.JwtUtils;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

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

        if (user == null) {
            log.warn("Login failed: no user found for email {}", req.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password"));
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            log.warn("Login failed: wrong password for email {}", req.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password"));
        }

        if (!user.getEnabled()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Account is disabled"));
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getFullName());

        AuthResponse resp = new AuthResponse(token, user.getRole().name(), user.getFullName(), user.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Login successful", resp));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException("Email already registered");
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new BusinessException("Username already taken");
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
