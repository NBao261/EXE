import { Router } from "express";
import { healthController } from "../controllers/health.controller.js";
import { authRouter } from "./auth.routes.js";
import { smartReviewRouter } from "./smartreview.routes.js";
import { paymentRouter } from "./payment.routes.js";
import { defenseRouter } from "./defense.routes.js";

const router = Router();

// Health check
router.get("/health", healthController.check);

// Auth routes
router.use("/auth", authRouter);

// Smart Review routes (upload, documents, quizzes)
router.use("/smart-review", smartReviewRouter);

// Payment routes
router.use("/payment", paymentRouter);

// Mock Defense routes
router.use("/defense", defenseRouter);

export { router as apiRouter };
