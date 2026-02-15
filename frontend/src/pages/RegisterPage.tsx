import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  FileText,
  Mic,
  Users,
  Star,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { registerSchema, type RegisterFormData } from "../validators/auth";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../stores/authStore";
import { useLanguageStore } from "../stores/languageStore";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setLoading, isLoading } = useAuthStore();
  const { t } = useLanguageStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      setLoading(true);
      await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("register.failed"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0F1115] p-6 relative overflow-hidden">
        {/* Confetti/Success blobs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-400/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4AA9B3]/20 rounded-full blur-3xl animate-blob animation-delay-2000" />

        <div className="w-full max-w-md text-center relative z-10 glass-card p-10 rounded-3xl">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/10">
            <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 font-[Quicksand]">
            {t("register.success")}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {t("register.redirecting")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0F1115] transition-colors duration-300">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-[#0F1115]">
        {/* Background Gradients */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[140%] bg-gradient-to-tl from-[#7E57C2]/20 via-[#0F1115] to-[#4AA9B3]/20 animate-blob opacity-60" />

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
          <p className="text-xl text-slate-300 mb-10 leading-relaxed">
            {t("register.brandDesc")}
          </p>

          {/* Stats */}
          <div className="flex gap-8 mb-10">
            <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-2 border border-white/10">
              <Users className="w-5 h-5 text-[#4AA9B3]" />
              <span className="text-white/90 font-medium">10,000+ users</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-2 border border-white/10">
              <Star className="w-5 h-5 text-[#FFD54F]" />
              <span className="text-white/90 font-medium">4.9/5 rating</span>
            </div>
          </div>

          {/* Features */}
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
                    {t("register.smartReviewShort")}
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
                    {t("register.mockDefenseShort")}
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
              {t("register.title")}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              {t("register.subtitle")}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2.5 ml-1"
              >
                {t("register.name")}
              </label>
              <input
                id="name"
                type="text"
                {...register("name")}
                className="input-base"
                placeholder={t("register.namePlaceholder")}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-500 ml-1 font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2.5 ml-1"
              >
                {t("register.email")}
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
              <label
                htmlFor="password"
                className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2.5 ml-1"
              >
                {t("register.password")}
              </label>
              <input
                id="password"
                type="password"
                {...register("password")}
                className="input-base"
                placeholder={t("register.passwordPlaceholder")}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-500 ml-1 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2.5 ml-1"
              >
                {t("register.confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                className="input-base"
                placeholder={t("register.confirmPasswordPlaceholder")}
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-500 ml-1 font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("common.processing")}
                </>
              ) : (
                t("register.submit")
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-slate-600 dark:text-slate-400">
            {t("register.hasAccount")}{" "}
            <Link
              to="/login"
              className="text-[#4AA9B3] hover:text-[#3D8C94] font-bold hover:underline transition-colors"
            >
              {t("register.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
