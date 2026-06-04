package com.examflow.backend.dto;

import lombok.Data;
import java.util.Map;

@Data
public class AnswerSaveDto {
    private Map<Long, String> answers;  // questionId → answerGiven
}
