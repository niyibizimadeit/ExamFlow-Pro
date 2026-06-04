package com.examflow.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class AddQuestionsDto {
    private List<Item> questions;

    @Data
    public static class Item {
        private Long questionId;
        private BigDecimal score;
    }
}
