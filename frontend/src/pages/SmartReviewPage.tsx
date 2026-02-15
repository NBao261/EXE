import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Sparkles,
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
  Zap,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { smartReviewService } from "../services/smartreview.service";
import FileUpload from "../components/FileUpload";
import Header from "../components/Header";
import type { UserQuota, QuizListItem } from "../types/smartreview";

const QUIZZES_PER_PAGE = 5;

export default function SmartReviewPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();

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
            setError("Có lỗi xảy ra khi tạo quiz. Vui lòng thử lại.");
          } else {
            setSuccessMessage("🎉 Quiz đã được tạo thành công!");
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
      setError("Quá thời gian chờ xử lý. Vui lòng tải lại trang.");
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
      setSuccessMessage("Quiz đã được xóa!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa quiz");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <Header quota={quota} />

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-200/50 mb-4">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              Powered by AI
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-cyan-700 bg-clip-text text-transparent">
              Smart Review
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Upload tài liệu học tập và để AI tạo{" "}
            <span className="font-semibold text-blue-600">Quiz</span> &{" "}
            <span className="font-semibold text-cyan-600">Flashcard</span> giúp
            bạn ôn thi hiệu quả
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 flex items-center gap-3 animate-in slide-in-from-top duration-300">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <p className="text-red-600 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Success Toast */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 flex items-center gap-3 animate-in slide-in-from-top duration-300">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <p className="text-emerald-700 flex-1 font-medium">
              {successMessage}
            </p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-500 hover:text-emerald-700 font-medium"
            >
              Đóng
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">
                      Tải lên tài liệu
                    </h2>
                    <p className="text-xs text-slate-500">
                      PDF, Word, PowerPoint
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
                  <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-700">
                          AI đang phân tích...
                        </p>
                        <p className="text-sm text-blue-600">
                          Đang tạo quiz từ tài liệu của bạn
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quizzes Section */}
          <div className="lg:col-span-3">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">Quiz của bạn</h2>
                    <p className="text-xs text-slate-500">
                      {totalQuizzes} bộ quiz
                    </p>
                  </div>
                </div>
                <button
                  onClick={loadInitialData}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all duration-300 group"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`w-5 h-5 text-slate-600 group-hover:text-slate-800 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {isLoading ? (
                <div className="py-16 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur opacity-50 animate-pulse" />
                    <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <RefreshCw className="w-7 h-7 text-white animate-spin" />
                    </div>
                  </div>
                  <p className="text-slate-500">Đang tải dữ liệu...</p>
                </div>
              ) : quizzes.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400 rounded-3xl blur opacity-30" />
                    <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200">
                      <FileText className="w-9 h-9 text-slate-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    Chưa có quiz nào
                  </h3>
                  <p className="text-slate-500">
                    Upload tài liệu để AI tạo quiz cho bạn
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizzes.map((quiz, index) => (
                    <div
                      key={quiz._id}
                      className="group flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-white to-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300 cursor-pointer flex-shrink-0"
                          onClick={() => navigate(`/quiz/${quiz._id}`)}
                        >
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingId === quiz._id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveTitle(quiz._id);
                                  if (e.key === "Escape") cancelEditing();
                                }}
                              />
                              <button
                                onClick={() => saveTitle(quiz._id)}
                                disabled={isSaving}
                                className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3
                                className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors cursor-pointer truncate"
                                onClick={() => navigate(`/quiz/${quiz._id}`)}
                              >
                                {quiz.title}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(quiz);
                                }}
                                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-200 transition-all"
                                title="Đổi tên"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(quiz._id);
                                }}
                                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-1 flex-wrap">
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              {quiz.questionCount} câu hỏi
                            </span>
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <Brain className="w-3.5 h-3.5" />
                              {quiz.flashcardCount} flashcards
                            </span>
                            {quiz.lastScore !== undefined && (
                              <span
                                className={`text-sm font-medium flex items-center gap-1 px-2 py-0.5 rounded-full ${
                                  quiz.lastScore >= 70
                                    ? "bg-emerald-100 text-emerald-700"
                                    : quiz.lastScore >= 50
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                Lần cuối: {quiz.lastScore}%
                              </span>
                            )}
                            <span className="text-sm text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(quiz.createdAt).toLocaleString(
                                "vi-VN",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className="w-6 h-6 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 cursor-pointer flex-shrink-0"
                        onClick={() => navigate(`/quiz/${quiz._id}`)}
                      />
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalQuizzes > QUIZZES_PER_PAGE && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      {/* Previous button */}
                      <button
                        onClick={() => loadPage(page - 1)}
                        disabled={page === 1 || isLoading}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Trước
                      </button>

                      {/* Page numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from(
                          {
                            length: Math.ceil(totalQuizzes / QUIZZES_PER_PAGE),
                          },
                          (_, i) => i + 1,
                        )
                          .filter((p) => {
                            // Show first, last, current, and adjacent pages
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
                              {/* Show ellipsis if there's a gap */}
                              {idx > 0 && p - arr[idx - 1] > 1 && (
                                <span className="px-2 text-slate-400">...</span>
                              )}
                              <button
                                onClick={() => loadPage(p)}
                                disabled={isLoading}
                                className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                                  p === page
                                    ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30"
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-blue-300"
                                }`}
                              >
                                {p}
                              </button>
                            </div>
                          ))}
                      </div>

                      {/* Next button */}
                      <button
                        onClick={() => loadPage(page + 1)}
                        disabled={!hasMore || isLoading}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                      >
                        Tiếp
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Info text */}
                  {totalQuizzes > 0 && (
                    <p className="text-center text-slate-400 text-sm mt-4">
                      Trang {page} /{" "}
                      {Math.ceil(totalQuizzes / QUIZZES_PER_PAGE)} • Tổng{" "}
                      {totalQuizzes} quiz
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-white/50 animate-in zoom-in-95 duration-300">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/50">
                <Crown className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3">
              Nâng cấp Premium
            </h2>
            <p className="text-slate-600 mb-8">
              Bạn đã hết lượt upload miễn phí. Nâng cấp lên{" "}
              <span className="font-semibold text-amber-600">Premium</span> để
              upload không giới hạn!
            </p>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 mb-6 text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="text-slate-700">Upload không giới hạn</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-slate-700">
                    AI nâng cao với độ chính xác cao hơn
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span className="text-slate-700">
                    Ưu tiên xử lý nhanh hơn
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:from-amber-600 hover:to-orange-600 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:scale-[1.02]">
                Nâng cấp ngay - 99.000đ/tháng
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-3 px-6 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all duration-300"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-white/50 animate-in zoom-in-95 duration-300">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-500 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/50">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              Xóa Quiz?
            </h2>
            <p className="text-slate-600 mb-8">
              Bạn có chắc chắn muốn xóa quiz này? Hành động này{" "}
              <span className="font-semibold text-red-600">
                không thể hoàn tác
              </span>
              .
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleDeleteQuiz(deleteConfirmId)}
                disabled={isDeleting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold hover:from-red-600 hover:to-rose-600 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Xóa Quiz
                  </>
                )}
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="w-full py-3 px-6 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all duration-300 disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
