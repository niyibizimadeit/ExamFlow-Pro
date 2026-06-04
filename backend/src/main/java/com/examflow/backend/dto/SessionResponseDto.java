package com.examflow.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class SessionResponseDto {
    private Long id;
    private Long paperId;
    private String paperTitle;
    private Integer durationMins;
    private BigDecimal totalScore;
    private String status;          // IN_PROGRESS, SUBMITTED, GRADED
    private LocalDateTime startTime;
    private LocalDateTime submitTime;
    private Integer answeredCount;
    private Integer totalQuestions;
    private List<ExamQuestionDto> questions;

    @Data
    @Builder
    @AllArgsConstructor
    public static class ExamQuestionDto {
        private Long id;
        private String content;
        private String type;
        private Integer orderNum;
        private BigDecimal score;
        private List<OptionDto> options;        // without isCorrect for students
        private String savedAnswer;              // student's current answer
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class OptionDto {
        private String label;
        private String content;
    }
}
