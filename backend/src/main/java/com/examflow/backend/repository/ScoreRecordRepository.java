package com.examflow.backend.repository;

import com.examflow.backend.entity.ExamPaper;
import com.examflow.backend.entity.ScoreRecord;
import com.examflow.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ScoreRecordRepository extends JpaRepository<ScoreRecord, Long> {
    List<ScoreRecord> findByStudent(User student);
    List<ScoreRecord> findByPaper(ExamPaper paper);
    Optional<ScoreRecord> findBySession_Id(Long sessionId);

    @Query("SELECT AVG(s.score) FROM ScoreRecord s WHERE s.paper = :paper")
    Double avgScoreByPaper(@Param("paper") ExamPaper paper);

    @Query("SELECT MAX(s.score) FROM ScoreRecord s WHERE s.paper = :paper")
    Double maxScoreByPaper(@Param("paper") ExamPaper paper);

    @Query("SELECT MIN(s.score) FROM ScoreRecord s WHERE s.paper = :paper")
    Double minScoreByPaper(@Param("paper") ExamPaper paper);
}
