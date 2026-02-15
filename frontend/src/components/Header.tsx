import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useLanguageStore } from "../stores/languageStore";
import { useThemeStore } from "../stores/themeStore";
import {
  LogOut,
  User,
  Globe,
  ChevronDown,
  Moon,
  Sun,
  Menu,
  X,
  Zap,
} from "lucide-react";
import type { UserQuota } from "../types/smartreview";

interface HeaderProps {
  quota?: UserQuota | null;
}

export default function Header({ quota }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { language, setLanguage, t } = useLanguageStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useThemeStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setIsLangOpen(false);
      setIsProfileOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { name: t("home.nav.features"), path: "/smart-review" },
    { name: t("home.nav.testimonials"), path: "/mock-defense" }, // Using mock-defense as testimonials placeholder or rename key later
    { name: t("home.nav.pricing"), path: "/upgrade" },
  ];

  return (
    <>
      <header
        className={`fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 dark:bg-[#1a1d24]/90 backdrop-blur-md shadow-lg"
            : "bg-white/80 dark:bg-[#1a1d24]/80 backdrop-blur-sm shadow-md"
        } rounded-full border border-white/20 dark:border-white/5 py-3 px-6`}
      >
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4AA9B3] to-[#7E57C2] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <span className="font-bold text-lg font-[Quicksand]">R</span>
            </div>
            <span className="text-2xl font-bold bling-text font-[Quicksand] hidden sm:block">
              {t("common.brand")}
            </span>
          </Link>

          {/* Desktop Navigation - Centered (Milingo style) */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/smart-review"
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                location.pathname === "/smart-review"
                  ? "bg-[#4AA9B3]/10 text-[#4AA9B3] dark:bg-[#4AA9B3]/20 dark:text-[#4AA9B3]"
                  : "text-slate-600 dark:text-slate-300 hover:text-[#4AA9B3] dark:hover:text-[#4AA9B3]"
              }`}
            >
              Tạo Quiz/FlashCard
            </Link>
            <Link
              to="/mock-defense"
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                location.pathname === "/mock-defense"
                  ? "bg-[#4AA9B3]/10 text-[#4AA9B3] dark:bg-[#4AA9B3]/20 dark:text-[#4AA9B3]"
                  : "text-slate-600 dark:text-slate-300 hover:text-[#4AA9B3] dark:hover:text-[#4AA9B3]"
              }`}
            >
              Phòng đồ án ảo
            </Link>
            <Link
              to="/upgrade"
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                location.pathname === "/upgrade"
                  ? "bg-[#4AA9B3]/10 text-[#4AA9B3] dark:bg-[#4AA9B3]/20 dark:text-[#4AA9B3]"
                  : "text-slate-600 dark:text-slate-300 hover:text-[#4AA9B3] dark:hover:text-[#4AA9B3]"
              }`}
            >
              Nâng cấp Premium
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTheme();
              }}
              className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLangOpen(!isLangOpen);
                  setIsProfileOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">
                  {language === "vi" ? "VN" : "EN"}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${isLangOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isLangOpen && (
                <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-[#1a1d24] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => setLanguage("vi")}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                      language === "vi"
                        ? "text-[#4AA9B3]"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                      language === "en"
                        ? "text-[#4AA9B3]"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    English
                  </button>
                </div>
              )}
            </div>

            {/* User Profile or Login Button */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileOpen(!isProfileOpen);
                    setIsLangOpen(false);
                  }}
                  className="flex items-center gap-3 pl-1 pr-1 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4AA9B3] to-[#7E57C2] flex items-center justify-center text-white font-bold shadow-md">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-[#1a1d24] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 animate-in fade-in zoom-in-95 duration-200">
                    {/* User Info */}
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4AA9B3] to-[#7E57C2] flex items-center justify-center text-white text-xl font-bold shadow-md">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-white truncate">
                          {user?.name}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Quota Info (if available) */}
                    {quota && (
                      <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">
                            {t("smartReview.upgradeBtn")}
                          </span>
                          <span className="text-xs font-bold text-[#4AA9B3] bg-[#4AA9B3]/10 px-2 py-0.5 rounded-full">
                            {user?.role === "premium" ? "Premium" : "Free"}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-2">
                          <div
                            className="bg-gradient-to-r from-[#4AA9B3] to-[#7E57C2] h-1.5 rounded-full"
                            style={{
                              width: `${Math.min((quota.totalDocuments / (user?.role === "premium" ? 100 : 5)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 text-right">
                          {quota.remainingUploads} uploads left
                        </p>
                      </div>
                    )}

                    {/* Menu Items */}
                    <div className="space-y-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors group"
                      >
                        <User className="w-5 h-5 group-hover:text-[#4AA9B3]" />
                        <span className="font-medium group-hover:text-slate-900 dark:group-hover:text-white">
                          Profile
                        </span>
                      </Link>
                      <Link
                        to="/upgrade"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors group"
                      >
                        <Zap className="w-5 h-5 text-amber-500" />
                        <span className="font-medium group-hover:text-slate-900 dark:group-hover:text-white">
                          Upgrade
                        </span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">
                          {t("header.logout")}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {t("login.submit")}
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg shadow-slate-900/20"
                >
                  {t("register.submit")}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content overlap */}
      <div className="h-28"></div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 dark:bg-[#0F1115]/95 backdrop-blur-xl pt-28 px-6 animate-in fade-in slide-in-from-top-10 duration-200 block md:hidden">
          <nav className="flex flex-col gap-4">
            <Link
              to="/smart-review"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-2xl font-bold py-2 ${
                location.pathname === "/smart-review"
                  ? "text-[#4AA9B3]"
                  : "text-slate-800 dark:text-slate-200"
              }`}
            >
              {t("home.chooseFeature")}
            </Link>
            <Link
              to="/mock-defense"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-2xl font-bold py-2 ${
                location.pathname === "/mock-defense"
                  ? "text-[#4AA9B3]"
                  : "text-slate-800 dark:text-slate-200"
              }`}
            >
              Mock Defense
            </Link>
            <Link
              to="/upgrade"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-2xl font-bold py-2 ${
                location.pathname === "/upgrade"
                  ? "text-[#4AA9B3]"
                  : "text-slate-800 dark:text-slate-200"
              }`}
            >
              {t("smartReview.upgradeBtn")}
            </Link>

            {!isAuthenticated && (
              <div className="flex flex-col gap-4 mt-8">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-center"
                >
                  {t("login.submit")}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#4AA9B3] to-[#7E57C2] text-white font-bold text-center shadow-lg"
                >
                  {t("register.submit")}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
