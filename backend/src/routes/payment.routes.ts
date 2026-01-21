import { Router, RequestHandler } from "express";
import { paymentController } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Create Payment URL (Requires Auth)
router.post(
  "/create-url",
  authMiddleware,
  paymentController.createPaymentUrl as RequestHandler,
);

// VNPay Callbacks
router.get("/vnpay-return", paymentController.vnpayReturn as RequestHandler);
router.get("/vnpay-ipn", paymentController.vnpayIPN as RequestHandler);

// Momo Callbacks
router.get("/momo-return", paymentController.momoReturn as RequestHandler);
router.post("/momo-ipn", paymentController.momoIPN as RequestHandler);

export { router as paymentRouter };
