import { create } from "zustand";

export type Language = "vi" | "en";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const getInitialLanguage = (): Language => {
  const stored = localStorage.getItem("revo-lang") as Language | null;
  return stored || "vi";
};

export const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Common
    "common.brand": "Revo",
    "common.loading": "Đang tải...",
    "common.processing": "Đang xử lý...",
    "common.save": "Lưu",
    "common.cancel": "Hủy",
    "common.delete": "Xóa",
    "common.confirm": "Xác nhận",
    "common.close": "Đóng",
    "common.uploads": "uploads",

    // Header
    "header.account": "Tài khoản",
    "header.upgradePremium": "Nâng cấp Premium",
    "header.unlockFeatures": "Mở khóa tính năng",
    "header.profile": "Thông tin cá nhân",
    "header.settings": "Cài đặt",
    "header.logout": "Đăng xuất",
    "header.language": "Ngôn ngữ",
    "header.theme": "Giao diện",

    // Home - Unauthenticated
    "home.welcome": "Chào mừng đến Revo",
    "home.welcomeDesc": "Nền tảng ôn thi và luyện tập bảo vệ đồ án với Revo",
    "home.loginBtn": "Đăng nhập",
    "home.createAccountBtn": "Tạo tài khoản miễn phí",

    // Home - Authenticated
    "home.greeting": "Xin chào,",
    "home.chooseFeature": "Chọn tính năng bạn muốn sử dụng",
    "home.smartReview": "Smart Review",
    "home.smartReviewBadge": "Revo-Powered",
    "home.smartReviewDesc":
      "Upload Slide, PDF, Word — Revo tự động tạo Quiz và Flashcard giúp bạn ôn thi hiệu quả",
    "home.uploadHint": "Kéo thả hoặc chọn file tài liệu",
    "home.startReview": "Bắt đầu ôn thi",
    "home.mockDefense": "Phòng đồ án ảo",
    "home.mockDefenseBadge": "Voice Revo",
    "home.mockDefenseDesc":
      "Upload báo cáo — Revo đóng vai hội đồng phản biện bằng giọng nói, giúp bạn tự tin bảo vệ đồ án",
    "home.uploadReportHint": "Kéo thả hoặc chọn file báo cáo",
    "home.startMockDefense": "Bắt đầu thi thử",
    "home.tip": "Chuẩn bị tốt hơn với Revo",
    "home.tipDesc":
      "Upload tài liệu chi tiết để Revo tạo câu hỏi sát với nội dung học của bạn",
    "home.viewGuide": "Xem hướng dẫn",

    // Login
    "login.title": "Đăng nhập",
    "login.subtitle": "Chào mừng bạn quay lại! Nhập thông tin để tiếp tục.",
    "login.email": "Email",
    "login.password": "Mật khẩu",
    "login.submit": "Đăng nhập",
    "login.noAccount": "Chưa có tài khoản?",
    "login.registerNow": "Đăng ký ngay",
    "login.failed": "Đăng nhập thất bại",
    "login.brandDesc":
      "Nền tảng EdTech thông minh giúp sinh viên ôn thi và luyện tập bảo vệ đồ án với Revo",
    "login.smartReviewDesc":
      "Upload Slide, PDF, Word — Revo tự động tạo Quiz và Flashcard giúp ôn thi hiệu quả",
    "login.mockDefenseDesc":
      "Upload báo cáo — Revo đóng vai hội đồng phản biện bằng giọng nói, giúp tự tin bảo vệ đồ án",

    // Register
    "register.title": "Tạo tài khoản",
    "register.subtitle": "Bắt đầu hành trình học tập thông minh cùng Revo",
    "register.name": "Họ và tên",
    "register.namePlaceholder": "Nguyễn Văn A",
    "register.email": "Email",
    "register.password": "Mật khẩu",
    "register.passwordPlaceholder": "Tối thiểu 8 ký tự",
    "register.confirmPassword": "Xác nhận mật khẩu",
    "register.confirmPasswordPlaceholder": "Nhập lại mật khẩu",
    "register.submit": "Đăng ký miễn phí",
    "register.hasAccount": "Đã có tài khoản?",
    "register.login": "Đăng nhập",
    "register.success": "Đăng ký thành công!",
    "register.redirecting": "Đang chuyển đến trang đăng nhập...",
    "register.failed": "Đăng ký thất bại",
    "register.brandDesc":
      "Tham gia cùng hàng nghìn sinh viên đang sử dụng Revo để ôn thi và bảo vệ đồ án thành công",
    "register.smartReviewShort": "Upload tài liệu — Revo tạo Quiz/Flashcard",
    "register.mockDefenseShort": "Revo phản biện bằng giọng nói",

    // Smart Review
    "smartReview.title": "Smart Review",
    "smartReview.desc":
      "Upload tài liệu và Revo sẽ tạo Quiz, Flashcard giúp bạn ôn thi",
    "smartReview.analyzing": "Revo đang phân tích tài liệu của bạn...",
    "smartReview.yourQuizzes": "Quiz của bạn",
    "smartReview.noQuizzes": "Chưa có quiz nào",
    "smartReview.noQuizzesDesc":
      "Upload tài liệu để Revo tạo quiz giúp bạn ôn thi",
    "smartReview.questions": "câu hỏi",
    "smartReview.flashcards": "flashcards",
    "smartReview.score": "Điểm:",
    "smartReview.previous": "Trước",
    "smartReview.next": "Tiếp",
    "smartReview.deleteConfirm": "Bạn có chắc muốn xóa quiz này?",
    "smartReview.upgradeTitle": "Nâng cấp Premium",
    "smartReview.upgradeDesc":
      "Bạn đã hết lượt upload miễn phí. Nâng cấp để tiếp tục sử dụng Revo.",
    "smartReview.upgradeBtn": "Nâng cấp ngay",
    "smartReview.maybeLater": "Để sau",
  },
  en: {
    // Common
    "common.brand": "Revo",
    "common.loading": "Loading...",
    "common.processing": "Processing...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.confirm": "Confirm",
    "common.close": "Close",
    "common.uploads": "uploads",

    // Header
    "header.account": "Account",
    "header.upgradePremium": "Upgrade to Premium",
    "header.unlockFeatures": "Unlock features",
    "header.profile": "Profile",
    "header.settings": "Settings",
    "header.logout": "Log out",
    "header.language": "Language",
    "header.theme": "Theme",

    // Home - Unauthenticated
    "home.welcome": "Welcome to Revo",
    "home.welcomeDesc":
      "Smart learning platform for exam prep and thesis defense practice",
    "home.loginBtn": "Sign in",
    "home.createAccountBtn": "Create free account",

    // Home - Authenticated
    "home.greeting": "Hello,",
    "home.chooseFeature": "Choose a feature to get started",
    "home.smartReview": "Smart Review",
    "home.smartReviewBadge": "Revo-Powered",
    "home.smartReviewDesc":
      "Upload Slides, PDF, Word — Revo automatically generates Quiz and Flashcard to help you study effectively",
    "home.uploadHint": "Drag & drop or select document files",
    "home.startReview": "Start studying",
    "home.mockDefense": "Mock Defense",
    "home.mockDefenseBadge": "Voice Revo",
    "home.mockDefenseDesc":
      "Upload your report — Revo acts as a defense panel with voice, helping you practice your thesis defense",
    "home.uploadReportHint": "Drag & drop or select report file",
    "home.startMockDefense": "Start mock defense",
    "home.tip": "Prepare better with Revo",
    "home.tipDesc":
      "Upload detailed documents so Revo can generate questions closely matching your study content",
    "home.viewGuide": "View guide",

    // Login
    "login.title": "Sign in",
    "login.subtitle": "Welcome back! Enter your credentials to continue.",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign in",
    "login.noAccount": "Don't have an account?",
    "login.registerNow": "Sign up now",
    "login.failed": "Login failed",
    "login.brandDesc":
      "Smart EdTech platform helping students prepare for exams and practice thesis defense with Revo",
    "login.smartReviewDesc":
      "Upload Slides, PDF, Word — Revo auto-generates Quiz and Flashcard for effective studying",
    "login.mockDefenseDesc":
      "Upload your report — Revo acts as a defense panel with voice for confident thesis defense",

    // Register
    "register.title": "Create account",
    "register.subtitle": "Start your smart learning journey with Revo",
    "register.name": "Full name",
    "register.namePlaceholder": "John Doe",
    "register.email": "Email",
    "register.password": "Password",
    "register.passwordPlaceholder": "Minimum 8 characters",
    "register.confirmPassword": "Confirm password",
    "register.confirmPasswordPlaceholder": "Re-enter password",
    "register.submit": "Sign up free",
    "register.hasAccount": "Already have an account?",
    "register.login": "Sign in",
    "register.success": "Registration successful!",
    "register.redirecting": "Redirecting to login page...",
    "register.failed": "Registration failed",
    "register.brandDesc":
      "Join thousands of students using Revo to prepare for exams and successfully defend their thesis",
    "register.smartReviewShort":
      "Upload documents — Revo creates Quiz/Flashcard",
    "register.mockDefenseShort": "Revo provides voice-based defense practice",

    // Smart Review
    "smartReview.title": "Smart Review",
    "smartReview.desc":
      "Upload documents and Revo will generate Quiz, Flashcard to help you study",
    "smartReview.analyzing": "Revo is analyzing your documents...",
    "smartReview.yourQuizzes": "Your Quizzes",
    "smartReview.noQuizzes": "No quizzes yet",
    "smartReview.noQuizzesDesc":
      "Upload documents to let Revo create quizzes for you",
    "smartReview.questions": "questions",
    "smartReview.flashcards": "flashcards",
    "smartReview.score": "Score:",
    "smartReview.previous": "Previous",
    "smartReview.next": "Next",
    "smartReview.deleteConfirm": "Are you sure you want to delete this quiz?",
    "smartReview.upgradeTitle": "Upgrade to Premium",
    "smartReview.upgradeDesc":
      "You've used all free uploads. Upgrade to continue using Revo.",
    "smartReview.upgradeBtn": "Upgrade now",
    "smartReview.maybeLater": "Maybe later",
  },
};

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: getInitialLanguage(),
  setLanguage: (lang) => {
    localStorage.setItem("revo-lang", lang);
    set({ language: lang });
  },
  t: (key) => {
    const { language } = get();
    return translations[language][key] || key;
  },
}));
