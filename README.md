# SkillSphere – Academic Mini Project

SkillSphere is a single-project full-stack learning and quiz platform built with React, JavaScript, HTML5, CSS3, Java, Spring Boot, Spring Data JPA and MySQL.

## Features

- Student registration and login (passwords stored as BCrypt hashes)
- Dashboard with learning statistics
- Quiz catalogue with category filters
- Timed multiple-choice quizzes
- Server-side answer checking and score calculation
- Attempt history and student leaderboard
- Admin question management: create, edit, delete and reorder questions inside each quiz
- Responsive modern interface
- REST API with a three-layer structure (controller, service/data access via repositories, entities)
- Sample quizzes automatically inserted on first startup

## Requirements

- Java 17 or later
- Maven 3.6+ (or use IntelliJ IDEA's Maven support)
- MySQL 8+
- Internet connection in the browser for the React, ReactDOM, Babel and Google Fonts CDN resources used by the starter UI

## 1. Create the database

Start MySQL, then run the `database.sql` file in MySQL Workbench or the MySQL command line:

```sql
CREATE DATABASE skillsphere;
```

The application uses `spring.jpa.hibernate.ddl-auto=update`, so JPA creates the required tables automatically on first launch and adds the `display_order` column to an existing questions table.

## 2. Configure the database

The application now falls back to an in-memory H2 database automatically when no database URL is provided, so it can run without a local MySQL install.

Open `src/main/resources/application.properties` if you want to override the defaults.

Default settings:
- Database: embedded H2 (`jdbc:h2:mem:skillsphere;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE`)
- Username: `sa`
- Password: empty

If you want to use MySQL instead, set environment variables before starting:
- `SKILLSPHERE_ADMIN_KEY` (admin panel access key; default is `skillsphere-demo-admin` for local academic use)
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_URL` (optional; defaults to the H2 database)

Example MySQL URL:
`jdbc:mysql://localhost:3306/skillsphere?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`

## 3. Run the application

Open a terminal in the `SkillSphere` folder:

```bash
mvn spring-boot:run
```

Or open the folder in IntelliJ IDEA, wait for Maven dependencies to load, then run `SkillSphereApplication.java`.

Open:

`http://localhost:8080`

The sample quizzes are inserted automatically when the quizzes table is empty.

## 4. Use the application

1. Select **Create an account**.
2. Register with your name, email and a password of at least six characters.
3. Sign in.
4. Open **Explore quizzes** and select a quiz.
5. Answer the questions and submit.
6. View your result, dashboard statistics and leaderboard.
7. Open **Manage questions** in the sidebar, enter the admin key, select a quiz, then add, edit, delete or reorder its questions. The local demo key is `skillsphere-demo-admin`; change it before sharing the project.

## REST API overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check application status |
| POST | `/api/auth/register` | Register a student |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/quizzes` | List quizzes |
| GET | `/api/quizzes/{id}` | Get quiz questions (without answers) |
| POST | `/api/attempts` | Submit answers and save score |
| GET | `/api/users/{userId}/attempts` | Get recent attempts |
| GET | `/api/users/{userId}/stats` | Get student statistics |
| GET | `/api/leaderboard` | Get leaderboard |
| GET | `/api/admin/quizzes` | List quizzes for the admin panel (requires `X-Admin-Key`) |
| GET | `/api/admin/quizzes/{quizId}/questions` | List questions including correct answers (requires `X-Admin-Key`) |
| POST | `/api/admin/questions` | Create a question (requires `X-Admin-Key`) |
| PUT | `/api/admin/questions/{id}` | Update a question (requires `X-Admin-Key`) |
| DELETE | `/api/admin/questions/{id}` | Delete a question (requires `X-Admin-Key`) |

## Database tables

- `users` – student account details
- `quizzes` – quiz title, category, difficulty and duration
- `questions` – question text, four options, correct answer, explanation and display order
- `quiz_attempts` – student quiz scores and completion time

## Important academic notes

- The frontend is served from Spring Boot's `src/main/resources/static` directory. It is not a separate frontend project.
- `database.sql` creates the database. JPA creates/updates the tables automatically.
- This is an academic demonstration. Login returns a user profile and the browser stores it in localStorage; it is not production-grade session/token authentication. For a real deployment, add Spring Security, server-side sessions or JWT, CSRF protection, role-based access and stricter validation. The question-management endpoints use a shared `X-Admin-Key` for this academic demo only; it is not production-grade role authentication.
- React and Babel are loaded from CDNs in this beginner-friendly starter. For an offline or production build, bundle React locally using a frontend build tool.
- The quiz timer is enforced in the browser for the academic demo. The server calculates and stores scores, but a production system should also validate quiz timing on the server.

## Troubleshooting

**Cannot connect to MySQL**
- Confirm MySQL service is running.
- Confirm the database name, username and password.
- Check that port 3306 is available.

**Port 8080 is already in use**
- Change `server.port=8081` in `application.properties`, then open `http://localhost:8081`.

**React page does not load**
- Check the browser internet connection because the starter uses CDN scripts.
- Check browser developer tools for failed network requests.
- Confirm Spring Boot started successfully and visit `/api/health`.

## Suggested viva explanation

SkillSphere is a full-stack web application that helps students learn and evaluate technical skills. React handles the user interface, Spring Boot provides REST APIs and business logic, Spring Data JPA maps Java entities to MySQL tables, and MySQL stores users, quizzes, questions and quiz attempts. The project follows a layered architecture with controllers, repositories and entities.
