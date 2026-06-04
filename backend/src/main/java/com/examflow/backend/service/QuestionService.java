package com.examflow.backend.service;

import com.examflow.backend.dto.*;
import com.examflow.backend.entity.*;
import com.examflow.backend.entity.Question.QuestionType;
import com.examflow.backend.entity.QuestionStdAnswer.MatchMode;
import com.examflow.backend.exception.BusinessException;
import com.examflow.backend.exception.ResourceNotFoundException;
import com.examflow.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final PaperQuestionRepository paperQuestionRepository;

    public QuestionService(QuestionRepository questionRepository,
                           CategoryRepository categoryRepository,
                           UserRepository userRepository,
                           PaperQuestionRepository paperQuestionRepository) {
        this.questionRepository = questionRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.paperQuestionRepository = paperQuestionRepository;
    }

    public Page<QuestionResponseDto> findAll(String type, Long categoryId,
                                              Integer difficulty, String keyword,
                                              Pageable pageable) {
        QuestionType qType = null;
        if (type != null && !type.isBlank()) {
            qType = QuestionType.valueOf(type.toUpperCase());
        }

        return questionRepository.findWithFilters(qType, categoryId, difficulty, keyword, pageable)
                .map(this::toResponseDto);
    }

    public QuestionResponseDto findById(Long id) {
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", id));
        return toResponseDto(q);
    }

    @Transactional
    public QuestionResponseDto create(QuestionCreateDto dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", dto.getCategoryId()));

        QuestionType qType = QuestionType.valueOf(dto.getType().toUpperCase());

        Question q = new Question();
        q.setContent(dto.getContent());
        q.setType(qType);
        q.setDifficulty(dto.getDifficulty());
        q.setDefaultScore(dto.getDefaultScore() != null ? dto.getDefaultScore() : BigDecimal.ONE);
        q.setExplanation(dto.getExplanation());
        q.setCategory(category);
        q.setCreatedBy(user);

        // Handle options for SINGLE / MULTIPLE / TRUEFALSE
        if (qType == QuestionType.SINGLE || qType == QuestionType.MULTIPLE || qType == QuestionType.TRUEFALSE) {
            if (dto.getOptions() == null || dto.getOptions().size() < 2) {
                throw new BusinessException("SINGLE/MULTIPLE/TRUEFALSE questions require at least 2 options");
            }
            List<QuestionOption> options = dto.getOptions().stream().map(opt -> {
                QuestionOption o = new QuestionOption();
                o.setLabel(opt.getLabel());
                o.setContent(opt.getContent());
                o.setIsCorrect(opt.getIsCorrect() != null && opt.getIsCorrect());
                o.setQuestion(q);
                return o;
            }).toList();
            q.setOptions(options);

            // Validate at least one correct answer for SINGLE / TRUEFALSE
            if (qType == QuestionType.SINGLE || qType == QuestionType.TRUEFALSE) {
                long correctCount = options.stream().filter(QuestionOption::getIsCorrect).count();
                if (correctCount != 1) {
                    throw new BusinessException("SINGLE/TRUEFALSE questions must have exactly 1 correct option");
                }
            }
        }

        // Handle std answers for FILL
        if (qType == QuestionType.FILL) {
            if (dto.getStdAnswers() == null || dto.getStdAnswers().isEmpty()) {
                throw new BusinessException("FILL questions require at least 1 standard answer");
            }
            List<QuestionStdAnswer> answers = dto.getStdAnswers().stream().map(ans -> {
                QuestionStdAnswer a = new QuestionStdAnswer();
                a.setAnswerText(ans.getAnswerText());
                a.setMatchMode(MatchMode.valueOf(ans.getMatchMode().toUpperCase()));
                a.setQuestion(q);
                return a;
            }).toList();
            q.setStdAnswers(answers);
        }

        questionRepository.save(q);
        return toResponseDto(q);
    }

    @Transactional
    public QuestionResponseDto update(Long id, QuestionUpdateDto dto, String userEmail) {
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", id));

        if (dto.getContent() != null) q.setContent(dto.getContent());
        if (dto.getDifficulty() != null) q.setDifficulty(dto.getDifficulty());
        if (dto.getDefaultScore() != null) q.setDefaultScore(dto.getDefaultScore());
        if (dto.getExplanation() != null) q.setExplanation(dto.getExplanation());

        if (dto.getCategoryId() != null) {
            Category cat = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", dto.getCategoryId()));
            q.setCategory(cat);
        }

        if (dto.getType() != null) {
            q.setType(QuestionType.valueOf(dto.getType().toUpperCase()));
        }

        // Replace options if provided
        if (dto.getOptions() != null && !dto.getOptions().isEmpty()) {
            q.getOptions().clear();
            List<QuestionOption> options = dto.getOptions().stream().map(opt -> {
                QuestionOption o = new QuestionOption();
                o.setLabel(opt.getLabel());
                o.setContent(opt.getContent());
                o.setIsCorrect(opt.getIsCorrect() != null && opt.getIsCorrect());
                o.setQuestion(q);
                return o;
            }).toList();
            q.getOptions().addAll(options);
        }

        // Replace std answers if provided
        if (dto.getStdAnswers() != null && !dto.getStdAnswers().isEmpty()) {
            q.getStdAnswers().clear();
            List<QuestionStdAnswer> answers = dto.getStdAnswers().stream().map(ans -> {
                QuestionStdAnswer a = new QuestionStdAnswer();
                a.setAnswerText(ans.getAnswerText());
                a.setMatchMode(MatchMode.valueOf(ans.getMatchMode().toUpperCase()));
                a.setQuestion(q);
                return a;
            }).toList();
            q.getStdAnswers().addAll(answers);
        }

        questionRepository.save(q);
        return toResponseDto(q);
    }

    @Transactional
    public void delete(Long id) {
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", id));

        if (paperQuestionRepository.existsByQuestion(q)) {
            throw new BusinessException("Cannot delete: question is used in one or more exam papers");
        }

        questionRepository.delete(q);
    }

    private QuestionResponseDto toResponseDto(Question q) {
        return QuestionResponseDto.builder()
                .id(q.getId())
                .content(q.getContent())
                .type(q.getType().name())
                .difficulty(q.getDifficulty())
                .defaultScore(q.getDefaultScore())
                .explanation(q.getExplanation())
                .categoryId(q.getCategory().getId())
                .categoryName(q.getCategory().getName())
                .createdByName(q.getCreatedBy().getFullName())
                .createdAt(q.getCreatedAt())
                .updatedAt(q.getUpdatedAt())
                .options(q.getOptions().stream().map(o ->
                        QuestionResponseDto.OptionResp.builder()
                                .id(o.getId())
                                .label(o.getLabel())
                                .content(o.getContent())
                                .isCorrect(o.getIsCorrect())
                                .build()).toList())
                .stdAnswers(q.getStdAnswers().stream().map(a ->
                        QuestionResponseDto.StdAnswerResp.builder()
                                .id(a.getId())
                                .answerText(a.getAnswerText())
                                .matchMode(a.getMatchMode().name())
                                .build()).toList())
                .build();
    }
}
