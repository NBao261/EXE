// Smart Review types for frontend

export interface UserQuota {
  plan: "free" | "premium";
  uploadCount: number;
  uploadLimit: number;
  remainingUploads: number;
  canUpload: boolean;
}

export interface Document {
  _id: string;
  originalName: string;
  fileType: "pdf" | "docx" | "pptx";
  status: "uploading" | "processing" | "completed" | "failed";
  createdAt: string;
}

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
  _id: string;
  title: string;
  questions: QuizQuestion[];
  flashcards: Flashcard[];
  lastScore?: number;
  createdAt: string;
}

export interface QuizListItem {
  _id: string;
  title: string;
  questionCount: number;
  flashcardCount: number;
  lastScore?: number;
  createdAt: string;
}
