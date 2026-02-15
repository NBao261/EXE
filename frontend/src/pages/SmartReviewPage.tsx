import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  BookOpen,
  Brain,
  Edit3,
  Check,
  X,
  Loader2,
  Crown,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useLanguageStore } from "../stores/languageStore";
import { smartReviewService } from "../services/smartreview.service";
import FileUpload from "../components/FileUpload";
import Header from "../components/Header";
import type { UserQuota, QuizListItem } from "../types/smartreview";

const QUIZZES_PER_PAGE = 5;

export default function SmartReviewPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const { t, language } = useLanguageStore();

  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [pendingDocIds, setPendingDocIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalQuizzes, setTotalQuizzes] = useState(0);

  // Rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    loadInitialData();
  }, [isAuthenticated, navigate]);

  // Auto-poll when upload is processing - only track pending documents
  useEffect(() => {
    if (!isProcessingUpload || !token || pendingDocIds.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const docsData = await smartReviewService.getDocuments(token);
        // Only check the documents from the current upload
        const pendingDocs = docsData.filter((d) =>
          pendingDocIds.includes(d._id),
        );
        const stillProcessing = pendingDocs.filter(
          (d) => d.status === "processing" || d.status === "uploading",
        ).length;

        if (stillProcessing === 0) {
          // Reload quizzes to get the newly created one
          const quizzesData = await smartReviewService.getQuizzes(
            token,
            1,
            QUIZZES_PER_PAGE,
          );
          setQuizzes(quizzesData.quizzes);
          setHasMore(quizzesData.hasMore);
          setTotalQuizzes(quizzesData.total);
          setPage(1);
          setIsProcessingUpload(false);
          setPendingDocIds([]);

          // Also refresh quota
          const quotaData = await smartReviewService.getQuota(token);
          setQuota(quotaData);

          const failedDocs = pendingDocs.filter((d) => d.status === "failed");
          if (failedDocs.length > 0) {
            setError(
              language === "vi"
                ? "Có lỗi xảy ra khi tạo quiz. Vui lòng thử lại."
                : "Failed to create quiz. Please try again.",
            );
          } else {
            setSuccessMessage(
              language === "vi"
                ? "Quiz đã được tạo thành công!"
                : "Quiz created successfully!",
            );
            setTimeout(() => setSuccessMessage(null), 5000);
          }
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    // Safety timeout: stop polling after 60s
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsProcessingUpload(false);
      setPendingDocIds([]);
      setError(
        language === "vi"
          ? "Quá thời gian chờ xử lý. Vui lòng tải lại trang."
          : "Processing timed out. Please reload the page.",
      );
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isProcessingUpload, token, pendingDocIds]);

  const loadInitialData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setPage(1);
      const [quotaData, quizzesData] = await Promise.all([
        smartReviewService.getQuota(token),
        smartReviewService.getQuizzes(token, 1, QUIZZES_PER_PAGE),
      ]);
      setQuota(quotaData);
      setQuizzes(quizzesData.quizzes);
      setHasMore(quizzesData.hasMore);
      setTotalQuizzes(quizzesData.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPage = async (pageNum: number) => {
    if (!token || isLoading) return;

    try {
      setIsLoading(true);
      const data = await smartReviewService.getQuizzes(
        token,
        pageNum,
        QUIZZES_PER_PAGE,
      );

      setQuizzes(data.quizzes);
      setPage(pageNum);
      setHasMore(data.hasMore);
      setTotalQuizzes(data.total);
    } catch (err) {
      console.error("Load page error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!token || files.length === 0) return;

    if (quota && !quota.canUpload) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      let docIds: string[] = [];
      if (files.length === 1) {
        const result = await smartReviewService.uploadDocument(files[0], token);
        docIds = [result.document._id];
      } else {
        const result = await smartReviewService.uploadMultipleDocuments(
          files,
          token,
        );
        docIds = result.documents.map((d) => d._id);
      }

      // Track pending documents and start polling
      setPendingDocIds(docIds);
      setIsProcessingUpload(true);
    } catch (err) {
      if ((err as Error).message.includes("hết lượt")) {
        setShowUpgradeModal(true);
      }
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const startEditing = (quiz: QuizListItem) => {
    setEditingId(quiz._id);
    setEditTitle(quiz.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const saveTitle = async (quizId: string) => {
    if (!token || !editTitle.trim()) return;

    try {
      setIsSaving(true);
      await smartReviewService.renameQuiz(quizId, editTitle.trim(), token);

      // Update local state
      setQuizzes((prev) =>
        prev.map((q) =>
          q._id === quizId ? { ...q, title: editTitle.trim() } : q,
        ),
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!token) return;

    try {
      setIsDeleting(true);
      await smartReviewService.deleteQuiz(quizId, token);

      // Remove from local state
      setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
      setTotalQuizzes((prev) => prev - 1);
      setDeleteConfirmId(null);
      setSuccessMessage(
        language === "vi" ? "Quiz đã được xóa!" : "Quiz deleted!",
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : language === "vi"
            ? "Không thể xóa quiz"
            : "Cannot delete quiz",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115] transition-colors duration-300 relative overflow-hidden">
      {/* Background Blobs - Subtle */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-[#4AA9B3]/5 rounded-full mix-blend-multiply filter blur-[80px] animate-blob" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#7E57C2]/5 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000" />
      </div>

      <Header quota={quota} />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 z-10">
        {/* Hero Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4AA9B3]/10 border border-[#4AA9B3]/20 text-[#4AA9B3] text-sm font-bold mb-4">
            <Brain className="w-4 h-4" />
            <span>Revo-Powered Learning</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 font-[Quicksand]">
            <span className="bling-text">{t("smartReview.title")}</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            {t("smartReview.desc")}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400 flex-1 text-sm font-medium">
              {error}
            </p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-800 dark:hover:text-red-300 font-bold text-sm"
            >
              {t("common.close")}
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-8 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <p className="text-emerald-700 dark:text-emerald-400 flex-1 font-medium text-sm">
              {successMessage}
            </p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold text-sm"
            >
              {t("common.close")}
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-3xl p-6 border-t-8 border-t-[#4AA9B3]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#4AA9B3]/20 flex items-center justify-center text-[#4AA9B3]">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white font-[Quicksand]">
                    {language === "vi"
                      ? "Tải lên tài liệu"
                      : "Upload documents"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md inline-block mt-1">
                    PDF, Word, TXT
                  </p>
                </div>
              </div>

              <FileUpload
                onUpload={handleUpload}
                isLoading={isUploading}
                disabled={quota ? !quota.canUpload : false}
                remainingUploads={quota?.remainingUploads}
              />

              {isProcessingUpload && (
                <div className="mt-6 p-5 rounded-2xl bg-[#4AA9B3]/5 border border-[#4AA9B3]/20">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-[#4AA9B3] flex items-center justify-center shadow-lg shadow-[#4AA9B3]/20">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FFD54F] rounded-full animate-ping" />
                    </div>
                    <div>
                      <p className="font-bold text-[#4AA9B3] dark:text-[#4AA9B3] text-sm">
                        {t("smartReview.analyzing")}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        AI đang xử lý nội dung...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats or Tips could go here */}
            <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-[#7E57C2]/10 to-[#4AA9B3]/10 border-none">
              <h3 className="font-bold text-slate-800 dark:text-white mb-2 font-[Quicksand]">
                Mẹo học tập
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Tải lên các file bài giảng hoặc ghi chú của bạn để AI tạo ra các
                câu hỏi ôn tập trắc nghiệm ngay lập tức.
              </p>
            </div>
          </div>

          {/* Quizzes Section */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-3xl p-8 min-h-[500px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#7E57C2]/20 flex items-center justify-center text-[#7E57C2]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white font-[Quicksand]">
                      {t("smartReview.yourQuizzes")}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      {totalQuizzes} quiz đã tạo
                    </p>
                  </div>
                </div>
                <button
                  onClick={loadInitialData}
                  className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group border border-slate-100 dark:border-slate-700"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-[#4AA9B3] transition-colors ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {isLoading ? (
                <div className="py-20 text-center">
                  <Loader2 className="w-10 h-10 text-[#4AA9B3] animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    {t("common.loading")}
                  </p>
                </div>
              ) : quizzes.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 font-[Quicksand]">
                    {t("smartReview.noQuizzes")}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    {t("smartReview.noQuizzesDesc")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz._id}
                      className="group flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 hover:border-[#4AA9B3] dark:hover:border-[#4AA9B3] hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-[#4AA9B3]/10 transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/quiz/${quiz._id}`)}
                    >
                      <div className="flex items-center gap-5 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4AA9B3] to-[#3D8C94] flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                          <FileText className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingId === quiz._id ? (
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1 px-4 py-2 rounded-xl border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveTitle(quiz._id);
                                  if (e.key === "Escape") cancelEditing();
                                }}
                              />
                              <button
                                onClick={() => saveTitle(quiz._id)}
                                disabled={isSaving}
                                className="p-2 rounded-xl bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Check className="w-5 h-5" />
                                )}
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-2 rounded-xl bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#4AA9B3] dark:group-hover:text-[#4AA9B3] transition-colors truncate font-[Quicksand]">
                                {quiz.title}
                              </h3>
                              <div
                                className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => startEditing(quiz)}
                                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(quiz._id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
                              <BookOpen className="w-3.5 h-3.5" />
                              {quiz.questionCount} {t("smartReview.questions")}
                            </span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
                              <Brain className="w-3.5 h-3.5" />
                              {quiz.flashcardCount}{" "}
                              {t("smartReview.flashcards")}
                            </span>
                            {quiz.lastScore !== undefined && (
                              <span
                                className={`text-xs font-bold px-2 py-1 rounded-lg ${
                                  quiz.lastScore >= 70
                                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                    : quiz.lastScore >= 50
                                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                }`}
                              >
                                {t("smartReview.score")} {quiz.lastScore}%
                              </span>
                            )}
                            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto">
                              <Clock className="w-3 h-3" />
                              {new Date(quiz.createdAt).toLocaleString(
                                language === "vi" ? "vi-VN" : "en-US",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="pl-4 border-l border-slate-100 dark:border-slate-700 ml-4 hidden sm:block">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/30 group-hover:bg-[#4AA9B3]/10 dark:group-hover:bg-[#4AA9B3]/20 transition-colors">
                          <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-[#4AA9B3]" />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalQuizzes > QUIZZES_PER_PAGE && (
                    <div className="mt-8 flex items-center justify-center gap-3">
                      <button
                        onClick={() => loadPage(page - 1)}
                        disabled={page === 1 || isLoading}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm font-medium"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {t("smartReview.previous")}
                      </button>

                      <div className="flex items-center gap-2">
                        {Array.from(
                          {
                            length: Math.ceil(totalQuizzes / QUIZZES_PER_PAGE),
                          },
                          (_, i) => i + 1,
                        )
                          .filter((p) => {
                            const totalPages = Math.ceil(
                              totalQuizzes / QUIZZES_PER_PAGE,
                            );
                            return (
                              p === 1 ||
                              p === totalPages ||
                              Math.abs(p - page) <= 1
                            );
                          })
                          .map((p, idx, arr) => (
                            <div key={p} className="flex items-center">
                              {idx > 0 && p - arr[idx - 1] > 1 && (
                                <span className="px-2 text-slate-400 dark:text-slate-600">
                                  ...
                                </span>
                              )}
                              <button
                                onClick={() => loadPage(p)}
                                disabled={isLoading}
                                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                                  p === page
                                    ? "bg-[#4AA9B3] text-white shadow-lg shadow-[#4AA9B3]/30"
                                    : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600"
                                }`}
                              >
                                {p}
                              </button>
                            </div>
                          ))}
                      </div>

                      <button
                        onClick={() => loadPage(page + 1)}
                        disabled={!hasMore || isLoading}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm font-medium"
                      >
                        {t("smartReview.next")}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="glass-card rounded-3xl p-10 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#4AA9B3]/20 rounded-full blur-3xl -ml-16 -mb-16" />

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-400/30 relative z-10">
              <Crown className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-[Quicksand] relative z-10">
              {t("smartReview.upgradeTitle")}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-base relative z-10">
              {t("smartReview.upgradeDesc")}
            </p>

            <div className="space-y-4 relative z-10">
              <button
                onClick={() => navigate("/upgrade")}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all hover:scale-[1.02]"
              >
                {t("smartReview.upgradeBtn")}
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-4 px-6 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-medium"
              >
                {t("smartReview.maybeLater")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="glass-card rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-[Quicksand]">
              {t("smartReview.deleteConfirm")}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Hành động này không thể hoàn tác.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="flex-1 py-3.5 px-4 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-medium"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => handleDeleteQuiz(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 py-3.5 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t("common.delete")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
