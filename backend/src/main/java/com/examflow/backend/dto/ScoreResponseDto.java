package com.examflow.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class ScoreResponseDto {
    private Long id;
    private Long sessionId;
    private Long paperId;
    private String paperTitle;
    private BigDecimal totalScore;
    private BigDecimal paperTotalScore;
    private Boolean passed;
    private BigDecimal passScore;
    private LocalDateTime gradedAt;
}

@Data
@Builder
@AllArgsConstructor
public class ScoreDetailDto {
    private Long id;
    private Long sessionId;
    private Long paperId;
    private String paperTitle;
    private BigDecimal score;
    private BigDecimal totalScore;
    private Boolean passed;
    private LocalDateTime gradedAt;
    private java.util.List<AnswerDetailDto> answers;

    @Data
    @Builder
    @AllArgsConstructor
    public static class AnswerDetailDto {
        private Long questionId;
        private String questionContent;
        private String questionType;
        private String answerGiven;
        private String correctAnswer;
        private Boolean isCorrect;
        private BigDecimal scoreEarned;
        private BigDecimal maxScore;
        private String explanation;
    }
}
