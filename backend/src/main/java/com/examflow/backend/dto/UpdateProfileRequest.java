package com.examflow.backend.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String studentNo;
    private String className;
    private String currentPassword;
    private String newPassword;
}
