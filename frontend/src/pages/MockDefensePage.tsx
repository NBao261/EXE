import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Upload,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Play,
  Send,
  FileText,
  GraduationCap,
  Settings,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useLanguageStore } from "../stores/languageStore";
import {
  defenseService,
  type DefenseSession,
} from "../services/defense.service";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import Header from "../components/Header";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function MockDefensePage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { language } = useLanguageStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (vi: string, en: string) => (language === "vi" ? vi : en);

  const [sessions, setSessions] = useState<DefenseSession[]>([]);
  const [currentSession, setCurrentSession] = useState<DefenseSession | null>(
    null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: sttSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText({ lang: "vi-VN", continuous: true });

  const {
    isSpeaking,
    isSupported: ttsSupported,
    voices,
    selectedVoice,
    currentRate,
    speak,
    cancel: cancelSpeech,
    setVoice,
    setRate,
  } = useTextToSpeech({ lang: "vi-VN", rate: 1.1 });

  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    loadSessions();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isListening && transcript.trim() && currentSession) {
      sendMessage(transcript.trim());
      resetTranscript();
    }
  }, [isListening, transcript, currentSession]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const data = await defenseService.getSessions();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (id: string) => {
    try {
      setIsProcessing(true);
      const session = await defenseService.getSession(id);
      setCurrentSession(session);
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Session not found");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError(t("Chỉ hỗ trợ file PDF", "Only PDF files are supported"));
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const session = await defenseService.uploadDocument(
        file,
        uploadTitle || undefined,
      );
      setSessions((prev) => [session, ...prev]);
      setUploadTitle("");
      navigate(`/mock-defense/${session._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const startDefense = async () => {
    if (!currentSession) return;

    try {
      setIsProcessing(true);
      const openingQuestion = await defenseService.startDefense(
        currentSession._id,
      );

      const assistantMessage: Message = {
        role: "assistant",
        content: openingQuestion,
        timestamp: new Date(),
      };
      setMessages([assistantMessage]);

      if (ttsSupported) {
        speak(openingQuestion);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start defense");
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentSession || !content.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setTextInput("");

    try {
      setIsSending(true);
      const response = await defenseService.chat(
        currentSession._id,
        content.trim(),
      );

      const assistantMessage: Message = {
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (ttsSupported) {
        speak(response.response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setIsSending(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendMessage(textInput.trim());
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeaking) cancelSpeech();
      startListening();
    }
  };

  const statusLabel = (status: string) => {
    if (language === "vi") {
      return status === "ready"
        ? "Sẵn sàng"
        : status === "in_progress"
          ? "Đang diễn ra"
          : status === "completed"
            ? "Hoàn thành"
            : "Chuẩn bị";
    }
    return status === "ready"
      ? "Ready"
      : status === "in_progress"
        ? "In progress"
        : status === "completed"
          ? "Completed"
          : "Preparing";
  };

  // Session list view
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1115] transition-colors duration-300 relative overflow-hidden">
        {/* Background Blobs - Subtle */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#7E57C2]/5 rounded-full mix-blend-multiply filter blur-[80px] animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#FFD54F]/5 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-2000" />
        </div>

        <Header />

        <main className="relative max-w-4xl mx-auto px-4 py-10 z-10">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7E57C2]/10 border border-[#7E57C2]/20 text-[#7E57C2] text-sm font-bold mb-4">
              <GraduationCap className="w-4 h-4" />
              <span className="font-[Quicksand]">Mock Defense AI</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 font-[Quicksand]">
              <span className="bling-text">
                {t("Phòng Bảo Vệ Ảo", "Virtual Defense Room")}
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t(
                "Upload đồ án và luyện tập bảo vệ với Revo đóng vai giáo viên phản biện",
                "Upload your project and practice defense with Revo as your panel reviewer",
              )}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-400 flex-1 text-sm font-medium">
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300 font-bold text-sm"
              >
                {t("Đóng", "Close")}
              </button>
            </div>
          )}

          {/* Upload Section */}
          <div className="glass-card rounded-3xl p-8 mb-10 border-t-8 border-t-[#7E57C2]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#7E57C2]/20 flex items-center justify-center text-[#7E57C2]">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-[Quicksand]">
                  {t("Upload Đồ Án", "Upload Project")}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("Chỉ hỗ trợ file PDF", "PDF files only")}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder={t(
                  "Tên đồ án (tùy chọn)",
                  "Project name (optional)",
                )}
                className="flex-1 px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7E57C2]/50 transition-all"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#7E57C2] to-[#673AB7] text-white font-bold hover:shadow-lg hover:shadow-[#7E57C2]/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-w-[160px]"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                {isUploading
                  ? t("Đang xử lý...", "Processing...")
                  : t("Chọn file PDF", "Choose PDF")}
              </button>
            </div>
          </div>

          {/* Sessions List */}
          <div className="glass-card rounded-3xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F]">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-[Quicksand]">
                  {t("Phiên Bảo Vệ", "Defense Sessions")}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {sessions.length} {t("phiên", "sessions")}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-10 h-10 text-[#7E57C2] animate-spin mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  {t("Đang tải...", "Loading...")}
                </p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2 font-[Quicksand]">
                  {t("Chưa có phiên bảo vệ nào", "No defense sessions yet")}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  {t(
                    "Upload đồ án để bắt đầu",
                    "Upload a project to get started",
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <button
                    key={session._id}
                    onClick={() => navigate(`/mock-defense/${session._id}`)}
                    className="w-full group flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 hover:border-[#7E57C2] dark:hover:border-[#7E57C2] hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-[#7E57C2]/10 transition-all duration-300 text-left"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7E57C2] to-[#673AB7] flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#7E57C2] dark:group-hover:text-[#7E57C2] transition-colors font-[Quicksand]">
                          {session.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              session.status === "ready"
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                : session.status === "in_progress"
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                  : session.status === "completed"
                                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            }`}
                          >
                            {statusLabel(session.status)}
                          </span>
                          <span className="font-medium bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
                            {session.totalChunks} {t("phần", "parts")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 group-hover:bg-[#7E57C2]/10 dark:group-hover:bg-[#7E57C2]/20 transition-colors">
                      <Play className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-[#7E57C2] fill-current" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Active defense session view
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F1115] flex flex-col transition-colors duration-300">
      {/* Mini Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0F1115]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/mock-defense")}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#7E57C2] dark:hover:text-[#7E57C2] transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">{t("Quay lại", "Go back")}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#7E57C2]/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#7E57C2]" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white truncate max-w-[200px] font-[Quicksand]">
              {currentSession?.title || t("Đang tải...", "Loading...")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVoiceSettings(true)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={t("Cài đặt giọng đọc", "Voice settings")}
            >
              <Settings className="w-5 h-5" />
            </button>

            {isSpeaking && (
              <button
                onClick={cancelSpeech}
                className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors animate-pulse"
                title={t("Dừng nói", "Stop speaking")}
              >
                <VolumeX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-400 flex-1 text-sm font-medium">
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300 font-bold"
              >
                ×
              </button>
            </div>
          )}

          {isProcessing ? (
            <div className="py-24 text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 rounded-3xl bg-[#7E57C2] flex items-center justify-center shadow-lg shadow-[#7E57C2]/30 z-10 relative">
                  <Sparkles className="w-10 h-10 text-white animate-pulse" />
                </div>
                <div className="absolute inset-0 bg-[#7E57C2] rounded-3xl animate-ping opacity-30"></div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-bold text-lg mb-2">
                {t(
                  "Đang chuẩn bị phiên bảo vệ...",
                  "Preparing defense session...",
                )}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                AI đang phân tích tài liệu của bạn
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-[#7E57C2] to-[#673AB7] flex items-center justify-center shadow-2xl shadow-[#7E57C2]/40 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 blur-xl"></div>
                <GraduationCap className="w-12 h-12 text-white relative z-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 font-[Quicksand]">
                {t("Sẵn sàng bảo vệ?", "Ready to defend?")}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
                {t(
                  "Giáo viên Revo sẽ đặt câu hỏi về đồ án của bạn. Hãy chuẩn bị tinh thần! Nhấn nút bên dưới để bắt đầu.",
                  "Revo will ask questions about your project. Be prepared! Click below to start.",
                )}
              </p>
              <button
                onClick={startDefense}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#7E57C2] to-[#673AB7] text-white font-bold hover:shadow-lg hover:shadow-[#7E57C2]/30 hover:scale-105 transition-all flex items-center gap-3 mx-auto"
              >
                <Play className="w-6 h-6 fill-current" />
                {t("Bắt đầu Bảo Vệ", "Start Defense")}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                >
                  <div
                    className={`max-w-[85%] p-5 rounded-2xl shadow-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-[#7E57C2] to-[#673AB7] text-white rounded-tr-none"
                        : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-3 text-[#7E57C2] dark:text-[#7E57C2] text-sm font-bold border-b border-slate-100 dark:border-slate-700 pb-2">
                        <GraduationCap className="w-4 h-4" />
                        <span className="uppercase tracking-wide">
                          {t("Giáo viên", "Teacher")}
                        </span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 p-5 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#7E57C2] rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-[#7E57C2] rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-[#7E57C2] rounded-full animate-bounce delay-200"></span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        {t("Đang suy nghĩ...", "Thinking...")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      {messages.length > 0 && (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1115] sticky bottom-0 z-40 pb-safe">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {(isListening || interimTranscript) && (
              <div className="mb-3 p-4 rounded-2xl bg-[#7E57C2]/5 border border-[#7E57C2]/20 shadow-inner">
                <div className="flex items-center gap-2 text-[#7E57C2] dark:text-[#7E57C2] text-sm mb-2 font-bold uppercase tracking-wide">
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>{t("Đang nghe...", "Listening...")}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {transcript || interimTranscript || (
                    <span className="text-slate-400 italic">...</span>
                  )}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={toggleListening}
                disabled={!sttSupported || isSending}
                className={`p-4 rounded-2xl transition-all shadow-sm ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse shadow-red-500/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={
                  isListening
                    ? t("Dừng ghi âm", "Stop recording")
                    : t("Bắt đầu nói", "Start speaking")
                }
              >
                {isListening ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>

              <form
                onSubmit={handleTextSubmit}
                className="flex-1 flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t(
                      "Nhập câu trả lời của bạn...",
                      "Type your answer...",
                    )}
                    disabled={isSending}
                    className="w-full pl-5 pr-12 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-[#7E57C2] text-slate-700 dark:text-slate-200 shadow-sm transition-all"
                  />
                  <MessageSquare className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>

                <button
                  type="submit"
                  disabled={isSending || !textInput.trim()}
                  className="p-4 rounded-2xl bg-gradient-to-r from-[#7E57C2] to-[#673AB7] text-white hover:shadow-lg hover:shadow-[#7E57C2]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                >
                  {isSending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Send className="w-6 h-6 ml-0.5" />
                  )}
                </button>
              </form>

              {isSpeaking && (
                <div className="p-4 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 animate-pulse">
                  <Volume2 className="w-6 h-6" />
                </div>
              )}
            </div>

            {!sttSupported && (
              <p className="text-amber-600 dark:text-amber-400 text-xs mt-3 text-center font-medium bg-amber-50 dark:bg-amber-900/20 py-2 rounded-lg">
                {t(
                  "Trình duyệt không hỗ trợ ghi âm giọng nói. Vui lòng dùng Chrome.",
                  "Browser does not support voice recording. Please use Chrome.",
                )}
              </p>
            )}
          </div>
        </footer>
      )}

      {/* Voice Settings Modal */}
      {showVoiceSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#7E57C2]/20 flex items-center justify-center text-[#7E57C2]">
                  <Settings className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-[Quicksand]">
                  {t("Cài đặt giọng đọc", "Voice Settings")}
                </h2>
              </div>
              <button
                onClick={() => setShowVoiceSettings(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                  {t("Giọng đọc", "Voice")}
                </label>
                <div className="relative">
                  <select
                    value={selectedVoice?.name || ""}
                    onChange={(e) => setVoice(e.target.value)}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-700 border-none ring-1 ring-slate-200 dark:ring-slate-600 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7E57C2] appearance-none"
                  >
                    {voices
                      .filter((v) => v.lang.startsWith("vi"))
                      .map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    {voices.filter((v) => v.lang.startsWith("vi")).length ===
                      0 && (
                      <option value="">
                        {t(
                          "Không có giọng tiếng Việt",
                          "No Vietnamese voice available",
                        )}
                      </option>
                    )}
                  </select>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-1">
                  {t("Giọng hiện tại:", "Current voice:")}{" "}
                  <span className="font-medium">
                    {selectedVoice?.name || t("Mặc định", "Default")}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                  {t("Tốc độ đọc:", "Reading speed:")}{" "}
                  <span className="text-[#7E57C2]">
                    {currentRate.toFixed(1)}x
                  </span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={currentRate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#7E57C2]"
                />
                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
                  <span>{t("Chậm", "Slow")}</span>
                  <span>{t("Bình thường", "Normal")}</span>
                  <span>{t("Nhanh", "Fast")}</span>
                </div>
              </div>

              <button
                onClick={() =>
                  speak(
                    language === "vi"
                      ? "Xin chào! Đây là giọng đọc tiếng Việt."
                      : "Hello! This is a Vietnamese voice test.",
                  )
                }
                disabled={isSpeaking}
                className="w-full py-4 px-6 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <Volume2 className="w-5 h-5" />
                {isSpeaking
                  ? t("Đang phát...", "Playing...")
                  : t("Nghe thử", "Test voice")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
