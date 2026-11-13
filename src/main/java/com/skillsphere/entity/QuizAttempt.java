package com.skillsphere.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private int totalQuestions;

    @Column(nullable = false)
    private double percentage;

    @Column(nullable = false)
    private LocalDateTime completedAt = LocalDateTime.now();

    public QuizAttempt() {}

    public QuizAttempt(AppUser user, Quiz quiz, int score, int totalQuestions) {
        this.user = user;
        this.quiz = quiz;
        this.score = score;
        this.totalQuestions = totalQuestions;
        this.percentage = totalQuestions == 0 ? 0 : (score * 100.0 / totalQuestions);
        this.completedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public Quiz getQuiz() { return quiz; }
    public int getScore() { return score; }
    public int getTotalQuestions() { return totalQuestions; }
    public double getPercentage() { return percentage; }
    public LocalDateTime getCompletedAt() { return completedAt; }
}
