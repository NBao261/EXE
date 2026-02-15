import { useState } from "react";
import { User, Lock, Save, Loader2, Key } from "lucide-react";
import Header from "../components/Header";
import { useAuthStore } from "../stores/authStore";
import { useLanguageStore } from "../stores/languageStore";
import { authService } from "../services/auth.service";

export default function ProfilePage() {
  const { user, token, checkAuth } = useAuthStore();
  const { language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const t = (vi: string, en: string) => (language === "vi" ? vi : en);

  const [name, setName] = useState(user?.name || "");
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setIsLoading(true);
      setMessage(null);
      await authService.updateProfile(name, token);
      await checkAuth();
      setMessage({
        type: "success",
        text: t("Cập nhật thông tin thành công", "Profile updated"),
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : t("Lỗi cập nhật", "Update error"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({
        type: "error",
        text: t("Mật khẩu xác nhận không khớp", "Passwords do not match"),
      });
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);
      await authService.changePassword(
        {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        },
        token,
      );
      setMessage({
        type: "success",
        text: t("Đổi mật khẩu thành công", "Password changed"),
      });
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : t("Lỗi đổi mật khẩu", "Password change error"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          {t("Cài đặt tài khoản", "Account Settings")}
        </h1>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 p-6">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("info")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === "info"
                    ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <User className="w-5 h-5" />
                {t("Thông tin chung", "General info")}
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === "password"
                    ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <Lock className="w-5 h-5" />
                {t("Đổi mật khẩu", "Change password")}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-8">
            {message && (
              <div
                className={`mb-6 p-4 rounded-xl text-sm ${
                  message.type === "success"
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            {activeTab === "info" ? (
              <form
                onSubmit={handleUpdateProfile}
                className="max-w-md space-y-6"
              >
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6">
                  {t("Thông tin cá nhân", "Personal Information")}
                </h2>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {t("Email không thể thay đổi", "Email cannot be changed")}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t("Họ và tên", "Full name")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-base"
                    required
                  />
                </div>

                <div className="pt-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t("Gói hiện tại:", "Current plan:")}
                    </span>
                    <span
                      className={`text-sm font-bold uppercase ${
                        user?.plan === "premium"
                          ? "text-amber-600"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {user?.plan || "Free"}
                    </span>
                  </div>
                  {user?.plan === "premium" && user?.premiumExpiresAt && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      {t("Hết hạn:", "Expires:")}{" "}
                      {new Date(user.premiumExpiresAt).toLocaleDateString(
                        language === "vi" ? "vi-VN" : "en-US",
                      )}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {t("Lưu thay đổi", "Save changes")}
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleChangePassword}
                className="max-w-md space-y-6"
              >
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6">
                  {t("Đổi mật khẩu", "Change password")}
                </h2>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t("Mật khẩu hiện tại", "Current password")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          oldPassword: e.target.value,
                        })
                      }
                      className="w-full pl-10 px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t("Mật khẩu mới", "New password")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full pl-10 px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t("Xác nhận mật khẩu mới", "Confirm new password")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full pl-10 px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {t("Đổi mật khẩu", "Change password")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
