package com.examflow.backend.repository;

import com.examflow.backend.entity.ExamPaper;
import com.examflow.backend.entity.ExamSession;
import com.examflow.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExamSessionRepository extends JpaRepository<ExamSession, Long> {
    Optional<ExamSession> findByPaperAndStudent(ExamPaper paper, User student);
    List<ExamSession> findByStudent(User student);
    List<ExamSession> findByPaper(ExamPaper paper);
}
