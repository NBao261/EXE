import type {
  UserQuota,
  Document,
  Quiz,
  QuizListItem,
} from "../types/smartreview";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface PaginatedQuizzes {
  quizzes: QuizListItem[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

class SmartReviewService {
  private getHeaders(token: string | null): HeadersInit {
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async uploadDocument(
    file: File,
    token: string,
  ): Promise<{ document: Document; remainingUploads: number }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/smart-review/upload`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    return data.data;
  }

  async uploadMultipleDocuments(
    files: File[],
    token: string,
  ): Promise<{ documents: Document[]; remainingUploads: number }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`${API_URL}/smart-review/upload-multiple`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    return data.data;
  }

  async getDocuments(token: string): Promise<Document[]> {
    const response = await fetch(`${API_URL}/smart-review/documents`, {
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to get documents");
    }

    return data.data.documents;
  }

  async getQuizzes(
    token: string,
    page: number = 1,
    limit: number = 5,
  ): Promise<PaginatedQuizzes> {
    const response = await fetch(
      `${API_URL}/smart-review/quizzes?page=${page}&limit=${limit}`,
      {
        headers: this.getHeaders(token),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to get quizzes");
    }

    return data.data;
  }

  async getQuiz(quizId: string, token: string): Promise<Quiz> {
    const response = await fetch(`${API_URL}/smart-review/quizzes/${quizId}`, {
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to get quiz");
    }

    return data.data.quiz;
  }

  async renameQuiz(
    quizId: string,
    title: string,
    token: string,
  ): Promise<{ _id: string; title: string }> {
    const response = await fetch(`${API_URL}/smart-review/quizzes/${quizId}`, {
      method: "PATCH",
      headers: {
        ...this.getHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to rename quiz");
    }

    return data.data.quiz;
  }

  async getQuota(token: string): Promise<UserQuota> {
    const response = await fetch(`${API_URL}/smart-review/user/quota`, {
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to get quota");
    }

    return data.data;
  }

  async updateQuizScore(
    quizId: string,
    score: number,
    token: string,
  ): Promise<{ lastScore: number }> {
    const response = await fetch(
      `${API_URL}/smart-review/quizzes/${quizId}/score`,
      {
        method: "PATCH",
        headers: {
          ...this.getHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ score }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update score");
    }

    return data.data;
  }

  async deleteQuiz(quizId: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/smart-review/quizzes/${quizId}`, {
      method: "DELETE",
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete quiz");
    }
  }
}

export const smartReviewService = new SmartReviewService();
