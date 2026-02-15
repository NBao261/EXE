import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { defenseService, type DefenseSession } from '../services/defense.service';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import Header from '../components/Header';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function MockDefensePage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Session state
  const [sessions, setSessions] = useState<DefenseSession[]>([]);
  const [currentSession, setCurrentSession] = useState<DefenseSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');

  // Speech hooks
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: sttSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText({ lang: 'vi-VN', continuous: true });

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
  } = useTextToSpeech({ lang: 'vi-VN', rate: 1.1 });

  // Voice settings modal
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load data on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadSessions();
  }, [isAuthenticated, navigate]);

  // Load session when ID changes
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  // Send transcript when user stops speaking
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
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
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
      setError(err instanceof Error ? err.message : 'Session not found');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Chỉ hỗ trợ file PDF');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const session = await defenseService.uploadDocument(file, uploadTitle || undefined);
      setSessions(prev => [session, ...prev]);
      setUploadTitle('');
      navigate(`/mock-defense/${session._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startDefense = async () => {
    if (!currentSession) return;

    try {
      setIsProcessing(true);
      const openingQuestion = await defenseService.startDefense(currentSession._id);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: openingQuestion,
        timestamp: new Date(),
      };
      setMessages([assistantMessage]);
      
      if (ttsSupported) {
        speak(openingQuestion);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start defense');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentSession || !content.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setTextInput('');

    try {
      setIsSending(true);
      const response = await defenseService.chat(currentSession._id, content.trim());
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      if (ttsSupported) {
        speak(response.response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed');
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

  // Session list view
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <Header />

        <main className="relative max-w-4xl mx-auto px-4 py-8">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-200/50 mb-4">
              <GraduationCap className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Mock Defense</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-slate-900 via-orange-800 to-amber-700 bg-clip-text text-transparent">
                Phòng Bảo Vệ Ảo
              </span>
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Upload đồ án và luyện tập bảo vệ với AI đóng vai giáo viên phản biện
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 flex items-center gap-3 animate-in slide-in-from-top duration-300">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-red-600 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-medium">
                Đóng
              </button>
            </div>
          )}

          {/* Upload Section */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-xl shadow-slate-200/50 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Upload Đồ Án</h2>
                <p className="text-xs text-slate-500">Chỉ hỗ trợ file PDF</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Tên đồ án (tùy chọn)"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300"
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
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold hover:from-orange-600 hover:to-amber-600 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                {isUploading ? 'Đang xử lý...' : 'Chọn file PDF'}
              </button>
            </div>
          </div>

          {/* Sessions List */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Phiên Bảo Vệ</h2>
                <p className="text-xs text-slate-500">{sessions.length} phiên</p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl blur opacity-50 animate-pulse" />
                  <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                  </div>
                </div>
                <p className="text-slate-500">Đang tải...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-16 text-center">
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400 rounded-3xl blur opacity-30" />
                  <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200">
                    <FileText className="w-9 h-9 text-slate-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Chưa có phiên bảo vệ nào</h3>
                <p className="text-slate-500">Upload đồ án để bắt đầu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session, index) => (
                  <button
                    key={session._id}
                    onClick={() => navigate(`/mock-defense/${session._id}`)}
                    className="w-full group flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-white to-slate-50 border border-slate-200/80 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 text-left"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 group-hover:text-orange-600 transition-colors">
                          {session.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            session.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                            session.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            session.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {session.status === 'ready' ? 'Sẵn sàng' :
                             session.status === 'in_progress' ? 'Đang diễn ra' :
                             session.status === 'completed' ? 'Hoàn thành' : 'Chuẩn bị'}
                          </span>
                          <span>{session.totalChunks} phần</span>
                        </div>
                      </div>
                    </div>
                    <Play className="w-5 h-5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-300" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 flex flex-col">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Mini Header */}
      <header className="relative border-b border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/mock-defense')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Quay lại</span>
          </button>
          
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-slate-800 truncate max-w-[200px]">
              {currentSession?.title || 'Đang tải...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice Settings Button */}
            <button
              onClick={() => setShowVoiceSettings(true)}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              title="Cài đặt giọng đọc"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {isSpeaking && (
              <button
                onClick={cancelSpeech}
                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                title="Dừng nói"
              >
                <VolumeX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="relative flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {error && (
            <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-600 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
            </div>
          )}

          {isProcessing ? (
            <div className="py-20 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl blur opacity-50 animate-pulse" />
                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              </div>
              <p className="text-slate-500">Đang chuẩn bị phiên bảo vệ...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center border-2 border-orange-200">
                <GraduationCap className="w-12 h-12 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Sẵn sàng bảo vệ?</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Giáo viên AI sẽ đặt câu hỏi về đồ án của bạn. Hãy chuẩn bị tinh thần!
              </p>
              <button
                onClick={startDefense}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold hover:from-orange-600 hover:to-amber-600 hover:shadow-xl hover:shadow-orange-500/30 transition-all flex items-center gap-3 mx-auto hover:scale-[1.02]"
              >
                <Play className="w-6 h-6" />
                Bắt đầu Bảo Vệ
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-orange-600 text-sm">
                        <GraduationCap className="w-4 h-4" />
                        <span className="font-semibold">Giáo viên</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 text-slate-800 p-4 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                      <span className="text-slate-500">Đang suy nghĩ...</span>
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
        <footer className="relative border-t border-slate-200/80 bg-white/80 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Transcript preview */}
            {(isListening || interimTranscript) && (
              <div className="mb-3 p-3 rounded-xl bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-2 text-orange-600 text-sm mb-1">
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Đang nghe...</span>
                </div>
                <p className="text-slate-800">{transcript || interimTranscript || '...'}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Voice button */}
              <button
                onClick={toggleListening}
                disabled={!sttSupported || isSending}
                className={`p-4 rounded-2xl transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? 'Dừng ghi âm' : 'Bắt đầu nói'}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {/* Text input */}
              <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Hoặc nhập câu trả lời..."
                  disabled={isSending}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSending || !textInput.trim()}
                  className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>

              {/* TTS indicator */}
              {isSpeaking && (
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                </div>
              )}
            </div>

            {!sttSupported && (
              <p className="text-amber-600 text-sm mt-2 text-center">
                ⚠️ Trình duyệt không hỗ trợ ghi âm giọng nói. Vui lòng dùng Chrome.
              </p>
            )}
          </div>
        </footer>
      )}

      {/* Voice Settings Modal */}
      {showVoiceSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full shadow-2xl border border-white/50 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Cài đặt giọng đọc</h2>
              </div>
              <button
                onClick={() => setShowVoiceSettings(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Voice Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Giọng đọc
                </label>
                <select
                  value={selectedVoice?.name || ''}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-300"
                >
                  {voices
                    .filter((v) => v.lang.startsWith('vi'))
                    .map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  {voices.filter((v) => v.lang.startsWith('vi')).length === 0 && (
                    <option value="">Không có giọng tiếng Việt</option>
                  )}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Giọng hiện tại: {selectedVoice?.name || 'Mặc định'}
                </p>
              </div>

              {/* Rate Slider */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tốc độ đọc: {currentRate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={currentRate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Chậm (0.5x)</span>
                  <span>Bình thường (1x)</span>
                  <span>Nhanh (2x)</span>
                </div>
              </div>

              {/* Test Button */}
              <button
                onClick={() => speak('Xin chào! Đây là giọng đọc tiếng Việt.')}
                disabled={isSpeaking}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold hover:from-orange-600 hover:to-amber-600 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <Volume2 className="w-5 h-5" />
                {isSpeaking ? 'Đang phát...' : 'Nghe thử'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
