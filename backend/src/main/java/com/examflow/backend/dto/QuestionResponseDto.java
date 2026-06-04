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
public class QuestionResponseDto {
    private Long id;
    private String content;
    private String type;
    private Integer difficulty;
    private BigDecimal defaultScore;
    private String explanation;
    private Long categoryId;
    private String categoryName;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OptionResp> options;
    private List<StdAnswerResp> stdAnswers;

    @Data
    @Builder
    @AllArgsConstructor
    public static class OptionResp {
        private Long id;
        private String label;
        private String content;
        private Boolean isCorrect;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class StdAnswerResp {
        private Long id;
        private String answerText;
        private String matchMode;
    }
}
