import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { apiRouter } from "./routes/index.js";

const app = express();

// Middlewares
// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = config.corsOrigin
        .split(",")
        .map((url) => url.trim().replace(/\/$/, ""));

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // Optional: Allow Vercel preview deployments dynamically?
        // if (origin.endsWith('.vercel.app')) return callback(null, true);

        callback(new Error(`CORS blocked: ${origin} not to allowed`));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", apiRouter);

// Error handler
app.use(errorHandler);

export { app };
