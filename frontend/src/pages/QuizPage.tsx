import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Layers,
  ChevronLeft,
  ChevronRight,
  Trophy,
  BookOpen,
  Brain,
  Lightbulb,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useLanguageStore } from "../stores/languageStore";
import { smartReviewService } from "../services/smartreview.service";
import Header from "../components/Header";
import type { Quiz } from "../types/smartreview";

type Mode = "select" | "quiz" | "flashcard" | "result";

export default function QuizPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token, isAuthenticated } = useAuthStore();
  const { language } = useLanguageStore();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("select");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const [isFlipped, setIsFlipped] = useState(false);

  const t = (vi: string, en: string) => (language === "vi" ? vi : en);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (id && token) {
      loadQuiz();
    }
  }, [id, token, isAuthenticated, navigate]);

  const loadQuiz = async () => {
    if (!id || !token) return;
    try {
      setIsLoading(true);
      const data = await smartReviewService.getQuiz(id, token);
      setQuiz(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = () => {
    setMode("quiz");
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowAnswer(false);
  };

  const startFlashcards = () => {
    setMode("flashcard");
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showAnswer) return;
    setSelectedAnswer(answerIndex);
    setShowAnswer(true);

    const isCorrect =
      answerIndex === quiz?.questions[currentIndex].correctAnswer;
    if (isCorrect) setScore((s) => s + 1);
    setAnswers([...answers, isCorrect]);
  };

  const nextQuestion = async () => {
    if (!quiz) return;

    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      const finalScore = Math.round(
        ((score +
          (selectedAnswer === quiz.questions[currentIndex].correctAnswer
            ? 1
            : 0)) /
          quiz.questions.length) *
          100,
      );
      if (token && id) {
        try {
          await smartReviewService.updateQuizScore(id, finalScore, token);
        } catch (err) {
          console.error("Failed to save score:", err);
        }
      }
      setMode("result");
    }
  };

  const nextFlashcard = () => {
    if (!quiz) return;
    if (currentIndex < quiz.flashcards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    }
  };

  const prevFlashcard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setIsFlipped(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Brain className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            {t("Đang tải quiz...", "Loading quiz...")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || t("Không tìm thấy quiz", "Quiz not found")}
          </p>
          <button
            onClick={() => navigate("/smart-review")}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            {t("Quay lại", "Go back")}
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const currentFlashcard = quiz.flashcards[currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header
        showBack
        backTo="/smart-review"
        onBack={mode !== "select" ? () => setMode("select") : undefined}
        title={quiz.title}
        maxWidth="4xl"
      />

      <main className="max-w-4xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        {/* Mode Selection */}
        {mode === "select" && (
          <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                {t("Chọn chế độ học", "Choose study mode")}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {t("Luyện tập với", "Practice with")} {quiz.questions.length}{" "}
                {t("câu hỏi và", "questions and")} {quiz.flashcards.length}{" "}
                flashcards
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Quiz Card */}
              <div
                onClick={startQuiz}
                className="group bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 text-center">
                  {t("Làm Quiz", "Take Quiz")}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-center text-sm">
                  {quiz.questions.length}{" "}
                  {t("câu hỏi trắc nghiệm", "multiple choice questions")}
                </p>
                <div className="mt-5 flex justify-center">
                  <span className="px-4 py-2 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-sm font-semibold">
                    {t("Bắt đầu →", "Start →")}
                  </span>
                </div>
              </div>

              {/* Flashcard Card */}
              <div
                onClick={startFlashcards}
                className="group bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mx-auto mb-5">
                  <Layers className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 text-center">
                  Flashcards
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-center text-sm">
                  {quiz.flashcards.length} {t("thẻ ghi nhớ", "memory cards")}
                </p>
                <div className="mt-5 flex justify-center">
                  <span className="px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-semibold">
                    {t("Bắt đầu →", "Start →")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Mode */}
        {mode === "quiz" && currentQuestion && (
          <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
              {/* Progress */}
              <div className="flex items-center gap-4 mb-8">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {currentIndex + 1} / {quiz.questions.length}
                </span>
                <div className="h-3 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                    style={{
                      width: `${((currentIndex + 1) / quiz.questions.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  {score}
                </div>
              </div>

              {/* Question */}
              <div className="mb-8">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 pt-2">
                    {currentQuestion.question}
                  </h2>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === currentQuestion.correctAnswer;

                  let bgClass =
                    "bg-white dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500";
                  let textClass = "text-slate-700 dark:text-slate-300";

                  if (showAnswer) {
                    if (isCorrect) {
                      bgClass =
                        "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-600";
                      textClass = "text-emerald-700 dark:text-emerald-400";
                    } else if (isSelected && !isCorrect) {
                      bgClass =
                        "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600";
                      textClass = "text-red-700 dark:text-red-400";
                    } else {
                      bgClass =
                        "bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600";
                      textClass = "text-slate-400 dark:text-slate-500";
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={showAnswer}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${bgClass} ${!showAnswer ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <span
                        className={`flex items-center gap-4 font-medium ${textClass}`}
                      >
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                            showAnswer && isCorrect
                              ? "bg-emerald-500 text-white"
                              : showAnswer && isSelected && !isCorrect
                                ? "bg-red-500 text-white"
                                : "bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1">
                          {option.replace(/^[A-D]\.\s*/, "")}
                        </span>
                        {showAnswer && isCorrect && (
                          <CheckCircle className="w-6 h-6 text-emerald-500" />
                        )}
                        {showAnswer && isSelected && !isCorrect && (
                          <XCircle className="w-6 h-6 text-red-500" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showAnswer && currentQuestion.explanation && (
                <div className="mt-6 p-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                        {t("Giải thích", "Explanation")}
                      </p>
                      <p className="text-blue-700 dark:text-blue-400 text-sm leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Next button */}
              {showAnswer && (
                <button
                  onClick={nextQuestion}
                  className="mt-6 w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
                >
                  {currentIndex < quiz.questions.length - 1 ? (
                    <>
                      {t("Câu tiếp theo", "Next question")}{" "}
                      <ChevronRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      {t("Xem kết quả", "View results")}{" "}
                      <Trophy className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Flashcard Mode */}
        {mode === "flashcard" && currentFlashcard && (
          <div className="w-full max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              {quiz.flashcards.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? "w-8 bg-gradient-to-r from-indigo-500 to-blue-500"
                      : i < currentIndex
                        ? "w-2 bg-indigo-400 dark:bg-indigo-600"
                        : "w-2 bg-slate-300 dark:bg-slate-600"
                  }`}
                />
              ))}
            </div>

            <div className="text-center mb-4 text-slate-500 dark:text-slate-400 font-medium">
              {currentIndex + 1} / {quiz.flashcards.length}
            </div>

            {/* 3D Flashcard */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative h-80 cursor-pointer mb-6"
              style={{ perspective: "1500px" }}
            >
              <div
                className="absolute inset-0 transition-transform duration-700 ease-out"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col items-center justify-center p-10"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center mb-6">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xl font-semibold text-slate-800 dark:text-slate-200 text-center leading-relaxed">
                    {currentFlashcard.front}
                  </p>
                  <p className="mt-6 text-sm text-slate-400 dark:text-slate-500">
                    {t("Click để lật thẻ", "Click to flip")}
                  </p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl shadow-lg flex flex-col items-center justify-center p-10"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xl font-semibold text-white text-center leading-relaxed">
                    {currentFlashcard.back}
                  </p>
                  <p className="mt-6 text-sm text-white/60">
                    {t("Click để lật lại", "Click to flip back")}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={prevFlashcard}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                {t("Trước", "Prev")}
              </button>
              <button
                onClick={nextFlashcard}
                disabled={currentIndex === quiz.flashcards.length - 1}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold hover:from-indigo-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t("Tiếp", "Next")}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Result Mode */}
        {mode === "result" && (
          <div className="w-full max-w-lg mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 border border-slate-200 dark:border-slate-700 text-center">
              {/* Score circle */}
              <div className="relative w-28 h-28 mx-auto mb-8">
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center ${
                    score >= quiz.questions.length * 0.7
                      ? "bg-gradient-to-br from-emerald-500 to-green-600"
                      : "bg-gradient-to-br from-amber-500 to-orange-500"
                  }`}
                >
                  <span className="text-3xl font-bold text-white">
                    {Math.round((score / quiz.questions.length) * 100)}%
                  </span>
                </div>
              </div>

              {score >= quiz.questions.length * 0.7 ? (
                <>
                  <Trophy className="w-10 h-10 mx-auto mb-4 text-amber-500" />
                  <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-3">
                    {t("Tuyệt vời!", "Excellent!")}
                  </h2>
                </>
              ) : (
                <>
                  <Brain className="w-10 h-10 mx-auto mb-4 text-blue-500" />
                  <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                    {t("Cố gắng hơn nhé!", "Keep trying!")}
                  </h2>
                </>
              )}

              <p className="text-slate-600 dark:text-slate-400 mb-8">
                {t("Bạn trả lời đúng", "You answered correctly")}{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {score}
                </span>{" "}
                /{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {quiz.questions.length}
                </span>{" "}
                {t("câu", "questions")}
              </p>

              {/* Answer summary */}
              <div className="flex justify-center gap-1.5 mb-8 flex-wrap">
                {answers.map((correct, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                      correct ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startQuiz}
                  className="flex-1 py-4 px-6 rounded-xl border-2 border-blue-500 dark:border-blue-600 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  {t("Làm lại", "Retry")}
                </button>
                <button
                  onClick={() => navigate("/smart-review")}
                  className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:from-blue-700 hover:to-cyan-700 transition-all"
                >
                  {t("Về trang chính", "Back to main")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
