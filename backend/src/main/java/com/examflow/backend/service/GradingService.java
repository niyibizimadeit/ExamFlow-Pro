package com.examflow.backend.service;

import com.examflow.backend.dto.*;
import com.examflow.backend.entity.*;
import com.examflow.backend.entity.Question.QuestionType;
import com.examflow.backend.entity.QuestionStdAnswer.MatchMode;
import com.examflow.backend.exception.ResourceNotFoundException;
import com.examflow.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GradingService {

    private final ExamSessionRepository sessionRepo;
    private final StudentAnswerRepository answerRepo;
    private final PaperQuestionRepository paperQuestionRepo;
    private final ScoreRecordRepository scoreRepo;
    private final QuestionStdAnswerRepository stdAnswerRepo;
    private final ExamPaperRepository paperRepo;

    public GradingService(ExamSessionRepository sessionRepo,
                          StudentAnswerRepository answerRepo,
                          PaperQuestionRepository paperQuestionRepo,
                          ScoreRecordRepository scoreRepo,
                          QuestionStdAnswerRepository stdAnswerRepo,
                          ExamPaperRepository paperRepo) {
        this.sessionRepo = sessionRepo;
        this.answerRepo = answerRepo;
        this.paperQuestionRepo = paperQuestionRepo;
        this.scoreRepo = scoreRepo;
        this.stdAnswerRepo = stdAnswerRepo;
        this.paperRepo = paperRepo;
    }

    @Transactional
    public void gradeSession(Long sessionId) {
        ExamSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));

        List<StudentAnswer> answers = answerRepo.findBySession(session);
        ExamPaper paper = session.getPaper();
        List<PaperQuestion> pqs = paperQuestionRepo.findByPaperOrderByOrderNum(paper);
        Map<Long, BigDecimal> scoreMap = new HashMap<>();
        for (PaperQuestion pq : pqs) {
            scoreMap.put(pq.getQuestion().getId(), pq.getScore());
        }

        BigDecimal total = BigDecimal.ZERO;

        for (StudentAnswer ans : answers) {
            Question q = ans.getQuestion();
            BigDecimal maxScore = scoreMap.getOrDefault(q.getId(), q.getDefaultScore());
            boolean correct = false;

            if (ans.getAnswerGiven() == null || ans.getAnswerGiven().isBlank()) {
                correct = false;
            } else {
                switch (q.getType()) {
                    case SINGLE, TRUEFALSE -> {
                        String correctLabel = q.getOptions().stream()
                                .filter(QuestionOption::getIsCorrect)
                                .map(QuestionOption::getLabel)
                                .findFirst()
                                .orElse("");
                        correct = correctLabel.equalsIgnoreCase(ans.getAnswerGiven().trim());
                    }
                    case MULTIPLE -> {
                        Set<String> correctSet = q.getOptions().stream()
                                .filter(QuestionOption::getIsCorrect)
                                .map(o -> o.getLabel().toUpperCase())
                                .collect(Collectors.toSet());
                        Set<String> givenSet = Arrays.stream(ans.getAnswerGiven().split(","))
                                .map(s -> s.trim().toUpperCase())
                                .filter(s -> !s.isEmpty())
                                .collect(Collectors.toSet());
                        correct = correctSet.equals(givenSet);
                    }
                    case FILL -> {
                        List<QuestionStdAnswer> stdAnswers = stdAnswerRepo.findByQuestion(q);
                        correct = stdAnswers.stream().anyMatch(sa ->
                                matchAnswer(sa.getMatchMode(), sa.getAnswerText(), ans.getAnswerGiven().trim()));
                    }
                }
            }

            ans.setIsCorrect(correct);
            ans.setScoreEarned(correct ? maxScore : BigDecimal.ZERO);
            total = total.add(ans.getScoreEarned());
        }

        answerRepo.saveAll(answers);

        // Create score record
        ScoreRecord record = new ScoreRecord();
        record.setSession(session);
        record.setStudent(session.getStudent());
        record.setPaper(paper);
        record.setScore(total);
        record.setPassed(total.compareTo(paper.getPassScore()) >= 0);
        scoreRepo.save(record);

        session.setStatus(ExamSession.SessionStatus.GRADED);
        sessionRepo.save(session);
    }

    public List<ScoreResponseDto> getMyScores(String email) {
        return scoreRepo.findAll().stream()
                .filter(s -> s.getStudent().getEmail().equals(email))
                .map(this::toScoreDto)
                .toList();
    }

    public List<ScoreResponseDto> getPaperScores(Long paperId) {
        ExamPaper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper", paperId));
        return scoreRepo.findByPaper(paper).stream()
                .map(this::toScoreDto)
                .toList();
    }

    public Map<String, Object> getPaperStats(Long paperId) {
        ExamPaper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("Paper", paperId));
        List<ScoreRecord> records = scoreRepo.findByPaper(paper);
        if (records.isEmpty()) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("count", 0);
            return empty;
        }

        DoubleSummaryStatistics stats = records.stream()
                .mapToDouble(r -> r.getScore().doubleValue())
                .summaryStatistics();

        long passed = records.stream().filter(ScoreRecord::getPassed).count();

        // Distribution
        Map<String, Long> dist = new LinkedHashMap<>();
        dist.put("0-59", records.stream().filter(r -> r.getScore().doubleValue() < 60).count());
        dist.put("60-74", records.stream().filter(r -> r.getScore().doubleValue() >= 60 && r.getScore().doubleValue() < 75).count());
        dist.put("75-89", records.stream().filter(r -> r.getScore().doubleValue() >= 75 && r.getScore().doubleValue() < 90).count());
        dist.put("90-100", records.stream().filter(r -> r.getScore().doubleValue() >= 90).count());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("count", records.size());
        result.put("avg", BigDecimal.valueOf(stats.getAverage()).setScale(2, RoundingMode.HALF_UP));
        result.put("max", BigDecimal.valueOf(stats.getMax()).setScale(2, RoundingMode.HALF_UP));
        result.put("min", BigDecimal.valueOf(stats.getMin()).setScale(2, RoundingMode.HALF_UP));
        result.put("passRate", records.isEmpty() ? 0 : (double) passed / records.size());
        result.put("distribution", dist);
        return result;
    }

    public ScoreDetailDto getScoreDetail(Long sessionId) {
        ExamSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));

        ScoreRecord record = scoreRepo.findBySession_Id(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Score record not found"));

        List<StudentAnswer> answers = answerRepo.findBySession(session);
        Map<Long, BigDecimal> scoreMap = new HashMap<>();
        for (PaperQuestion pq : paperQuestionRepo.findByPaperOrderByOrderNum(session.getPaper())) {
            scoreMap.put(pq.getQuestion().getId(), pq.getScore());
        }

        List<ScoreDetailDto.AnswerDetailDto> answerDetails = answers.stream().map(ans -> {
            Question q = ans.getQuestion();
            String correctAnswer = getCorrectAnswerText(q);
            return ScoreDetailDto.AnswerDetailDto.builder()
                    .questionId(q.getId())
                    .questionContent(q.getContent())
                    .questionType(q.getType().name())
                    .answerGiven(ans.getAnswerGiven())
                    .correctAnswer(correctAnswer)
                    .isCorrect(ans.getIsCorrect())
                    .scoreEarned(ans.getScoreEarned())
                    .maxScore(scoreMap.getOrDefault(q.getId(), BigDecimal.ZERO))
                    .explanation(q.getExplanation())
                    .build();
        }).toList();

        // Unanswered questions
        Set<Long> answeredIds = answers.stream().map(a -> a.getQuestion().getId()).collect(Collectors.toSet());
        for (PaperQuestion pq : paperQuestionRepo.findByPaperOrderByOrderNum(session.getPaper())) {
            if (!answeredIds.contains(pq.getQuestion().getId())) {
                Question q = pq.getQuestion();
                answerDetails.add(ScoreDetailDto.AnswerDetailDto.builder()
                        .questionId(q.getId())
                        .questionContent(q.getContent())
                        .questionType(q.getType().name())
                        .answerGiven("(unanswered)")
                        .correctAnswer(getCorrectAnswerText(q))
                        .isCorrect(false)
                        .scoreEarned(BigDecimal.ZERO)
                        .maxScore(pq.getScore())
                        .explanation(q.getExplanation())
                        .build());
            }
        }

        return ScoreDetailDto.builder()
                .id(record.getId())
                .sessionId(sessionId)
                .paperId(session.getPaper().getId())
                .paperTitle(session.getPaper().getTitle())
                .score(record.getScore())
                .totalScore(session.getPaper().getTotalScore())
                .passed(record.getPassed())
                .gradedAt(record.getGradedAt())
                .answers(answerDetails)
                .build();
    }

    private ScoreResponseDto toScoreDto(ScoreRecord r) {
        return ScoreResponseDto.builder()
                .id(r.getId())
                .sessionId(r.getSession().getId())
                .paperId(r.getPaper().getId())
                .paperTitle(r.getPaper().getTitle())
                .totalScore(r.getScore())
                .paperTotalScore(r.getPaper().getTotalScore())
                .passed(r.getPassed())
                .passScore(r.getPaper().getPassScore())
                .gradedAt(r.getGradedAt())
                .build();
    }

    private String getCorrectAnswerText(Question q) {
        return switch (q.getType()) {
            case SINGLE, TRUEFALSE -> q.getOptions().stream()
                    .filter(QuestionOption::getIsCorrect)
                    .map(o -> o.getLabel() + ". " + o.getContent())
                    .findFirst().orElse("");
            case MULTIPLE -> q.getOptions().stream()
                    .filter(QuestionOption::getIsCorrect)
                    .map(o -> o.getLabel() + ". " + o.getContent())
                    .collect(Collectors.joining("; "));
            case FILL -> stdAnswerRepo.findByQuestion(q).stream()
                    .map(QuestionStdAnswer::getAnswerText)
                    .collect(Collectors.joining(" / "));
        };
    }

    private boolean matchAnswer(MatchMode mode, String expected, String given) {
        return switch (mode) {
            case EXACT -> expected.equals(given);
            case CASE_INSENSITIVE -> expected.equalsIgnoreCase(given);
            case CONTAINS -> given.toLowerCase().contains(expected.toLowerCase());
        };
    }

    public List<ScoreDetailDto.AnswerDetailDto> getWrongAnswers(Long sessionId) {
        ExamSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));
        List<StudentAnswer> answers = answerRepo.findBySessionAndIsCorrectFalse(session);
        return buildAnswerDetails(session, answers);
    }

    public List<ScoreDetailDto.AnswerDetailDto> getAllWrongAnswers(String email) {
        List<ScoreDetailDto.AnswerDetailDto> all = new ArrayList<>();
        List<ExamSession> sessions = sessionRepo.findAll().stream()
                .filter(s -> s.getStudent().getEmail().equals(email) && s.getStatus() == ExamSession.SessionStatus.GRADED)
                .toList();
        for (ExamSession session : sessions) {
            List<StudentAnswer> wrong = answerRepo.findBySessionAndIsCorrectFalse(session);
            all.addAll(buildAnswerDetails(session, wrong));
        }
        return all;
    }

    private List<ScoreDetailDto.AnswerDetailDto> buildAnswerDetails(
            ExamSession session, List<StudentAnswer> answers) {
        Map<Long, BigDecimal> scoreMap = new HashMap<>();
        for (PaperQuestion pq : paperQuestionRepo.findByPaperOrderByOrderNum(session.getPaper())) {
            scoreMap.put(pq.getQuestion().getId(), pq.getScore());
        }
        return answers.stream().map(ans -> {
            Question q = ans.getQuestion();
            return ScoreDetailDto.AnswerDetailDto.builder()
                    .questionId(q.getId())
                    .questionContent(q.getContent())
                    .questionType(q.getType().name())
                    .answerGiven(ans.getAnswerGiven())
                    .correctAnswer(getCorrectAnswerText(q))
                    .isCorrect(false)
                    .scoreEarned(ans.getScoreEarned())
                    .maxScore(scoreMap.getOrDefault(q.getId(), BigDecimal.ZERO))
                    .explanation(q.getExplanation())
                    .build();
        }).toList();
    }
}
