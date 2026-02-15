import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Shield, CreditCard, Smartphone, Loader2 } from "lucide-react";
import { paymentService } from "../services/payment.service";
import { useAuthStore } from "../stores/authStore";
import { useLanguageStore } from "../stores/languageStore";
import Header from "../components/Header";

export default function UpgradePage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { language } = useLanguageStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (vi: string, en: string) => (language === "vi" ? vi : en);

  const handlePayment = async (provider: "momo" | "vnpay") => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const url = await paymentService.createPaymentUrl(provider, token);
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initiate payment",
      );
      setIsLoading(false);
    }
  };

  const benefits =
    language === "vi"
      ? [
          "Tải lên 100 tài liệu/ngày",
          "Tốc độ xử lý ưu tiên (Nhanh gấp 2 lần)",
          "Lưu trữ không giới hạn",
          "Tạo Quiz & Flashcard không giới hạn",
          "Hỗ trợ định dạng PDF, Word, PPTX",
          "Không có quảng cáo",
        ]
      : [
          "Upload 100 documents/day",
          "Priority processing (2x faster)",
          "Unlimited storage",
          "Unlimited Quiz & Flashcard creation",
          "PDF, Word, PPTX support",
          "No ads",
        ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header showBack title={t("Nâng cấp Premium", "Upgrade to Premium")} />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {t("Nâng cấp lên Premium", "Upgrade to Premium")}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t(
              "Mở khóa toàn bộ tính năng và không giới hạn lượt tải lên",
              "Unlock all features and unlimited uploads",
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Benefits Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              {t("Quyền lợi Premium", "Premium Benefits")}
            </h2>

            <ul className="space-y-4">
              {benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-slate-600 dark:text-slate-400">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-blue-100 dark:border-blue-900/50 shadow-lg relative overflow-hidden">
            <div className="text-center mb-8">
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                {t("Gói tháng", "Monthly plan")}
              </span>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                  30.000
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  đ / {t("tháng", "month")}
                </span>
              </div>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                {t(
                  "Thanh toán một lần, không tự động gia hạn",
                  "One-time payment, no auto-renewal",
                )}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {user?.plan === "premium" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {t("Bạn đang là Premium", "You are Premium")}
                  </h3>
                  {user.premiumExpiresAt && (
                    <p className="text-slate-600 dark:text-slate-400">
                      {t("Hết hạn:", "Expires:")}{" "}
                      {new Date(user.premiumExpiresAt).toLocaleDateString(
                        language === "vi" ? "vi-VN" : "en-US",
                      )}
                    </p>
                  )}
                  <div className="mt-6">
                    <button
                      onClick={() => navigate("/")}
                      className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                    >
                      {t("Quay về trang chủ", "Go to home")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handlePayment("momo")}
                    disabled={isLoading}
                    className="w-full py-4 px-6 rounded-xl bg-[#A50064] text-white font-semibold hover:bg-[#8d0056] transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <span>{t("Thanh toán MoMo", "Pay with MoMo")}</span>
                    </div>
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : null}
                  </button>

                  <button
                    onClick={() => handlePayment("vnpay")}
                    disabled={isLoading}
                    className="w-full py-4 px-6 rounded-xl bg-[#005BAA] text-white font-semibold hover:bg-[#004e91] transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span>{t("Thanh toán VNPay", "Pay with VNPay")}</span>
                    </div>
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : null}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
