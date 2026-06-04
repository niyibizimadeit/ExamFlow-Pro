package com.examflow.backend.repository;

import com.examflow.backend.entity.Question;
import com.examflow.backend.entity.QuestionStdAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionStdAnswerRepository extends JpaRepository<QuestionStdAnswer, Long> {
    List<QuestionStdAnswer> findByQuestion(Question question);
}
