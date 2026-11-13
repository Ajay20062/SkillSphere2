package com.skillsphere.repository;

import com.skillsphere.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface AttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findTop10ByUserIdOrderByCompletedAtDesc(Long userId);

    @Query("select a.user.id, a.user.name, sum(a.score), sum(a.totalQuestions), count(a.id) " +
           "from QuizAttempt a group by a.user.id, a.user.name order by sum(a.score) desc")
    List<Object[]> leaderboard();

    List<QuizAttempt> findByUserId(Long userId);
}
