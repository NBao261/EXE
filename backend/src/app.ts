import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { config } from "./config/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { apiRouter } from "./routes/index.js";

const app = express();

// Security headers
app.use(helmet());

// Request logging
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

// Global rate limit: 100 requests per 15 minutes
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Quá nhiều request. Vui lòng thử lại sau.",
    },
  }),
);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = config.corsOrigin
        .split(",")
        .map((url) => url.trim().replace(/\/$/, ""));

      // Allow requests with no origin only in development (mobile apps, curl)
      if (!origin) {
        if (config.nodeEnv === "development") return callback(null, true);
        return callback(new Error("CORS: Origin required"));
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin} not allowed`));
      }
    },
    credentials: true,
  }),
);

// Body parsing with size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Routes
app.use("/api", apiRouter);

// Error handler
app.use(errorHandler);

export { app };
