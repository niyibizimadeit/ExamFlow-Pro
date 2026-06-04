package com.examflow.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AssemblyRuleDto {
    private String questionType;
    private Long categoryId;
    private Integer difficulty;
    private Integer count;
    private BigDecimal scoreEach;
}
