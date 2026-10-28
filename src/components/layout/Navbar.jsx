import { useState } from 'react';
import { Bell, ChevronDown, LogOut, X } from 'lucide-react';

export default function Navbar({ 
  activePage = 'Overview', 
  onLogout, 
  onNavigate,
  alertCount = 0,
  userProfile = { fullName: 'Alex Mendoza', role: 'System Administrator' } 
}) {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Auto-generate initials from the provided full name
  const getInitials = (name) => {
    if (!name) return 'AM';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const initials = getInitials(userProfile.fullName);

  return (
    <>
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 relative z-40">
        
        {/* Dynamic Breadcrumb Header */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 font-medium">CAPartner</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-bold">{activePage}</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-gray-500 font-medium">All services online</span>
          </div>
          
          {/* Notifications Toggle */}
          <div className="relative">
            <div 
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsUserDropdownOpen(false); 
              }}
              className="relative cursor-pointer p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
              {alertCount > 0 && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                  {alertCount}
                </span>
              )}
            </div>

            {/* Notifications Dropdown Container */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* Dark Green Header */}
                <div className="bg-[#0A3320] px-5 py-4">
                  <h3 className="text-white font-bold text-base mb-0.5">Notifications</h3>
                  <p className="text-emerald-400/80 text-xs">
                    {alertCount} unacknowledged {alertCount === 1 ? 'alert' : 'alerts'}
                  </p>
                </div>
                
                {/* Body State */}
                <div className="p-8 text-center bg-white border-b border-gray-50">
                  <p className="text-sm font-medium text-gray-500">
                    {alertCount > 0 ? `You have ${alertCount} pending alert(s) requiring attention.` : 'No unacknowledged alerts found.'}
                  </p>
                </div>
                
                {/* Footer Link */}
                <button 
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    if (onNavigate) onNavigate('Alerts');
                  }}
                  className="py-3.5 bg-gray-50 hover:bg-gray-100 text-[#0A3320] text-xs font-bold transition-colors w-full cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View all alerts & history &rarr;
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <div 
              onClick={() => {
                setIsUserDropdownOpen(!isUserDropdownOpen);
                setIsNotificationsOpen(false); 
              }}
              className="flex items-center gap-3 pl-6 border-l border-gray-200 cursor-pointer bg-white hover:bg-gray-50 py-1.5 px-2 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#E8F2EC] text-[#0A3320] flex items-center justify-center font-bold text-xs shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{userProfile.fullName}</p>
                <p className="text-[10px] text-gray-500">{userProfile.role}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ml-1 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* User Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-50 mb-1 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E8F2EC] text-[#0A3320] flex items-center justify-center font-bold text-xs shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">My Profile</p>
                    <p className="text-[10px] text-gray-500">{userProfile.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                    if (onNavigate) onNavigate('Settings');
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  Account Settings
                </button>
                <button 
                  onClick={() => {
                    setIsUserDropdownOpen(false); 
                    setShowLogoutModal(true); 
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200 m-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                  <LogOut className="w-5 h-5 ml-0.5" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Confirm Logout</h3>
              </div>
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to log out? You will need to sign in again to access the PSTMD command center.
            </p>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={onLogout}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#E02424] text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                Yes, Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}