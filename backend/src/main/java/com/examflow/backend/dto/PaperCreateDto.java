package com.examflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PaperCreateDto {
    @NotBlank
    private String title;

    private String description;

    @NotNull @Positive
    private Integer durationMins;

    @NotNull @Positive
    private BigDecimal totalScore;

    @NotNull
    private BigDecimal passScore;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    // Optional: directly add questions on create
    private List<PaperQuestionItem> questions;

    // Optional: assembly rules for auto-generation
    private List<AssemblyRuleDto> assemblyRules;

    @Data
    public static class PaperQuestionItem {
        @NotNull
        private Long questionId;
        @NotNull @Positive
        private BigDecimal score;
    }

    @Data
    public static class AssemblyRuleDto {
        @NotBlank
        private String questionType;
        private Long categoryId;
        private Integer difficulty;
        @Positive
        private Integer count;
        @NotNull @Positive
        private BigDecimal scoreEach;
    }
}
