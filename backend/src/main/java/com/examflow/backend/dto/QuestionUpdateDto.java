package com.examflow.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class QuestionUpdateDto {
    private String content;
    private String type;
    private Integer difficulty;
    private BigDecimal defaultScore;
    private String explanation;
    private Long categoryId;
    private List<QuestionCreateDto.OptionDto> options;
    private List<QuestionCreateDto.StdAnswerDto> stdAnswers;
}
