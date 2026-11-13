package com.skillsphere.controller;

import com.skillsphere.entity.*;
import com.skillsphere.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Value;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final UserRepository users;
    private final QuizRepository quizzes;
    private final QuestionRepository questions;
    private final AttemptRepository attempts;
    private final PasswordEncoder passwordEncoder;
    @Value("${skillsphere.admin-key:}")
    private String adminKey;

    public ApiController(UserRepository users, QuizRepository quizzes, QuestionRepository questions,
                         AttemptRepository attempts, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.quizzes = quizzes;
        this.questions = questions;
        this.attempts = attempts;
        this.passwordEncoder = passwordEncoder;
    }

    public record AuthRequest(@NotBlank String name, @Email @NotBlank String email,
                              @Size(min = 6) String password) {}
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
    public record UserView(Long id, String name, String email) {}
    public record QuizView(Long id, String title, String description, String category,
                           String difficulty, int durationMinutes, int questionCount) {}
    public record QuestionView(Long id, String questionText, String optionA, String optionB,
                               String optionC, String optionD) {}
    public record AdminQuestionView(Long id, Long quizId, String questionText, String optionA,
                                    String optionB, String optionC, String optionD,
                                    String correctOption, String explanation, int displayOrder) {}
    public record QuestionRequest(Long quizId, String questionText, String optionA, String optionB,
                                  String optionC, String optionD, String correctOption,
                                  String explanation, Integer displayOrder) {}
    public record QuizDetail(QuizView quiz, List<QuestionView> questions) {}
    public record SubmitRequest(Long userId, Long quizId, Map<Long, String> answers) {}
    public record AttemptView(Long id, String quizTitle, int score, int totalQuestions,
                              double percentage, String completedAt) {}
    public record LeaderboardView(Long userId, String name, long points, long questionsAnswered,
                                  long attempts) {}

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "application", "SkillSphere");
    }

    @PostMapping("/auth/register")
    public UserView register(@Valid @RequestBody AuthRequest request) {
        if (request.password() == null || request.password().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must contain at least 6 characters.");
        }
        if (users.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        AppUser user = users.save(new AppUser(request.name().trim(), request.email().trim().toLowerCase(),
                passwordEncoder.encode(request.password())));
        return toUserView(user);
    }

    @PostMapping("/auth/login")
    public UserView login(@Valid @RequestBody LoginRequest request) {
        AppUser user = users.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }
        return toUserView(user);
    }

    @GetMapping("/quizzes")
    @Transactional(readOnly = true)
    public List<QuizView> getQuizzes() {
        return quizzes.findAll().stream().map(this::toQuizView).toList();
    }

    @GetMapping("/quizzes/{id}")
    @Transactional(readOnly = true)
    public QuizDetail getQuiz(@PathVariable Long id) {
        Quiz quiz = quizzes.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
        List<QuestionView> questionViews = questions.findByQuizIdOrderByDisplayOrderAscIdAsc(id).stream()
                .map(q -> new QuestionView(q.getId(), q.getQuestionText(), q.getOptionA(),
                        q.getOptionB(), q.getOptionC(), q.getOptionD()))
                .toList();
        return new QuizDetail(toQuizView(quiz), questionViews);
    }

    @PostMapping("/attempts")
    @Transactional
    public AttemptView submitAttempt(@RequestBody SubmitRequest request) {
        if (request.userId() == null || request.quizId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User and quiz are required.");
        }
        AppUser user = users.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        Quiz quiz = quizzes.findById(request.quizId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
        List<Question> quizQuestions = questions.findByQuizIdOrderByDisplayOrderAscIdAsc(quiz.getId());
        Map<Long, String> answers = request.answers() == null ? Map.of() : request.answers();
        int score = 0;
        for (Question question : quizQuestions) {
            String selected = answers.get(question.getId());
            if (selected != null && selected.equalsIgnoreCase(question.getCorrectOption())) score++;
        }
        QuizAttempt attempt = attempts.save(new QuizAttempt(user, quiz, score, quizQuestions.size()));
        return toAttemptView(attempt);
    }

    @GetMapping("/users/{userId}/attempts")
    @Transactional(readOnly = true)
    public List<AttemptView> userAttempts(@PathVariable Long userId) {
        return attempts.findTop10ByUserIdOrderByCompletedAtDesc(userId).stream()
                .map(this::toAttemptView).toList();
    }

    @GetMapping("/leaderboard")
    public List<LeaderboardView> leaderboard() {
        return attempts.leaderboard().stream().map(row -> new LeaderboardView(
                (Long) row[0], (String) row[1], ((Number) row[2]).longValue(),
                ((Number) row[3]).longValue(), ((Number) row[4]).longValue()
        )).toList();
    }

    @GetMapping("/users/{userId}/stats")
    public Map<String, Object> userStats(@PathVariable Long userId) {
        AppUser user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        List<QuizAttempt> userAttempts = attempts.findByUserId(userId);
        int totalScore = userAttempts.stream().mapToInt(QuizAttempt::getScore).sum();
        int totalQuestions = userAttempts.stream().mapToInt(QuizAttempt::getTotalQuestions).sum();
        double average = userAttempts.isEmpty() ? 0 : userAttempts.stream()
                .mapToDouble(QuizAttempt::getPercentage).average().orElse(0);
        return Map.of("name", user.getName(), "attempts", userAttempts.size(),
                "totalScore", totalScore, "totalQuestions", totalQuestions,
                "averagePercentage", Math.round(average * 10.0) / 10.0);
    }


    // Academic-demo admin endpoints. Set SKILLSPHERE_ADMIN_KEY before exposing this app publicly.
    @GetMapping("/admin/quizzes")
    @Transactional(readOnly = true)
    public List<QuizView> adminQuizzes(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        requireAdmin(key);
        return quizzes.findAll().stream().map(this::toQuizView).toList();
    }

    @GetMapping("/admin/quizzes/{quizId}/questions")
    @Transactional(readOnly = true)
    public List<AdminQuestionView> adminQuestions(@PathVariable Long quizId,
            @RequestHeader(value = "X-Admin-Key", required = false) String key) {
        requireAdmin(key);
        if (!quizzes.existsById(quizId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found.");
        return questions.findByQuizIdOrderByDisplayOrderAscIdAsc(quizId).stream().map(this::toAdminQuestionView).toList();
    }

    @PostMapping("/admin/questions")
    @Transactional
    public AdminQuestionView createQuestion(@RequestHeader(value = "X-Admin-Key", required = false) String key,
            @RequestBody QuestionRequest request) {
        requireAdmin(key);
        validateQuestion(request);
        Quiz quiz = quizzes.findById(request.quizId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
        Question question = new Question(clean(request.questionText()), clean(request.optionA()),
                clean(request.optionB()), clean(request.optionC()), clean(request.optionD()),
                request.correctOption().trim().toUpperCase(), cleanNullable(request.explanation()));
        question.setQuiz(quiz);
        question.setDisplayOrder(request.displayOrder() == null ? questions.findByQuizIdOrderByDisplayOrderAscIdAsc(quiz.getId()).size() : request.displayOrder());
        return toAdminQuestionView(questions.save(question));
    }

    @PutMapping("/admin/questions/{id}")
    @Transactional
    public AdminQuestionView updateQuestion(@PathVariable Long id,
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @RequestBody QuestionRequest request) {
        requireAdmin(key);
        validateQuestion(request);
        Question question = questions.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found."));
        Quiz quiz = quizzes.findById(request.quizId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
        question.setQuiz(quiz);
        question.setQuestionText(clean(request.questionText()));
        question.setOptionA(clean(request.optionA()));
        question.setOptionB(clean(request.optionB()));
        question.setOptionC(clean(request.optionC()));
        question.setOptionD(clean(request.optionD()));
        question.setCorrectOption(request.correctOption().trim().toUpperCase());
        question.setExplanation(cleanNullable(request.explanation()));
        if (request.displayOrder() != null) question.setDisplayOrder(request.displayOrder());
        return toAdminQuestionView(questions.save(question));
    }

    @DeleteMapping("/admin/questions/{id}")
    @Transactional
    public Map<String, String> deleteQuestion(@PathVariable Long id,
            @RequestHeader(value = "X-Admin-Key", required = false) String key) {
        requireAdmin(key);
        Question question = questions.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found."));
        questions.delete(question);
        return Map.of("message", "Question deleted.");
    }

    private void requireAdmin(String suppliedKey) {
        if (adminKey == null || adminKey.isBlank() || suppliedKey == null ||
                !MessageDigest.isEqual(adminKey.getBytes(StandardCharsets.UTF_8), suppliedKey.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin key is missing or incorrect.");
        }
    }

    private void validateQuestion(QuestionRequest r) {
        if (r == null || r.quizId() == null || blank(r.questionText()) || blank(r.optionA()) ||
                blank(r.optionB()) || blank(r.optionC()) || blank(r.optionD()) || blank(r.correctOption()) ||
                !List.of("A", "B", "C", "D").contains(r.correctOption().trim().toUpperCase()) ||
                r.questionText().length() > 1000 || r.optionA().length() > 255 || r.optionB().length() > 255 ||
                r.optionC().length() > 255 || r.optionD().length() > 255 ||
                (r.explanation() != null && r.explanation().length() > 1000) ||
                (r.displayOrder() != null && r.displayOrder() < 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Enter a quiz, question, all four options, a correct option (A-D), and a non-negative order.");
        }
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }
    private String clean(String value) { return value.trim(); }
    private String cleanNullable(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private AdminQuestionView toAdminQuestionView(Question q) {
        return new AdminQuestionView(q.getId(), q.getQuiz().getId(), q.getQuestionText(), q.getOptionA(),
                q.getOptionB(), q.getOptionC(), q.getOptionD(), q.getCorrectOption(), q.getExplanation(), q.getDisplayOrder());
    }

    private UserView toUserView(AppUser user) {
        return new UserView(user.getId(), user.getName(), user.getEmail());
    }

    private QuizView toQuizView(Quiz quiz) {
        return new QuizView(quiz.getId(), quiz.getTitle(), quiz.getDescription(), quiz.getCategory(),
                quiz.getDifficulty(), quiz.getDurationMinutes(), quiz.getQuestions().size());
    }

    private AttemptView toAttemptView(QuizAttempt attempt) {
        return new AttemptView(attempt.getId(), attempt.getQuiz().getTitle(), attempt.getScore(),
                attempt.getTotalQuestions(), Math.round(attempt.getPercentage() * 10.0) / 10.0,
                attempt.getCompletedAt().toString());
    }
}
