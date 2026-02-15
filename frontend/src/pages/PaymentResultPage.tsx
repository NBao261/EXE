import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Home, ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "../stores/authStore";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(true);

  const status = window.location.pathname.includes("success")
    ? "success"
    : "failed";
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (status === "success") {
      // Refresh user profile to get premium status
      checkAuth();

      // Simulate checking transaction or waiting for IPN
      const timer = setTimeout(async () => {
        setIsProcessing(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsProcessing(false);
    }
  }, [status, checkAuth]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
        {isProcessing ? (
          <div className="py-12">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900">
              Đang xử lý giao dịch...
            </h2>
            <p className="text-slate-500">Vui lòng chờ trong giây lát</p>
          </div>
        ) : (
          <>
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                status === "success" ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {status === "success" ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {status === "success"
                ? "Thanh toán thành công!"
                : "Thanh toán thất bại"}
            </h1>

            <p className="text-slate-600 mb-8">
              {status === "success"
                ? "Tài khoản của bạn đã được nâng cấp lên Premium. Cảm ơn bạn đã tin tưởng Revo."
                : "Giao dịch không thành công hoặc đã bị hủy. Vui lòng thử lại."}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/")}
                className={`w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  status === "success"
                    ? "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/30"
                    : "bg-slate-800 text-white hover:bg-slate-900"
                }`}
              >
                {status === "success" ? (
                  <>
                    Bắt đầu sử dụng Premium
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Home className="w-4 h-4" />
                    Về trang chủ
                  </>
                )}
              </button>

              {status === "failed" && (
                <button
                  onClick={() => navigate("/upgrade")}
                  className="w-full py-3 px-6 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  Thử lại
                </button>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-400">
              Mã giao dịch: {orderId || "N/A"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
