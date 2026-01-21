import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../config/database.js";
import { config } from "../config/index.js";
import type { JwtPayload } from "../types/auth.types.js";

// Extend Request with user and quota info
export interface QuotaRequest extends Request {
  user?: JwtPayload;
  userQuota?: {
    plan: "free" | "premium";
    uploadCount: number;
    uploadLimit: number;
    canUpload: boolean;
    remainingUploads: number;
  };
}

export const checkQuota = async (
  req: QuotaRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const db = getDb();
    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    let plan = user.plan || "free";

    // Check if premium expired
    if (
      plan === "premium" &&
      user.premiumExpiresAt &&
      new Date(user.premiumExpiresAt) < new Date()
    ) {
      plan = "free";
      await db
        .collection("users")
        .updateOne({ _id: new ObjectId(userId) }, { $set: { plan: "free" } });
    }

    let uploadCount = user.uploadCount || 0;
    const lastUploadDate = user.lastUploadDate
      ? new Date(user.lastUploadDate)
      : null;
    const today = new Date();

    // Premium Daily Reset Logic
    if (plan === "premium") {
      const isNewDay =
        !lastUploadDate ||
        lastUploadDate.toDateString() !== today.toDateString();

      if (isNewDay && uploadCount > 0) {
        await db
          .collection("users")
          .updateOne(
            { _id: new ObjectId(userId) },
            { $set: { uploadCount: 0 } },
          );
        uploadCount = 0;
      }
    }

    // Limits
    const FREE_LIMIT = 5;
    const PREMIUM_LIMIT = 100;
    const uploadLimit = plan === "premium" ? PREMIUM_LIMIT : FREE_LIMIT;

    const canUpload = uploadCount < uploadLimit;
    const remainingUploads = Math.max(0, uploadLimit - uploadCount);

    req.userQuota = {
      plan,
      uploadCount,
      uploadLimit,
      canUpload,
      remainingUploads,
    };

    // Block if quota exceeded
    if (!canUpload) {
      const msg =
        plan === "free"
          ? "Bạn đã dùng hết 5 lượt upload miễn phí trọn đời. Nâng cấp Premium để có 100 lượt/ngày!"
          : "Bạn đã đạt giới hạn 100 lượt upload hôm nay. Vui lòng quay lại vào ngày mai!";

      res.status(403).json({
        success: false,
        message: msg,
        data: {
          plan,
          uploadCount,
          uploadLimit,
          remainingUploads: 0,
        },
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Quota check error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Increment upload count after successful upload
export const incrementUploadCount = async (userId: string): Promise<void> => {
  const db = getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $inc: { uploadCount: 1 },
      $set: { updatedAt: new Date(), lastUploadDate: new Date() },
    },
  );
};
