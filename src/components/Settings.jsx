import { useState } from 'react';
import { LogOut, Mail } from 'lucide-react';

export default function Settings({ onLogout }) {
  const [accounts, setAccounts] = useState([
    { id: 1, name: 'Miguel Reyes', init: 'MR', badge: 'ENF-2401', user: 'miguel.reyes', post: 'North Transport Terminal', active: true },
    { id: 2, name: 'Andrea Dela Cruz', init: 'AD', badge: 'ENF-2402', user: 'andrea.dela.cruz', post: 'Central Public Market', active: true },
    { id: 3, name: 'Jose Santos', init: 'JS', badge: 'ENF-2403', user: 'jose.santos', post: 'South Highway Junction', active: false },
  ]);

  const [toggles, setToggles] = useState({
    siren: true,
    desktop: true,
    lora: true,
    lowBattery: true,
    heartRate: true,
    temp: true,
    offlineEnforcer: true,
    offlineCamera: true,
  });

  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAccountStatus = (id) => {
    setAccounts(accounts.map(acc => 
      acc.id === id ? { ...acc, active: !acc.active } : acc
    ));
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#F8FAF9]">
      
      {/* Top Page Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase mb-2">System configuration</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Settings</h2>
        <p className="text-sm text-gray-500">Manage personnel accounts, notification preferences, and system access.</p>
      </div>

      <div className="grid grid-cols-[1.3fr_1fr] gap-6">
        
        {/* LEFT COLUMN: Account Management */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-8">
          <div className="flex items-start justify-between mb-8 border-b border-gray-100 pb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Account management</h3>
              <p className="text-xs text-gray-500">Create, edit, and deactivate enforcer accounts. Passwords are never displayed.</p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold">
              {accounts.length} accounts
            </span>
          </div>

          {/* Account List */}
          <div className="space-y-4 mb-10">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#E8F2EC] flex items-center justify-center text-sm font-bold text-[#0A3320]">
                    {acc.init}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{acc.name}</h4>
                    <p className="text-[10px] text-gray-500">{acc.badge} · {acc.user} · {acc.post}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${acc.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {acc.active ? 'Active' : 'Inactive'}
                  </span>
                  <button className="px-4 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs transition-colors cursor-pointer">
                    Edit
                  </button>
                  <button 
                    onClick={() => toggleAccountStatus(acc.id)}
                    className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${acc.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                  >
                    {acc.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Simplified Create Account Form */}
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6">
            <h4 className="text-base font-bold text-gray-900 mb-6">Create enforcer account</h4>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] bg-white" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] bg-white" 
                />
              </div>
            </div>

            {/* Email Notification Banner */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 mb-6 flex items-start gap-3">
              <div className="bg-emerald-100 p-1.5 rounded-lg shrink-0 mt-0.5">
                <Mail className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                Upon creation, the system will automatically email a temporary password and secure setup instructions to the provided address.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-xs transition-colors cursor-pointer bg-white">
                Cancel
              </button>
              <button className="px-5 py-2.5 rounded-xl bg-[#0A3320] text-white hover:bg-[#061E12] font-bold text-xs transition-colors cursor-pointer shadow-sm">
                Create account
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          
          {/* Notification Preferences */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-8">
            <div className="mb-6 border-b border-gray-100 pb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Notification preferences</h3>
              <p className="text-xs text-gray-500">Choose which safety and system events generate notifications.</p>
            </div>

            <div className="space-y-0">
              {[
                { key: 'siren', title: 'Audible SOS Siren', desc: 'Play a siren when an SOS signal is received.' },
                { key: 'desktop', title: 'Desktop Notifications', desc: 'Show browser-style notification prompts.' },
                { key: 'lora', title: 'LoRa Fallback Alerts', desc: 'Warn when fallback radio connectivity changes.' },
                { key: 'lowBattery', title: 'Low Battery Warnings', desc: 'Notify when a device falls below its configured threshold.' },
                { key: 'heartRate', title: 'Abnormal Heart Rate Alerts', desc: 'Configurable sensor warning; not a medical diagnosis.' },
                { key: 'temp', title: 'High Body Temperature Alerts', desc: 'Configurable temperature warning; not a medical diagnosis.' },
                { key: 'offlineEnforcer', title: 'Enforcer Offline Alerts', desc: 'Notify when personnel devices stop reporting.' },
                { key: 'offlineCamera', title: 'Camera Offline Alerts', desc: 'Notify when a camera heartbeat is unavailable.' },
              ].map((item, idx) => (
                <div key={item.key} className={`flex items-center justify-between py-4 ${idx !== 7 ? 'border-b border-gray-50' : ''}`}>
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-0.5">{item.title}</h4>
                    <p className="text-[10px] text-gray-500">{item.desc}</p>
                  </div>
                  <button 
                    onClick={() => handleToggle(item.key)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${toggles[item.key] ? 'bg-[#0A3320]' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${toggles[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 border-t border-gray-100 pt-6">
              <button className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs transition-colors cursor-pointer bg-white">
                Reset to default
              </button>
              <button className="px-5 py-2.5 rounded-xl bg-[#0A3320] text-white hover:bg-[#061E12] font-bold text-xs transition-colors cursor-pointer shadow-sm">
                Save changes
              </button>
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-white rounded-3xl border border-red-100 shadow-sm p-8 mt-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-red-600 mb-1">Session Management</h3>
                <p className="text-xs text-gray-500">Securely end your current administrative session.</p>
              </div>
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold text-xs transition-colors cursor-pointer border border-red-100 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}