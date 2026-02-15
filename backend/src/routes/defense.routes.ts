import { Router } from "express";
import multer from "multer";
import path from "path";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { defenseController } from "../controllers/defense.controller.js";
import { config } from "../config/index.js";

const router = Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `defense-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for thesis PDFs
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// All routes require authentication
router.use(authMiddleware);

// Upload PDF for mock defense
router.post("/upload", upload.single("file"), defenseController.uploadDocument);

// Get all user's defense sessions
router.get("/sessions", defenseController.getSessions);

// Get specific session
router.get("/sessions/:id", defenseController.getSession);

// Start defense (get opening question)
router.post("/sessions/:id/start", defenseController.startDefense);

// Chat with AI professor
router.post("/sessions/:id/chat", defenseController.chat);

// Delete session
router.delete("/sessions/:id", defenseController.deleteSession);

export { router as defenseRouter };
