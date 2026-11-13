package com.skillsphere.service;

import com.skillsphere.entity.*;
import com.skillsphere.repository.QuizRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class SeedData implements CommandLineRunner {
    private final QuizRepository quizRepository;

    public SeedData(QuizRepository quizRepository) {
        this.quizRepository = quizRepository;
    }

    @Override
    public void run(String... args) {
        if (quizRepository.count() > 0) return;

        Quiz html = new Quiz("HTML & CSS Essentials", "Test your understanding of semantic HTML, styling and the CSS box model.", "Web Development", "Beginner", 10);
        html.addQuestion(new Question("Which HTML element represents the main content of a document?", "<section>", "<main>", "<header>", "<aside>", "B", "The main element represents the dominant content of the body."));
        html.addQuestion(new Question("Which CSS property controls the space inside an element's border?", "margin", "gap", "padding", "outline", "C", "Padding is the space between content and border."));
        html.addQuestion(new Question("Which CSS layout system is designed for one-dimensional layouts?", "CSS Grid", "Flexbox", "Float", "Table layout", "B", "Flexbox is ideal for arranging items in a row or column."));
        html.addQuestion(new Question("What does the alt attribute provide for an image?", "Animation", "Alternative text", "Image border", "Image alignment", "B", "Alternative text improves accessibility and provides a fallback description."));
        html.addQuestion(new Question("Which selector targets an element with id='hero'?", ".hero", "*hero", "#hero", "hero()", "C", "The # symbol selects an element by its ID."));
        quizRepository.save(html);

        Quiz js = new Quiz("JavaScript Fundamentals", "Practice variables, arrays, conditions, functions and DOM events.", "Programming", "Beginner", 12);
        js.addQuestion(new Question("Which keyword declares a block-scoped variable that can be reassigned?", "const", "let", "static", "define", "B", "Use let when the variable needs reassignment."));
        js.addQuestion(new Question("Which array method creates a new array by transforming each item?", "filter()", "push()", "map()", "pop()", "C", "map() returns a new array containing transformed values."));
        js.addQuestion(new Question("Which method selects an element by its ID?", "document.querySelectorAll()", "document.getElementById()", "window.getElement()", "document.getClass()", "B", "getElementById() returns the element matching the supplied ID."));
        js.addQuestion(new Question("What does addEventListener() do?", "Creates a database", "Attaches an event handler", "Deletes an element", "Changes CSS files", "B", "It registers a function to run when an event occurs."));
        js.addQuestion(new Question("Which value represents an intentional absence of a value?", "true", "0", "null", "NaN", "C", "null represents an intentional absence of an object value."));
        quizRepository.save(js);

        Quiz java = new Quiz("Java & Spring Boot Basics", "Explore Java fundamentals, dependency injection and Spring Boot.", "Java", "Intermediate", 12);
        java.addQuestion(new Question("Which keyword is used to inherit a class in Java?", "implements", "extends", "inherits", "super", "B", "A Java class uses extends to inherit another class."));
        java.addQuestion(new Question("What is dependency injection?", "Manually creating every object", "Providing required dependencies from outside", "Deleting unused classes", "Converting Java to SQL", "B", "Dependency injection supplies an object's dependencies rather than having it create them."));
        java.addQuestion(new Question("Which annotation marks a Spring Boot application entry class?", "@Entity", "@RestController", "@SpringBootApplication", "@Autowired", "C", "It combines configuration, component scanning and auto-configuration."));
        java.addQuestion(new Question("Which interface is commonly used for CRUD operations in Spring Data JPA?", "Runnable", "JpaRepository", "Serializable", "Comparator", "B", "JpaRepository provides common persistence operations."));
        java.addQuestion(new Question("Which HTTP method is commonly used to retrieve a resource?", "POST", "PATCH", "DELETE", "GET", "D", "GET requests retrieve resources."));
        quizRepository.save(java);
    }
}
