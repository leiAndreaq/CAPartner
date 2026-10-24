import { useState } from 'react';
import { Monitor, RefreshCw, Eye, Trash2, Loader2, Activity, MapPin, Clock, ArrowLeft, Radio, X, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export default function Monitoring() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewEnforcer, setViewEnforcer] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const initialEnforcers = [
    { 
      id: 1, name: 'Miguel Reyes', badge: 'ENF-2401', status: 'Normal', 
      post: 'North Transport Terminal', locType: 'CURRENT', address: 'Terminal Road, Brgy. San Roque', 
      color: 'emerald', time: 'Today, 10:45:12 AM', coords: [14.6507, 120.9822], hr: '82', temp: '36.6', motion: 'Moving', battery: '86%'
    },
    { 
      id: 2, name: 'Andrea Dela Cruz', badge: 'ENF-2402', status: 'Attention', 
      post: 'Central Public Market', locType: 'CURRENT', address: 'Mabini Street, Market District', 
      color: 'amber', time: 'Today, 10:43:08 AM', coords: [14.6488, 120.9850], hr: '104', temp: '37.8', motion: 'Stationary', battery: '64%'
    },
    { 
      id: 3, name: 'Jose Santos', badge: 'ENF-2403', status: 'Offline', 
      post: 'South Highway Junction', locType: 'LAST KNOWN', address: 'South Highway, Brgy. Mabuhay', 
      color: 'red', time: 'Today, 10:21:44 AM', coords: [14.6450, 120.9880], hr: '--', temp: '--', motion: 'No Signal', battery: '18%'
    }
  ];

  const [enforcers, setEnforcers] = useState(initialEnforcers);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setEnforcers(initialEnforcers);
      setIsLoading(false);
    }, 1200);
  };

  const confirmDelete = () => {
    setEnforcers(enforcers.filter((e) => e.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  const filteredEnforcers = enforcers.filter((enf) => {
    const matchesSearch = 
      enf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enf.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enf.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enf.post.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && enf.id === Number(activeTab);
  });

  const colors = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    red: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#F8FAF9]">
      
      {/* DETAILED VIEW */}
      {viewEnforcer ? (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          
          <button 
            onClick={() => setViewEnforcer(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0A3320] hover:underline mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to monitoring
          </button>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between mb-8 shadow-sm">
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl ${colors[viewEnforcer.color].bg} ${colors[viewEnforcer.color].text}`}>
                {viewEnforcer.name.split(' ').map(n=>n[0]).join('')}
              </div>
              <div>
                <p className="text-[9px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-1">FIELD PERSONNEL PROFILE</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-0.5">{viewEnforcer.name}</h2>
                <p className="text-xs text-gray-500 font-medium">Badge {viewEnforcer.badge} · Assigned to {viewEnforcer.post}</p>
              </div>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${colors[viewEnforcer.color].bg} ${colors[viewEnforcer.color].text} flex items-center gap-2`}>
              <span className={`w-2 h-2 rounded-full ${colors[viewEnforcer.color].dot}`}></span> {viewEnforcer.status}
            </span>
          </div>

          {/* Historical Range Header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-bold text-gray-700 text-sm">Historical reading range</h3>
            <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-medium text-gray-500">
            </div>
          </div>

          {/* Charts and Map Row */}
          <div className="grid grid-cols-[1.3fr_1fr] gap-6 mb-6">
            
            {/* Health Monitoring Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#0A3320]">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Health monitoring</h3>
                  <p className="text-[10px] text-gray-400">Historical sample readings · Last 24 Hours</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                
                {/* Heart Rate Chart */}
                <div className="flex flex-col w-full">
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 text-sm">Heart rate</h4>
                    <p className="text-[10px] text-gray-400 mb-2">Last 24 Hours</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">{viewEnforcer.hr}</span>
                      <span className="text-[10px] text-gray-500 font-bold">BPM</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full min-h-[140px] relative">
                    <svg viewBox="0 0 350 120" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="hr-grad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="25" x2="350" y2="25" stroke="#f3f4f6" strokeWidth="1.5" />
                      <line x1="0" y1="60" x2="350" y2="60" stroke="#f3f4f6" strokeWidth="1.5" />
                      <line x1="0" y1="95" x2="350" y2="95" stroke="#f3f4f6" strokeWidth="1.5" />
                      
                      <polygon points="0,90 50,70 100,85 150,50 200,75 250,30 300,45 350,25 350,95 0,95" fill="url(#hr-grad)" />
                      <polyline points="0,90 50,70 100,85 150,50 200,75 250,30 300,45 350,25" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      
                      <circle cx="0" cy="90" r="3.5" fill="white" stroke="#10b981" strokeWidth="2" />
                      <circle cx="50" cy="70" r="3.5" fill="white" stroke="#10b981" strokeWidth="2" />
                      <circle cx="100" cy="85" r="3.5" fill="white" stroke="#10b981" strokeWidth="2" />
                      <circle cx="150" cy="50" r="3.5" fill="white" stroke="#10b981" strokeWidth="2" />
                      <circle cx="200" cy="75" r="3.5" fill="white" stroke="#10b981" strokeWidth="2" />
                      <circle cx="250" cy="30" r="3.5" fill="white" stroke="#10b981" strokeWidth="2" />
                      <circle cx="300" cy="45" r="3.5" fill="white" stroke="#10b981" strokeWidth="2" />
                      <circle cx="350" cy="25" r="3.5" fill="white" stroke="#10b981" strokeWidth="2" />
                      
                      <text x="0" y="115" fontSize="10" fill="#9ca3af" fontWeight="500">00:00</text>
                      <text x="50" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="middle">03:00</text>
                      <text x="100" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="middle">06:00</text>
                      <text x="150" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="middle">09:00</text>
                      <text x="200" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="middle">12:00</text>
                      <text x="250" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="middle">15:00</text>
                      <text x="300" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="middle">18:00</text>
                      <text x="350" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="end">21:00</text>
                    </svg>
                  </div>
                </div>

                {/* Body Temperature Chart */}
                <div className="flex flex-col w-full">
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 text-sm">Body temperature</h4>
                    <p className="text-[10px] text-gray-400 mb-2">Last 24 Hours</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">{viewEnforcer.temp}</span>
                      <span className="text-[10px] text-gray-500 font-bold">°C</span>
                    </div>
                  </div>

                  <div className="flex-1 w-full min-h-[140px] relative">
                    <svg viewBox="0 0 350 120" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="temp-grad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#d97706" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="25" x2="350" y2="25" stroke="#f3f4f6" strokeWidth="1.5" />
                      <line x1="0" y1="60" x2="350" y2="60" stroke="#f3f4f6" strokeWidth="1.5" />
                      <line x1="0" y1="95" x2="350" y2="95" stroke="#f3f4f6" strokeWidth="1.5" />
                      
                      <polygon points="0,65 50,60 100,68 150,65 200,60 250,55 300,58 350,53 350,95 0,95" fill="url(#temp-grad)" />
                      <polyline points="0,65 50,60 100,68 150,65 200,60 250,55 300,58 350,53" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      
                      <circle cx="0" cy="65" r="3.5" fill="white" stroke="#d97706" strokeWidth="2" />
                      <circle cx="50" cy="60" r="3.5" fill="white" stroke="#d97706" strokeWidth="2" />
                      <circle cx="100" cy="68" r="3.5" fill="white" stroke="#d97706" strokeWidth="2" />
                      <circle cx="150" cy="65" r="3.5" fill="white" stroke="#d97706" strokeWidth="2" />
                      <circle cx="200" cy="60" r="3.5" fill="white" stroke="#d97706" strokeWidth="2" />
                      <circle cx="250" cy="55" r="3.5" fill="white" stroke="#d97706" strokeWidth="2" />
                      <circle cx="300" cy="58" r="3.5" fill="white" stroke="#d97706" strokeWidth="2" />
                      <circle cx="350" cy="53" r="3.5" fill="white" stroke="#d97706" strokeWidth="2" />
                      
                      <text x="0" y="115" fontSize="10" fill="#9ca3af" fontWeight="500">00:00</text>
                      <text x="50" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="middle">03:00</text>
                      <text x="100" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="middle">06:00</text>
                      <text x="150" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="middle">09:00</text>
                      <text x="200" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="middle">12:00</text>
                      <text x="250" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="middle">15:00</text>
                      <text x="300" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="middle">18:00</text>
                      <text x="350" y="115" fontSize="10" fill="#9ca3af" fontWeight="500" textAnchor="end">21:00</text>
                    </svg>
                  </div>
                </div>

              </div>
            </div>

            {/* Movement and Location Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#0A3320]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Movement and location</h3>
                  <p className="text-[10px] text-gray-400">Current tracking data</p>
                </div>
              </div>
              
              <div className="h-[180px] rounded-xl relative overflow-hidden border border-gray-200/60 z-0 mb-4 shadow-inner">
                <MapContainer 
                  center={viewEnforcer.coords} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  attributionControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={viewEnforcer.coords} />
                </MapContainer>
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded shadow-sm z-[1000] border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-700">{viewEnforcer.post}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <p className="text-[8px] tracking-wider font-bold text-gray-400 uppercase mb-0.5">MOTION STATUS</p>
                  <p className="text-xs font-bold text-gray-900">{viewEnforcer.motion}</p>
                </div>
                <div>
                  <p className="text-[8px] tracking-wider font-bold text-gray-400 uppercase mb-0.5">{viewEnforcer.locType} LOCATION</p>
                  <p className="text-xs font-bold text-gray-900 leading-tight">{viewEnforcer.address}</p>
                </div>
                <div>
                  <p className="text-[8px] tracking-wider font-bold text-gray-400 uppercase mb-0.5">DEPLOYMENT POST</p>
                  <p className="text-xs font-bold text-gray-900 leading-tight">{viewEnforcer.post}</p>
                </div>
                <div>
                  <p className="text-[8px] tracking-wider font-bold text-gray-400 uppercase mb-0.5">LAST LOCATION UPDATE</p>
                  <p className="text-xs font-bold text-gray-900">{viewEnforcer.time}</p>
                </div>
              </div>
            </div>
          </div>

          {/* IoT and History Row */}
          <div className="grid grid-cols-[1.5fr_1fr] gap-6">
            
            {/* IoT Connectivity Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#0A3320]">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">IoT connectivity</h3>
                  <p className="text-[10px] text-gray-400">Latest device communication state</p>
                </div>
              </div>

              {/* Updated boxes: darker border, added shadow, decreased bottom margin */}
              <div className="grid grid-cols-3 gap-4 mb-2.5">
                <div className="border border-gray-200 shadow-sm rounded-xl p-4 flex flex-col justify-center">
                  <div className={`w-2 h-2 rounded-full mb-3 ${viewEnforcer.status !== 'Offline' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <p className="text-[9px] text-gray-400 font-medium mb-1">Internet connection</p>
                  <p className="font-bold text-sm text-gray-900">{viewEnforcer.status !== 'Offline' ? 'Online' : 'Offline'}</p>
                </div>
                <div className="border border-gray-200 shadow-sm rounded-xl p-4 flex flex-col justify-center">
                  <div className={`w-2 h-2 rounded-full mb-3 ${viewEnforcer.status !== 'Offline' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <p className="text-[9px] text-gray-400 font-medium mb-1">LoRa connection</p>
                  <p className="font-bold text-sm text-gray-900">{viewEnforcer.status !== 'Offline' ? 'Online' : 'Offline'}</p>
                </div>
                <div className="border border-gray-200 shadow-sm rounded-xl p-4 flex flex-col justify-center">
                  <Activity className="w-4 h-4 text-gray-400 mb-2" />
                  <p className="text-[9px] text-gray-400 font-medium mb-1">Battery level</p>
                  <p className="font-bold text-sm text-gray-900">{viewEnforcer.battery}</p>
                </div>
              </div>

              <div className="bg-[#F8FAF9] border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-[9px] text-gray-400 font-medium mb-0.5">Last successful device communication</p>
                  <p className="font-bold text-xs text-gray-900">{viewEnforcer.time}</p>
                </div>
              </div>
            </div>

            {/* Connection History Timeline */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#0A3320]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Connection history and alerts</h3>
                  <p className="text-[10px] text-gray-400">Sensor, network, and status timeline</p>
                </div>
              </div>

              <div className="relative border-l border-gray-200 ml-3 space-y-8 pb-4">
                <div className="relative pl-6">
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white"></div>
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="text-sm font-bold text-gray-900">Device communication successful</p>
                    <span className="text-[10px] text-gray-400">10:45 AM</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Internet Online · LoRa Online</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white"></div>
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="text-sm font-bold text-gray-900">Sensor reading received</p>
                    <span className="text-[10px] text-gray-400">10:21 AM</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Vitals synchronized</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white"></div>
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="text-sm font-bold text-gray-900">Movement update</p>
                    <span className="text-[10px] text-gray-400">9:48 AM</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Patrol movement detected</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-4 ring-white"></div>
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="text-sm font-bold text-gray-900">Device session started</p>
                    <span className="text-[10px] text-gray-400">8:02 AM</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Internet and LoRa connection restored</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="animate-in fade-in duration-300">
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase mb-2">PERSONNEL STATUS</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Enforcer Monitoring</h2>
              <p className="text-sm text-gray-500">Search, filter, and review each enforcer record.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 pt-4 flex items-center gap-8 text-sm font-semibold text-gray-500">
              <button 
                onClick={() => setActiveTab('all')}
                className={`pb-3 border-b-2 transition-all cursor-pointer ${activeTab === 'all' ? 'border-[#0A3320] text-[#0A3320]' : 'border-transparent hover:text-gray-900'}`}
              >
                All Enforcers
              </button>
              {initialEnforcers.map((enf) => (
                <button 
                  key={enf.id}
                  onClick={() => setActiveTab(String(enf.id))}
                  className={`pb-3 border-b-2 transition-all cursor-pointer ${activeTab === String(enf.id) ? 'border-[#0A3320] text-[#0A3320]' : 'border-transparent hover:text-gray-900'}`}
                >
                  {enf.label}
                </button>
              ))}
            </div>

            <div className="p-6 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Monitor className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, badge, location, or post..." 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] outline-none text-xs transition-colors"
                />
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Loader2 className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#0A3320]' : ''}`} />
                  Refresh data
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="py-24 px-6 text-center flex flex-col items-center justify-center animate-in fade-in duration-200">
                <div className="w-14 h-14 bg-[#E8F2EC] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <Loader2 className="w-6 h-6 text-[#0A3320] animate-spin" />
                </div>
                <h4 className="text-base font-bold text-gray-900 mb-1">Loading enforcer records</h4>
                <p className="text-xs text-gray-400 font-medium">Retrieving the latest device data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-y border-gray-200/80 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                      <th className="py-3.5 px-6">NAME</th>
                      <th className="py-3.5 px-6">BADGE NUMBER</th>
                      <th className="py-3.5 px-6">STATUS</th>
                      <th className="py-3.5 px-6">LOCATION</th>
                      <th className="py-3.5 px-6">DEPLOYMENT POST</th>
                      <th className="py-3.5 px-6">LAST UPDATE</th>
                      <th className="py-3.5 px-6 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredEnforcers.length > 0 ? (
                      filteredEnforcers.map((enf) => {
                        const theme = colors[enf.color];
                        
                        return (
                          <tr key={enf.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${theme.bg} ${theme.text}`}>
                                  {enf.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 leading-tight">{enf.name}</p>
                                  <p className="text-[10px] text-gray-400">{enf.label}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-medium text-gray-600">{enf.badge}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${theme.bg} ${theme.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></span>
                                {enf.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-[8px] font-bold text-gray-400 uppercase">{enf.locType}</p>
                              <p className="font-medium text-gray-800">{enf.address}</p>
                            </td>
                            <td className="py-4 px-6 font-medium text-gray-700">{enf.post}</td>
                            <td className="py-4 px-6 font-medium text-gray-500">{enf.time}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => setViewEnforcer(enf)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" /> View
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirmId(enf.id)}
                                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400 font-medium">
                          No matching enforcer records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200 m-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="w-5 h-5 ml-0.5" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Delete Record</h3>
              </div>
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to delete this enforcer record? This action will permanently remove their tracking history.
            </p>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#E02424] text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}