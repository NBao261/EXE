import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, FileText, Mic, Loader2, ArrowLeft } from "lucide-react";
import { loginSchema, type LoginFormData } from "../validators/auth";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../stores/authStore";
import { useLanguageStore } from "../stores/languageStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, setLoading, isLoading } = useAuthStore();
  const { t } = useLanguageStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.login(data);
      setAuth(response.data.user, response.data.token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0F1115] transition-colors duration-300">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-[#0F1115]">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[140%] bg-gradient-to-br from-[#4AA9B3]/20 via-[#0F1115] to-[#7E57C2]/20 animate-blob opacity-60" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,rgba(126,87,194,0.15),transparent_60%)]" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white max-w-xl mx-auto w-full">
          <button
            onClick={() => navigate("/")}
            className="absolute top-8 left-8 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4AA9B3] to-[#7E57C2] flex items-center justify-center mb-8 shadow-lg shadow-[#4AA9B3]/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-5xl font-bold mb-6 tracking-tight font-[Quicksand]">
            <span className="bling-text">{t("common.brand")}</span>
          </h1>
          <p className="text-xl text-slate-300 mb-12 leading-relaxed">
            {t("login.brandDesc")}
          </p>

          <div className="space-y-4">
            <div className="glass-card !bg-white/5 !border-white/10 rounded-2xl p-5 hover:!border-[#4AA9B3]/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#4AA9B3]/20 flex items-center justify-center flex-shrink-0 text-[#4AA9B3]">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 font-[Quicksand]">
                    Smart Review
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {t("login.smartReviewDesc")}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card !bg-white/5 !border-white/10 rounded-2xl p-5 hover:!border-[#7E57C2]/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#7E57C2]/20 flex items-center justify-center flex-shrink-0 text-[#7E57C2]">
                  <Mic className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 font-[Quicksand]">
                    Mock Defense
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {t("login.mockDefenseDesc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div
            className="lg:hidden flex items-center gap-3 mb-10"
            onClick={() => navigate("/")}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4AA9B3] to-[#7E57C2] flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-[Quicksand]">
              {t("common.brand")}
            </span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 font-[Quicksand]">
              {t("login.title")}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              {t("login.subtitle")}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2.5 ml-1"
              >
                {t("login.email")}
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="input-base"
                placeholder="student@university.edu.vn"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-500 ml-1 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5 ml-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  {t("login.password")}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-[#4AA9B3] hover:text-[#3D8C94] transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                {...register("password")}
                className="input-base"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-500 ml-1 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("common.processing")}
                </>
              ) : (
                t("login.submit")
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-slate-600 dark:text-slate-400">
            {t("login.noAccount")}{" "}
            <Link
              to="/register"
              className="text-[#4AA9B3] hover:text-[#3D8C94] font-bold hover:underline transition-colors"
            >
              {t("login.registerNow")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
