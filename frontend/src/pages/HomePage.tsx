import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  FileText,
  Mic,
  Upload,
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useLanguageStore } from "../stores/languageStore";
import Header from "../components/Header";

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1115] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-[#4AA9B3]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-[#7E57C2]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-[#FFD54F]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

        <div className="w-full max-w-md bg-white/80 dark:bg-[#1A1D24]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 p-8 text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4AA9B3] to-[#7E57C2] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#4AA9B3]/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 font-[Quicksand]">
            {t("home.welcome")}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            {t("home.welcomeDesc")}
          </p>

          <div className="space-y-4">
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3.5 px-6 rounded-2xl btn-primary text-white font-bold shadow-lg shadow-[#4AA9B3]/20"
            >
              {t("home.loginBtn")}
            </button>
            <button
              onClick={() => navigate("/register")}
              className="w-full py-3.5 px-6 rounded-2xl bg-white dark:bg-transparent text-[#4AA9B3] dark:text-[#4AA9B3] font-bold border-2 border-[#4AA9B3] hover:bg-[#4AA9B3]/5 dark:hover:bg-[#4AA9B3]/10 transition-all"
            >
              {t("home.createAccountBtn")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115] relative overflow-hidden transition-colors duration-300">
      {/* Background Blobs - Fixed Position */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#4AA9B3]/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob opacity-50 dark:opacity-20" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#7E57C2]/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000 opacity-50 dark:opacity-20" />
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-[#FFD54F]/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000 opacity-50 dark:opacity-10" />
      </div>

      <Header />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Welcome Section */}
        <div className="text-center mb-16 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 mb-6 shadow-sm">
            <Sparkles className="w-5 h-5 text-[#FFD54F]" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("home.greeting")}{" "}
              <span className="text-[#4AA9B3] font-bold">{user?.name}</span>!
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 font-[Quicksand] leading-tight">
            <span className="bling-text">{t("home.chooseFeature")}</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Khám phá các công cụ hỗ trợ thông minh giúp bạn ôn tập và chuẩn bị
            tốt nhất cho kỳ thi.
          </p>
        </div>

        {/* 2 Main Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 relative z-10">
          {/* Smart Review Card */}
          <div
            onClick={() => navigate("/smart-review")}
            className="group glass-card rounded-3xl p-10 hover:border-[#4AA9B3]/50 dark:hover:border-[#4AA9B3]/50 transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
              <FileText className="w-40 h-40 text-[#4AA9B3]" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4AA9B3] to-[#3D8C94] flex items-center justify-center shadow-lg shadow-[#4AA9B3]/30 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <span className="px-4 py-1.5 rounded-full bg-[#4AA9B3]/10 text-[#4AA9B3] text-sm font-bold border border-[#4AA9B3]/20">
                  {t("home.smartReviewBadge")}
                </span>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 font-[Quicksand]">
                {t("home.smartReview")}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed text-lg">
                {t("home.smartReviewDesc")}
              </p>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 group-hover:border-[#4AA9B3]/50 transition-colors mb-8">
                <Upload className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-[#4AA9B3]" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                  {t("home.uploadHint")}
                </span>
              </div>

              <button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#4AA9B3] to-[#3D8C94] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#4AA9B3]/20 group-hover:shadow-xl group-hover:shadow-[#4AA9B3]/30 group-hover:-translate-y-1 transition-all">
                {t("home.startReview")}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mock Defense Card */}
          <div
            onClick={() => navigate("/mock-defense")}
            className="group glass-card rounded-3xl p-10 hover:border-[#7E57C2]/50 dark:hover:border-[#7E57C2]/50 transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
              <Mic className="w-40 h-40 text-[#7E57C2]" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7E57C2] to-[#6747A0] flex items-center justify-center shadow-lg shadow-[#7E57C2]/30 group-hover:scale-110 transition-transform duration-300">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <span className="px-4 py-1.5 rounded-full bg-[#7E57C2]/10 text-[#7E57C2] text-sm font-bold border border-[#7E57C2]/20">
                  {t("home.mockDefenseBadge")}
                </span>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 font-[Quicksand]">
                {t("home.mockDefense")}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed text-lg">
                {t("home.mockDefenseDesc")}
              </p>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 group-hover:border-[#7E57C2]/50 transition-colors mb-8">
                <Upload className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-[#7E57C2]" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                  {t("home.uploadReportHint")}
                </span>
              </div>

              <button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#7E57C2] to-[#6747A0] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#7E57C2]/20 group-hover:shadow-xl group-hover:shadow-[#7E57C2]/30 group-hover:-translate-y-1 transition-all">
                {t("home.startMockDefense")}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        {/* <div className="relative z-10 glass-card rounded-3xl p-8 border-l-8 border-l-[#FFD54F]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-[#FFD54F]/20 text-[#FFD54F]">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-[Quicksand]">
                  {t("home.tip")}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {t("home.tipDesc")}
                </p>
              </div>
            </div>
            <button className="flex-shrink-0 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              {t("home.viewGuide")}
            </button>
          </div>
        </div> */}
      </main>
    </div>
  );
}
