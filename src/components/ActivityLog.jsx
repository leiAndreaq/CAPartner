import { useState } from 'react';
import { Search, Download, Clock, Activity, AlertCircle, ShieldAlert, CheckCircle2, Eye, X, Battery } from 'lucide-react';

export default function ActivityLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('All events');
  const [severityFilter, setSeverityFilter] = useState('All severities');
  const [personnelFilter, setPersonnelFilter] = useState('All personnel');
  const [page, setPage] = useState(1);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const logs = [
    { 
      id: 1, time: 'Today, 11:20 AM', type: 'SOS Alert', desc: 'Manual SOS emergency button triggered by enforcer', target: 'Miguel Reyes · ENF-2401', severity: 'CRITICAL', status: 'Open',
      hr: '115 BPM', temp: '37.2 °C', motion: 'Moving (Active Patrol)', battery: '86%', internet: 'Online (Excellent)', lora: 'Acknowledged (RSSI: -72 dBm)', post: 'North Transport Terminal' 
    },
    { 
      id: 2, time: 'Today, 11:15 AM', type: 'Telemetry Warning', desc: 'Abnormal Heart Rate detected: 125 BPM', target: 'Andrea Dela Cruz · ENF-2402', severity: 'WARNING', status: 'Open',
      hr: '125 BPM (High)', temp: '37.8 °C', motion: 'Stationary (Resting)', battery: '64%', internet: 'Online (Good)', lora: 'Packet Retried', post: 'Central Public Market' 
    },
    { 
      id: 3, time: 'Today, 11:05 AM', type: 'Camera Alert', desc: 'Unauthorized movement detected in restricted zone', target: 'Camera 3 · CAM-003', severity: 'CRITICAL', status: 'Acknowledged',
      hr: '--', temp: '--', motion: '--', battery: '95%', internet: 'Online', lora: 'Connected', post: 'Sector A Perimeter' 
    },
    { 
      id: 4, time: 'Today, 10:50 AM', type: 'Motion Alert', desc: 'Enforcer stationary for > 20 mins during active patrol', target: 'Andrea Dela Cruz · ENF-2402', severity: 'WARNING', status: 'Resolved',
      hr: '98 BPM', temp: '37.5 °C', motion: 'Stationary', battery: '64%', internet: 'Online', lora: 'Stable', post: 'Central Public Market' 
    },
    { 
      id: 5, time: 'Today, 10:22 AM', type: 'Connectivity Lost', desc: 'Internet connection lost, falling back to LoRa network', target: 'Jose Santos · ENF-2403', severity: 'WARNING', status: 'Acknowledged',
      hr: '--', temp: '--', motion: 'Offline / Inactive', battery: '18%', internet: 'No Signal', lora: 'Timeout (No Response)', post: 'South Highway Junction' 
    },
    { 
      id: 6, time: 'Today, 10:18 AM', type: 'Sensor Warning', desc: 'Body temperature threshold reached: 38.5 °C', target: 'Miguel Reyes · ENF-2401', severity: 'CRITICAL', status: 'Open',
      hr: '110 BPM', temp: '38.5 °C (Elevated)', motion: 'Active', battery: '85%', internet: 'Online', lora: 'Acknowledged', post: 'North Transport Terminal' 
    },
    { 
      id: 7, time: 'Today, 9:56 AM', type: 'Camera Outage', desc: 'Live video feed disconnected / heartbeat unavailable', target: 'Camera 1 · CAM-001', severity: 'CRITICAL', status: 'Open',
      hr: '--', temp: '--', motion: '--', battery: '--', internet: 'Disconnected', lora: '--', post: 'Main Gate' 
    },
    { 
      id: 8, time: 'Today, 9:42 AM', type: 'Low Battery', desc: 'Wearable device battery dropped to 18%', target: 'Jose Santos · ENF-2403', severity: 'WARNING', status: 'Resolved',
      hr: '--', temp: '--', motion: 'Inactive', battery: '18%', internet: 'Offline', lora: 'Timeout', post: 'South Highway Junction' 
    },
  ];

  const severityStyles = {
    CRITICAL: 'bg-red-50 text-red-700 border border-red-200',
    WARNING: 'bg-amber-50 text-amber-700 border border-amber-200',
    INFO: 'bg-sky-50 text-sky-700 border border-sky-200',
  };

  const severityIcons = {
    CRITICAL: <ShieldAlert className="w-3.5 h-3.5" />,
    WARNING: <AlertCircle className="w-3.5 h-3.5" />,
    INFO: <CheckCircle2 className="w-3.5 h-3.5" />,
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = !searchQuery || [log.type, log.desc, log.target].join(' ').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = eventTypeFilter === 'All events' || log.type === eventTypeFilter;
    const matchesSeverity = severityFilter === 'All severities' || log.severity === severityFilter;
    const matchesPersonnel = personnelFilter === 'All personnel' || log.target.includes(personnelFilter);
    return matchesSearch && matchesEvent && matchesSeverity && matchesPersonnel;
  });

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const handleExportLogs = () => {
    const rows = [
      ['Date and time', 'Event type', 'Description', 'Related enforcer or device', 'Severity', 'Status'],
      ...filteredLogs.map(log => [log.time, log.type, log.desc, log.target, log.severity, log.status]),
    ];

    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'capartner-activity-log.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSingleIncident = (log) => {
    const rows = [
      ['Field', 'Details'],
      ['Timestamp', log.time],
      ['Event Type', log.type],
      ['Description', log.desc],
      ['Target / Enforcer', log.target],
      ['Severity', log.severity],
      ['Incident Status', log.status],
      ['Assigned Post', log.post],
      ['Heart Rate', log.hr],
      ['Body Temp', log.temp],
      ['Motion Status', log.motion],
      ['Battery Level', log.battery],
      ['Internet Status', log.internet],
      ['LoRa Feedback', log.lora]
    ];

    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incident-report-${log.id}-${log.type.toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePageChange = (nextPage) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

  const uniqueEventTypes = ['All events', ...new Set(logs.map(log => log.type))];
  const uniquePersonnel = ['All personnel', ...new Set(logs.map(log => log.target.split(' · ')[0]))];

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto bg-[#F4F7F5] font-sans transition-all duration-300">
      
      {/* Top Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8 animate-in fade-in duration-500">
        <div>
          <p className="text-[10px] font-black tracking-[0.15em] text-[#0A3320] uppercase mb-1">System Audit & Records</p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" /> Activity Log & Telemetry History
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-gray-500">Historical records of telemetry, camera alerts, and personnel activities.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportLogs}
            className="bg-[#0A3320] hover:bg-[#061E12] text-white px-5 py-3 rounded-xl text-xs font-black transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Activity Log
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 animate-in slide-in-from-bottom-2 duration-500">
        <div className="relative w-full max-w-lg">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search by event, enforcer name, badge, or description..." 
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none text-sm font-semibold transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 animate-in slide-in-from-bottom-3 duration-500">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Event Type</label>
          <select 
            value={eventTypeFilter}
            onChange={(e) => { setEventTypeFilter(e.target.value); setPage(1); }}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] bg-gray-50 cursor-pointer font-bold transition-colors"
          >
            {uniqueEventTypes.map((type, i) => (
              <option key={i} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Severity</label>
          <select 
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] bg-gray-50 cursor-pointer font-bold transition-colors"
          >
            <option value="All severities">All severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Enforcer / Device</label>
          <select 
            value={personnelFilter}
            onChange={(e) => { setPersonnelFilter(e.target.value); setPage(1); }}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] bg-gray-50 cursor-pointer font-bold transition-colors"
          >
            {uniquePersonnel.map((person, i) => (
              <option key={i} value={person}>{person}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Date</label>
          <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] bg-gray-50 cursor-pointer font-bold transition-colors" />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Sort By</label>
          <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] bg-gray-50 cursor-pointer font-bold transition-colors">
            <option>Newest first</option>
            <option>Oldest first</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-6 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Desktop View */}
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-[11px] font-black tracking-wider text-gray-500 uppercase">
                <th className="py-4 px-6">Date and time</th>
                <th className="py-4 px-6">Event type</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6">Source / Enforcer</th>
                <th className="py-4 px-6">Severity</th>
                <th className="py-4 px-6">Current Status</th>
                <th className="py-4 px-6 text-center">Review & Incident Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors duration-200 group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 font-bold text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {log.time}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-black text-gray-900 whitespace-nowrap">{log.type}</td>
                    <td className="py-4 px-6 text-gray-700 font-semibold">{log.desc}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex px-3 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 font-bold text-[11px]">
                        {log.target}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black shadow-sm ${severityStyles[log.severity]}`}>
                        {severityIcons[log.severity]} {log.severity}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black inline-flex items-center gap-1.5 border ${
                        log.status === 'Resolved' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : log.status === 'Acknowledged' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          log.status === 'Resolved' ? 'bg-emerald-500' : log.status === 'Acknowledged' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        {log.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {log.target.includes('ENF-') ? (
                        <button
                          onClick={() => setSelectedIncident(log)}
                          className="px-3.5 py-2 rounded-xl bg-[#0A3320] hover:bg-[#061E12] text-white font-black text-[11px] inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Incident Details
                        </button>
                      ) : (
                        <span className="text-gray-400 font-bold text-[11px]">N/A (Camera)</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500 font-bold text-sm">
                    No matching activity records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="xl:hidden divide-y divide-gray-100">
          {paginatedLogs.length > 0 ? (
            paginatedLogs.map((log) => (
              <div key={log.id} className="p-5 hover:bg-gray-50 transition-colors space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {log.time}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black ${severityStyles[log.severity]}`}>
                    {severityIcons[log.severity]} {log.severity}
                  </span>
                </div>

                <div>
                  <p className="text-base font-black text-gray-900">{log.type}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-600 leading-relaxed">{log.desc}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2">
                  <span className="inline-flex px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 font-bold text-[10px] max-w-[180px] truncate">
                    {log.target}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                      log.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : log.status === 'Acknowledged' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {log.status}
                    </span>
                    {log.target.includes('ENF-') && (
                      <button
                        onClick={() => setSelectedIncident(log)}
                        className="px-3 py-1.5 rounded-lg bg-[#0A3320] text-white font-black text-[10px] inline-flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3 h-3" /> Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 font-bold text-sm">
              No matching activity records found.
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-5 border-t border-gray-200 flex items-center justify-between text-xs font-bold text-gray-500 bg-gray-50">
          <p>Showing {filteredLogs.length ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, filteredLogs.length)} of {filteredLogs.length} records</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || filteredLogs.length === 0}
              className={`px-4 py-2 rounded-xl border border-gray-200 text-xs font-black transition-colors ${page === 1 || filteredLogs.length === 0 ? 'bg-white text-gray-400 opacity-50 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer active:scale-95'}`}
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-white rounded-xl border border-gray-200 font-black text-[#0A3320] shadow-sm">
              {filteredLogs.length ? page : 0} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || filteredLogs.length === 0}
              className={`px-4 py-2 rounded-xl border border-gray-200 text-xs font-black transition-colors ${page === totalPages || filteredLogs.length === 0 ? 'bg-white text-gray-400 opacity-50 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer active:scale-95'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* INCIDENT REVIEW & TELEMETRY DETAILS MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedIncident(null)} 
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-black text-base shadow-sm shrink-0">
                {selectedIncident.target.split(' ')[0][0]}
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider mb-1">
                  Incident Review & Telemetry Data
                </span>
                <h3 className="text-lg sm:text-xl font-black text-gray-900">{selectedIncident.target}</h3>
              </div>
            </div>

            {/* Event Summary Banner (Kasama na ang Status kung Resolved, Acknowledged, o Open) */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-400 uppercase">Event Type:</span>
                <span className="font-black text-gray-900">{selectedIncident.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-400 uppercase">Timestamp:</span>
                <span className="font-black text-gray-900">{selectedIncident.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-400 uppercase">Severity Level:</span>
                <span className={`px-2 py-0.5 rounded font-black text-[10px] ${severityStyles[selectedIncident.severity]}`}>{selectedIncident.severity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-400 uppercase">Incident Status:</span>
                <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black inline-flex items-center gap-1.5 border ${
                  selectedIncident.status === 'Resolved' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : selectedIncident.status === 'Acknowledged' 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    selectedIncident.status === 'Resolved' ? 'bg-emerald-500' : selectedIncident.status === 'Acknowledged' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  {selectedIncident.status}
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-400 uppercase block mb-1">Description:</span>
                <p className="font-semibold text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200">{selectedIncident.desc}</p>
              </div>
            </div>

            {/* Detailed Biometric & Device Telemetry Data for Review */}
            <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider mb-3">Captured Telemetry & Device Data</h4>
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 mb-6 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <span className="font-bold text-gray-600 uppercase">Assigned Post:</span>
                <span className="font-black text-gray-900">{selectedIncident.post}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <span className="font-bold text-gray-600 uppercase">Heart Rate:</span>
                <span className="font-black text-emerald-800">{selectedIncident.hr}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <span className="font-bold text-gray-600 uppercase">Body Temperature:</span>
                <span className="font-black text-emerald-800">{selectedIncident.temp}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <span className="font-bold text-gray-600 uppercase">Motion Status:</span>
                <span className="font-black text-gray-900">{selectedIncident.motion}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <span className="font-bold text-gray-600 uppercase">Battery Level:</span>
                <span className="font-black text-emerald-800 flex items-center gap-1"><Battery className="w-3.5 h-3.5" /> {selectedIncident.battery}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <span className="font-bold text-gray-600 uppercase">Internet Link:</span>
                <span className="font-black text-emerald-800">{selectedIncident.internet}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-600 uppercase">LoRa Feedback:</span>
                <span className="font-black text-gray-900">{selectedIncident.lora}</span>
              </div>
            </div>

            {/* Modal Footer with Export Button */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 flex-wrap">
              <button
                onClick={() => handleExportSingleIncident(selectedIncident)}
                className="px-4 py-3 rounded-xl bg-white border-2 border-[#0A3320] text-[#0A3320] font-black text-xs hover:bg-emerald-50 transition-colors cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
              >
                <Download className="w-4 h-4" /> Export Incident Details
              </button>

              <button
                onClick={() => setSelectedIncident(null)}
                className="px-6 py-3 rounded-xl bg-[#0A3320] text-white font-black text-xs hover:bg-[#061E12] transition-colors cursor-pointer shadow-md active:scale-95"
              >
                Close & Finish Review
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}