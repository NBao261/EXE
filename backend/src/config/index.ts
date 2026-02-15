import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/exe_auth",
  jwtSecret:
    process.env.JWT_SECRET ||
    (() => {
      if (process.env.NODE_ENV === "production")
        throw new Error("JWT_SECRET is required in production");
      return "dev-only-secret-do-not-use-in-prod";
    })(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",

  // App URL for redirects
  appUrl: process.env.APP_URL || "http://localhost:5173",

  // Upload settings
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB

  // Quota settings
  freeUploadLimit: parseInt(process.env.FREE_UPLOAD_LIMIT || "3"),

  // Gemini AI
  geminiApiKey: process.env.GEMINI_API_KEY || "",
};
