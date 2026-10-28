import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, User, Trash2, ChevronDown, X, ShieldAlert } from 'lucide-react';

export default function Navbar({ activePage, notifications = [], onNavigate, onClearAll, onOpenSidebar, adminProfile }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const filteredNotifications = notifications.filter(item => {
    if (activeTab === 'All') return true;
    if (activeTab === 'SOS') return item.category === 'SOS';
    if (activeTab === 'Health') return item.category === 'Health';
    if (activeTab === 'Connection') return item.category === 'Connection';
    if (activeTab === 'Device') return item.category === 'Device';
    return true;
  });

  const unacknowledgedList = notifications.filter(n => n.status === 'Unacknowledged');
  const unreadCount = unacknowledgedList.length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'AM';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between shrink-0 relative z-30">
      
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 lg:hidden transition-colors cursor-pointer"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-500">
          <span className="hidden sm:inline">CAPartner</span>
          <span className="hidden sm:inline text-gray-300">/</span>
          <span className="text-gray-900 truncate max-w-[180px] sm:max-w-xs">{activePage}</span>
        </div>
      </div>

      {/* Right: Status, Notifications, & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* System Online Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-800">All services online</span>
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-all cursor-pointer flex items-center justify-center"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Panel */}
          {showNotifications && (
            <div className="fixed inset-x-0 bottom-0 top-16 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-[410px] sm:max-h-[85vh] bg-white sm:rounded-3xl shadow-2xl border-t sm:border border-gray-100 overflow-hidden z-50 flex flex-col animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
              <div className="p-4 bg-[#0A3320] text-white flex items-center justify-between shrink-0">
                <div>
                  <h4 className="font-bold text-sm">Notifications</h4>
                  <p className="text-[10px] text-emerald-200/80">{unreadCount} unacknowledged alerts</p>
                </div>

                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      title="Clear all alerts"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 sm:hidden transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs Bar */}
              <div className="bg-[#082B1A] px-3 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 border-t border-emerald-900/50 scrollbar-none">
                {['All', 'SOS', 'Health', 'Connection', 'Device'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === tab 
                        ? 'bg-white/20 text-white shadow-sm border border-white/20' 
                        : 'text-emerald-200/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Notification Items */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        onNavigate('Alerts', item.id);
                        setShowNotifications(false);
                      }}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          item.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.severity}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{item.time}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-900 mb-0.5">{item.type}</p>
                      <p className="text-[11px] text-gray-500 line-clamp-2">{item.target} - {item.desc}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-xs text-gray-400 font-medium">
                    No alerts found for "{activeTab}".
                  </div>
                )}
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100 text-center shrink-0">
                <button
                  onClick={() => {
                    onNavigate('Alerts');
                    setShowNotifications(false);
                  }}
                  className="text-xs font-bold text-[#0A3320] hover:underline cursor-pointer"
                >
                  View all alerts & history →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu Dropdown (WALANG LOGOUT OPTION) */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0A3320] text-white font-bold flex items-center justify-center text-xs overflow-hidden shadow-xs">
              {adminProfile?.avatar ? (
                <img src={adminProfile.avatar} alt="Admin" className="w-full h-full object-cover" />
              ) : (
                getInitials(adminProfile?.name)
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{adminProfile?.name || 'Alex Mendoza'}</p>
              <p className="text-[9px] text-gray-500 font-medium">System Administrator</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 py-1.5">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900 truncate">{adminProfile?.name || 'Alex Mendoza'}</p>
                <p className="text-[10px] text-gray-500 truncate">@{adminProfile?.username || 'alex.admin'}</p>
              </div>

              <button
                onClick={() => {
                  onNavigate('Admin Account Settings');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-gray-400" /> Admin Account Settings
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Clear All Warning Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-amber-100">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Clear All Notifications</h3>
            <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 mb-6 text-left">
              <p className="text-[10px] font-bold tracking-wider text-amber-800 uppercase mb-1">Important Warning</p>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                Are you sure you want to clear all active alerts? This action will permanently remove all unacknowledged emergency and system notifications from the active log.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-xs bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearAll) onClearAll();
                  setShowClearConfirm(false);
                  setShowNotifications(false);
                }}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-[#0A3320] text-white hover:bg-[#061E12] transition-colors shadow-lg cursor-pointer"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}