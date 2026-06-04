package com.examflow.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "student_answers")
public class StudentAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ExamSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "answer_given", columnDefinition = "TEXT")
    private String answerGiven;  // comma-separated for MULTIPLE

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "score_earned", nullable = false, precision = 5, scale = 2)
    private BigDecimal scoreEarned = BigDecimal.ZERO;

    @UpdateTimestamp
    @Column(name = "saved_at")
    private LocalDateTime savedAt;
}
