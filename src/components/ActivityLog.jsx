import { useState } from 'react';
import { Search } from 'lucide-react';

export default function ActivityLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('All events');
  const [severityFilter, setSeverityFilter] = useState('All severities');
  const [personnelFilter, setPersonnelFilter] = useState('All personnel');

  const logs = [
    { id: 1, time: 'Today, 10:46 AM', type: 'SOS signal', desc: 'Manual SOS warning generated', target: 'Miguel Reyes · ENF-2401', severity: 'CRITICAL', status: 'Open' },
    { id: 2, time: 'Today, 10:22 AM', type: 'Device offline', desc: 'Internet and LoRa connections lost', target: 'Jose Santos · ENF-2403', severity: 'CRITICAL', status: 'Acknowledged' },
    { id: 3, time: 'Today, 10:18 AM', type: 'Sensor warning', desc: 'Temperature threshold warning at 37.8 °C', target: 'Andrea Dela Cruz · ENF-2402', severity: 'WARNING', status: 'Open' },
    { id: 4, time: 'Today, 9:56 AM', type: 'Camera outage', desc: 'Camera heartbeat unavailable', target: 'Camera 3 · CAM-003', severity: 'CRITICAL', status: 'Open' },
    { id: 5, time: 'Today, 9:42 AM', type: 'Low battery', desc: 'Wearable device battery at 18%', target: 'Jose Santos · ENF-2403', severity: 'WARNING', status: 'Resolved' },
    { id: 6, time: 'Yesterday, 4:31 PM', type: 'LoRa disconnection', desc: 'LoRa fallback lost and restored after 2 minutes', target: 'Miguel Reyes · ENF-2401', severity: 'INFO', status: 'Resolved' },
  ];

  const severityStyles = {
    CRITICAL: 'bg-red-50 text-red-600 border border-red-100',
    WARNING: 'bg-amber-50 text-amber-700 border border-amber-100',
    INFO: 'bg-sky-50 text-sky-600 border border-sky-100',
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#F8FAF9]">
      
      {/* Top Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase mb-2">Historical record</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Activity Log</h2>
          <p className="text-sm text-gray-500">Historical records of system events, alerts, and personnel activities.</p>
        </div>
        <button className="bg-[#0A3320] hover:bg-[#061E12] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer">
          Export Activity Log
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity records..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none text-xs transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm mb-6 grid grid-cols-5 gap-4">
        <div>
          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Event Type</label>
          <select 
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] bg-white cursor-pointer font-medium"
          >
            <option>All events</option>
            <option>SOS signal</option>
            <option>Device offline</option>
            <option>Sensor warning</option>
            <option>Camera outage</option>
            <option>Low battery</option>
          </select>
        </div>

        <div>
          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Severity</label>
          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] bg-white cursor-pointer font-medium"
          >
            <option>All severities</option>
            <option>CRITICAL</option>
            <option>WARNING</option>
            <option>INFO</option>
          </select>
        </div>

        <div>
          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Enforcer / Device</label>
          <select 
            value={personnelFilter}
            onChange={(e) => setPersonnelFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] bg-white cursor-pointer font-medium"
          >
            <option>All personnel</option>
            <option>Miguel Reyes</option>
            <option>Andrea Dela Cruz</option>
            <option>Jose Santos</option>
            <option>Camera 3</option>
          </select>
        </div>

        <div>
          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Date</label>
          <input type="date" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] cursor-pointer" />
        </div>

        <div>
          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Sort</label>
          <select className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] bg-white cursor-pointer font-medium">
            <option>Newest first</option>
            <option>Oldest first</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                <th className="py-3.5 px-6">Date and time</th>
                <th className="py-3.5 px-6">Event type</th>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6">Related enforcer or device</th>
                <th className="py-3.5 px-6">Severity</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-500 whitespace-nowrap">{log.time}</td>
                  <td className="py-4 px-6 font-bold text-gray-900 whitespace-nowrap">{log.type}</td>
                  <td className="py-4 px-6 text-gray-700 font-medium">{log.desc}</td>
                  <td className="py-4 px-6 text-gray-800 font-semibold">{log.target}</td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${severityStyles[log.severity]}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">{log.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/30">
          <p>Showing 6 of 10 historical records</p>
          <div className="flex items-center gap-2">
            <button disabled className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 font-bold text-xs opacity-50 cursor-not-allowed">
              Previous
            </button>
            <span className="px-3 py-1.5 font-bold text-gray-700">1 / 2</span>
            <button className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-bold text-xs cursor-pointer transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}