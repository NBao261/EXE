import { Response } from "express";
import type { QuotaRequest } from "../middlewares/quota.middleware.js";
import { defenseService } from "../services/defense.service.js";

export const defenseController = {
  /**
   * POST /api/defense/upload
   * Upload PDF for mock defense
   */
  async uploadDocument(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const file = req.file;
      const userId = req.user?.userId;
      const { title } = req.body;

      if (!file) {
        res.status(400).json({ success: false, message: "No file uploaded" });
        return;
      }

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Validate file type
      if (file.mimetype !== "application/pdf") {
        res.status(400).json({
          success: false,
          message: "Only PDF files are supported for Mock Defense",
        });
        return;
      }

      const session = await defenseService.uploadAndPrepare(
        file,
        userId,
        title,
      );

      res.status(201).json({
        success: true,
        message: "Document processed. Ready for defense!",
        data: { session },
      });
    } catch (error) {
      console.error("Defense upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process document",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * GET /api/defense/sessions
   * Get user's defense sessions
   */
  async getSessions(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const sessions = await defenseService.getUserSessions(userId);

      res.json({
        success: true,
        data: { sessions },
      });
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  /**
   * GET /api/defense/sessions/:id
   * Get specific session
   */
  async getSession(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const session = await defenseService.getSession(id);

      if (!session) {
        res.status(404).json({ success: false, message: "Session not found" });
        return;
      }

      // Verify ownership
      if (session.userId.toString() !== userId) {
        res.status(403).json({ success: false, message: "Forbidden" });
        return;
      }

      res.json({
        success: true,
        data: { session },
      });
    } catch (error) {
      console.error("Get session error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  /**
   * POST /api/defense/sessions/:id/start
   * Start the defense (get opening question from AI)
   */
  async startDefense(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const session = await defenseService.getSession(id);
      if (!session || session.userId.toString() !== userId) {
        res.status(404).json({ success: false, message: "Session not found" });
        return;
      }

      const openingQuestion = await defenseService.startDefense(id);

      res.json({
        success: true,
        data: {
          message: openingQuestion,
          sessionStatus: "in_progress",
        },
      });
    } catch (error) {
      console.error("Start defense error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to start defense",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * POST /api/defense/sessions/:id/chat
   * Send message and get AI response
   */
  async chat(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { message } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!message || typeof message !== "string") {
        res
          .status(400)
          .json({ success: false, message: "Message is required" });
        return;
      }

      const session = await defenseService.getSession(id);
      if (!session || session.userId.toString() !== userId) {
        res.status(404).json({ success: false, message: "Session not found" });
        return;
      }

      const result = await defenseService.chat(id, message);

      res.json({
        success: true,
        data: {
          response: result.response,
          // Only include context in dev mode for debugging
          ...(process.env.NODE_ENV === "development" && {
            retrievedContext: result.retrievedContext,
          }),
        },
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      });
    }
  },

  /**
   * DELETE /api/defense/sessions/:id
   * Delete a session
   */
  async deleteSession(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const session = await defenseService.getSession(id);
      if (!session || session.userId.toString() !== userId) {
        res.status(404).json({ success: false, message: "Session not found" });
        return;
      }

      await defenseService.deleteSession(id);

      res.json({
        success: true,
        message: "Session deleted",
      });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
};
