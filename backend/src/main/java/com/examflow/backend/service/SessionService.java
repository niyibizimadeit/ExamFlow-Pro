package com.examflow.backend.service;

import com.examflow.backend.dto.*;
import com.examflow.backend.entity.*;
import com.examflow.backend.entity.ExamSession.SessionStatus;
import com.examflow.backend.exception.BusinessException;
import com.examflow.backend.exception.ResourceNotFoundException;
import com.examflow.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SessionService {

    private final ExamSessionRepository sessionRepo;
    private final ExamPaperRepository paperRepo;
    private final PaperQuestionRepository paperQuestionRepo;
    private final StudentAnswerRepository answerRepo;
    private final UserRepository userRepo;
    private final QuestionRepository questionRepo;
    private final GradingService gradingService;

    public SessionService(ExamSessionRepository sessionRepo,
                          ExamPaperRepository paperRepo,
                          PaperQuestionRepository paperQuestionRepo,
                          StudentAnswerRepository answerRepo,
                          UserRepository userRepo,
                          QuestionRepository questionRepo,
                          GradingService gradingService) {
        this.sessionRepo = sessionRepo;
        this.paperRepo = paperRepo;
        this.paperQuestionRepo = paperQuestionRepo;
        this.answerRepo = answerRepo;
        this.userRepo = userRepo;
        this.questionRepo = questionRepo;
        this.gradingService = gradingService;
    }

    @Transactional
    public SessionResponseDto startExam(Long paperId, String email) {
        User student = userRepo.findByEmail(email).orElseThrow();
        ExamPaper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper", paperId));

        if (paper.getStatus() != ExamPaper.PaperStatus.PUBLISHED) {
            throw new BusinessException("This exam is not available");
        }

        // Check time window
        if (paper.getStartTime() != null && LocalDateTime.now().isBefore(paper.getStartTime())) {
            throw new BusinessException("Exam has not started yet");
        }
        if (paper.getEndTime() != null && LocalDateTime.now().isAfter(paper.getEndTime())) {
            throw new BusinessException("Exam has ended");
        }

        // Check duplicate
        if (sessionRepo.findByPaperAndStudent(paper, student).isPresent()) {
            throw new BusinessException("You have already started this exam");
        }

        ExamSession session = new ExamSession();
        session.setPaper(paper);
        session.setStudent(student);
        session.setStatus(SessionStatus.IN_PROGRESS);
        sessionRepo.save(session);

        return buildSessionResponse(session);
    }

    public SessionResponseDto getSessionState(Long sessionId, String email) {
        ExamSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));

        if (!session.getStudent().getEmail().equals(email)) {
            throw new BusinessException("Access denied");
        }

        return buildSessionResponse(session);
    }

    @Transactional
    public void saveAnswers(Long sessionId, AnswerSaveDto dto, String email) {
        ExamSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));

        if (!session.getStudent().getEmail().equals(email)) {
            throw new BusinessException("Access denied");
        }
        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BusinessException("Exam is not in progress");
        }

        if (dto.getAnswers() != null) {
            for (var entry : dto.getAnswers().entrySet()) {
                Question question = questionRepo.findById(entry.getKey())
                        .orElseThrow(() -> new ResourceNotFoundException("Question", entry.getKey()));

                // Upsert answer
                List<StudentAnswer> existing = answerRepo.findBySession(session);
                StudentAnswer ans = existing.stream()
                        .filter(a -> a.getQuestion().getId().equals(entry.getKey()))
                        .findFirst()
                        .orElse(null);

                if (ans == null) {
                    ans = new StudentAnswer();
                    ans.setSession(session);
                    ans.setQuestion(question);
                }

                ans.setAnswerGiven(entry.getValue());
                ans.setScoreEarned(java.math.BigDecimal.ZERO); // will be set by grading
                answerRepo.save(ans);
            }
        }
    }

    @Transactional
    public void submitExam(Long sessionId, String email) {
        ExamSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));

        if (!session.getStudent().getEmail().equals(email)) {
            throw new BusinessException("Access denied");
        }
        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BusinessException("Exam already submitted");
        }

        session.setStatus(SessionStatus.SUBMITTED);
        session.setSubmitTime(LocalDateTime.now());
        sessionRepo.save(session);

        // Auto-grade
        gradingService.gradeSession(sessionId);
    }

    private SessionResponseDto buildSessionResponse(ExamSession session) {
        ExamPaper paper = session.getPaper();
        List<PaperQuestion> pqs = paperQuestionRepo.findByPaperOrderByOrderNum(paper);
        List<StudentAnswer> savedAnswers = answerRepo.findBySession(session);
        Map<Long, String> answerMap = new HashMap<>();
        for (StudentAnswer a : savedAnswers) {
            answerMap.put(a.getQuestion().getId(), a.getAnswerGiven());
        }

        int answered = (int) pqs.stream()
                .filter(pq -> answerMap.containsKey(pq.getQuestion().getId())
                        && answerMap.get(pq.getQuestion().getId()) != null
                        && !answerMap.get(pq.getQuestion().getId()).isBlank())
                .count();

        List<SessionResponseDto.ExamQuestionDto> questions = pqs.stream().map(pq -> {
            Question q = pq.getQuestion();
            List<SessionResponseDto.OptionDto> opts = q.getOptions().stream()
                    .map(o -> SessionResponseDto.OptionDto.builder()
                            .label(o.getLabel())
                            .content(o.getContent())
                            .build())
                    .toList();

            return SessionResponseDto.ExamQuestionDto.builder()
                    .id(q.getId())
                    .content(q.getContent())
                    .type(q.getType().name())
                    .orderNum(pq.getOrderNum())
                    .score(pq.getScore())
                    .options(opts)
                    .savedAnswer(answerMap.getOrDefault(q.getId(), ""))
                    .build();
        }).toList();

        return SessionResponseDto.builder()
                .id(session.getId())
                .paperId(paper.getId())
                .paperTitle(paper.getTitle())
                .durationMins(paper.getDurationMins())
                .totalScore(paper.getTotalScore())
                .status(session.getStatus().name())
                .startTime(session.getStartTime())
                .submitTime(session.getSubmitTime())
                .answeredCount(answered)
                .totalQuestions(pqs.size())
                .questions(questions)
                .build();
    }
}
