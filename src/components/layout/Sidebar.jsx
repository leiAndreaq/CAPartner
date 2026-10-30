import { useState } from 'react';
import { Monitor, Video, Activity, AlertTriangle, ShieldCheck, CheckCircle2, X, LogOut, ShieldAlert } from 'lucide-react';
import capLogo from '../../assets/CAP LOGO.png';

export default function Sidebar({ activePage = 'Monitoring', onNavigate, alertBadgeCount, onClose, adminProfile, onLogout }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { icon: Monitor, label: 'Monitoring' },
    { icon: Video, label: 'Camera' },
    { icon: Activity, label: 'Activity Log' },
    { icon: AlertTriangle, label: 'Alerts', badge: alertBadgeCount > 0 ? alertBadgeCount : null },
    { icon: ShieldCheck, label: 'Admin Account Settings' },
  ];

  const getInitials = (name) => {
    if (!name) return 'AM';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      <div className="w-[88vw] max-w-[19rem] h-full min-h-0 bg-[#0A3320] text-white flex flex-col justify-between border-r border-[#115E3E]/35 shrink-0 rounded-r-[24px] lg:w-[280px] lg:rounded-none relative z-50 transition-all">
        
        {/* Top Section */}
        <div className="flex flex-col shrink-0">
          <div className="flex items-center justify-between gap-3 p-4 lg:p-6 pb-2 lg:pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-white p-1.5 rounded-xl shrink-0">
                <img src={capLogo} alt="Logo" className="w-8 h-8" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-wide leading-none mb-1">CAPartner</h1>
                <p className="text-[7px] tracking-wider text-emerald-200/70 uppercase leading-tight">
                  CAPartner sa kalusugan<br/>CAPartner sa kaligtasan
                </p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                aria-label="Close sidebar"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden cursor-pointer hover:bg-white/10 active:scale-95 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="px-4 py-2 mt-2">
            <p className="text-[10px] font-bold tracking-[0.15em] text-emerald-500/80 uppercase mb-3 px-2">Workspace</p>
            <nav className="space-y-1.5">
              {menuItems.map((item, idx) => {
                const isActive = activePage === item.label;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onNavigate && onNavigate(item.label);
                      onClose && onClose();
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5 rounded-2xl transition-all cursor-pointer active:scale-[0.98] ${
                      isActive ? 'bg-white text-[#0A3320] shadow-md' : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <item.icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                      <span className="font-bold text-sm text-left leading-tight">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 space-y-3 bg-[#0A3320] border-t border-[#115E3E]/40 shrink-0 mt-auto">
          <div className="bg-[#115E3E]/30 border border-[#115E3E]/50 rounded-2xl p-3 flex items-center gap-3">
            <div className="bg-[#0A3320] p-1.5 rounded-xl text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight mb-0.5">All systems operational</p>
              <p className="text-[10px] text-emerald-200/60 leading-tight">Last check: just now</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3 px-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#115E3E] flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-inner">
                {adminProfile?.avatar ? (
                  <img src={adminProfile.avatar} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  getInitials(adminProfile?.name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{adminProfile?.name || 'Alex Mendoza'}</p>
                <p className="text-[10px] text-emerald-200/60 truncate">System Administrator</p>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-white transition-all flex items-center justify-center gap-2.5 text-sm font-bold border border-red-500/20 cursor-pointer active:scale-95 shadow-sm"
              >
                <LogOut className="w-4 h-4" /> Log Out Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full-Screen Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-red-100 animate-bounce">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Confirm System Logout</h3>
            <div className="bg-red-50/70 border border-red-200/60 rounded-2xl p-4 mb-6 text-left">
              <p className="text-[10px] font-bold tracking-wider text-red-800 uppercase mb-1">Important Warning</p>
              <p className="text-xs sm:text-sm text-red-900/80 leading-relaxed">
                You are about to end your active command center session. Any unsaved modifications will be discarded, and you will need to re-authenticate to access dispatch tools.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 font-bold text-sm bg-white text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) onLogout();
                }}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}