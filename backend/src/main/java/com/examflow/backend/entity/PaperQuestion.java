package com.examflow.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "paper_questions",
       uniqueConstraints = @UniqueConstraint(name = "uq_paper_question",
                                             columnNames = {"paper_id", "question_id"}))
public class PaperQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paper_id", nullable = false)
    private ExamPaper paper;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "order_num", nullable = false)
    private Integer orderNum = 0;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal score;
}
