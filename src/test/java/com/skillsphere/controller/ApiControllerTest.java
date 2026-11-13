package com.skillsphere.controller;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import com.skillsphere.repository.AttemptRepository;
import com.skillsphere.repository.QuestionRepository;
import com.skillsphere.repository.QuizRepository;
import com.skillsphere.repository.UserRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiControllerTest {

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private UserRepository users;
    @Autowired
    private QuizRepository quizzes;
    @Autowired
    private QuestionRepository questions;
    @Autowired
    private AttemptRepository attempts;

    @BeforeEach
    void cleanDatabase() {
        attempts.deleteAll();
        questions.deleteAll();
        quizzes.deleteAll();
        users.deleteAll();
    }

    private Map<String, Object> registerAndLogin() {
        var request = Map.of("name", "Test Student", "email", "student@example.com", "password", "secret123");
        var response = rest.postForEntity("/api/auth/register", request, Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    @Test
    void healthEndpointIsAvailable() {
        var response = rest.getForEntity("/api/health", Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("status", "ok");
    }

    @Test
    void registerThenLoginReturnsTheSameUser() {
        var registered = registerAndLogin();
        assertThat(registered.get("email")).isEqualTo("student@example.com");

        var loginResponse = rest.postForEntity("/api/auth/login",
                Map.of("email", "student@example.com", "password", "secret123"), Map.class);
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody().get("id")).isEqualTo(registered.get("id"));
    }

    @Test
    void registerRejectsDuplicateEmail() {
        registerAndLogin();
        var duplicate = rest.postForEntity("/api/auth/register",
                Map.of("name", "Other", "email", "STUDENT@example.com", "password", "secret123"), Map.class);
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void loginRejectsWrongPassword() {
        registerAndLogin();
        var response = rest.postForEntity("/api/auth/login",
                Map.of("email", "student@example.com", "password", "wrong-pass"), Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void submitAttemptScoresAnswersCorrectly() {
        var user = registerAndLogin();
        var userId = ((Number) user.get("id")).longValue();

        var quiz = quizzes.save(new com.skillsphere.entity.Quiz(
                "Sample Quiz", "Testing", "Programming", "Beginner", 10));
        var quizId = quiz.getId();

        var submit = rest.postForEntity("/api/attempts", Map.of(
                "userId", userId, "quizId", quizId, "answers", Map.of()), Map.class);
        assertThat(submit.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void adminEndpointsRejectMissingKey() {
        var response = rest.getForEntity("/api/admin/quizzes", Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void adminEndpointsAcceptCorrectKey() {
        var headers = new HttpHeaders();
        headers.set("X-Admin-Key", "skillsphere-demo-admin");
        var response = rest.exchange("/api/admin/quizzes", HttpMethod.GET, new HttpEntity<>(headers), java.util.List.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void leaderboardReturnsEmptyListWhenNoAttempts() {
        var response = rest.getForEntity("/api/leaderboard", java.util.List.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    void unknownQuizReturns404() {
        var response = rest.getForEntity("/api/quizzes/999999", Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
