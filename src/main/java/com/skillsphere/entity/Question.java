package com.skillsphere.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String questionText;

    @Column(nullable = false)
    private String optionA;
    @Column(nullable = false)
    private String optionB;
    @Column(nullable = false)
    private String optionC;
    @Column(nullable = false)
    private String optionD;

    @Column(nullable = false, length = 1)
    private String correctOption;

    @Column(length = 1000)
    private String explanation;

    @Column(nullable = false)
    private int displayOrder = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    public Question() {}

    public Question(String questionText, String a, String b, String c, String d,
                    String correctOption, String explanation) {
        this.questionText = questionText;
        this.optionA = a;
        this.optionB = b;
        this.optionC = c;
        this.optionD = d;
        this.correctOption = correctOption;
        this.explanation = explanation;
    }

    public Long getId() { return id; }
    public String getQuestionText() { return questionText; }
    public String getOptionA() { return optionA; }
    public String getOptionB() { return optionB; }
    public String getOptionC() { return optionC; }
    public String getOptionD() { return optionD; }
    public String getCorrectOption() { return correctOption; }
    public String getExplanation() { return explanation; }
    public Quiz getQuiz() { return quiz; }
    public int getDisplayOrder() { return displayOrder; }
    public void setQuiz(Quiz quiz) { this.quiz = quiz; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public void setOptionA(String optionA) { this.optionA = optionA; }
    public void setOptionB(String optionB) { this.optionB = optionB; }
    public void setOptionC(String optionC) { this.optionC = optionC; }
    public void setOptionD(String optionD) { this.optionD = optionD; }
    public void setCorrectOption(String correctOption) { this.correctOption = correctOption; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
}
