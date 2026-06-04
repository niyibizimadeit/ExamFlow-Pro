package com.examflow.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class QuestionCreateDto {

    @NotBlank
    private String content;

    @NotNull
    private String type;  // SINGLE, MULTIPLE, TRUEFALSE, FILL

    @NotNull @Min(1) @Max(3)
    private Integer difficulty;

    private BigDecimal defaultScore = BigDecimal.ONE;

    private String explanation;

    @NotNull
    private Long categoryId;

    // For SINGLE / MULTIPLE / TRUEFALSE
    private List<OptionDto> options;

    // For FILL
    private List<StdAnswerDto> stdAnswers;

    @Data
    public static class OptionDto {
        @NotBlank
        private String label;   // A, B, C, D or T, F

        @NotBlank
        private String content;

        private Boolean isCorrect = false;
    }

    @Data
    public static class StdAnswerDto {
        @NotBlank
        private String answerText;

        private String matchMode = "CASE_INSENSITIVE";  // EXACT, CASE_INSENSITIVE, CONTAINS
    }
}
