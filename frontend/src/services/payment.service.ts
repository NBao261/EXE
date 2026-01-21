import { API_URL } from "../config";
import { useAuthStore } from "../stores/authStore";

export interface PaymentUrlResponse {
  paymentUrl: string;
}

class PaymentService {
  private getHeaders(token: string | null) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async createPaymentUrl(
    provider: "momo" | "vnpay",
    token: string,
  ): Promise<string> {
    const response = await fetch(`${API_URL}/payment/create-url`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify({ provider }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create payment URL");
    }

    return data.data.paymentUrl;
  }
}

export const paymentService = new PaymentService();
