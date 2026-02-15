import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Home, ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useLanguageStore } from "../stores/languageStore";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const { language } = useLanguageStore();
  const [isProcessing, setIsProcessing] = useState(true);

  const status = window.location.pathname.includes("success")
    ? "success"
    : "failed";
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (status === "success") {
      checkAuth();
      const timer = setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsProcessing(false);
    }
  }, [status, checkAuth]);

  const t = (vi: string, en: string) => (language === "vi" ? vi : en);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg text-center">
        {isProcessing ? (
          <div className="py-12">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t("Đang xử lý giao dịch...", "Processing transaction...")}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              {t("Vui lòng chờ trong giây lát", "Please wait a moment")}
            </p>
          </div>
        ) : (
          <>
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                status === "success"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {status === "success" ? (
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {status === "success"
                ? t("Thanh toán thành công!", "Payment successful!")
                : t("Thanh toán thất bại", "Payment failed")}
            </h1>

            <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm">
              {status === "success"
                ? t(
                    "Tài khoản đã được nâng cấp lên Premium.",
                    "Your account has been upgraded to Premium.",
                  )
                : t(
                    "Giao dịch không thành công. Vui lòng thử lại.",
                    "Transaction failed. Please try again.",
                  )}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/")}
                className={`w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  status === "success"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-slate-800 dark:bg-slate-600 text-white hover:bg-slate-900 dark:hover:bg-slate-500"
                }`}
              >
                {status === "success" ? (
                  <>
                    {t("Bắt đầu sử dụng Premium", "Start using Premium")}
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Home className="w-4 h-4" />
                    {t("Về trang chủ", "Go to home")}
                  </>
                )}
              </button>

              {status === "failed" && (
                <button
                  onClick={() => navigate("/upgrade")}
                  className="w-full py-3 px-6 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {t("Thử lại", "Try again")}
                </button>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
              {t("Mã giao dịch:", "Transaction ID:")} {orderId || "N/A"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
