import { useCallback, useState } from "react";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  Files,
  Sparkles,
} from "lucide-react";

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  remainingUploads?: number;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".pptx"];
const MAX_FILES = 10;

export default function FileUpload({
  onUpload,
  isLoading,
  disabled,
  remainingUploads,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (
      !ALLOWED_TYPES.includes(file.type) &&
      !ALLOWED_EXTENSIONS.includes(ext)
    ) {
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      return false;
    }

    return true;
  };

  const addFiles = (files: FileList) => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      if (validateFile(file)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setError(
        `File không hợp lệ: ${invalidFiles.join(", ")}. Chỉ hỗ trợ PDF, DOCX, PPTX (max 10MB)`,
      );
    } else {
      setError(null);
    }

    const newFiles = [...selectedFiles, ...validFiles].slice(0, MAX_FILES);
    setSelectedFiles(newFiles);

    if (newFiles.length >= MAX_FILES) {
      setError(`Tối đa ${MAX_FILES} files`);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      if (e.dataTransfer.files) {
        addFiles(e.dataTransfer.files);
      }
    },
    [disabled, selectedFiles],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((files) => files.filter((_, i) => i !== index));
    setError(null);
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setError(null);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const colors: Record<string, string> = {
      pdf: "text-red-500",
      docx: "text-blue-500",
      pptx: "text-orange-500",
    };
    return colors[ext || ""] || "text-gray-500";
  };

  return (
    <div className="w-full">
      {/* Quota warning with animation */}
      {remainingUploads !== undefined &&
        remainingUploads <= 1 &&
        remainingUploads > 0 && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">
                Lượt upload cuối cùng!
              </p>
              <p className="text-sm text-amber-600">
                Bạn còn {remainingUploads} lượt upload miễn phí
              </p>
            </div>
          </div>
        )}

      {/* Drop zone with glassmorphism and animations */}
      <div
        className={`
          relative overflow-hidden rounded-3xl transition-all duration-500 ease-out cursor-pointer
          ${
            dragActive
              ? "bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-400 scale-[1.02] shadow-2xl shadow-blue-500/20"
              : "bg-gradient-to-br from-slate-50 to-slate-100/50 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() =>
          !disabled && document.getElementById("file-input")?.click()
        }
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <input
          id="file-input"
          type="file"
          accept=".pdf,.docx,.pptx"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
          multiple
        />

        <div className="relative p-8 text-center">
          {/* Icon with glow effect */}
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-40 animate-pulse" />
            <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30 transform transition-transform duration-300 hover:scale-110">
              <Upload className="w-9 h-9 text-white" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Kéo thả file vào đây
          </h3>
          <p className="text-slate-500 mb-3">
            hoặc{" "}
            <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
              click để chọn file
            </span>
          </p>

          {/* File type badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
              PDF
            </span>
            <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
              Word
            </span>
            <span className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold">
              PowerPoint
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Max 10MB/file • Tối đa {MAX_FILES} files
          </p>
        </div>
      </div>

      {/* Selected files list with stagger animation */}
      {selectedFiles.length > 0 && (
        <div className="mt-5 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Files className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-700">
                {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}{" "}
                đã chọn
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFiles();
              }}
              className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              Xóa tất cả
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="group flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    file.name.endsWith(".pdf")
                      ? "bg-red-100"
                      : file.name.endsWith(".docx")
                        ? "bg-blue-100"
                        : "bg-orange-100"
                  }`}
                >
                  <FileText className={`w-5 h-5 ${getFileIcon(file.name)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error message with animation */}
      {error && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 flex items-center gap-3 animate-in shake duration-300">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Upload button with gradient and animation */}
      {selectedFiles.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={isLoading || disabled}
          className="mt-5 w-full py-4 px-6 rounded-2xl font-bold text-white transition-all duration-300 
            bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 
            hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600
            hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-[1.02]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            flex items-center justify-center gap-3 relative overflow-hidden group"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

          {isLoading ? (
            <>
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>
                {selectedFiles.length === 1
                  ? "Tạo Quiz với Revo"
                  : `Gộp ${selectedFiles.length} files & Tạo Quiz`}
              </span>
            </>
          )}
        </button>
      )}

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
