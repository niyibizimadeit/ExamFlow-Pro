package com.examflow.backend.repository;

import com.examflow.backend.entity.ExamPaper;
import com.examflow.backend.entity.PaperQuestion;
import com.examflow.backend.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaperQuestionRepository extends JpaRepository<PaperQuestion, Long> {
    List<PaperQuestion> findByPaperOrderByOrderNum(ExamPaper paper);
    boolean existsByQuestion(Question question);
    Optional<PaperQuestion> findByPaperAndQuestion(ExamPaper paper, Question question);
    void deleteByPaper(ExamPaper paper);
}
