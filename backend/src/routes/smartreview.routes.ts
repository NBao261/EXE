import { Router, RequestHandler } from "express";
import { uploadController } from "../controllers/upload.controller.js";
import { quizController } from "../controllers/quiz.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkQuota } from "../middlewares/quota.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Upload routes - single file
router.post(
  "/upload",
  checkQuota as RequestHandler,
  upload.single("file"),
  uploadController.uploadDocument as RequestHandler,
);

// Upload routes - multiple files (merge into one quiz)
router.post(
  "/upload-multiple",
  checkQuota as RequestHandler,
  upload.array("files", 10), // max 10 files
  uploadController.uploadMultipleDocuments as RequestHandler,
);

// Document routes
router.get("/documents", uploadController.getDocuments as RequestHandler);
router.get("/documents/:id", uploadController.getDocument as RequestHandler);

// Quiz routes
router.get("/quizzes", quizController.getQuizzes as RequestHandler);
router.get("/quizzes/:id", quizController.getQuiz as RequestHandler);
router.patch("/quizzes/:id", quizController.updateQuiz as RequestHandler);
router.patch(
  "/quizzes/:id/score",
  quizController.updateScore as RequestHandler,
);
router.post(
  "/documents/:documentId/regenerate",
  quizController.regenerateQuiz as RequestHandler,
);

// Quota route - no quota check needed here, just return info
router.get("/user/quota", uploadController.getQuota as RequestHandler);

export { router as smartReviewRouter };
