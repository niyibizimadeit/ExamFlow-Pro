package com.examflow.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class WrongAnswersResponse {
    private int totalCount;
    private List<ScoreDetailDto.AnswerDetailDto> answers;
}
