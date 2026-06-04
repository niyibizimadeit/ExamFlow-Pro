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
