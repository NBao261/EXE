import { Response } from "express";
import { ObjectId } from "mongodb";
import { quizService } from "../services/quiz.service.js";
import { getDb } from "../config/database.js";
import { config } from "../config/index.js";
import {
  incrementUploadCount,
  type QuotaRequest,
} from "../middlewares/quota.middleware.js";

export const uploadController = {
  /**
   * Upload single document and create quiz
   */
  async uploadDocument(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const file = req.file;
      const userId = req.user?.userId;

      if (!file) {
        res
          .status(400)
          .json({ success: false, message: "Không có file được upload" });
        return;
      }

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Create document record
      const document = await quizService.createDocument({
        userId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });

      // Increment upload count
      await incrementUploadCount(userId);

      // Process document and generate quiz (async)
      quizService
        .processDocument(document._id!.toString())
        .catch((err) => console.error("Document processing error:", err));

      res.status(201).json({
        success: true,
        message: "File uploaded successfully. Revo đang tạo quiz...",
        data: {
          document: {
            _id: document._id,
            originalName: document.originalName,
            fileType: document.fileType,
            status: document.status,
          },
          remainingUploads: req.userQuota?.remainingUploads
            ? req.userQuota.remainingUploads - 1
            : 0,
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Upload multiple documents and merge into one quiz
   */
  async uploadMultipleDocuments(
    req: QuotaRequest,
    res: Response,
  ): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      const userId = req.user?.userId;

      if (!files || files.length === 0) {
        res
          .status(400)
          .json({ success: false, message: "Không có file được upload" });
        return;
      }

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Create document records for all files
      const documents = await Promise.all(
        files.map((file) =>
          quizService.createDocument({
            userId,
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          }),
        ),
      );

      // Increment upload count (count as 1 upload for multiple files)
      await incrementUploadCount(userId);

      // Get document IDs
      const documentIds = documents.map((d) => d._id!.toString());

      // Process all documents and merge into one quiz (async)
      quizService
        .processMultipleDocuments(documentIds)
        .catch((err) => console.error("Document processing error:", err));

      res.status(201).json({
        success: true,
        message: `${files.length} files uploaded. Revo đang gộp và tạo quiz...`,
        data: {
          documents: documents.map((d) => ({
            _id: d._id,
            originalName: d.originalName,
            fileType: d.fileType,
            status: d.status,
          })),
          remainingUploads: req.userQuota?.remainingUploads
            ? req.userQuota.remainingUploads - 1
            : 0,
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Get user's documents
   */
  async getDocuments(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const documents = await quizService.getUserDocuments(userId);

      res.json({
        success: true,
        data: { documents },
      });
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  /**
   * Get document by ID
   */
  async getDocument(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const documentId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const document = await quizService.getDocumentById(documentId, userId);

      if (!document) {
        res.status(404).json({ success: false, message: "Document not found" });
        return;
      }

      res.json({
        success: true,
        data: { document },
      });
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  /**
   * Get user quota info - query directly from DB (no middleware needed)
   */
  async getQuota(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Query user directly from DB
      const db = getDb();
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });

      const plan = user?.plan || "free";
      const uploadCount = user?.uploadCount || 0;

      const FREE_LIMIT = 5;
      const PREMIUM_LIMIT = 100;
      const uploadLimit = plan === "premium" ? PREMIUM_LIMIT : FREE_LIMIT;

      const canUpload = uploadCount < uploadLimit;
      const remainingUploads = Math.max(0, uploadLimit - uploadCount);

      res.json({
        success: true,
        data: {
          plan,
          uploadCount,
          uploadLimit,
          remainingUploads,
          canUpload,
        },
      });
    } catch (error) {
      console.error("Get quota error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
};
