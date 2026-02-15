import { GoogleGenAI } from "@google/genai";
import { ObjectId } from "mongodb";
import { config } from "../config/index.js";
import { vectorService } from "./vector.service.js";
import { getDb } from "../config/database.js";
import type {
  DefenseSession,
  ConversationMessage,
} from "../types/defense.types.js";

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

const SESSIONS_COLLECTION = "defensesessions";

// System prompt for the "Strict Professor" persona
const STRICT_PROFESSOR_PROMPT = `You are a STRICT PROFESSOR conducting an oral thesis defense examination.

YOUR ROLE:
- You are evaluating a student who has submitted their thesis/report
- Ask probing, challenging questions about their work
- Do NOT accept vague or incomplete answers
- Push the student to demonstrate deep understanding
- Reference specific parts of their document when questioning

YOUR BEHAVIOR:
- Be formal and professional
- Ask ONE focused question at a time
- If the student's answer is weak, point out the weakness and ask for clarification
- Occasionally acknowledge good answers briefly, then move to harder questions
- Use phrases like "Explain further...", "What evidence supports...", "How does this relate to..."

CRITICAL RULES:
- ONLY ask questions about topics that appear in the provided document context
- If asked about something NOT in the document, say "That topic is not covered in your submitted document. Let's focus on what you've written."
- Keep responses concise (2-4 sentences max)
- Always end with a question to keep the defense going

LANGUAGE: Respond in the same language the student uses.`;

export const ragService = {
  /**
   * Create a new defense session
   */
  async createSession(
    userId: ObjectId,
    documentId: ObjectId,
    title: string,
  ): Promise<DefenseSession> {
    const db = getDb();
    const collection = db.collection<DefenseSession>(SESSIONS_COLLECTION);

    const session: Omit<DefenseSession, "_id"> = {
      userId,
      documentId,
      title,
      status: "preparing",
      totalChunks: 0,
      conversationHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(session as DefenseSession);
    return { ...session, _id: result.insertedId };
  },

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: ObjectId,
    status: DefenseSession["status"],
    totalChunks?: number,
  ): Promise<void> {
    const db = getDb();
    const collection = db.collection<DefenseSession>(SESSIONS_COLLECTION);

    const update: Partial<DefenseSession> = {
      status,
      updatedAt: new Date(),
    };

    if (totalChunks !== undefined) {
      update.totalChunks = totalChunks;
    }

    await collection.updateOne({ _id: sessionId }, { $set: update });
  },

  /**
   * Get session by ID
   */
  async getSession(sessionId: ObjectId): Promise<DefenseSession | null> {
    const db = getDb();
    const collection = db.collection<DefenseSession>(SESSIONS_COLLECTION);
    return collection.findOne({ _id: sessionId });
  },

  /**
   * Get user's sessions
   */
  async getUserSessions(userId: ObjectId): Promise<DefenseSession[]> {
    const db = getDb();
    const collection = db.collection<DefenseSession>(SESSIONS_COLLECTION);
    return collection.find({ userId }).sort({ createdAt: -1 }).toArray();
  },

  /**
   * Process a chat message with RAG
   */
  async chat(
    sessionId: ObjectId,
    userMessage: string,
  ): Promise<{ response: string; retrievedContext: string[] }> {
    // 1. Get session
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Defense session not found");
    }

    if (session.status === "preparing") {
      throw new Error(
        "Session is still preparing. Please wait for document processing to complete.",
      );
    }

    // 2. Retrieve relevant context using vector search
    const searchResults = await vectorService.searchByText(
      userMessage,
      sessionId,
      5,
    );
    const retrievedContext = searchResults.map((r) => r.content);

    // 3. Build the prompt with context and conversation history
    const contextText =
      retrievedContext.length > 0
        ? `\n\nRELEVANT DOCUMENT EXCERPTS:\n${retrievedContext.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")}`
        : "\n\n[No specific context found for this query]";

    const historyText =
      session.conversationHistory.length > 0
        ? `\n\nPREVIOUS CONVERSATION:\n${session.conversationHistory
            .slice(-6) // Last 6 messages for context
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n")}`
        : "";

    const fullPrompt = `${STRICT_PROFESSOR_PROMPT}${contextText}${historyText}

STUDENT'S CURRENT RESPONSE: ${userMessage}

YOUR REPLY (as the Strict Professor):`;

    // 4. Generate response from Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    const assistantMessage =
      response.text || "I couldn't generate a response. Please try again.";

    // 5. Save to conversation history
    const newMessages: ConversationMessage[] = [
      { role: "user", content: userMessage, timestamp: new Date() },
      { role: "assistant", content: assistantMessage, timestamp: new Date() },
    ];

    const db = getDb();
    const collection = db.collection<DefenseSession>(SESSIONS_COLLECTION);
    await collection.updateOne(
      { _id: sessionId },
      {
        $push: { conversationHistory: { $each: newMessages } },
        $set: { status: "in_progress", updatedAt: new Date() },
      },
    );

    return {
      response: assistantMessage,
      retrievedContext,
    };
  },

  /**
   * Generate an opening question for the defense
   */
  async startDefense(sessionId: ObjectId): Promise<string> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Defense session not found");
    }

    // Get a few random chunks to base the opening question on
    const searchResults = await vectorService.searchByText(
      "main topic thesis introduction purpose",
      sessionId,
      3,
    );
    const context = searchResults.map((r) => r.content).join("\n\n");

    const openingPrompt = `${STRICT_PROFESSOR_PROMPT}

DOCUMENT CONTEXT:
${context}

Generate an opening question for this oral defense. The question should:
1. Be challenging but fair
2. Focus on a key aspect of the student's work
3. Set the tone for a rigorous academic defense

YOUR OPENING QUESTION:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: openingPrompt,
    });

    const openingQuestion =
      response.text ||
      "Please summarize your thesis and explain why this topic is significant.";

    // Save opening to conversation history
    const db = getDb();
    const collection = db.collection<DefenseSession>(SESSIONS_COLLECTION);
    await collection.updateOne(
      { _id: sessionId },
      {
        $push: {
          conversationHistory: {
            role: "assistant",
            content: openingQuestion,
            timestamp: new Date(),
          },
        },
        $set: { status: "in_progress", updatedAt: new Date() },
      },
    );

    return openingQuestion;
  },
};
