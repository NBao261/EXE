import { ObjectId } from "mongodb";

// ============ Document Chunk (for Vector Storage) ============
export interface DocumentChunk {
  _id?: ObjectId;
  documentId: ObjectId; // Reference to original uploaded PDF
  userId: ObjectId;
  sessionId: ObjectId; // Reference to DefenseSession
  content: string; // Text content of this chunk
  chunkIndex: number; // Order within document
  embedding: number[]; // Vector embedding (768 dims for embedding-001)
  metadata: {
    pageNumber?: number;
    startChar: number;
    endChar: number;
  };
  createdAt: Date;
}

// ============ Defense Session ============
export type DefenseSessionStatus =
  | "preparing"
  | "ready"
  | "in_progress"
  | "completed";

export interface DefenseSession {
  _id?: ObjectId;
  userId: ObjectId;
  documentId: ObjectId;
  title: string; // Document title or user-defined
  status: DefenseSessionStatus;
  totalChunks: number;
  conversationHistory: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ============ API Types ============
export interface UploadDefenseDocumentInput {
  file: Express.Multer.File;
  userId: string;
  title?: string;
}

export interface DefenseChatInput {
  sessionId: string;
  userMessage: string;
}

export interface DefenseChatResponse {
  success: boolean;
  message: string;
  data?: {
    response: string;
    retrievedContext?: string[]; // For debugging
  };
}

export interface DefenseSessionResponse {
  success: boolean;
  message: string;
  data?: {
    session: DefenseSession;
  };
}
