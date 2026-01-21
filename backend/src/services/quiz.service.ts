import { ObjectId } from "mongodb";
import { getDb } from "../config/database.js";
import { documentService } from "./document.service.js";
import { geminiService } from "./gemini.service.js";
import { config } from "../config/index.js";
import type {
  Document,
  Quiz,
  CreateDocumentInput,
} from "../types/document.types.js";

export const quizService = {
  /**
   * Create document record in database
   */
  async createDocument(input: CreateDocumentInput): Promise<Document> {
    const db = getDb();

    const doc: Document = {
      userId: new ObjectId(input.userId),
      filename: input.filename,
      originalName: input.originalName,
      mimeType: input.mimeType,
      fileType: this.getFileType(input.mimeType),
      size: input.size,
      status: "processing",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("documents").insertOne(doc);
    doc._id = result.insertedId;

    return doc;
  },

  /**
   * Get file type from mime type
   */
  getFileType(mimeType: string): "pdf" | "docx" | "pptx" {
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.includes("wordprocessingml")) return "docx";
    if (mimeType.includes("presentationml")) return "pptx";
    return "pdf";
  },

  /**
   * Process document and generate quiz
   */
  async processDocument(documentId: string): Promise<Quiz> {
    const db = getDb();
    const docId = new ObjectId(documentId);

    // Get document
    const doc = (await db
      .collection("documents")
      .findOne({ _id: docId })) as Document | null;
    if (!doc) {
      throw new Error("Document not found");
    }

    try {
      // Extract text from document
      const filePath = documentService.getFilePath(
        config.uploadDir,
        doc.filename,
      );
      const extractedText = await documentService.extractText(
        filePath,
        doc.fileType,
      );

      // Update document with extracted text
      await db.collection("documents").updateOne(
        { _id: docId },
        {
          $set: {
            extractedText,
            status: "processing",
            updatedAt: new Date(),
          },
        },
      );

      // Generate quiz with Gemini
      const generated =
        await geminiService.generateQuizAndFlashcards(extractedText);

      // Create quiz record
      const quiz: Quiz = {
        userId: doc.userId,
        documentId: docId,
        title: generated.title,
        questions: generated.questions,
        flashcards: generated.flashcards,
        createdAt: new Date(),
      };

      const quizResult = await db.collection("quizzes").insertOne(quiz);
      quiz._id = quizResult.insertedId;

      // Update document status
      await db
        .collection("documents")
        .updateOne(
          { _id: docId },
          { $set: { status: "completed", updatedAt: new Date() } },
        );

      return quiz;
    } catch (error) {
      // Update document status to failed
      await db.collection("documents").updateOne(
        { _id: docId },
        {
          $set: {
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
            updatedAt: new Date(),
          },
        },
      );
      throw error;
    }
  },

  /**
   * Process multiple documents and merge into one quiz
   */
  async processMultipleDocuments(documentIds: string[]): Promise<Quiz> {
    const db = getDb();

    // Get all documents
    const docs = await Promise.all(
      documentIds.map(async (id) => {
        const doc = await db
          .collection("documents")
          .findOne({ _id: new ObjectId(id) });
        return doc as Document | null;
      }),
    );

    // Filter out null docs
    const validDocs = docs.filter((d): d is Document => d !== null);
    if (validDocs.length === 0) {
      throw new Error("No valid documents found");
    }

    try {
      // Extract text from all documents and merge
      const allTexts: string[] = [];

      for (const doc of validDocs) {
        const filePath = documentService.getFilePath(
          config.uploadDir,
          doc.filename,
        );
        const extractedText = await documentService.extractText(
          filePath,
          doc.fileType,
        );
        allTexts.push(`\n\n=== ${doc.originalName} ===\n\n${extractedText}`);

        // Update document with extracted text
        await db.collection("documents").updateOne(
          { _id: doc._id },
          {
            $set: {
              extractedText,
              status: "processing",
              updatedAt: new Date(),
            },
          },
        );
      }

      // Merge all texts
      const mergedText = allTexts.join("\n");

      // Generate quiz with Gemini from merged content
      const generated =
        await geminiService.generateQuizAndFlashcards(mergedText);

      // Create quiz record (link to first document)
      const quiz: Quiz = {
        userId: validDocs[0].userId,
        documentId: validDocs[0]._id!,
        title: generated.title,
        questions: generated.questions,
        flashcards: generated.flashcards,
        createdAt: new Date(),
      };

      const quizResult = await db.collection("quizzes").insertOne(quiz);
      quiz._id = quizResult.insertedId;

      // Update all documents status to completed
      for (const doc of validDocs) {
        await db
          .collection("documents")
          .updateOne(
            { _id: doc._id },
            { $set: { status: "completed", updatedAt: new Date() } },
          );
      }

      return quiz;
    } catch (error) {
      // Update all documents status to failed
      for (const doc of validDocs) {
        await db.collection("documents").updateOne(
          { _id: doc._id },
          {
            $set: {
              status: "failed",
              errorMessage:
                error instanceof Error ? error.message : "Unknown error",
              updatedAt: new Date(),
            },
          },
        );
      }
      throw error;
    }
  },

  /**
   * Get user's documents
   */
  async getUserDocuments(userId: string): Promise<Document[]> {
    const db = getDb();
    return db
      .collection("documents")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray() as Promise<Document[]>;
  },

  /**
   * Get user's quizzes with pagination
   */
  async getUserQuizzes(
    userId: string,
    page: number = 1,
    limit: number = 5,
  ): Promise<{ quizzes: Quiz[]; total: number; hasMore: boolean }> {
    const db = getDb();
    const skip = (page - 1) * limit;

    const [quizzes, total] = await Promise.all([
      db
        .collection("quizzes")
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray() as Promise<Quiz[]>,
      db.collection("quizzes").countDocuments({ userId: new ObjectId(userId) }),
    ]);

    return {
      quizzes,
      total,
      hasMore: skip + quizzes.length < total,
    };
  },

  /**
   * Get quiz by ID
   */
  async getQuizById(quizId: string, userId: string): Promise<Quiz | null> {
    const db = getDb();
    return db.collection("quizzes").findOne({
      _id: new ObjectId(quizId),
      userId: new ObjectId(userId),
    }) as Promise<Quiz | null>;
  },

  /**
   * Update quiz title
   */
  async renameQuiz(
    quizId: string,
    userId: string,
    newTitle: string,
  ): Promise<Quiz | null> {
    const db = getDb();
    const result = await db.collection("quizzes").findOneAndUpdate(
      {
        _id: new ObjectId(quizId),
        userId: new ObjectId(userId),
      },
      {
        $set: { title: newTitle, updatedAt: new Date() },
      },
      { returnDocument: "after" },
    );
    return result as Quiz | null;
  },

  /**
   * Get document by ID
   */
  async getDocumentById(
    documentId: string,
    userId: string,
  ): Promise<Document | null> {
    const db = getDb();
    return db.collection("documents").findOne({
      _id: new ObjectId(documentId),
      userId: new ObjectId(userId),
    }) as Promise<Document | null>;
  },

  /**
   * Update quiz score after completion
   */
  async updateQuizScore(
    quizId: string,
    userId: string,
    score: number,
  ): Promise<Quiz | null> {
    const db = getDb();
    const result = await db.collection("quizzes").findOneAndUpdate(
      {
        _id: new ObjectId(quizId),
        userId: new ObjectId(userId),
      },
      {
        $set: {
          lastScore: Math.round(score),
          lastAttemptAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
    return result as Quiz | null;
  },
};
