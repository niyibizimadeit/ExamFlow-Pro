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
public class PaperResponseDto {
    private Long id;
    private String title;
    private String description;
    private Integer durationMins;
    private BigDecimal totalScore;
    private BigDecimal passScore;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String createdByName;
    private LocalDateTime createdAt;
    private Integer questionCount;
    private List<PaperQuestionResp> questions;

    @Data
    @Builder
    @AllArgsConstructor
    public static class PaperQuestionResp {
        private Long id;
        private Long questionId;
        private String questionContent;
        private String questionType;
        private Integer difficulty;
        private Integer orderNum;
        private BigDecimal score;
    }
}
