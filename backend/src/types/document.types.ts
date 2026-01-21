import { ObjectId } from "mongodb";

// User plan types
export type UserPlan = "free" | "premium";

export interface UserQuota {
  plan: UserPlan;
  uploadCount: number;
  uploadLimit: number;
  canUpload: boolean;
}

// Document types
export type DocumentStatus =
  | "uploading"
  | "processing"
  | "completed"
  | "failed";
export type DocumentType = "pdf" | "docx" | "pptx";

export interface Document {
  _id?: ObjectId;
  userId: ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  fileType: DocumentType;
  size: number;
  extractedText?: string;
  status: DocumentStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentInput {
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

// Quiz & Flashcard types
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Quiz {
  _id?: ObjectId;
  userId: ObjectId;
  documentId: ObjectId;
  title: string;
  questions: QuizQuestion[];
  flashcards: Flashcard[];
  lastScore?: number;
  lastAttemptAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// API Response types
export interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    document: Document;
    remainingUploads: number;
  };
}

export interface QuizResponse {
  success: boolean;
  message: string;
  data?: {
    quiz: Quiz;
  };
}
