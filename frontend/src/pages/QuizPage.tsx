import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, RotateCcw, Layers, Sparkles, ChevronLeft, ChevronRight, Trophy, BookOpen, Brain, Lightbulb } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { smartReviewService } from '../services/smartreview.service';
import Header from '../components/Header';
import type { Quiz } from '../types/smartreview';

type Mode = 'select' | 'quiz' | 'flashcard' | 'result';

export default function QuizPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token, isAuthenticated } = useAuthStore();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [mode, setMode] = useState<Mode>('select');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  // Flashcard state
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
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
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = () => {
    setMode('quiz');
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowAnswer(false);
  };

  const startFlashcards = () => {
    setMode('flashcard');
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showAnswer) return;
    setSelectedAnswer(answerIndex);
    setShowAnswer(true);

    const isCorrect = answerIndex === quiz?.questions[currentIndex].correctAnswer;
    if (isCorrect) setScore(s => s + 1);
    setAnswers([...answers, isCorrect]);
  };

  const nextQuestion = async () => {
    if (!quiz) return;
    
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      // Quiz completed - save score
      const finalScore = Math.round(((score + (selectedAnswer === quiz.questions[currentIndex].correctAnswer ? 1 : 0)) / quiz.questions.length) * 100);
      if (token && id) {
        try {
          await smartReviewService.updateQuizScore(id, finalScore, token);
        } catch (err) {
          console.error('Failed to save score:', err);
        }
      }
      setMode('result');
    }
  };

  const nextFlashcard = () => {
    if (!quiz) return;
    if (currentIndex < quiz.flashcards.length - 1) {
      setCurrentIndex(i => i + 1);
      setIsFlipped(false);
    }
  };

  const prevFlashcard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setIsFlipped(false);
    }
  };

  // Loading state with animation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Brain className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">Đang tải quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 flex items-center justify-center">
        <div className="text-center bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl">
          <p className="text-red-600 mb-4">{error || 'Quiz not found'}</p>
          <button 
            onClick={() => navigate('/smart-review')} 
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const currentFlashcard = quiz.flashcards[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>


      {/* Header */}
      <Header 
        showBack 
        backTo="/smart-review"
        onBack={mode !== 'select' ? () => setMode('select') : undefined}
        title={quiz.title}
        maxWidth="4xl"
      />

      <main className="relative max-w-4xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        {/* Mode Selection - Centered */}
        {mode === 'select' && (
          <div className="w-full max-w-2xl mx-auto animate-in fade-in-up duration-500">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-cyan-700 bg-clip-text text-transparent mb-3">
                Chọn chế độ học
              </h1>
              <p className="text-slate-600">Luyện tập với {quiz.questions.length} câu hỏi và {quiz.flashcards.length} flashcards</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Quiz Card */}
              <div
                onClick={startQuiz}
                className="group relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2 text-center">Làm Quiz</h3>
                  <p className="text-slate-500 text-center">{quiz.questions.length} câu hỏi trắc nghiệm</p>
                  <div className="mt-5 flex justify-center">
                    <span className="px-4 py-2 rounded-full bg-cyan-100 text-cyan-700 text-sm font-semibold">
                      Bắt đầu →
                    </span>
                  </div>
                </div>
              </div>

              {/* Flashcard Card */}
              <div
                onClick={startFlashcards}
                className="group relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Layers className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2 text-center">Flashcards</h3>
                  <p className="text-slate-500 text-center">{quiz.flashcards.length} thẻ ghi nhớ</p>
                  <div className="mt-5 flex justify-center">
                    <span className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
                      Bắt đầu →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Mode - Centered */}
        {mode === 'quiz' && currentQuestion && (
          <div className="w-full max-w-2xl mx-auto animate-in fade-in-up duration-300">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl">
              {/* Progress */}
              <div className="flex items-center gap-4 mb-8">
                <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">
                  {currentIndex + 1} / {quiz.questions.length}
                </span>
                <div className="h-3 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                    style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  {score}
                </div>
              </div>

              {/* Question */}
              <div className="mb-8">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800 pt-2">{currentQuestion.question}</h2>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === currentQuestion.correctAnswer;
                  
                  let bgClass = 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300';
                  let textClass = 'text-slate-700';
                  
                  if (showAnswer) {
                    if (isCorrect) {
                      bgClass = 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-400';
                      textClass = 'text-emerald-700';
                    } else if (isSelected && !isCorrect) {
                      bgClass = 'bg-gradient-to-r from-red-50 to-rose-50 border-red-400';
                      textClass = 'text-red-700';
                    } else {
                      bgClass = 'bg-slate-50 border-slate-200';
                      textClass = 'text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={showAnswer}
                      className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 ${bgClass} ${!showAnswer ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <span className={`flex items-center gap-4 font-medium ${textClass}`}>
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                          showAnswer && isCorrect ? 'bg-emerald-500 text-white' :
                          showAnswer && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1">{option.replace(/^[A-D]\.\s*/, '')}</span>
                        {showAnswer && isCorrect && <CheckCircle className="w-6 h-6 text-emerald-500" />}
                        {showAnswer && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showAnswer && currentQuestion.explanation && (
                <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800 mb-1">Giải thích</p>
                      <p className="text-blue-700 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Next button */}
              {showAnswer && (
                <button
                  onClick={nextQuestion}
                  className="mt-6 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {currentIndex < quiz.questions.length - 1 ? (
                    <>Câu tiếp theo <ChevronRight className="w-5 h-5" /></>
                  ) : (
                    <>Xem kết quả <Trophy className="w-5 h-5" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Flashcard Mode - Centered with 3D Flip */}
        {mode === 'flashcard' && currentFlashcard && (
          <div className="w-full max-w-xl mx-auto animate-in fade-in-up duration-300">
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {quiz.flashcards.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500' : 
                    i < currentIndex ? 'w-2 bg-purple-400' : 'w-2 bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <div className="text-center mb-4 text-slate-500 font-medium">
              {currentIndex + 1} / {quiz.flashcards.length}
            </div>

            {/* 3D Flashcard */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative h-80 cursor-pointer mb-6"
              style={{ perspective: '1500px' }}
            >
              <div
                className="absolute inset-0 transition-transform duration-700 ease-out"
                style={{ 
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* Front */}
                <div 
                  className="absolute inset-0 bg-white/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl flex flex-col items-center justify-center p-10"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-2xl font-semibold text-slate-800 text-center leading-relaxed">{currentFlashcard.front}</p>
                  <p className="mt-6 text-sm text-slate-400">Click để lật thẻ</p>
                </div>

                {/* Back */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-10"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-2xl font-semibold text-white text-center leading-relaxed">{currentFlashcard.back}</p>
                  <p className="mt-6 text-sm text-white/60">Click để lật lại</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={prevFlashcard}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/70 backdrop-blur border border-white/50 text-slate-700 font-semibold hover:bg-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <ChevronLeft className="w-5 h-5" />
                Trước
              </button>
              <button
                onClick={nextFlashcard}
                disabled={currentIndex === quiz.flashcards.length - 1}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Tiếp
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Result Mode - Centered */}
        {mode === 'result' && (
          <div className="w-full max-w-lg mx-auto animate-in zoom-in-95 duration-500">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 border border-white/50 shadow-2xl text-center">
              {/* Score circle */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${
                  score >= quiz.questions.length * 0.7 
                    ? 'bg-gradient-to-br from-emerald-400 to-green-500' 
                    : 'bg-gradient-to-br from-amber-400 to-orange-500'
                }`} />
                <div className={`relative w-full h-full rounded-full flex items-center justify-center shadow-lg ${
                  score >= quiz.questions.length * 0.7 
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                    : 'bg-gradient-to-br from-amber-500 to-orange-500'
                }`}>
                  <span className="text-4xl font-bold text-white">
                    {Math.round((score / quiz.questions.length) * 100)}%
                  </span>
                </div>
              </div>

              {/* Trophy or encouragement */}
              {score >= quiz.questions.length * 0.7 ? (
                <>
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-3">
                    Tuyệt vời!
                  </h2>
                </>
              ) : (
                <>
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
                    Cố gắng hơn nhé!
                  </h2>
                </>
              )}

              <p className="text-lg text-slate-600 mb-8">
                Bạn trả lời đúng <span className="font-bold text-slate-800">{score}</span> / <span className="font-bold text-slate-800">{quiz.questions.length}</span> câu
              </p>

              {/* Answer summary */}
              <div className="flex justify-center gap-1.5 mb-8 flex-wrap">
                {answers.map((correct, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                      correct ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startQuiz}
                  className="flex-1 py-4 px-6 rounded-2xl border-2 border-blue-500 text-blue-600 font-bold hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Làm lại
                </button>
                <button
                  onClick={() => navigate('/smart-review')}
                  className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                >
                  Về trang chính
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Custom styles for animations */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in.fade-in-up { animation: fade-in-up 0.5s ease-out; }
        .animate-in.zoom-in-95 { animation: zoom-in-95 0.5s ease-out; }
        @keyframes zoom-in-95 {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
