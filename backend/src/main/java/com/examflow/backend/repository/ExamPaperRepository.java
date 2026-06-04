package com.examflow.backend.repository;

import com.examflow.backend.entity.ExamPaper;
import com.examflow.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamPaperRepository extends JpaRepository<ExamPaper, Long> {
    List<ExamPaper> findByCreatedBy(User createdBy);
    List<ExamPaper> findByStatus(ExamPaper.PaperStatus status);
}
