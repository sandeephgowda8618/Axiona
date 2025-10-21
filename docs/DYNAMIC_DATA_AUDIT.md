# Dynamic Data Audit and Migration Plan

This document lists pages/components currently using hardcoded data and defines the dynamic data sources, API endpoints, and entities to replace them. It aligns with the ERD in `docs/DATABASE_ERD.md` and targets a 3NF logical model with MongoDB implementation guidance.

## Pages and Hardcoded Data

- QuizSelection.tsx

  - Hardcoded: `client/src/data/mockQuizzes.ts`
  - Replace with: GET `/api/quizzes` with filters (category, difficulty, search)
  - Entities: quizzes, attempts (for status badges)
  - Notes: show user status via last attempt summary (server to calculate `lastAttemptStatus`)

- QuizExam.tsx / QuizExamSecure.tsx

  - Hardcoded: `getQuizById` from mocks
  - Replace with: GET `/api/quizzes/:id`, POST `/api/quizzes/:id/attempts`, POST `/api/quizzes/:id/attempts/:attemptId/submit`
  - Entities: quizzes (embedded questions), attempts

- TutorialHub.tsx

  - Hardcoded: in-file `mockTutorials` array
  - Replace with: GET `/api/tutorials?search=&category=`
  - Entities: tutorials (can be part of documents or a separate collection), users (saved/liked), activity

- MyRack.tsx

  - Hardcoded: `demoNotes`
  - Replace with: GET `/api/notes?page=&limit=` (user scoped)
  - Entities: notes, users

- Library.tsx

  - Likely static/demo; replace with:
    - GET `/api/library/books?filters`
    - GET `/api/library/books/:id`, POST `/api/library/books/:id/reviews`
  - Entities: library_books, book_reviews

- StudyPES / StudyMaterialsPES
  - Replace with: GET `/api/study-materials`, GET `/api/study-materials/:id`, download endpoints
  - Entities: documents

## API Contracts (client)

- quizzesAPI: getQuizzes, getQuizById, createAttempt, submitAttempt, getAttempts
- tutorialsAPI: getTutorials, getTutorialById
- rackAPI: getNotes (paged)
- studyMaterialsAPI/libraryAPI already present

## Server Endpoints (to implement)

- GET `/api/quizzes` → { items, pagination }
- GET `/api/quizzes/:id`
- POST `/api/quizzes/:id/attempts` → creates attempt
- POST `/api/quizzes/:id/attempts/:attemptId/submit`
- GET `/api/tutorials` → supports search, category, difficulty
- GET `/api/tutorials/:id`
- GET `/api/notes` → user scoped, paginated

## Data Model: 3NF Logical Layer

Although MongoDB is document-oriented, the logical design should be in 3NF for clarity and future SQL compatibility. Key normalized entities (PK → FK):

- User(UserId PK, Email, DisplayName, Role, FirebaseUid, CreatedAt)
- Quiz(QuizId PK, Title, SubjectId FK, CategoryId FK, DifficultyId FK, Duration, MaxMarks, PassingMarks, CreatedBy FK, CreatedAt)
- QuizInstruction(InstructionId PK, QuizId FK, Text)
- QuizTag(QuizId FK, TagId FK) [Junction]
- Question(QuestionId PK, QuizId FK, TypeId FK, Text, Marks, TimeLimit, DifficultyId FK)
- QuestionOption(OptionId PK, QuestionId FK, Label, IsCorrect)
- Attempt(AttemptId PK, QuizId FK, UserId FK, StartTime, EndTime, Status, Score, Percentage, Passed)
- AttemptAnswer(AttemptId FK, QuestionId FK, Value)
- Document(DocumentId PK, Title, SubjectId FK, ClassId FK, Year, Pages, Urls...)
- DocumentTag(DocumentId FK, TagId FK)
- Note(NoteId PK, UserId FK, DocumentId FK NULL, Content, SubjectId FK NULL, CreatedAt, UpdatedAt, IsPinned, Color)
- Tutorial(TutorialId PK, Title, CategoryId FK, InstructorId FK, Duration, VideoId, ThumbnailUrl, Rating, PublishedAt)
- TutorialTag(TutorialId FK, TagId FK)
- UserTutorialState(UserId FK, TutorialId FK, IsLiked, IsSaved, IsDownloaded, LastWatched, WatchProgress)
- LibraryBook(BookId PK, ...)
- BookReview(ReviewId PK, BookId FK, UserId FK, Rating, Review, ReviewDate)
- Lookup tables: Subject, Category, Difficulty, Tag, Class, QuestionType

MongoDB Mapping:

- Embed arrays where read-optimized (Quiz.instructions, Quiz.questions[options]).
- Keep references for cross-entity relations (Attempt.quizId/userId, Note.userId/documentId).
- Maintain separate collections for lookups if needed or keep as enum constants.

## Migration Steps

1. Implement server schemas/models mapped from `docs/DATABASE_ERD.md` (Mongoose)
2. Add controllers and routes for quizzes, attempts, tutorials, notes
3. Replace client mocks with API calls guarded by fallbacks (if API fails, show mocked data with a banner)
4. Add pagination/filtering on server; wire to client filters
5. Add basic auth (Firebase token verification) for user-scoped endpoints

## Rollout Strategy

- Phase 1: Read-only dynamic data (QuizSelection, TutorialHub, MyRack listing)
- Phase 2: Attempts creation/submission; notes CRUD
- Phase 3: Library reviews, favorites, analytics

## QA Checklist

- All pages render with API data when server available; gracefully fallback to mocks otherwise
- Filters/search persist across navigation
- Pagination works and matches total counts
- Entities respect normalization constraints; no duplicate tag/lookup values
- Security: endpoints require auth where user-specific
