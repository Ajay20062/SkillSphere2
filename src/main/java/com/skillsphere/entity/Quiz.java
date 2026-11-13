package com.skillsphere.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quizzes")
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 700)
    private String description;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String difficulty;

    @Column(nullable = false)
    private int durationMinutes;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC, id ASC")
    private List<Question> questions = new ArrayList<>();

    public Quiz() {}

    public Quiz(String title, String description, String category, String difficulty, int durationMinutes) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.difficulty = difficulty;
        this.durationMinutes = durationMinutes;
    }

    public void addQuestion(Question question) {
        question.setDisplayOrder(questions.size());
        questions.add(question);
        question.setQuiz(this);
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public String getDifficulty() { return difficulty; }
    public int getDurationMinutes() { return durationMinutes; }
    public List<Question> getQuestions() { return questions; }
}
