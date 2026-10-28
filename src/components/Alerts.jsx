import { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Check, Clock, X, ShieldAlert, Sparkles } from 'lucide-react';

export default function Alerts({ alerts = [], selectedAlertId, onAcknowledge, onResolve, onClearAll }) {
  const [viewedAlert, setViewedAlert] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', actionType: null, alertId: null });
  const [highlightedId, setHighlightedId] = useState(null);

  // Gamit ang ref para sa auto-scroll patungo sa pinindot na alert item
  const alertItemRefs = useRef({});

  useEffect(() => {
    if (selectedAlertId) {
      setHighlightedId(selectedAlertId);
      const target = alerts.find(a => a.id === selectedAlertId);
      if (target) {
        setViewedAlert(target);
      }

      // Auto-scroll papunta sa mismong alert card kung nasaan man ito sa listahan
      if (alertItemRefs.current[selectedAlertId]) {
        alertItemRefs.current[selectedAlertId].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }

      const timer = setTimeout(() => setHighlightedId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [selectedAlertId, alerts]);

  const totalAlerts = alerts.length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'Resolved').length;
  const unacknowledgedCount = alerts.filter(a => a.status === 'Unacknowledged').length;
  const resolvedCount = alerts.filter(a => a.status === 'Resolved').length;

  const showToast = (message) => {
    setToast({ message });
    setTimeout(() => setToast(null), 3500);
  };

  const promptAction = (actionType, alertId, title) => {
    let message = '';
    if (actionType === 'acknowledge') {
      message = 'Are you sure you want to acknowledge this alert? This confirms that station personnel are aware of the reported incident along Camarin Road.';
    } else if (actionType === 'resolve') {
      message = 'Important Warning: Resolving this alert will close the active incident tracking. Ensure all safety protocols have been verified before proceeding.';
    } else if (actionType === 'clearAll') {
      message = 'Important Warning: This will clear and archive all notifications and alert logs from the current session view.';
    }

    setConfirmModal({
      show: true,
      title: title || 'Confirm Action',
      message,
      actionType,
      alertId
    });
  };

  const handleConfirmExecute = () => {
    const { actionType, alertId } = confirmModal;
    
    if (actionType === 'acknowledge') {
      onAcknowledge(alertId);
      showToast(`Alert was successfully marked as acknowledged.`);
      const updated = alerts.find(a => a.id === alertId);
      if (viewedAlert && viewedAlert.id === alertId) {
        setViewedAlert({ ...updated, status: 'Acknowledged' });
      }
    } else if (actionType === 'resolve') {
      onResolve(alertId);
      showToast(`Alert was successfully marked as resolved.`);
      setViewedAlert(null);
    } else if (actionType === 'clearAll') {
      if (onClearAll) onClearAll();
      showToast(`All notifications have been cleared.`);
    }

    setConfirmModal({ show: false, title: '', message: '', actionType: null, alertId: null });
  };

  const statusStyles = {
    Unacknowledged: 'bg-gray-100 text-gray-600',
    Acknowledged: 'bg-blue-50 text-blue-600 border border-blue-100',
    Resolved: 'bg-gray-100 text-gray-400',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto bg-[#F8FAF9] relative">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase mb-2">Needs attention</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Alerts and Notifications</h2>
          <p className="text-sm text-gray-500">Configured operational warnings for personnel, IoT devices, connectivity, and cameras.</p>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={() => promptAction('clearAll', null, 'Clear All Alerts')}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer shadow-red-600/20"
          >
            Clear all notifications
          </button>
        )}
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"><Bell className="w-6 h-6" /></div>
          <div><p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total alerts</p><h3 className="text-2xl font-bold text-gray-900">{totalAlerts}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500"><AlertTriangle className="w-6 h-6" /></div>
          <div><p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Critical alerts</p><h3 className="text-2xl font-bold text-gray-900">{criticalCount}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500"><Clock className="w-6 h-6" /></div>
          <div><p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Unacknowledged</p><h3 className="text-2xl font-bold text-gray-900">{unacknowledgedCount}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div>
          <div><p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Resolved alerts</p><h3 className="text-2xl font-bold text-gray-900">{resolvedCount}</h3></div>
        </div>
      </div>

      {/* Main List Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="divide-y divide-gray-100">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const isCritical = alert.severity === 'CRITICAL';
              const isResolved = alert.status === 'Resolved';
              const isSelected = highlightedId === alert.id;
              
              return (
                <div 
                  key={alert.id} 
                  ref={(el) => (alertItemRefs.current[alert.id] = el)}
                  className={`p-4 sm:p-6 transition-all duration-300 ${
                    isResolved 
                      ? 'bg-gray-50/70 hover:bg-gray-100/60' 
                      : isCritical 
                        ? 'bg-red-50/60 border-l-4 border-red-600 hover:bg-red-50/80' 
                        : 'hover:bg-gray-50/30'
                  } ${isSelected ? 'ring-4 ring-emerald-500 bg-emerald-100/50 shadow-lg scale-[1.01]' : ''}`}
                >
                  <div className="flex items-start gap-3 sm:gap-5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl ${
                      isCritical ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                            isCritical ? 'bg-red-600 text-white shadow-sm' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${statusStyles[alert.status]}`}>
                            {alert.status}
                          </span>
                          {/* Malinaw na indicator kapag galing sa Navbar interaction */}
                          {isSelected && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-emerald-600 text-white animate-bounce flex items-center gap-1.5 shadow-sm">
                              <Sparkles className="w-3.5 h-3.5" /> Selected from Notification Bell
                            </span>
                          )}
                        </div>

                        {/* Conditional Button: Kapag Resolved na, dark green na "View" button; Kapag hindi pa, "View details & actions" */}
                        {isResolved ? (
                          <button
                            onClick={() => setViewedAlert(alert)}
                            className="inline-flex items-center justify-center rounded-xl bg-[#0A3320] text-white px-5 py-2 text-xs font-bold hover:bg-[#061E12] active:scale-95 transition-all shadow-sm cursor-pointer"
                          >
                            View
                          </button>
                        ) : (
                          <button
                            onClick={() => setViewedAlert(alert)}
                            className="inline-flex items-center justify-center rounded-xl bg-[#0A3320] text-white px-4 py-2 text-xs font-bold hover:bg-[#061E12] active:scale-95 transition-all shadow-sm cursor-pointer"
                          >
                            View details & actions
                          </button>
                        )}
                      </div>

                      <h3 className={`mt-2 text-base font-bold sm:text-lg ${isResolved ? 'text-gray-700' : isCritical ? 'text-red-950' : 'text-gray-900'}`}>
                        {alert.type}
                      </h3>
                      <p className="mt-1 text-[11px] font-bold text-gray-700 sm:text-xs">{alert.target}</p>
                      <p className="mt-1 text-[11px] text-gray-600 sm:text-xs">{alert.desc}</p>
                      <p className="mt-2 text-[10px] font-medium text-gray-400">{alert.time}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-sm text-gray-400 font-medium">
              No alerts or notifications recorded.
            </div>
          )}
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 relative border border-gray-100">
            
            <button 
              onClick={() => setViewedAlert(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6 pr-8">
              <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider mb-3 ${
                viewedAlert.severity === 'CRITICAL' ? 'bg-red-600 text-white font-bold' : 'bg-amber-100 text-amber-800'
              }`}>
                {viewedAlert.severity}
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{viewedAlert.type}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{viewedAlert.desc}</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 mb-6 space-y-3 border border-gray-100 text-xs">
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Affected personnel / device</p>
                <p className="font-bold text-gray-900">{viewedAlert.target}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Timestamp reported</p>
                <p className="font-bold text-gray-900">{viewedAlert.time}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Current Status</p>
                <p className="font-bold text-gray-900">{viewedAlert.status}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button 
                onClick={() => setViewedAlert(null)}
                className="w-full sm:flex-1 py-3 rounded-xl border border-gray-200 font-bold text-xs bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              {viewedAlert.status === 'Unacknowledged' && (
                <button 
                  onClick={() => promptAction('acknowledge', viewedAlert.id, 'Acknowledge Alert')}
                  className="w-full sm:flex-1 py-3 rounded-xl font-bold text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm cursor-pointer"
                >
                  Acknowledge
                </button>
              )}
              {viewedAlert.status !== 'Resolved' && (
                <button 
                  onClick={() => promptAction('resolve', viewedAlert.id, 'Resolve Alert')}
                  className="w-full sm:flex-1 py-3 rounded-xl font-bold text-xs bg-[#0A3320] text-white hover:bg-[#061E12] transition-colors shadow-sm cursor-pointer"
                >
                  Resolve alert
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 text-center">
            
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-amber-100">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
            
            <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 mb-6 text-left">
              <p className="text-[10px] font-bold tracking-wider text-amber-800 uppercase mb-1">Important Warning</p>
              <p className="text-xs text-amber-900/80 leading-relaxed">{confirmModal.message}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmModal({ show: false, title: '', message: '', actionType: null, alertId: null })}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-xs bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExecute}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-[#0A3320] text-white hover:bg-[#061E12] transition-colors shadow-lg shadow-[#0A3320]/20 cursor-pointer"
              >
                Confirm Action
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-[#0A3320] text-white px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3 border border-emerald-500/30">
            <div className="bg-[#115E3E] rounded-full p-1 text-emerald-400">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold tracking-wide">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}