package com.examflow.backend.repository;

import com.examflow.backend.entity.AssemblyRule;
import com.examflow.backend.entity.ExamPaper;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssemblyRuleRepository extends JpaRepository<AssemblyRule, Long> {
    List<AssemblyRule> findByPaper(ExamPaper paper);
    void deleteByPaper(ExamPaper paper);
}
