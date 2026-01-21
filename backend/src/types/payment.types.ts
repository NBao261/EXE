import { ObjectId } from "mongodb";

export type PaymentProvider = "momo" | "vnpay";
export type PaymentStatus = "pending" | "success" | "failed";

export interface Transaction {
  _id?: ObjectId;
  userId: ObjectId;
  provider: PaymentProvider;
  amount: number;
  currency: "VND";
  orderId: string; // Unique order ID sent to provider
  requestId?: string; // Extra ID for Momo
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any; // Store raw response from provider
}

export interface PaymentUrlRequest {
  provider: PaymentProvider;
}

export interface PaymentUrlResponse {
  success: boolean;
  message: string;
  data?: {
    paymentUrl: string;
  };
}

// Environment variables for payment
export interface PaymentConfig {
  momo: {
    partnerCode: string;
    accessKey: string;
    secretKey: string;
    requestType: string;
    redirectUrl: string;
    ipnUrl: string;
  };
  vnpay: {
    tmnCode: string;
    hashSecret: string;
    url: string;
    returnUrl: string;
  };
}
