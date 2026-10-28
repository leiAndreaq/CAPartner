import { useState } from 'react';
import { LayoutDashboard, Monitor, Video, Activity, AlertTriangle, Users, ShieldCheck, CheckCircle2, X, LogOut, ShieldAlert } from 'lucide-react';
import capLogo from '../../assets/CAP LOGO.png';

export default function Sidebar({ activePage = 'Overview', onNavigate, alertBadgeCount, onClose, adminProfile, onLogout }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview' },
    { icon: Monitor, label: 'Monitoring' },
    { icon: Video, label: 'Camera' },
    { icon: Activity, label: 'Activity Log' },
    { icon: AlertTriangle, label: 'Alerts', badge: alertBadgeCount > 0 ? alertBadgeCount : null },
    { icon: Users, label: 'Personnel Accounts' },
    { icon: ShieldCheck, label: 'Admin Settings' },
  ];

  const getInitials = (name) => {
    if (!name) return 'AM';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      <div className="w-[88vw] max-w-[19rem] h-[100dvh] bg-[#0A3320] text-white flex flex-col justify-between border-r border-[#115E3E]/30 shrink-0 rounded-r-[24px] overflow-hidden lg:w-64 lg:rounded-none lg:overflow-visible relative">
        <div>
          <div className="flex items-center justify-between gap-3 p-4 pb-2 lg:p-6 lg:pb-4">
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

            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4">
            <p className="text-[10px] font-bold tracking-[0.15em] text-emerald-500/80 uppercase mb-3 px-2">Workspace</p>
            <nav className="space-y-1">
              {menuItems.map((item, idx) => {
                const isActive = activePage === item.label;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onNavigate && onNavigate(item.label);
                      onClose && onClose();
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                      isActive ? 'bg-white text-[#0A3320] shadow-sm' : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                      <span className="font-semibold text-xs sm:text-sm text-left leading-tight">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="bg-[#115E3E]/30 border border-[#115E3E]/50 rounded-xl p-3 flex items-center gap-3">
            <div className="bg-[#0A3320] p-1.5 rounded-lg text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">All systems operational</p>
              <p className="text-[10px] text-emerald-200/60">Last check: just now</p>
            </div>
          </div>

          {/* Admin Profile & Log Out Button sa pinakailalim (sa baba ng Admin Settings) */}
          <div className="pt-2 border-t border-[#115E3E]/40 space-y-3">
            <div className="flex items-center gap-3 px-2 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#115E3E] flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
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
                className="w-full py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-white transition-colors flex items-center justify-center gap-2 text-xs font-bold border border-red-500/20 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Log Out Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* LOG OUT CONFIRMATION & IMPORTANT WARNING MODAL             */}
      {/* ========================================================== */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-red-100">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm System Logout</h3>
            
            <div className="bg-red-50/70 border border-red-200/60 rounded-2xl p-4 mb-6 text-left">
              <p className="text-[10px] font-bold tracking-wider text-red-800 uppercase mb-1">Important Warning</p>
              <p className="text-xs text-red-900/80 leading-relaxed">
                You are about to end your active command center session. Any unsaved modifications will be discarded, and you will need to re-authenticate to access dispatch tools.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-xs bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) onLogout();
                }}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg cursor-pointer"
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