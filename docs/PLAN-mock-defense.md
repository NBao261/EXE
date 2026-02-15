# PLAN - Sprint 2: Mock Defense (Virtual Defense Room)

## 1. Overview

Build the "Mock Defense" feature where users upload a thesis PDF, and a "Strict Professor" AI (Gemini) conducts an oral defense simulation using RAG (Retrieval-Augmented Generation) and Voice Interaction.

## 2. Project Type

- **Type**: WEB (MERN Stack)
- **Primary Agent**: `frontend-specialist` (for UI/Voice) & `backend-specialist` (for RAG/Vector DB)

## 3. Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Audio**: Web Speech API (Native Browser STT/TTS) - _Option A (Cost-effective)_
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB Atlas with **Vector Search**
- **AI**:
  - **LLM**: Google Gemini 2.5 Flash
  - **Embeddings**: Google `embedding-001`
- **File Processing**: `multer`, `pdf-parse`

## 4. Success Criteria

- [ ] User can upload PDF, system chunks and stores embeddings in MongoDB.
- [ ] MongoDB Atlas Vector Search queries return relevant context.
- [ ] "Virtual Room" UI captures microphone input (STT).
- [ ] AI responds with "Strict Professor" persona based _only_ on document context.
- [ ] System speaks back the response (TTS).
- [ ] Latency is acceptable for conversation (< 3s ideal).

## 5. File Structure New/Modified

```
backend/
├── src/
│   ├── config/
│   │   └── gemini.ts          # AI Config
│   ├── controllers/
│   │   └── defense.controller.ts
│   ├── models/
│   │   └── DocumentChunk.ts   # Schema for vector storage
│   ├── routes/
│   │   └── defense.routes.ts
│   ├── services/
│   │   ├── embedding.service.ts # Handle embedding-001
│   │   ├── vector.service.ts    # Handle MongoDB Vector Search
│   │   └── rag.service.ts       # Combine Search + Generation
│   └── app.ts                 # Register routes

frontend/
├── src/
│   ├── components/
│   │   ├── defense/
│   │   │   ├── AudioVisualizer.tsx
│   │   │   └── ChatTranscript.tsx
│   ├── hooks/
│   │   ├── useSpeechToText.ts # Web Speech API Wrapper
│   │   └── useTextToSpeech.ts # Web Speech API Wrapper
│   ├── pages/
│   │   └── MockDefensePage.tsx
│   └── services/
│       └── defense.service.ts
```

## 6. Task Breakdown

### Phase 1: Foundation & Database (Backend)

- [ ] **Task 1.1 - MongoDB Atlas Setup (MANUAL)**
  - _Agent_: `database-architect`
  - _Action_: User must log in to MongoDB Atlas, create Search Index.
  - _Output_: Vector Index ready.
  - _Details_: JSON configuration for Index provided in implementation.
- [ ] **Task 1.2 - Vector Schema & Model**
  - _Agent_: `backend-specialist`
  - _Input_: `models/DocumentChunk.ts`
  - _Output_: Mongoose schema with `embedding` field (array of numbers).

### Phase 2: Core Logic (Backend)

- [ ] **Task 2.1 - Embedding Service**
  - _Agent_: `backend-specialist`
  - _Input_: Text chunk
  - _Output_: Vector (768 dimensions for embedding-001).
  - _Verify_: Test function returns array of floats.
- [ ] **Task 2.2 - Upload & Chunking API**
  - _Agent_: `backend-specialist`
  - _Route_: `POST /api/defense/upload`
  - _Logic_: Upload PDF -> Parse Text -> Split by paragraphs/size -> Generate Embeddings -> Save to DB.
- [ ] **Task 2.3 - Vector Search Service**
  - _Agent_: `backend-specialist`
  - _Logic_: `$vectorSearch` aggregation pipeline in MongoDB.
- [ ] **Task 2.4 - RAG Chat Endpoint**
  - _Agent_: `backend-specialist`
  - _Route_: `POST /api/defense/chat`
  - _Logic_: User Query -> Embed -> Search DB -> Construct Prompt (System + Context + Query) -> Call Gemini -> Return Text.

### Phase 3: Frontend Interface (Virtual Room)

- [ ] **Task 3.1 - Speech Hooks (STT/TTS)**
  - _Agent_: `frontend-specialist`
  - _Files_: `hooks/useSpeechToText.ts`, `hooks/useTextToSpeech.ts`
  - _Logic_: Wrap `window.SpeechRecognition` and `window.speechSynthesis`.
- [ ] **Task 3.2 - Defense Service**
  - _Agent_: `frontend-specialist`
  - _File_: `services/defense.service.ts`
  - _Logic_: API calls to backend.
- [ ] **Task 3.3 - Mock Defense Page UI**
  - _Agent_: `frontend-specialist`
  - _UI_: Big "Microphone" button, status indicator (Listening/Thinking/Speaking), simple Transcript scroll.
  - _Theme_: Professional, slightly intense (it's a defense!).

### Phase 4: Integration & Polish

- [ ] **Task 4.1 - Connect & Verify Flow**
  - _Agent_: `fullstack-integrator`
  - _Test_: Upload specific PDF -> Ask about specific detail -> verify AI knows it.
- [ ] **Task 4.2 - Prompt Tuning**
  - _Agent_: `backend-specialist`
  - _Action_: Refine "Strict Professor" system prompt.

## 7. Phase X: Verification Checklist

- [ ] **Security**: Upload limits (file size), type validation (PDF only).
- [ ] **Performance**: Vector search returns results < 500ms.
- [ ] **UX**: Visual feedback when AI is "thinking".
- [ ] **Voice**: Browser requests microphone permission correctly.
- [ ] **Lint**: `npm run lint` passes in both FE and BE.

## 8. Manual Instruction: MongoDB Atlas Vector Search

You will need to create a Search Index in your MongoDB Cloud dashboard.
**Collection**: `documentchunks` (plural of model name)
**Index Name**: `vector_index`
**Definition**:

```json
{
  "fields": [
    {
      "numDimensions": 768,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    }
  ]
}
```

_Note: We will confirm the dimensionality of embedding-001 (768) during implementation._
