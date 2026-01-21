import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { config } from "../config/index.js";

// Ensure upload directory exists
const uploadDir = config.uploadDir || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed file types
const ALLOWED_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
];

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".pptx"];

// Storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    ALLOWED_MIMES.includes(file.mimetype) &&
    ALLOWED_EXTENSIONS.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ hỗ trợ file PDF, Word (.docx) và PowerPoint (.pptx)"));
  }
};

// Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB default
  },
});

// Helper to get file type
export const getFileType = (mimetype: string): "pdf" | "docx" | "pptx" => {
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype.includes("wordprocessingml")) return "docx";
  if (mimetype.includes("presentationml")) return "pptx";
  return "pdf"; // fallback
};
