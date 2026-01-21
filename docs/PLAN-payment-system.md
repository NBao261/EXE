# Payment System Implementation Plan

## Goal

Implement a payment system to allow users to upgrade to **Premium** (30,000 VND/month) using **Momo** and **VNPay** (Sandbox).

---

## 1. Database Schema Changes

### [NEW] Transaction Model

Create a new collection `transactions` to store payment history.

```typescript
interface Transaction {
  _id: ObjectId;
  userId: ObjectId;
  provider: "momo" | "vnpay";
  amount: number;
  currency: "VND";
  orderId: string; // Unique order ID sent to provider
  requestId: string; // Extra ID for Momo
  status: "pending" | "success" | "failed";
  createdAt: Date;
  updatedAt: Date;
  metadata?: any; // Store raw response from provider
}
```

### [MODIFY] User Model

Update user schema to track premium status and expiration.

```typescript
interface User {
  // ... existing fields
  plan: "free" | "premium";
  premiumExpiresAt?: Date; // Null if free or expired
}
```

---

## 2. Backend Implementation

### Configuration

- Add environment variables for Momo and VNPay credentials.
  - `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`
  - `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`

### Services

- **`payment.service.ts`**:
  - `createMomoUrl(userId, amount)`: Generate redirect URL for Momo.
  - `createVNPayUrl(userId, amount)`: Generate redirect URL for VNPay.
  - `verifyMomoIPN(data)`: Verify signature and update transaction status.
  - `verifyVNPayIPN(data)`: Verify signature and update transaction status.
  - `handlePaymentSuccess(transactionId)`: Update user plan and expiration.

### Controllers & Routes

- `POST /api/payment/create-url`: Create payment URL (body: `{ provider: 'momo' | 'vnpay' }`).
- `GET /api/payment/vnpay-return`: Handle redirect from VNPay (Frontend redirect).
- `GET /api/payment/vnpay-ipn`: Server-to-server callback from VNPay.
- `POST /api/payment/momo-ipn`: Server-to-server callback from Momo.

---

## 3. Frontend Implementation

### [NEW] Upgrade Page (`/upgrade`)

- Display Premium benefits.
- Price: **30,000đ / month**.
- Payment method selection:
  - **Momo Wallet** (QR Code / App)
  - **VNPay** (ATM / QR / Banking)
- "Pay Now" button triggers API -> Redirects user.

### [NEW] Payment Result Pages

- `/payment/success`: Show success message, confetti, redirect button.
- `/payment/failed`: Show error, "Try Again" button.

### [MODIFY] App Logic

- Update `useAuthStore` or `quota.middleware` to check `premiumExpiresAt`.
- If expired, revert to 'free' logic (limit uploads).

---

## 4. VNPay Sandbox Guide (For User)

To get VNPay Sandbox credentials:

1. Register at [VNPay Sandbox for Devs](https://sandbox.vnpayment.vn/devreg/).
2. You will receive an email with:
   - **TmnCode** (Website Code)
   - **HashSecret** (Secure Secret)
   - **VnpUrl** (Testing URL: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`)
3. Use test cards provided by VNPay for testing.

---

## Task Breakdown

### Phase 1: Setup & Backend

- [ ] Add env vars and types for Payment/Transactions
- [ ] Implement `Transaction` model/service
- [ ] Implement `VNPayService` (URL creation + Checksum)
- [ ] Implement `MomoService` (URL creation + Signature)
- [ ] Create Payment Controller & Routes (IPN handling)

### Phase 2: Frontend Integration

- [ ] Create `UpgradePage` UI
- [ ] Implement Payment Method selection logic
- [ ] Create `PaymentResultPage` (Success/Fail)
- [ ] Update Quota/Plan logic to respect `premiumExpiresAt`

### Phase 3: Testing

- [ ] Test Momo Sandbox flow
- [ ] Test VNPay Sandbox flow
- [ ] Verify plan update after success
