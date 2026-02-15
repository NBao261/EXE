import { API_URL } from "../config";

// Get token from Zustand persisted storage
const getToken = (): string | null => {
  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (!authStorage) return null;
    const parsed = JSON.parse(authStorage);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
};

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

const getJsonHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export interface DefenseSession {
  _id: string;
  title: string;
  status: "preparing" | "ready" | "in_progress" | "completed";
  totalChunks: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  response: string;
  retrievedContext?: string[];
}

export const defenseService = {
  /**
   * Upload a PDF for mock defense
   */
  async uploadDocument(file: File, title?: string): Promise<DefenseSession> {
    const formData = new FormData();
    formData.append("file", file);
    if (title) {
      formData.append("title", title);
    }

    const response = await fetch(`${API_URL}/defense/upload`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Upload failed");
    }

    return data.data.session;
  },

  /**
   * Get all defense sessions for current user
   */
  async getSessions(): Promise<DefenseSession[]> {
    const response = await fetch(`${API_URL}/defense/sessions`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch sessions");
    }

    return data.data.sessions;
  },

  /**
   * Get a specific session
   */
  async getSession(sessionId: string): Promise<DefenseSession> {
    const response = await fetch(`${API_URL}/defense/sessions/${sessionId}`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Session not found");
    }

    return data.data.session;
  },

  /**
   * Start the defense (get opening question)
   */
  async startDefense(sessionId: string): Promise<string> {
    const response = await fetch(
      `${API_URL}/defense/sessions/${sessionId}/start`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error
          ? `${data.message}: ${data.error}`
          : data.message || "Failed to start defense",
      );
    }

    return data.data.message;
  },

  /**
   * Send a message and get AI response
   */
  async chat(sessionId: string, message: string): Promise<ChatResponse> {
    const response = await fetch(
      `${API_URL}/defense/sessions/${sessionId}/chat`,
      {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify({ message }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      // If response is not ok, 'data' already contains the error body
      const errorData = data; // Use the already parsed 'data' as errorData
      throw new Error(
        errorData.error
          ? `${errorData.message}: ${errorData.error}`
          : errorData.message || "Chat failed",
      );
    }

    // If response is ok, ensure data.success is true as per original logic
    if (!data.success) {
      throw new Error(data.message || "Chat failed due to server logic");
    }

    return data.data;
  },

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_URL}/defense/sessions/${sessionId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to delete session");
    }
  },
};
