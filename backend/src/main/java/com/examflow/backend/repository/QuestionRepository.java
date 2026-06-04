package com.examflow.backend.repository;

import com.examflow.backend.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    @Query("SELECT q FROM Question q WHERE " +
           "(:type IS NULL OR q.type = :type) AND " +
           "(:categoryId IS NULL OR q.category.id = :categoryId) AND " +
           "(:difficulty IS NULL OR q.difficulty = :difficulty) AND " +
           "(:keyword IS NULL OR q.content LIKE %:keyword%)")
    Page<Question> findWithFilters(
            @Param("type") Question.QuestionType type,
            @Param("categoryId") Long categoryId,
            @Param("difficulty") Integer difficulty,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.type = :type AND " +
           "(:difficulty IS NULL OR q.difficulty = :difficulty) AND " +
           "(:categoryId IS NULL OR q.category.id = :categoryId)")
    List<Question> findByTypeAndDifficulty(
            @Param("type") Question.QuestionType type,
            @Param("difficulty") Integer difficulty,
            @Param("categoryId") Long categoryId);
}
