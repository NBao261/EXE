import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";
import type { QuizQuestion, Flashcard } from "../types/document.types.js";

// Initialize Gemini with new SDK
const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

export interface GeneratedContent {
  title: string;
  questions: QuizQuestion[];
  flashcards: Flashcard[];
}

export const geminiService = {
  /**
   * Generate quiz questions and flashcards from document text
   */
  async generateQuizAndFlashcards(text: string): Promise<GeneratedContent> {
    if (!config.geminiApiKey) {
      throw new Error("Gemini API key not configured");
    }

    // Truncate text if too long (Gemini has token limits)
    const maxLength = 30000;
    const truncatedText =
      text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

    const prompt = `You are an AI teaching assistant. Based on the following document content, create:
1. Multiple choice questions (4 options each, mark correct answer as 0-3) - CREATE AS MANY AS APPROPRIATE based on the document content (typically 5-20 questions depending on content length and complexity)
2. Flashcards (front: concept/question, back: definition/answer) - CREATE AS MANY AS APPROPRIATE based on key concepts

IMPORTANT RULES:
- Questions and answers MUST be in ENGLISH
- Explanations MUST be in VIETNAMESE (tiếng Việt) and MUST include:
  1. Why the correct answer is right
  2. Reference to WHERE in the document this information is found (e.g., "Theo tài liệu, phần về [topic]..." or "Trong slide/trang về [section]...")
- Number of questions/flashcards should be proportional to content - don't limit to fixed numbers

Return JSON with this exact format (no markdown code blocks):
{
  "title": "Short topic name in English",
  "questions": [
    {
      "question": "Question in English?",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correctAnswer": 0,
      "explanation": "Giải thích bằng tiếng Việt + trích dẫn vị trí trong tài liệu"
    }
  ],
  "flashcards": [
    {
      "front": "Concept/Question in English",
      "back": "Definition/Answer in English"
    }
  ]
}

DOCUMENT CONTENT:
${truncatedText}`;

    try {
      // Use new SDK syntax - gemini-2.5-flash is the latest model
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let responseText = response.text || "";

      // Clean up response - remove markdown code blocks if present
      responseText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(responseText) as GeneratedContent;

      // Validate response structure
      if (
        !parsed.title ||
        !Array.isArray(parsed.questions) ||
        !Array.isArray(parsed.flashcards)
      ) {
        throw new Error("Invalid response structure from Gemini");
      }

      return parsed;
    } catch (error) {
      console.error("Gemini API error:", error);

      // Return fallback content if Gemini fails
      return {
        title: "Quiz từ tài liệu",
        questions: [
          {
            question:
              "Không thể tạo câu hỏi từ tài liệu này. Vui lòng thử lại.",
            options: [
              "A. Thử lại",
              "B. Thử tài liệu khác",
              "C. Liên hệ hỗ trợ",
              "D. Bỏ qua",
            ],
            correctAnswer: 0,
            explanation: "Vui lòng upload tài liệu có nội dung rõ ràng hơn.",
          },
        ],
        flashcards: [
          {
            front: "Lỗi khi tạo flashcard",
            back: "Vui lòng thử lại với tài liệu khác.",
          },
        ],
      };
    }
  },
};
