import { LayoutDashboard, Monitor, Video, Activity, AlertTriangle, Settings, CheckCircle2 } from 'lucide-react';
import capLogo from '../../assets/CAP LOGO.png';

export default function Sidebar({ activePage = 'Overview', onNavigate, alertBadgeCount }) {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview' },
    { icon: Monitor, label: 'Monitoring' },
    { icon: Video, label: 'Camera' },
    { icon: Activity, label: 'Activity Log' },
    // Use dynamic badge count here! Hide it if the count is 0.
    { icon: AlertTriangle, label: 'Alerts', badge: alertBadgeCount > 0 ? alertBadgeCount : null },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 h-screen bg-[#0A3320] text-white flex flex-col justify-between border-r border-[#115E3E]/30 shrink-0">
      <div>
        <div className="flex items-center gap-3 p-6 mb-4">
          <div className="bg-white p-1.5 rounded-xl shrink-0">
            <img src={capLogo} alt="Logo" className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide leading-none mb-1">CAPartner</h1>
            <p className="text-[7px] tracking-wider text-emerald-200/70 uppercase leading-tight">
              CAPartner sa kalusugan<br/>CAPartner sa kaligtasan
            </p>
          </div>
        </div>

        <div className="px-4">
          <p className="text-[10px] font-bold tracking-[0.15em] text-emerald-500/80 uppercase mb-3 px-2">Workspace</p>
          <nav className="space-y-1">
            {menuItems.map((item, idx) => {
              const isActive = activePage === item.label;
              return (
                <button
                  key={idx}
                  onClick={() => onNavigate && onNavigate(item.label)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all cursor-pointer ${
                    isActive ? 'bg-white text-[#0A3320] shadow-sm' : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="font-semibold text-sm">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
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
          <div className="bg-[#0A3320] p-1.5 rounded-lg text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">All systems operational</p>
            <p className="text-[10px] text-emerald-200/60">Last check: just now</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-2 pt-2 border-t border-[#115E3E]/40">
          <div className="w-10 h-10 rounded-lg bg-[#115E3E] flex items-center justify-center font-bold text-sm">
            AM
          </div>
          <div>
            <p className="text-sm font-bold text-white">Alex Mendoza</p>
            <p className="text-[10px] text-emerald-200/60">System Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}