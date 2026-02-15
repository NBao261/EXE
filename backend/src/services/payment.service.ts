import crypto from "crypto";
import { format } from "date-fns";
import { ObjectId } from "mongodb";
import { getDb } from "../config/database.js";
import {
  Transaction,
  PaymentProvider,
  PaymentStatus,
  PaymentConfig,
} from "../types/payment.types.js";
import { User } from "../types/auth.types.js";

const config: PaymentConfig = {
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE || "",
    accessKey: process.env.MOMO_ACCESS_KEY || "",
    secretKey: process.env.MOMO_SECRET_KEY || "",
    requestType: "captureWallet",
    redirectUrl: `${process.env.API_URL || "http://localhost:5173"}/api/payment/momo-return`,
    ipnUrl: `${process.env.API_URL || "http://localhost:3000"}/api/payment/momo-ipn`,
  },
  vnpay: {
    tmnCode: process.env.VNP_TMN_CODE || "",
    hashSecret: process.env.VNP_HASH_SECRET || "",
    url:
      process.env.VNP_URL ||
      "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: `${process.env.API_URL || "http://localhost:5173"}/api/payment/vnpay-return`,
  },
};

export const paymentService = {
  /**
   * Create transaction record
   */
  async createTransaction(
    userId: string,
    provider: PaymentProvider,
    amount: number,
    orderId: string,
  ): Promise<Transaction> {
    const db = getDb();
    const transaction: Transaction = {
      userId: new ObjectId(userId),
      provider,
      amount,
      currency: "VND",
      orderId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("transactions").insertOne(transaction);
    return transaction;
  },

  /**
   * Create VNPay Payment URL
   */
  async createVNPayUrl(
    userId: string,
    amount: number,
    ipAddr: string = "127.0.0.1",
  ): Promise<string> {
    const orderId =
      format(new Date(), "yyyyMMddHHmmss") + "_" + userId.slice(-4);

    await this.createTransaction(userId, "vnpay", amount, orderId);

    const createDate = format(new Date(), "yyyyMMddHHmmss");
    const tmnCode = config.vnpay.tmnCode;
    const secretKey = config.vnpay.hashSecret;
    let vnpUrl = config.vnpay.url;
    const returnUrl = config.vnpay.returnUrl;

    const vnp_Params: any = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = `Thanh toan don hang ${orderId}`;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100; // VNPay amount is in dong * 100
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    // Ensure IPv4 for VNPay
    vnp_Params["vnp_IpAddr"] =
      ipAddr && ipAddr.includes(":") ? "127.0.0.1" : ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;

    // Strict Request Signing (VNPay Standard)
    // 1. Sort parameter keys
    const sortedKeys = Object.keys(vnp_Params).sort();

    // 2. Build signing string (key=value&...) with spaces encoded as '+'
    const signData = sortedKeys
      .map((key) => {
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(
          String(vnp_Params[key]),
        ).replace(/%20/g, "+");
        return `${encodedKey}=${encodedValue}`;
      })
      .join("&");

    // 3. Create HMAC signature
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // 4. Create final URL
    // Append signature
    // vnpUrl query params should be the signData + vnp_SecureHash
    // (Since signData is already encoded correctly for URL)
    vnpUrl += "?" + signData + "&vnp_SecureHash=" + signed;

    return vnpUrl;
  },

  /**
   * Create Momo Payment URL
   */
  async createMomoUrl(userId: string, amount: number): Promise<string> {
    const orderId =
      format(new Date(), "yyyyMMddHHmmss") + "_" + userId.slice(-4);
    const requestId = orderId;

    await this.createTransaction(userId, "momo", amount, orderId);

    const {
      partnerCode,
      accessKey,
      secretKey,
      requestType,
      redirectUrl,
      ipnUrl,
    } = config.momo;
    const orderInfo = "Thanh toan Premium";
    const extraData = ""; // Base64 encoded if needed

    // Signature creation usually: accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = JSON.stringify({
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      resultCode: 200,
      message: "",
      extraData,
      requestType,
      signature,
      lang: "vi",
    });

    try {
      const response = await fetch(
        "https://test-payment.momo.vn/v2/gateway/api/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestBody,
        },
      );

      const data: any = await response.json();
      if (data.resultCode === 0) {
        return data.payUrl;
      } else {
        throw new Error(data.message || "Momo URL creation failed");
      }
    } catch (error) {
      console.error("Momo Error:", error);
      throw new Error("Failed to create Momo payment URL");
    }
  },

  /**
   * Verify Momo IPN Signature
   */
  verifyMomoIPN(data: any): boolean {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = data;
    const accessKey = config.momo.accessKey;
    const secretKey = config.momo.secretKey;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const generatedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(generatedSignature),
      );
    } catch {
      return false;
    }
  },

  /**
   * Verify VNPay Return/IPN
   */
  verifyVNPayChecksum(vnp_Params: any): boolean {
    const secureHash = vnp_Params["vnp_SecureHash"];
    const vnp_Params_Copy = { ...vnp_Params };
    delete vnp_Params_Copy["vnp_SecureHash"];
    delete vnp_Params_Copy["vnp_SecureHashType"];

    const secretKey = config.vnpay.hashSecret;

    // Strict Request Signing (VNPay Standard)
    const sortedKeys = Object.keys(vnp_Params_Copy).sort();

    const signData = sortedKeys
      .map((key) => {
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(
          String(vnp_Params_Copy[key]),
        ).replace(/%20/g, "+");
        return `${encodedKey}=${encodedValue}`;
      })
      .join("&");

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(secureHash),
        Buffer.from(signed),
      );
    } catch {
      return false;
    }
  },

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(
    orderId: string,
    transactionId?: string,
  ): Promise<User | null> {
    const db = getDb();

    // Update transaction status
    const updateResult = await db
      .collection("transactions")
      .findOneAndUpdate(
        { orderId: orderId },
        { $set: { status: "success", updatedAt: new Date() } },
        { returnDocument: "after" },
      );

    if (!updateResult) return null;
    const transaction = updateResult as unknown as Transaction;

    // Update user plan
    const premiumDays = 30; // 1 month
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + premiumDays);

    const userUpdate = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(transaction.userId) },
      {
        $set: {
          plan: "premium",
          premiumExpiresAt: expiresAt,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    return userUpdate as unknown as User;
  },
};
