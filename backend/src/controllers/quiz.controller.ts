import { Response } from "express";
import { quizService } from "../services/quiz.service.js";
import type { QuotaRequest } from "../middlewares/quota.middleware.js";

export const quizController = {
  /**
   * Get user's quizzes with pagination
   */
  async getQuizzes(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Parse pagination params
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;

      const { quizzes, total, hasMore } = await quizService.getUserQuizzes(
        userId,
        page,
        limit,
      );

      // Return simplified quiz list (without full questions)
      const quizList = quizzes.map((q) => ({
        _id: q._id,
        title: q.title,
        questionCount: q.questions.length,
        flashcardCount: q.flashcards.length,
        lastScore: q.lastScore,
        createdAt: q.createdAt,
      }));

      res.json({
        success: true,
        data: {
          quizzes: quizList,
          total,
          hasMore,
          page,
          limit,
        },
      });
    } catch (error) {
      console.error("Get quizzes error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  /**
   * Get quiz by ID with full questions
   */
  async getQuiz(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const quizId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const quiz = await quizService.getQuizById(quizId, userId);

      if (!quiz) {
        res.status(404).json({ success: false, message: "Quiz not found" });
        return;
      }

      res.json({
        success: true,
        data: { quiz },
      });
    } catch (error) {
      console.error("Get quiz error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  /**
   * Update quiz (rename)
   */
  async updateQuiz(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const quizId = req.params.id as string;
      const { title } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!title || typeof title !== "string" || title.trim().length === 0) {
        res.status(400).json({ success: false, message: "Title is required" });
        return;
      }

      const quiz = await quizService.renameQuiz(quizId, userId, title.trim());

      if (!quiz) {
        res.status(404).json({ success: false, message: "Quiz not found" });
        return;
      }

      res.json({
        success: true,
        message: "Quiz renamed successfully",
        data: {
          quiz: {
            _id: quiz._id,
            title: quiz.title,
          },
        },
      });
    } catch (error) {
      console.error("Update quiz error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  /**
   * Regenerate quiz from document
   */
  async regenerateQuiz(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const documentId = req.params.documentId as string;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Verify document belongs to user
      const document = await quizService.getDocumentById(documentId, userId);
      if (!document) {
        res.status(404).json({ success: false, message: "Document not found" });
        return;
      }

      // Regenerate quiz
      const quiz = await quizService.processDocument(documentId);

      res.json({
        success: true,
        message: "Quiz regenerated successfully",
        data: { quiz },
      });
    } catch (error) {
      console.error("Regenerate quiz error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to regenerate quiz",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Update quiz score after completion
   */
  async updateScore(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const quizId = req.params.id as string;
      const { score } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (typeof score !== "number" || score < 0 || score > 100) {
        res
          .status(400)
          .json({ success: false, message: "Invalid score (0-100)" });
        return;
      }

      const quiz = await quizService.updateQuizScore(quizId, userId, score);

      if (!quiz) {
        res.status(404).json({ success: false, message: "Quiz not found" });
        return;
      }

      res.json({
        success: true,
        message: "Score updated",
        data: { lastScore: quiz.lastScore },
      });
    } catch (error) {
      console.error("Update score error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  /**
   * Delete quiz permanently (hard delete)
   */
  async deleteQuiz(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const quizId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const deleted = await quizService.deleteQuiz(quizId, userId);

      if (!deleted) {
        res.status(404).json({ success: false, message: "Quiz not found" });
        return;
      }

      res.json({
        success: true,
        message: "Quiz deleted successfully",
      });
    } catch (error) {
      console.error("Delete quiz error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
};
