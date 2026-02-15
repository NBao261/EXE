import { Response } from "express";
import { ObjectId } from "mongodb";
import type { QuotaRequest } from "../middlewares/quota.middleware.js";
import { documentService } from "./document.service.js";
import { embeddingService } from "./embedding.service.js";
import { vectorService } from "./vector.service.js";
import { ragService } from "./rag.service.js";
import { getDb } from "../config/database.js";
import { config } from "../config/index.js";
import type { DocumentChunk, DefenseSession } from "../types/defense.types.js";

const DOCUMENTS_COLLECTION = "documents";

export const defenseService = {
  /**
   * Upload a PDF and prepare it for defense (chunk + embed + store)
   */
  async uploadAndPrepare(
    file: Express.Multer.File,
    userId: string,
    title?: string,
  ): Promise<DefenseSession> {
    const userObjectId = new ObjectId(userId);

    // 1. Save document record
    const db = getDb();
    const docResult = await db.collection(DOCUMENTS_COLLECTION).insertOne({
      userId: userObjectId,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileType: "pdf",
      size: file.size,
      status: "processing",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const documentId = docResult.insertedId;

    // 2. Create defense session
    const sessionTitle = title || file.originalname.replace(/\.pdf$/i, "");
    const session = await ragService.createSession(
      userObjectId,
      documentId,
      sessionTitle,
    );

    // 3. Extract text from PDF
    const filePath = documentService.getFilePath(
      config.uploadDir,
      file.filename,
    );
    const extractedText = await documentService.extractFromPdf(filePath);

    // 4. Chunk text
    const chunks = embeddingService.chunkText(extractedText, 1000, 100);
    console.log(`📄 Document chunked into ${chunks.length} parts`);

    // 5. Generate embeddings
    console.log("🧠 Generating embeddings...");
    const embeddings = await embeddingService.embedTexts(chunks);

    // 6. Store in vector DB
    await vectorService.storeChunks(chunks, embeddings, {
      documentId,
      userId: userObjectId,
      sessionId: session._id!,
    });

    // 7. Update session and document status
    await ragService.updateSessionStatus(session._id!, "ready", chunks.length);
    await db
      .collection(DOCUMENTS_COLLECTION)
      .updateOne(
        { _id: documentId },
        { $set: { status: "completed", extractedText, updatedAt: new Date() } },
      );

    console.log(`✅ Defense session ready: ${session._id}`);
    return { ...session, status: "ready", totalChunks: chunks.length };
  },

  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<DefenseSession | null> {
    return ragService.getSession(new ObjectId(sessionId));
  },

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<DefenseSession[]> {
    return ragService.getUserSessions(new ObjectId(userId));
  },

  /**
   * Chat with the AI professor
   */
  async chat(
    sessionId: string,
    userMessage: string,
  ): Promise<{ response: string; retrievedContext: string[] }> {
    return ragService.chat(new ObjectId(sessionId), userMessage);
  },

  /**
   * Start the defense (get opening question)
   */
  async startDefense(sessionId: string): Promise<string> {
    return ragService.startDefense(new ObjectId(sessionId));
  },

  /**
   * Delete a session and its chunks
   */
  async deleteSession(sessionId: string): Promise<void> {
    const sessionObjectId = new ObjectId(sessionId);

    // Delete chunks
    await vectorService.deleteSessionChunks(sessionObjectId);

    // Delete session
    const db = getDb();
    await db.collection("defensesessions").deleteOne({ _id: sessionObjectId });
  },
};
