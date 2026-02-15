import { useNavigate } from 'react-router-dom';
import { GraduationCap, FileText, Mic, Upload, Sparkles, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import Header from '../components/Header';

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Chào mừng đến EduAI Pro</h1>
          <p className="text-slate-600 mb-8">Nền tảng ôn thi và luyện tập bảo vệ đồ án với AI</p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-6 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => navigate('/register')}
              className="w-full py-3 px-6 rounded-xl bg-white text-blue-600 font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Tạo tài khoản miễn phí
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Xin chào, {user?.name}!
          </h1>
          <p className="text-slate-600">Chọn tính năng bạn muốn sử dụng</p>
        </div>

        {/* 2 Main Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Smart Review Card */}
          <div 
            onClick={() => navigate('/smart-review')}
            className="group bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-cyan-400 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-Powered
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Smart Review</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Upload Slide, PDF, Word → AI tự động tạo <span className="font-semibold text-cyan-600">Quiz</span> và <span className="font-semibold text-cyan-600">Flashcard</span> giúp bạn ôn thi hiệu quả
              </p>

              {/* Upload hint */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 group-hover:border-cyan-300 transition-colors">
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-cyan-500" />
                <span className="text-sm text-slate-500 group-hover:text-slate-700">Kéo thả hoặc chọn file tài liệu</span>
              </div>

              <button className="mt-6 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                Bắt đầu ôn thi
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mock Defense Card */}
          <div 
            onClick={() => navigate('/mock-defense')}
            className="group bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-purple-400 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Mic className="w-7 h-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Voice AI
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Mock Defense</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Upload báo cáo → AI đóng vai <span className="font-semibold text-purple-600">hội đồng phản biện</span> bằng giọng nói, giúp bạn tự tin bảo vệ đồ án
              </p>

              {/* Upload hint */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 group-hover:border-purple-300 transition-colors">
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-purple-500" />
                <span className="text-sm text-slate-500 group-hover:text-slate-700">Kéo thả hoặc chọn file báo cáo</span>
              </div>

              <button className="mt-6 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-all">
                Bắt đầu thi thử
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold mb-1">Mẹo: Chuẩn bị tốt hơn với AI</h3>
              <p className="text-blue-100 text-sm">Upload tài liệu chi tiết để AI tạo câu hỏi sát với nội dung học của bạn</p>
            </div>
            <button className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white text-blue-600 font-semibold hover:bg-blue-50 transition-colors">
              Xem hướng dẫn
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
