import { useState } from 'react';
import { Bell, AlertTriangle, VideoOff, BatteryWarning, Radio, CheckCircle2, Check, X, Clock } from 'lucide-react';

export default function Alerts({ onUnacknowledgedCountChange }) {
  const [alerts, setAlerts] = useState([
    {
      id: 1, type: 'SOS Signal', target: 'Miguel Reyes · ENF-2401', desc: 'Manual SOS signal initiated from wearable device.',
      time: 'Today, 10:46 AM', severity: 'CRITICAL', status: 'Acknowledged', icon: AlertTriangle
    },
    {
      id: 2, type: 'Abnormal Heart Rate', target: 'Andrea Dela Cruz · ENF-2402', desc: 'Configured heart-rate warning threshold exceeded at 104 BPM.',
      time: 'Today, 10:14 AM', severity: 'WARNING', status: 'Acknowledged', icon: AlertTriangle
    },
    {
      id: 3, type: 'Camera Offline', target: 'Camera 3 · South Highway', desc: 'Camera stream and heartbeat are unavailable.',
      time: 'Today, 9:56 AM', severity: 'CRITICAL', status: 'Unacknowledged', icon: VideoOff
    },
    {
      id: 4, type: 'Low Battery', target: 'Jose Santos · ENF-2403', desc: 'Device battery reached 18 percent.',
      time: 'Today, 9:42 AM', severity: 'WARNING', status: 'Resolved', icon: BatteryWarning
    },
    {
      id: 5, type: 'LoRa Connection Lost', target: 'Miguel Reyes · ENF-2401', desc: 'LoRa fallback connection was temporarily unavailable.',
      time: 'Yesterday, 4:31 PM', severity: 'INFO', status: 'Resolved', icon: Radio
    },
  ]);

  const [viewedAlert, setViewedAlert] = useState(null);
  const [toast, setToast] = useState(null); // { message: string }

  // State for dropdown filters
  const [severityFilter, setSeverityFilter] = useState('All severities');
  const [deviceFilter, setDeviceFilter] = useState('All enforcers/devices');
  const [statusFilter, setStatusFilter] = useState('All statuses');

  // Dynamic counts for top cards
  const totalAlerts = alerts.length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'Resolved').length;
  const unacknowledgedCount = alerts.filter(a => a.status === 'Unacknowledged').length;
  const resolvedCount = alerts.filter(a => a.status === 'Resolved').length;

  // Show a temporary toast notification in the bottom right
  const showToast = (message) => {
    setToast({ message });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper to update the sidebar badge whenever unacknowledged count changes
  const updateBadge = (newAlerts) => {
    const newCount = newAlerts.filter(a => a.status === 'Unacknowledged').length;
    if (onUnacknowledgedCountChange) onUnacknowledgedCountChange(newCount);
  };

  const handleAcknowledge = (id, e) => {
    if (e) e.stopPropagation();
    const newAlerts = alerts.map(a => a.id === id ? { ...a, status: 'Acknowledged' } : a);
    setAlerts(newAlerts);
    updateBadge(newAlerts);
    const updatedAlert = newAlerts.find(a => a.id === id);
    showToast(`${updatedAlert.type} was marked as acknowledged.`);
    if (viewedAlert && viewedAlert.id === id) setViewedAlert(updatedAlert);
  };

  const handleResolve = (id, e) => {
    if (e) e.stopPropagation();
    const newAlerts = alerts.map(a => a.id === id ? { ...a, status: 'Resolved' } : a);
    setAlerts(newAlerts);
    updateBadge(newAlerts);
    const updatedAlert = newAlerts.find(a => a.id === id);
    showToast(`${updatedAlert.type} was marked as resolved.`);
    setViewedAlert(null); // Close modal on resolve
  };

  const severityStyles = {
    CRITICAL: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', icon: 'text-red-500' },
    WARNING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: 'text-amber-500' },
    INFO: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: 'text-emerald-500' },
  };

  const statusStyles = {
    Unacknowledged: 'bg-gray-100 text-gray-600',
    Acknowledged: 'bg-blue-50 text-blue-600 border border-blue-100',
    Resolved: 'bg-gray-100 text-gray-400',
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#F8FAF9] relative">
      
      {/* Top Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase mb-2">Needs attention</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Alerts and Notifications</h2>
        <p className="text-sm text-gray-500">Configured operational warnings for personnel, IoT devices, connectivity, and cameras.</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"><Bell className="w-6 h-6" /></div>
          <div><p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total alerts</p><h3 className="text-2xl font-bold text-gray-900">{totalAlerts}</h3><p className="text-[10px] text-gray-400">All recorded alerts</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500"><AlertTriangle className="w-6 h-6" /></div>
          <div><p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Critical alerts</p><h3 className="text-2xl font-bold text-gray-900">{criticalCount}</h3><p className="text-[10px] text-gray-400">Immediate review recommended</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500"><Clock className="w-6 h-6" /></div>
          <div><p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Unacknowledged</p><h3 className="text-2xl font-bold text-gray-900">{unacknowledgedCount}</h3><p className="text-[10px] text-gray-400">Awaiting administrator action</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div>
          <div><p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Resolved alerts</p><h3 className="text-2xl font-bold text-gray-900">{resolvedCount}</h3><p className="text-[10px] text-gray-400">Retained in activity history</p></div>
        </div>
      </div>

      {/* Main List Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="flex-1">
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Severity</label>
            <select 
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] bg-white cursor-pointer font-medium"
            >
              <option>All severities</option>
              <option>Critical</option>
              <option>Warning</option>
              <option>Information</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Enforcer or Device</label>
            <select 
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] bg-white cursor-pointer font-medium"
            >
              <option>All enforcers/devices</option>
              <option>Maya Reyes · PST-207</option>
              <option>Noah Cruz · PST-311</option>
              <option>Market East Gate · CAM-03</option>
              <option>Ava Santos · PST-104</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320]" />
          </div>
          <div className="flex-1">
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] bg-white cursor-pointer font-medium"
            >
              <option>All statuses</option>
              <option>Unacknowledged</option>
              <option>Acknowledged</option>
              <option>Resolved</option>
            </select>
          </div>
        </div>

        {/* List of Alerts */}
        <div className="divide-y divide-gray-100">
          {alerts.map((alert) => {
            const theme = severityStyles[alert.severity];
            const isResolved = alert.status === 'Resolved';
            
            return (
              <div key={alert.id} className={`p-6 flex items-start justify-between transition-colors ${isResolved ? 'opacity-60 bg-gray-50/50' : 'hover:bg-gray-50/30'}`}>
                <div className="flex gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${theme.bg}`}>
                    <alert.icon className={`w-6 h-6 ${theme.icon}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${theme.bg} ${theme.text}`}>
                        {alert.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${statusStyles[alert.status]}`}>
                        {alert.status}
                      </span>
                    </div>
                    <h3 className={`text-lg font-bold mb-1 ${isResolved ? 'text-gray-600' : 'text-gray-900'}`}>{alert.type}</h3>
                    <p className="text-xs font-bold text-gray-700 mb-1">{alert.target}</p>
                    <p className="text-xs text-gray-500 mb-2">{alert.desc}</p>
                    <p className="text-[10px] font-medium text-gray-400">{alert.time}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => setViewedAlert(alert)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs transition-colors cursor-pointer"
                  >
                    View details
                  </button>
                  {alert.status === 'Unacknowledged' && (
                    <button 
                      onClick={(e) => handleAcknowledge(alert.id, e)}
                      className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  )}
                  {!isResolved && (
                    <button 
                      onClick={(e) => handleResolve(alert.id, e)}
                      className="px-4 py-2 rounded-xl bg-[#0A3320] text-white hover:bg-[#061E12] font-bold text-xs transition-colors cursor-pointer shadow-sm"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ----------------- VIEW DETAILS MODAL ----------------- */}
      {viewedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-xl animate-in zoom-in-95 duration-200 m-4 relative">
            
            {/* Modal Header */}
            <div className="mb-6">
              <span className={`inline-block px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider mb-4 ${severityStyles[viewedAlert.severity].bg} ${severityStyles[viewedAlert.severity].text}`}>
                {viewedAlert.severity}
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{viewedAlert.type}</h3>
              <p className="text-sm text-gray-600">{viewedAlert.desc}</p>
            </div>

            {/* Info Box */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-4">
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-1">Affected personnel/device</p>
                <p className="text-sm font-bold text-gray-900">{viewedAlert.target}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-1">Reported</p>
                <p className="text-sm font-bold text-gray-900">{viewedAlert.time}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-1">Status</p>
                <p className="text-sm font-bold text-gray-900">{viewedAlert.status}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setViewedAlert(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              {viewedAlert.status === 'Unacknowledged' && (
                <button 
                  onClick={() => handleAcknowledge(viewedAlert.id)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Acknowledge
                </button>
              )}
              {viewedAlert.status !== 'Resolved' && (
                <button 
                  onClick={() => handleResolve(viewedAlert.id)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#0A3320] text-white hover:bg-[#061E12] transition-colors cursor-pointer shadow-sm"
                >
                  Resolve alert
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ----------------- TOAST NOTIFICATION ----------------- */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-[#0A3320] text-white px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3">
            <div className="bg-[#115E3E] rounded-full p-1">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-sm font-bold">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}