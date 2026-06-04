package com.examflow.backend.repository;

import com.examflow.backend.entity.ExamSession;
import com.examflow.backend.entity.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, Long> {
    List<StudentAnswer> findBySession(ExamSession session);
    List<StudentAnswer> findBySessionAndIsCorrectFalse(ExamSession session);
}
