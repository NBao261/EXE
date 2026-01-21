import { Request, Response } from "express";
import { paymentService } from "../services/payment.service.js";
import { QuotaRequest } from "../middlewares/quota.middleware.js";

export const paymentController = {
  /**
   * Create Payment URL
   */
  async createPaymentUrl(req: QuotaRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { provider } = req.body; // 'momo' | 'vnpay'
      const amount = 30000; // Fixed price for now

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      let url = "";
      if (provider === "momo") {
        url = await paymentService.createMomoUrl(userId, amount);
      } else if (provider === "vnpay") {
        const ipAddr =
          req.headers["x-forwarded-for"] ||
          req.socket.remoteAddress ||
          "127.0.0.1";
        url = await paymentService.createVNPayUrl(
          userId,
          amount,
          ipAddr as string,
        );
      } else {
        res.status(400).json({ success: false, message: "Invalid provider" });
        return;
      }

      res.json({ success: true, data: { paymentUrl: url } });
    } catch (error) {
      console.error("Create payment URL error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to create payment URL" });
    }
  },

  /**
   * VNPay Return Handler (Redirect to Frontend)
   */
  async vnpayReturn(req: Request, res: Response): Promise<void> {
    const vnp_Params = req.query;
    const isValid = paymentService.verifyVNPayChecksum(vnp_Params);

    // Check status
    // vnp_ResponseCode: 00 = success
    const isSuccess = isValid && vnp_Params["vnp_ResponseCode"] === "00";
    const orderId = vnp_Params["vnp_TxnRef"] as string;

    if (isSuccess) {
      // Logic handle success is actually done in IPN, but for return we can display success page immediately or check status
      // We should ideally call handlePaymentSuccess here just in case IPN is delayed,
      // but double check is handled by idempotency or status check.
      // For simplicity/robustness, we can try to update here too.
      await paymentService.handlePaymentSuccess(orderId);
      res.redirect(
        `${process.env.APP_URL || "http://localhost:3000"}/payment/success?orderId=${orderId}`,
      );
    } else {
      res.redirect(
        `${process.env.APP_URL || "http://localhost:3000"}/payment/failed?orderId=${orderId}`,
      );
    }
  },

  /**
   * VNPay IPN Handler (Server to Server)
   */
  async vnpayIPN(req: Request, res: Response): Promise<void> {
    const vnp_Params = req.query;
    const isValid = paymentService.verifyVNPayChecksum(vnp_Params);
    const orderId = vnp_Params["vnp_TxnRef"] as string;
    const rspCode = vnp_Params["vnp_ResponseCode"];

    if (!isValid) {
      res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
      return;
    }

    // Check order status in DB (omitted for brevity, assume transaction exists)

    if (rspCode === "00") {
      await paymentService.handlePaymentSuccess(orderId);
      res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
    } else {
      // Update transaction failed
      res.status(200).json({ RspCode: "00", Message: "Confirm Success" }); // Still return 00 to acknowledge receipt? Or should handle failed status update.
    }
  },

  /**
   * Momo IPN Handler
   */
  async momoIPN(req: Request, res: Response): Promise<void> {
    const data = req.body;

    // Verify signature
    const isValid = paymentService.verifyMomoIPN(data);
    if (!isValid) {
      // console.error("Momo signature failed");
      res.status(400).json({ message: "Invalid signature" });
      return; // Momo expects 204 or just 200 ok?
    }

    const { resultCode, orderId } = data;

    if (resultCode === 0) {
      await paymentService.handlePaymentSuccess(orderId);
    } // else handle failed

    res.status(204).send(); // Acknowledge
  },

  /**
   * Momo Return Handler (Redirect to Frontend)
   */
  async momoReturn(req: Request, res: Response): Promise<void> {
    const { resultCode, orderId } = req.query;
    if (Number(resultCode) === 0) {
      await paymentService.handlePaymentSuccess(orderId as string);
      res.redirect(
        `${process.env.APP_URL || "http://localhost:3000"}/payment/success?orderId=${orderId}`,
      );
    } else {
      res.redirect(
        `${process.env.APP_URL || "http://localhost:3000"}/payment/failed?orderId=${orderId}`,
      );
    }
  },
};
