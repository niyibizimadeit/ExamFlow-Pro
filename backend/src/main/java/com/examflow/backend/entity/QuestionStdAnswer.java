package com.examflow.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "question_std_answers")
public class QuestionStdAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "answer_text", nullable = false, length = 500)
    private String answerText;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_mode", nullable = false, length = 20)
    private MatchMode matchMode = MatchMode.CASE_INSENSITIVE;

    public enum MatchMode { EXACT, CASE_INSENSITIVE, CONTAINS }
}
