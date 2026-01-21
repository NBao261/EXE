import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Shield, CreditCard, Smartphone, Loader2 } from 'lucide-react';
import { paymentService } from '../services/payment.service';
import { useAuthStore } from '../stores/authStore';
import Header from '../components/Header';

export default function UpgradePage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async (provider: 'momo' | 'vnpay') => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const url = await paymentService.createPaymentUrl(provider, token);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showBack title="Nâng cấp Premium" />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Nâng cấp lên Premium</h1>
          <p className="text-lg text-slate-600">Mở khóa toàn bộ tính năng và không giới hạn lượt tải lên</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Benefits Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Quyền lợi Premium
            </h2>
            
            <ul className="space-y-4">
              {[
                'Tải lên 100 tài liệu/ngày',
                'Tốc độ xử lý ưu tiên (Nhanh gấp 2 lần)',
                'Lưu trữ không giới hạn',
                'Tạo Quiz & Flashcard không giới hạn',
                'Hỗ trợ định dạng PDF, Word, PPTX',
                'Không có quảng cáo'
              ].map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-slate-600">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-3xl p-8 border-2 border-blue-100 shadow-xl shadow-blue-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="text-center mb-8">
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Gói tháng</span>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-slate-900">30.000</span>
                <span className="text-slate-500 font-medium">đ / tháng</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">Thanh toán một lần, không tự động gia hạn</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {user?.plan === 'premium' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Bạn đang là Premium</h3>
                  {user.premiumExpiresAt && (
                     <p className="text-slate-600">
                       Hết hạn: {new Date(user.premiumExpiresAt).toLocaleDateString('vi-VN')}
                     </p>
                  )}
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/')}
                      className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                    >
                      Quay về trang chủ
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handlePayment('momo')}
                    disabled={isLoading}
                    className="w-full py-4 px-6 rounded-xl bg-[#A50064] text-white font-semibold hover:bg-[#8d0056] transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <span>Thanh toán MoMo</span>
                    </div>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </button>

                  <button
                    onClick={() => handlePayment('vnpay')}
                    disabled={isLoading}
                    className="w-full py-4 px-6 rounded-xl bg-[#005BAA] text-white font-semibold hover:bg-[#004e91] transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span>Thanh toán VNPay</span>
                    </div>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </button>
                </>
              )}
            </div>

            {/* <p className="text-xs text-center text-slate-400 mt-6">
              Bảo mật thanh toán 100%. Hoàn tiền trong 3 ngày nếu không hài lòng.
            </p> */}
          </div>
        </div>
      </main>
    </div>
  );
}
