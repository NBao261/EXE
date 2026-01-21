# Smart Review Feature Plan

## Overview

Tính năng **Smart Review** cho phép sinh viên upload tài liệu (Slide, PDF, Word) và sử dụng **Gemini 1.5 Flash** để tự động tạo Quiz và Flashcard giúp ôn thi hiệu quả.

**Business Model:** Freemium

- Free: 3 lần upload đầu tiên
- Paid: Upload không giới hạn

---

## Success Criteria

| Criteria      | Metric                                 |
| ------------- | -------------------------------------- |
| Upload        | Hỗ trợ .pptx, .pdf, .docx              |
| AI Generation | Tạo Quiz (MCQ) + Flashcard từ nội dung |
| Usage Limit   | Track số lần upload của user           |
| Paywall       | Block upload khi hết free quota        |

---

## Tech Stack

| Component        | Technology                             |
| ---------------- | -------------------------------------- |
| File Upload      | Multer (Express)                       |
| File Storage     | Local disk / Cloud Storage             |
| Document Parsing | pdf-parse, mammoth (docx), pptx-parser |
| AI               | Google Gemini 1.5 Flash API            |
| Database         | MongoDB (users, documents, quizzes)    |
| Payment          | Stripe / VNPay (future)                |

---

## Database Schema Changes

### User Collection (Update)

```
{
  _id: ObjectId,
  email: string,
  password: string,
  name: string,
  plan: 'free' | 'premium',   // NEW
  uploadCount: number,         // NEW: Track free uploads used
  createdAt: Date,
  updatedAt: Date
}
```

### Documents Collection (NEW)

```
{
  _id: ObjectId,
  userId: ObjectId,
  filename: string,
  originalName: string,
  mimeType: string,
  size: number,
  extractedText: string,
  status: 'processing' | 'completed' | 'failed',
  createdAt: Date
}
```

### Quizzes Collection (NEW)

```
{
  _id: ObjectId,
  userId: ObjectId,
  documentId: ObjectId,
  title: string,
  questions: [
    {
      question: string,
      options: string[],
      correctAnswer: number,
      explanation: string
    }
  ],
  flashcards: [
    {
      front: string,
      back: string
    }
  ],
  createdAt: Date
}
```

---

## File Structure

### Backend

```
backend/src/
├── config/
│   └── gemini.ts              # [NEW] Gemini API config
├── controllers/
│   ├── upload.controller.ts   # [NEW] Handle file uploads
│   └── quiz.controller.ts     # [NEW] Quiz/Flashcard endpoints
├── middlewares/
│   ├── upload.middleware.ts   # [NEW] Multer config
│   └── quota.middleware.ts    # [NEW] Check upload quota
├── services/
│   ├── document.service.ts    # [NEW] Parse documents
│   ├── gemini.service.ts      # [NEW] Gemini API integration
│   └── quiz.service.ts        # [NEW] Generate quiz/flashcard
├── models/
│   ├── document.model.ts      # [NEW] Document schema
│   └── quiz.model.ts          # [NEW] Quiz schema
├── routes/
│   ├── upload.routes.ts       # [NEW]
│   └── quiz.routes.ts         # [NEW]
└── types/
    ├── document.types.ts      # [NEW]
    └── quiz.types.ts          # [NEW]
```

### Frontend

```
frontend/src/
├── pages/
│   ├── SmartReviewPage.tsx    # [NEW] Main feature page
│   └── QuizPage.tsx           # [NEW] Take quiz
├── components/
│   ├── FileUpload.tsx         # [NEW] Drag & drop upload
│   ├── QuizCard.tsx           # [NEW] Display quiz
│   ├── FlashCard.tsx          # [NEW] Flip-able flashcard
│   └── UpgradeModal.tsx       # [NEW] Paywall modal
├── services/
│   └── upload.service.ts      # [NEW] Upload API calls
└── stores/
    └── quizStore.ts           # [NEW] Quiz state
```

---

## Task Breakdown

### Phase 1: Backend Upload & Quota (P0)

| Task                   | Agent              | Dependency | Output                       |
| ---------------------- | ------------------ | ---------- | ---------------------------- |
| 1.1 Update User schema | backend-specialist | -          | Add plan, uploadCount fields |
| 1.2 Setup Multer       | backend-specialist | -          | upload.middleware.ts         |
| 1.3 Quota middleware   | backend-specialist | 1.1        | quota.middleware.ts          |
| 1.4 Upload controller  | backend-specialist | 1.2, 1.3   | upload.controller.ts         |
| 1.5 Document model     | backend-specialist | -          | document.model.ts            |

### Phase 2: Document Parsing (P1)

| Task                 | Agent              | Dependency | Output                   |
| -------------------- | ------------------ | ---------- | ------------------------ |
| 2.1 Install parsers  | backend-specialist | -          | pdf-parse, mammoth, pptx |
| 2.2 Document service | backend-specialist | 2.1        | document.service.ts      |
| 2.3 Text extraction  | backend-specialist | 2.2        | Extract text from files  |

### Phase 3: Gemini Integration (P1)

| Task                | Agent              | Dependency | Output            |
| ------------------- | ------------------ | ---------- | ----------------- |
| 3.1 Gemini config   | backend-specialist | -          | gemini.ts, .env   |
| 3.2 Gemini service  | backend-specialist | 3.1        | gemini.service.ts |
| 3.3 Quiz generation | backend-specialist | 3.2, 2.3   | quiz.service.ts   |
| 3.4 Quiz model      | backend-specialist | -          | quiz.model.ts     |
| 3.5 Quiz routes     | backend-specialist | 3.3, 3.4   | quiz.routes.ts    |

### Phase 4: Frontend UI (P2)

| Task                     | Agent               | Dependency | Output              |
| ------------------------ | ------------------- | ---------- | ------------------- |
| 4.1 FileUpload component | frontend-specialist | -          | FileUpload.tsx      |
| 4.2 SmartReviewPage      | frontend-specialist | 4.1        | SmartReviewPage.tsx |
| 4.3 QuizCard component   | frontend-specialist | -          | QuizCard.tsx        |
| 4.4 FlashCard component  | frontend-specialist | -          | FlashCard.tsx       |
| 4.5 UpgradeModal         | frontend-specialist | -          | UpgradeModal.tsx    |
| 4.6 QuizPage             | frontend-specialist | 4.3, 4.4   | QuizPage.tsx        |

### Phase X: Verification

- [ ] Upload .pdf, .docx, .pptx works
- [ ] Text extraction successful
- [ ] Gemini generates valid quiz/flashcard
- [ ] Free quota (3) enforced
- [ ] Upgrade modal shown when quota exceeded
- [ ] Quiz/Flashcard UI functional

---

## API Endpoints

| Method | Endpoint                    | Description            | Auth |
| ------ | --------------------------- | ---------------------- | ---- |
| POST   | /api/upload                 | Upload document        | Yes  |
| GET    | /api/documents              | List user documents    | Yes  |
| GET    | /api/documents/:id          | Get document details   | Yes  |
| POST   | /api/documents/:id/generate | Generate quiz from doc | Yes  |
| GET    | /api/quizzes                | List user quizzes      | Yes  |
| GET    | /api/quizzes/:id            | Get quiz details       | Yes  |
| GET    | /api/user/quota             | Get remaining quota    | Yes  |

---

## Environment Variables

```
# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# Quota
FREE_UPLOAD_LIMIT=3
```

---

## Risk Areas

| Risk                  | Mitigation                           |
| --------------------- | ------------------------------------ |
| Large file processing | Limit file size, async processing    |
| Gemini rate limits    | Queue system, retry logic            |
| Poor quiz quality     | Improve prompts, allow regeneration  |
| Text extraction fails | Fallback handling, user notification |
