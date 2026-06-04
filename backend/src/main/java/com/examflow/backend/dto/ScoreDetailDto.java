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
public class ScoreDetailDto {
    private Long id;
    private Long sessionId;
    private Long paperId;
    private String paperTitle;
    private BigDecimal score;
    private BigDecimal totalScore;
    private Boolean passed;
    private LocalDateTime gradedAt;
    private List<AnswerDetailDto> answers;

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
