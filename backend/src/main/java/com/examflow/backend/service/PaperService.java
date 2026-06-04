package com.examflow.backend.service;

import com.examflow.backend.dto.*;
import com.examflow.backend.entity.*;
import com.examflow.backend.entity.ExamPaper.PaperStatus;
import com.examflow.backend.entity.Question.QuestionType;
import com.examflow.backend.exception.BusinessException;
import com.examflow.backend.exception.ResourceNotFoundException;
import com.examflow.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class PaperService {

    private final ExamPaperRepository paperRepo;
    private final PaperQuestionRepository paperQuestionRepo;
    private final QuestionRepository questionRepo;
    private final CategoryRepository categoryRepo;
    private final UserRepository userRepo;
    private final AssemblyRuleRepository assemblyRuleRepo;

    public PaperService(ExamPaperRepository paperRepo,
                        PaperQuestionRepository paperQuestionRepo,
                        QuestionRepository questionRepo,
                        CategoryRepository categoryRepo,
                        UserRepository userRepo,
                        AssemblyRuleRepository assemblyRuleRepo) {
        this.paperRepo = paperRepo;
        this.paperQuestionRepo = paperQuestionRepo;
        this.questionRepo = questionRepo;
        this.categoryRepo = categoryRepo;
        this.userRepo = userRepo;
        this.assemblyRuleRepo = assemblyRuleRepo;
    }

    // ---- Read ----
    public List<PaperResponseDto> getTeacherPapers(String email) {
        User user = userRepo.findByEmail(email).orElseThrow();
        return paperRepo.findByCreatedBy(user).stream().map(this::toDto).toList();
    }

    public List<PaperResponseDto> getStudentPapers() {
        return paperRepo.findByStatus(PaperStatus.PUBLISHED).stream()
                .filter(p -> {
                    if (p.getStartTime() != null && p.getEndTime() != null) {
                        var now = java.time.LocalDateTime.now();
                        return now.isAfter(p.getStartTime()) && now.isBefore(p.getEndTime());
                    }
                    return true;
                })
                .map(this::toDto).toList();
    }

    public PaperResponseDto getPaper(Long id) {
        return toDto(paperRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paper", id)));
    }

    public PaperResponseDto getPreview(Long id) {
        ExamPaper paper = paperRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paper", id));
        PaperResponseDto dto = toDto(paper);
        dto.setQuestions(paperQuestionRepo.findByPaperOrderByOrderNum(paper).stream()
                .map(pq -> PaperResponseDto.PaperQuestionResp.builder()
                        .id(pq.getId())
                        .questionId(pq.getQuestion().getId())
                        .questionContent(pq.getQuestion().getContent())
                        .questionType(pq.getQuestion().getType().name())
                        .difficulty(pq.getQuestion().getDifficulty())
                        .orderNum(pq.getOrderNum())
                        .score(pq.getScore())
                        .build())
                .toList());
        return dto;
    }

    // ---- Create ----
    @Transactional
    public PaperResponseDto createPaper(PaperCreateDto dto, String email) {
        User user = userRepo.findByEmail(email).orElseThrow();

        ExamPaper paper = new ExamPaper();
        paper.setTitle(dto.getTitle());
        paper.setDescription(dto.getDescription());
        paper.setDurationMins(dto.getDurationMins());
        paper.setTotalScore(dto.getTotalScore());
        paper.setPassScore(dto.getPassScore());
        paper.setStartTime(dto.getStartTime());
        paper.setEndTime(dto.getEndTime());
        paper.setCreatedBy(user);
        paper.setStatus(PaperStatus.DRAFT);
        paperRepo.save(paper);

        // Add questions manually if provided
        if (dto.getQuestions() != null && !dto.getQuestions().isEmpty()) {
            addQuestionsInternal(paper, dto.getQuestions());
        }

        // Save assembly rules if provided
        if (dto.getAssemblyRules() != null && !dto.getAssemblyRules().isEmpty()) {
            saveAssemblyRules(paper, dto.getAssemblyRules());
        }

        return toDto(paper);
    }

    // ---- Update metadata ----
    @Transactional
    public PaperResponseDto updatePaper(Long id, PaperCreateDto dto, String userEmail) {
        ExamPaper paper = paperRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paper", id));

        if (!paper.getCreatedBy().getEmail().equals(userEmail)) {
            throw new BusinessException("You can only modify your own papers");
        }

        if (paper.getStatus() != PaperStatus.DRAFT) {
            throw new BusinessException("Can only edit DRAFT papers");
        }

        if (dto.getTitle() != null) paper.setTitle(dto.getTitle());
        if (dto.getDescription() != null) paper.setDescription(dto.getDescription());
        if (dto.getDurationMins() != null) paper.setDurationMins(dto.getDurationMins());
        if (dto.getTotalScore() != null) paper.setTotalScore(dto.getTotalScore());
        if (dto.getPassScore() != null) paper.setPassScore(dto.getPassScore());
        if (dto.getStartTime() != null) paper.setStartTime(dto.getStartTime());
        if (dto.getEndTime() != null) paper.setEndTime(dto.getEndTime());

        // Save assembly rules if provided
        if (dto.getAssemblyRules() != null && !dto.getAssemblyRules().isEmpty()) {
            assemblyRuleRepo.deleteByPaper(paper);
            saveAssemblyRules(paper, dto.getAssemblyRules());
        }

        paperRepo.save(paper);
        return toDto(paper);
    }

    // ---- Add questions ----
    @Transactional
    public PaperResponseDto addQuestions(Long paperId, AddQuestionsDto dto, String userEmail) {
        ExamPaper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper", paperId));

        if (!paper.getCreatedBy().getEmail().equals(userEmail)) {
            throw new BusinessException("You can only modify your own papers");
        }

        if (paper.getStatus() != PaperStatus.DRAFT) {
            throw new BusinessException("Can only modify DRAFT papers");
        }

        for (var item : dto.getQuestions()) {
            Question q = questionRepo.findById(item.getQuestionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Question", item.getQuestionId()));

            if (paperQuestionRepo.findByPaperAndQuestion(paper, q).isPresent()) {
                continue; // skip duplicates
            }

            PaperQuestion pq = new PaperQuestion();
            pq.setPaper(paper);
            pq.setQuestion(q);
            pq.setOrderNum(paperQuestionRepo.findByPaperOrderByOrderNum(paper).size() + 1);
            pq.setScore(item.getScore() != null ? item.getScore() : q.getDefaultScore());
            paperQuestionRepo.save(pq);
        }

        return getPreview(paperId);
    }

    // ---- Remove question ----
    @Transactional
    public void removeQuestion(Long paperId, Long questionId, String userEmail) {
        ExamPaper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper", paperId));
        Question q = questionRepo.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", questionId));

        if (!paper.getCreatedBy().getEmail().equals(userEmail)) {
            throw new BusinessException("You can only modify your own papers");
        }

        if (paper.getStatus() != PaperStatus.DRAFT) {
            throw new BusinessException("Can only modify DRAFT papers");
        }

        paperQuestionRepo.findByPaperAndQuestion(paper, q)
                .ifPresent(paperQuestionRepo::delete);
    }

    // ---- Save Assembly Rules ----
    @Transactional
    public PaperResponseDto saveAssemblyRules(Long paperId, List<AssemblyRuleDto> rules, String userEmail) {
        ExamPaper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper", paperId));

        if (!paper.getCreatedBy().getEmail().equals(userEmail)) {
            throw new BusinessException("You can only modify your own papers");
        }
        if (paper.getStatus() != PaperStatus.DRAFT) {
            throw new BusinessException("Can only modify DRAFT papers");
        }

        assemblyRuleRepo.deleteByPaper(paper);
        for (var r : rules) {
            AssemblyRule rule = new AssemblyRule();
            rule.setPaper(paper);
            rule.setQuestionType(QuestionType.valueOf(r.getQuestionType().toUpperCase()));
            rule.setDifficulty(r.getDifficulty());
            rule.setCount(r.getCount());
            rule.setScoreEach(r.getScoreEach());
            if (r.getCategoryId() != null) {
                rule.setCategory(categoryRepo.findById(r.getCategoryId()).orElse(null));
            }
            assemblyRuleRepo.save(rule);
        }
        return toDto(paper);
    }

    // ---- Assembly ----
    @Transactional
    public PaperResponseDto assemble(Long paperId, String userEmail) {
        ExamPaper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper", paperId));

        if (!paper.getCreatedBy().getEmail().equals(userEmail)) {
            throw new BusinessException("You can only modify your own papers");
        }

        if (paper.getStatus() != PaperStatus.DRAFT) {
            throw new BusinessException("Can only assemble DRAFT papers");
        }

        // Clear existing questions
        paperQuestionRepo.deleteByPaper(paper);

        List<AssemblyRule> rules = assemblyRuleRepo.findByPaper(paper);
        if (rules.isEmpty()) {
            throw new BusinessException("No assembly rules defined. Add rules first.");
        }

        int orderNum = 0;
        for (AssemblyRule rule : rules) {
            List<Question> pool = questionRepo.findByTypeAndDifficulty(
                    rule.getQuestionType(),
                    rule.getDifficulty(),
                    rule.getCategory() != null ? rule.getCategory().getId() : null);

            if (pool.size() < rule.getCount()) {
                throw new BusinessException("Not enough questions for type " +
                        rule.getQuestionType() + " (need " + rule.getCount() +
                        ", have " + pool.size() + ")");
            }

            Collections.shuffle(pool, new Random());
            List<Question> selected = pool.subList(0, rule.getCount());

            for (Question q : selected) {
                PaperQuestion pq = new PaperQuestion();
                pq.setPaper(paper);
                pq.setQuestion(q);
                pq.setOrderNum(++orderNum);
                pq.setScore(rule.getScoreEach());
                paperQuestionRepo.save(pq);
            }
        }

        // Update total score
        List<PaperQuestion> allPqs = paperQuestionRepo.findByPaperOrderByOrderNum(paper);
        BigDecimal total = allPqs.stream()
                .map(PaperQuestion::getScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        paper.setTotalScore(total);
        paperRepo.save(paper);

        return getPreview(paperId);
    }

    // ---- Publish ----
    @Transactional
    public PaperResponseDto publish(Long paperId, String userEmail) {
        ExamPaper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper", paperId));

        if (!paper.getCreatedBy().getEmail().equals(userEmail)) {
            throw new BusinessException("You can only publish your own papers");
        }

        List<PaperQuestion> questions = paperQuestionRepo.findByPaperOrderByOrderNum(paper);
        if (questions.isEmpty()) {
            throw new BusinessException("Paper must have at least 1 question to publish");
        }

        paper.setStatus(PaperStatus.PUBLISHED);
        paperRepo.save(paper);
        return toDto(paper);
    }

    // ---- Delete ----
    @Transactional
    public void deletePaper(Long paperId, String userEmail) {
        ExamPaper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper", paperId));

        if (!paper.getCreatedBy().getEmail().equals(userEmail)) {
            throw new BusinessException("You can only delete your own papers");
        }

        paperRepo.deleteById(paperId);
    }

    // ---- Helpers ----
    private void addQuestionsInternal(ExamPaper paper, List<PaperCreateDto.PaperQuestionItem> items) {
        for (var item : items) {
            Question q = questionRepo.findById(item.getQuestionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Question", item.getQuestionId()));

            PaperQuestion pq = new PaperQuestion();
            pq.setPaper(paper);
            pq.setQuestion(q);
            pq.setOrderNum(paperQuestionRepo.findByPaperOrderByOrderNum(paper).size() + 1);
            pq.setScore(item.getScore());
            paperQuestionRepo.save(pq);
        }
    }

    private void saveAssemblyRules(ExamPaper paper, List<PaperCreateDto.AssemblyRuleDto> rules) {
        for (var r : rules) {
            AssemblyRule rule = new AssemblyRule();
            rule.setPaper(paper);
            rule.setQuestionType(QuestionType.valueOf(r.getQuestionType().toUpperCase()));
            rule.setDifficulty(r.getDifficulty());
            rule.setCount(r.getCount());
            rule.setScoreEach(r.getScoreEach());
            if (r.getCategoryId() != null) {
                rule.setCategory(categoryRepo.findById(r.getCategoryId()).orElse(null));
            }
            assemblyRuleRepo.save(rule);
        }
    }

    private PaperResponseDto toDto(ExamPaper p) {
        return PaperResponseDto.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .durationMins(p.getDurationMins())
                .totalScore(p.getTotalScore())
                .passScore(p.getPassScore())
                .startTime(p.getStartTime())
                .endTime(p.getEndTime())
                .status(p.getStatus().name())
                .createdByName(p.getCreatedBy().getFullName())
                .createdAt(p.getCreatedAt())
                .questionCount(paperQuestionRepo.findByPaperOrderByOrderNum(p).size())
                .build();
    }
}
