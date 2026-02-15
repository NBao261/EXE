import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Strict rate limit for auth: 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều lần thử. Vui lòng đợi 15 phút.",
  },
});

// Public routes (with rate limiting)
router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);

// Protected routes
router.get("/me", authMiddleware, authController.me);
router.put("/profile", authMiddleware, authController.updateProfile);
router.put("/password", authMiddleware, authController.changePassword);

export { router as authRouter };
