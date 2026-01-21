import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Crown, Zap, ArrowLeft, ChevronDown, User, Settings } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { UserQuota } from '../types/smartreview';

interface HeaderProps {
  quota?: UserQuota | null;
  showBack?: boolean;
  backTo?: string;
  onBack?: () => void;
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl';
}

export default function Header({ 
  quota, 
  showBack = false, 
  backTo, 
  onBack,
  title,
  maxWidth = '7xl'
}: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const maxWidthClass = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl',
  }[maxWidth];

  return (
    <nav className="relative sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/50 shadow-lg shadow-slate-200/50">
      <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className="flex justify-between items-center h-16">
          {/* Left section */}
          <div className="flex items-center gap-4">
            {showBack && (
              <button
                onClick={handleBack}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}
            
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => navigate('/')}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                EduAI Pro
              </span>
            </div>

            {title && (
              <>
                <span className="text-slate-300 hidden sm:block">/</span>
                <span className="font-semibold text-slate-700 hidden sm:block truncate max-w-[200px]">
                  {title}
                </span>
              </>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Quota badge */}
            {(quota || user?.plan === 'premium') && (
              <div className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                (quota?.plan === 'premium' || user?.plan === 'premium')
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30' 
                  : 'bg-white/80 backdrop-blur border border-slate-200 text-slate-700 hover:shadow-md'
              }`}>
                {(quota?.plan === 'premium' || user?.plan === 'premium') ? (
                  <span className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4" />
                    Premium {quota ? `(${quota.uploadCount}/${quota.uploadLimit})` : ''}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-500" />
                    {quota?.remainingUploads} / {quota?.uploadLimit} uploads
                  </span>
                )}
              </div>
            )}

            {/* User Dropdown */}
            <div className="relative group">
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/60 backdrop-blur border border-white/50 hover:bg-white/80 cursor-pointer transition-all">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {(quota?.plan === 'premium' || user?.plan === 'premium') ? (
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-wider flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Premium
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Free
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full pt-2 w-64 transform opacity-0 scale-95 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 origin-top-right z-50">
                {/* Safe hover bridge */}
                <div className="absolute inset-x-0 -top-2 h-4 bg-transparent" />
                
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-sm font-medium text-slate-900">Tài khoản</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  
                  <div className="p-2 space-y-1">
                    {quota?.plan !== 'premium' && (
                      <button 
                        onClick={() => navigate('/upgrade')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-slate-600 hover:text-amber-600 transition-colors group/item"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 group-hover/item:scale-110 transition-transform">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold">Nâng cấp Premium</p>
                          <p className="text-[10px] text-slate-500">Mở khóa tính năng</p>
                        </div>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => navigate('/profile')} 
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">Thông tin cá nhân</span>
                    </button>

                    <button 
                      onClick={() => navigate('/settings')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <Settings className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">Cài đặt</span>
                    </button>
                  </div>

                  <div className="p-2 border-t border-slate-50">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors group/logout"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500 group-hover/logout:bg-red-200 transition-colors">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
