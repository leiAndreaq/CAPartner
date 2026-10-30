import { useState } from 'react';
import { 
  Monitor, Eye, Trash2, Loader2, Activity, MapPin, Clock, ArrowLeft, Radio, AlertTriangle,
  Users, CheckCircle2, WifiOff, Shield, ChevronRight, Battery, X, RefreshCcw, Filter, Table,
  Wifi, Cpu, Signal, CheckCircle, Plus, Edit2, Mail, CheckSquare, Square, ShieldAlert, Heart, Thermometer, Power, AlertOctagon, ExternalLink, BatteryCharging, Bell, Image as ImageIcon, Navigation, Play, Download
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export default function Monitoring({ onNavigateToAlerts, onNavigateToCamera }) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewEnforcer, setViewEnforcer] = useState(null); // Floating Detailed Modal View
  const [showTablePage, setShowTablePage] = useState(false);

  // Account Management & Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Sector A Patrolling' });
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, type: 'single', id: null });
  const [statusModal, setStatusModal] = useState({ show: false, id: null, nextStatus: null, currentStatus: null });
  
  const [saveWarningModal, setSaveWarningModal] = useState({ show: false, payload: null, isEditing: false });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const initialEnforcers = [
    { 
      id: 1, name: 'Miguel Reyes', email: 'miguel.reyes@gmail.com', badge: 'ENF-2401', status: 'Active', label: 'Enforcer 01',
      post: 'Sector 1', locType: 'CURRENT LOCATION', address: 'Terminal Road, Brgy. San Roque', 
      color: 'emerald', time: '02:32 PM', coords: [14.6507, 120.9822], hr: '132', temp: '36.7', motion: 'Moving', battery: '78%',
      internet: true, lora: true, deviceModel: 'EnfWear Pro v2', ip: '192.168.1.104', signalStrength: 'Internet • Online',
      motionSensor: 'Normal (Stable)', loraFeedback: 'Acknowledged (RSSI: -72 dBm)', connectionHistory: 'Stable for 4h 12m',
      lastSync: '14:32:08', coordinatesText: '14.7539° N, 121.0513° E', alertsCount: 2, mediaCount: 2,
      connectionLogs: [
        { time: '14:02', type: 'Internet', desc: 'Restored — LTE signal regained' },
        { time: '13:18', type: 'LoRa fallback', desc: 'Fallback — LTE dropped below threshold' },
        { time: '11:47', type: 'Internet', desc: 'Restored — LTE signal regained' },
        { time: '09:05', type: 'Internet', desc: 'Shift start — unit paired' }
      ],
      role: 'Sector 1'
    },
    { 
      id: 2, name: 'L. Barcelona', email: 'andrea.delacruz@gmail.com', badge: 'ENF-2402', status: 'Attention', label: 'Enforcer 02',
      post: 'Sector 2', locType: 'CURRENT LOCATION', address: 'Mabini Street, Market District', 
      color: 'amber', time: '02:32 PM', coords: [14.6488, 120.9850], hr: '132', temp: '36.7', motion: 'Stationary', battery: '18%',
      internet: true, lora: true, deviceModel: 'EnfWear Pro v2', ip: '192.168.1.112', signalStrength: 'LoRa • Online',
      motionSensor: 'Warning (No Movement > 20m)', loraFeedback: 'Packet Retried (RSSI: -85 dBm)', connectionHistory: 'Intermittent ping (2 packet loss)',
      lastSync: '14:30:15', coordinatesText: '14.6488° N, 120.9850° E', alertsCount: 1, mediaCount: 0,
      connectionLogs: [
        { time: '13:00', type: 'LoRa fallback', desc: 'Fallback — switched to secondary relay' },
        { time: '08:30', type: 'Internet', desc: 'Shift start — unit paired' }
      ],
      role: 'Sector 2'
    },
    { 
      id: 3, name: 'J. Santos', email: 'jose.santos@gmail.com', badge: 'ENF-2403', status: 'Offline', label: 'Enforcer 03',
      post: 'Sector 3', locType: 'LAST KNOWN LOCATION', address: 'South Highway, Brgy. Mabuhay', 
      color: 'red', time: '--', coords: [14.6450, 120.9880], hr: '--', temp: '--', motion: '--', battery: '--',
      internet: false, lora: false, deviceModel: 'EnfWear Pro v1', ip: '192.168.1.130', signalStrength: 'Offline',
      motionSensor: 'Offline / Inactive', loraFeedback: 'Timeout (No Response)', connectionHistory: 'Disconnected',
      lastSync: '--', coordinatesText: '14.6450° N, 120.9880° E', alertsCount: 3, mediaCount: 1,
      connectionLogs: [
        { time: '10:21', type: 'Offline', desc: 'Disconnected / Signal lost' }
      ],
      role: 'Sector 3'
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

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormData({ name: '', email: '', role: 'Sector A Patrolling' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc) => {
    setEditingAccount(acc);
    setFormData({ name: acc.name, email: acc.email, role: acc.post || acc.role });
    setIsModalOpen(true);
  };

  const handleInitiateSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      showToast('Please fill in all required fields.');
      return;
    }
    setIsModalOpen(false);
    setSaveWarningModal({
      show: true,
      payload: formData,
      isEditing: !!editingAccount
    });
  };

  const confirmSaveAccount = () => {
    const data = saveWarningModal.payload;
    if (!data) return;

    if (saveWarningModal.isEditing && editingAccount) {
      setEnforcers(prev => prev.map(acc => acc.id === editingAccount.id ? { ...acc, name: data.name, email: data.email, post: data.role, role: data.role } : acc));
      showToast(`Account for ${data.name} successfully updated.`);
    } else {
      const newAcc = {
        id: Date.now(),
        name: data.name,
        email: data.email,
        badge: `ENF-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Active',
        label: `Enforcer 0${enforcers.length + 1}`,
        post: data.role,
        role: data.role,
        locType: 'CURRENT LOCATION',
        address: 'Caloocan City Station',
        color: 'emerald',
        time: 'Just now',
        coords: [14.6507, 120.9822],
        hr: '75',
        temp: '36.5',
        motion: 'Active',
        battery: '100%',
        internet: true,
        lora: true,
        deviceModel: 'EnfWear Pro v2',
        ip: '192.168.1.150',
        signalStrength: 'Internet • Online',
        motionSensor: 'Active',
        loraFeedback: 'Acknowledged',
        connectionHistory: 'Connected just now',
        lastSync: 'Just now',
        coordinatesText: '14.6507° N, 120.9822° E',
        alertsCount: 0,
        mediaCount: 0,
        connectionLogs: [{ time: 'Now', type: 'Internet', desc: 'Shift start — unit paired' }]
      };
      setEnforcers(prev => [newAcc, ...prev]);
      showToast(`New enforcer account for ${data.name} successfully created.`);
    }
    setSaveWarningModal({ show: false, payload: null, isEditing: false });
  };

  const handleToggleStatus = (id) => {
    const account = enforcers.find(acc => acc.id === id);
    if (!account) return;

    const newStatus = account.status === 'Active' || account.status === 'Normal' ? 'Offline' : 'Active';
    setStatusModal({
      show: true,
      id,
      nextStatus: newStatus,
      currentStatus: account.status,
    });
  };

  const confirmStatusChange = () => {
    if (!statusModal.id) return;

    setEnforcers(prev => prev.map(acc => {
      if (acc.id === statusModal.id) {
        const newStatus = statusModal.nextStatus;
        showToast(`Account ${acc.name} has been ${newStatus.toLowerCase()}.`);
        return { ...acc, status: newStatus };
      }
      return acc;
    }));
    setStatusModal({ show: false, id: null, nextStatus: null, currentStatus: null });
  };

  const executeDelete = () => {
    if (deleteModal.type === 'single') {
      setEnforcers(prev => prev.filter(acc => acc.id !== deleteModal.id));
      showToast('Personnel account permanently deleted.');
    }
    setDeleteModal({ show: false, type: 'single', id: null });
  };

  const filteredEnforcers = enforcers.filter((enf) => {
    const matchesSearch = 
      enf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enf.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enf.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enf.post.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'normal') return matchesSearch && (enf.status === 'Active' || enf.status === 'Normal');
    if (activeTab === 'attention') return matchesSearch && enf.status === 'Attention';
    if (activeTab === 'offline') return matchesSearch && (enf.status === 'Deactivated' || enf.status === 'Offline');
    return matchesSearch;
  });

  const getStatusMeta = (status) => {
    switch (status) {
      case 'Attention':
        return { badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40', dot: 'bg-amber-400' };
      case 'Offline':
      case 'Deactivated':
        return { badge: 'bg-gray-500/20 text-gray-400 border border-gray-500/40', dot: 'bg-gray-400' };
      default:
        return { badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40', dot: 'bg-emerald-400' };
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 h-full overflow-y-auto bg-[#F4F7F5] font-sans transition-all duration-300 relative">
      
      {showTablePage ? (
        // ==========================================
        // MANAGE ENFORCER ACCOUNTS TABLE VIEW
        // ==========================================
        <div className="animate-in fade-in duration-300 space-y-4 max-w-6xl mx-auto">
          <button 
            onClick={() => setShowTablePage(false)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-[#0A3320] hover:bg-gray-50 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Monitoring Dashboard
          </button>

          <div className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-md overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#0A3320] flex items-center justify-center text-white shrink-0 shadow-md">
                  <Table className="w-6 h-6 text-emerald-300 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-black text-gray-900 truncate">Manage Enforcer Accounts</h2>
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 truncate">Secure directory for personnel records and status controls</p>
                </div>
              </div>

              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#0A3320] text-white text-xs font-bold hover:bg-[#061E12] active:scale-95 transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Add New Account
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-xs">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-[11px] font-black tracking-wider text-gray-500 uppercase">
                    <th className="py-3.5 px-4">NAME</th>
                    <th className="py-3.5 px-4">BADGE & EMAIL</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4">POST / ROLE</th>
                    <th className="py-3.5 px-4 text-center">CONTROLS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {enforcers.map((enf) => {
                    const statusMeta = getStatusMeta(enf.status);
                    return (
                      <tr key={enf.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 font-black text-gray-900">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                              {enf.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="truncate max-w-[150px]">{enf.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-gray-800 block">{enf.badge}</span>
                          <span className="text-[11px] text-gray-500 truncate block max-w-[180px]">{enf.email}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black ${statusMeta.badge}`}>
                            <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`}></span>
                            {enf.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-700 truncate max-w-[150px]">{enf.post}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button 
                              onClick={() => handleOpenEdit(enf)}
                              className="px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-[11px] flex items-center gap-1 cursor-pointer bg-white shadow-xs"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gray-400" /> Edit
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(enf.id)}
                              className={`px-3 py-2 rounded-xl font-bold text-[11px] cursor-pointer border shadow-xs transition-all ${enf.status === 'Active' ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'}`}
                            >
                              {enf.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button 
                              onClick={() => setDeleteModal({ show: true, type: 'single', id: enf.id })}
                              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer shadow-xs"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden space-y-3">
              {enforcers.map((enf) => {
                const statusMeta = getStatusMeta(enf.status);
                return (
                  <div key={enf.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                          {enf.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-gray-900 text-sm whitespace-normal break-words">{enf.name}</h4>
                          <p className="text-[11px] font-bold text-gray-500">Badge: {enf.badge}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0 ${statusMeta.badge}`}>
                        {enf.status}
                      </span>
                    </div>

                    <div className="text-xs bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5">
                      <div><span className="font-bold text-gray-400 text-[10px]">POST:</span> <span className="font-semibold text-gray-800 whitespace-normal break-words">{enf.post}</span></div>
                      <div><span className="font-bold text-gray-400 text-[10px]">EMAIL:</span> <span className="font-semibold text-gray-800 whitespace-normal break-words">{enf.email}</span></div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                      <button onClick={() => handleOpenEdit(enf)} className="py-2 px-3 rounded-xl border border-gray-200 text-xs font-bold bg-white text-gray-700">Edit</button>
                      <button 
                        onClick={() => handleToggleStatus(enf.id)} 
                        className={`py-2 px-3 rounded-xl text-xs font-bold border ${enf.status === 'Active' ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'}`}
                      >
                        {enf.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => setDeleteModal({ show: true, type: 'single', id: enf.id })} className="py-2 px-3 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-200">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      ) : (
        // ==========================================
        // MAIN DASHBOARD VIEW
        // ==========================================
        <div className="animate-in fade-in duration-500 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black tracking-[0.15em] text-[#0A3320] uppercase mb-1">COMMAND CENTER</p>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 truncate">Enforcer Monitoring</h2>
              <p className="text-xs sm:text-sm font-semibold text-gray-600 whitespace-normal">Track enforcer safety, live map locations, and battery telemetry.</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button 
                onClick={() => setShowTablePage(true)}
                className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-white border-2 border-[#0A3320] hover:bg-emerald-50 text-[#0A3320] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Table className="w-4 h-4 sm:w-5 sm:h-5" /> Manage Enforcer Accounts
              </button>

              <button 
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-[#0A3320] hover:bg-[#061E12] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCcw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {[
              { label: 'Total Enforcers', value: enforcers.length, icon: Users, wrapper: 'bg-[#dff3ea] text-[#0f7a5a]' },
              { label: 'Active Status', value: enforcers.filter(e => e.status === 'Active' || e.status === 'Normal').length, icon: CheckCircle2, wrapper: 'bg-[#dff3ea] text-[#0f7a5a]' },
              { label: 'Attention', value: enforcers.filter(e => e.status === 'Attention').length, icon: AlertTriangle, wrapper: 'bg-[#f5eed7] text-[#b07d00]' },
              { label: 'Deactivated / Off', value: enforcers.filter(e => e.status === 'Deactivated' || e.status === 'Offline').length, icon: WifiOff, wrapper: 'bg-[#f7e3e3] text-[#b3261e]' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`rounded-[28px] border border-[#e7ece9] bg-[#f5f5f5] p-4 shadow-sm ${stat.wrapper}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[18px] shrink-0 bg-white/60">
                      <Icon className="h-5 w-5" strokeWidth={2.4} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 truncate">{stat.label}</p>
                      <h3 className="mt-1 text-2xl font-black text-gray-900">{stat.value}</h3>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto">
              <span className="text-xs font-black text-gray-500 uppercase flex items-center gap-1 shrink-0">
                <Filter className="w-4 h-4 text-[#0A3320]" /> Filter:
              </span>
              <button onClick={() => setActiveTab('all')} className={`px-3 py-2 rounded-xl font-black text-xs cursor-pointer whitespace-nowrap ${activeTab === 'all' ? 'bg-[#0A3320] text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
              <button onClick={() => setActiveTab('normal')} className={`px-3 py-2 rounded-xl font-black text-xs cursor-pointer whitespace-nowrap ${activeTab === 'normal' ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-700'}`}>Active</button>
              <button onClick={() => setActiveTab('attention')} className={`px-3 py-2 rounded-xl font-black text-xs cursor-pointer whitespace-nowrap ${activeTab === 'attention' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Attention</button>
              <button onClick={() => setActiveTab('offline')} className={`px-3 py-2 rounded-xl font-black text-xs cursor-pointer whitespace-nowrap ${activeTab === 'offline' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Off</button>
            </div>

            <div className="relative w-full lg:w-[320px]">
              <Monitor className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, badge..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#0A3320] outline-none text-xs font-semibold bg-gray-50"
              />
            </div>
          </div>

          {/* ENFORCER CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnforcers.length > 0 ? (
              filteredEnforcers.map((enf) => {
                const statusMeta = getStatusMeta(enf.status);
                const isOffline = enf.status === 'Offline';
                return (
                  <div key={enf.id} className="bg-[#0A3320] text-white rounded-3xl shadow-xl border border-emerald-900/50 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl">
                    
                    {/* Top: Name & Status Badge */}
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <div>
                          <h3 className="font-black text-lg text-white">{enf.label}</h3>
                          <p className="text-xs font-medium text-emerald-200/80">{enf.name}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${statusMeta.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}></span>
                          {enf.status}
                        </span>
                      </div>

                      {/* Metrics Row */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-emerald-800/60 text-xs">
                        <div>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-300/70 font-semibold mb-1">
                            <Heart className="w-3 h-3 text-emerald-400" /> Heart rate
                          </div>
                          <p className="font-black text-base text-white">
                            {isOffline ? '--' : enf.hr} <span className="text-[10px] font-normal text-emerald-300/70">{!isOffline && 'BPM'}</span>
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-300/70 font-semibold mb-1">
                            <Thermometer className="w-3 h-3 text-emerald-400" /> Temp
                          </div>
                          <p className="font-black text-base text-white">
                            {isOffline ? '--' : enf.temp} <span className="text-[10px] font-normal text-emerald-300/70">{!isOffline && '°C'}</span>
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-300/70 font-semibold mb-1">
                            <Activity className="w-3 h-3 text-emerald-400" /> Motion Status
                          </div>
                          <p className="font-black text-sm text-white truncate">
                            {isOffline ? '--' : enf.motion}
                          </p>
                        </div>
                      </div>

                      {/* Location, Connection & Last update details */}
                      <div className="mt-4 pt-4 border-t border-emerald-800/60 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-emerald-100/90">
                          <span className="flex items-center gap-1.5 text-emerald-300/80"><MapPin className="w-3.5 h-3.5" /> Location</span>
                          <span className="font-bold text-white">{enf.post}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-100/90">
                          <span className="flex items-center gap-1.5 text-emerald-300/80"><Wifi className="w-3.5 h-3.5" /> Connection</span>
                          <span className={`font-bold ${isOffline ? 'text-red-400' : 'text-emerald-400'}`}>{enf.signalStrength}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-100/90">
                          <span className="flex items-center gap-1.5 text-emerald-300/80"><Clock className="w-3.5 h-3.5" /> Last update</span>
                          <span className="font-bold text-white">{enf.time}</span>
                        </div>
                      </div>

                      {/* Mini Map Container */}
                      <div className="h-32 rounded-2xl mt-4 relative overflow-hidden border border-emerald-800/80 shadow-inner z-0">
                        <MapContainer center={enf.coords} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false} dragging={false} scrollWheelZoom={false}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={enf.coords} />
                        </MapContainer>
                      </div>
                    </div>

                    {/* Bottom Action Footer: Mas litaw at kapansin-pansin na Open Monitoring Button */}
                    <div className="mt-5 pt-3 border-t border-emerald-800/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setViewEnforcer(enf)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        Open monitoring <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1 text-emerald-300 text-xs font-bold">
                        {isOffline ? (
                          <WifiOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <>
                            <Battery className="w-4 h-4 text-emerald-400" />
                            <span>{enf.battery}</span>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
                <p className="text-gray-500 font-bold text-sm">No matching enforcer records found.</p>
              </div>
            )}
          </div>

          {/* Main Dashboard Map Container */}
          <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-md mt-6">
            <div className="flex items-center justify-between mb-3 px-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <h3 className="text-sm font-black text-gray-900 uppercase">Live Enforcer Map Telemetry</h3>
              </div>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-xl">Active: {enforcers.length}</span>
            </div>
            <div className="h-[280px] sm:h-[400px] rounded-2xl overflow-hidden border border-gray-300 z-0 shadow-inner relative">
              <MapContainer center={[14.6480, 120.9850]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={true} attributionControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {enforcers.map((enf) => (
                  <Marker key={enf.id} position={enf.coords}>
                    <Popup>
                      <div className="font-sans p-1">
                        <p className="font-black text-gray-900 text-sm">{enf.name}</p>
                        <p className="text-xs text-emerald-700 font-semibold mb-2">{enf.post}</p>
                        <button onClick={() => setViewEnforcer(enf)} className="w-full py-1 px-3 bg-[#0A3320] text-white rounded-lg text-xs font-bold cursor-pointer">View Details</button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================== */}
      {/* COMPLETE VIEW DETAILS MODAL (LAHAT NG DATOS AY NARITO NA)   */}
      {/* ========================================================== */}
      {viewEnforcer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/75 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
          
          <div className="bg-white rounded-3xl p-4 sm:p-8 w-full max-w-4xl shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[94vh] overflow-y-auto space-y-6 pt-12 sm:pt-8">
            
            <button 
              onClick={() => setViewEnforcer(null)} 
              className="absolute top-4 right-4 sm:top-5 sm:right-6 p-2.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer transition-transform hover:rotate-90 z-20 shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-3.5 sm:gap-4 pr-12 border-b border-gray-200 pb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base shrink-0 shadow-sm bg-emerald-50 text-emerald-800">
                {viewEnforcer.name.split(' ').map(n=>n[0]).join('')}
              </div>
              <div className="min-w-0">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider mb-1">
                  Personnel Telemetry Profile
                </span>
                <h3 className="text-base sm:text-2xl font-black text-gray-900 whitespace-normal break-words">{viewEnforcer.name}</h3>
                <p className="text-xs sm:text-sm font-bold text-gray-600 whitespace-normal break-words">Badge ID: {viewEnforcer.badge} · Assignment: {viewEnforcer.post}</p>
              </div>
            </div>

            {/* TWO-COLUMN GRID: Left (Biometrics, Motion, LoRa, Device Metadata) & Right (Unit Status) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              {/* Left Column */}
              <div className="lg:col-span-6 space-y-4">
                
                {/* Biometrics Box (Heart Rate & Temp) */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50 border border-gray-200/90 rounded-2xl p-4 shadow-xs text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
                      <Heart className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Heart Rate</span>
                      <span className="font-black text-gray-900 text-sm whitespace-normal break-words">{viewEnforcer.hr !== '--' ? `${viewEnforcer.hr} BPM` : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Body Temp</span>
                      <span className="font-black text-gray-900 text-sm whitespace-normal break-words">{viewEnforcer.temp !== '--' ? `${viewEnforcer.temp} °C` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Core Device Status Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-200/90 rounded-2xl p-3.5 shadow-xs">
                    <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Motion Sensor</span>
                    <span className="text-xs font-black text-gray-900 whitespace-normal break-words block">{viewEnforcer.motionSensor}</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200/90 rounded-2xl p-3.5 shadow-xs">
                    <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">LoRa Feedback</span>
                    <span className="text-xs font-black text-gray-900 whitespace-normal break-words block">{viewEnforcer.loraFeedback}</span>
                  </div>
                </div>

                {/* Network & Hardware Metadata Box */}
                <div className="bg-gray-50 border border-gray-200/90 rounded-2xl p-4 text-xs space-y-2 shadow-xs">
                  <div className="flex justify-between items-center gap-2 border-b border-gray-200/60 pb-1.5">
                    <span className="font-black text-gray-400 text-[10px] uppercase shrink-0">Device Model:</span>
                    <span className="font-semibold text-gray-800 text-right whitespace-normal break-words">{viewEnforcer.deviceModel}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2 border-b border-gray-200/60 pb-1.5">
                    <span className="font-black text-gray-400 text-[10px] uppercase shrink-0">IP Address:</span>
                    <span className="font-semibold text-gray-800 text-right whitespace-normal break-words">{viewEnforcer.ip}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2 pb-0.5">
                    <span className="font-black text-gray-400 text-[10px] uppercase shrink-0">Connection History:</span>
                    <span className="font-semibold text-gray-800 text-right whitespace-normal break-words">{viewEnforcer.connectionHistory}</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Unit Status Card (Battery, Last Sync, Coordinates, Alerts, Media) */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-xs space-y-3 flex-1 flex flex-col">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">Unit status</h4>
                  
                  <div className="grid grid-cols-1 divide-y divide-gray-100 text-xs font-semibold flex-1">
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-2"><Battery className="w-4 h-4 text-gray-500" /> Battery</span>
                      <span className="font-black text-gray-900">{viewEnforcer.battery}</span>
                    </div>
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-500" /> Last sync</span>
                      <span className="font-black text-gray-900">{viewEnforcer.lastSync}</span>
                    </div>
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-2"><Wifi className="w-4 h-4 text-gray-500" /> Connection</span>
                      <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Internet</span>
                    </div>
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500" /> Coordinates</span>
                      <span className="font-black text-gray-900">{viewEnforcer.coordinatesText}</span>
                    </div>
                  </div>

                  {/* Connected Alerts & Media Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => { if (onNavigateToAlerts) onNavigateToAlerts(viewEnforcer.badge); }}
                      className="py-2.5 px-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-xs font-black text-emerald-900 flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                    >
                      <Bell className="w-4 h-4 text-emerald-700" /> Alerts ({viewEnforcer.alertsCount})
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { if (onNavigateToCamera) onNavigateToCamera(viewEnforcer.badge); }}
                      className="py-2.5 px-3 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-xs font-black text-blue-900 flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                    >
                      <ImageIcon className="w-4 h-4 text-blue-700" /> Media ({viewEnforcer.mediaCount})
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Location & Movement Map Section */}
            <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#0A3320]" /> Location & movement
                </h4>
                <span className="text-[11px] font-bold text-gray-400">Last 90 minutes</span>
              </div>
              <p className="text-[11px] font-bold text-gray-500">Currently at: {viewEnforcer.address}</p>

              <div className="h-[240px] rounded-2xl overflow-hidden border border-gray-300 z-0 shadow-inner relative">
                <MapContainer center={viewEnforcer.coords} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={true} attributionControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={viewEnforcer.coords} />
                </MapContainer>
              </div>
            </div>

            {/* Connection History Section */}
            <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-1">Connection history</h4>
                <p className="text-[11px] font-semibold text-gray-400">Internet / LoRa switch events for {viewEnforcer.badge} this shift</p>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                {viewEnforcer.connectionLogs && viewEnforcer.connectionLogs.map((log, index) => (
                  <div key={index} className="py-3 flex items-center justify-between gap-4">
                    <span className="font-black text-gray-500 w-12 shrink-0">{log.time}</span>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="font-black text-gray-900 shrink-0">{log.type}</span>
                      <span className="text-gray-400 font-semibold truncate">— {log.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button 
                onClick={() => setViewEnforcer(null)}
                className="px-6 py-3 rounded-xl bg-[#0A3320] text-white font-bold text-xs hover:bg-[#061E12] cursor-pointer shadow-md active:scale-95 transition-all"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE / EDIT ACCOUNT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{editingAccount ? 'Edit Account' : 'Create Account'}</h3>
            <form onSubmit={handleInitiateSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-xs sm:text-sm text-gray-900 focus:border-emerald-600 outline-none bg-gray-50 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-xs sm:text-sm text-gray-900 focus:border-emerald-600 outline-none bg-gray-50 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Post / Role</label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-xs sm:text-sm text-gray-900 focus:border-emerald-600 outline-none bg-gray-50 font-semibold"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl border border-gray-200 text-xs font-bold bg-white text-gray-700 cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-3 rounded-xl font-bold text-xs bg-[#0A3320] text-white cursor-pointer shadow-md">Proceed to Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MANDATORY IMPORTANT WARNING CONFIRMATION (CREATE / EDIT)    */}
      {/* ========================================================== */}
      {saveWarningModal.show && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-gray-950/75 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl text-center border-4 border-amber-500 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-2 bg-amber-500 animate-pulse"></div>

            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner border border-amber-300">
              <AlertOctagon className="w-9 h-9 animate-bounce" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] uppercase tracking-widest mb-2 border border-amber-300">
              CRITICAL SECURITY PROTOCOL
            </span>

            <h3 className="text-xl font-black text-gray-900 mb-2">
              {saveWarningModal.isEditing ? 'Confirm Account Modifications?' : 'Confirm New Personnel Creation?'}
            </h3>

            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-6 text-left shadow-xs">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-amber-900 uppercase tracking-wide mb-1">WARNING: DATABASE & ACCESS IMPACT</p>
                  <p className="text-xs font-semibold text-amber-950 leading-relaxed whitespace-normal break-words">
                    {saveWarningModal.isEditing 
                      ? 'Saving these edits will instantly update credentials across the active command network. Ensure all clearance protocols are verified.' 
                      : 'Creating this account will instantly grant live telemetry tracking, IoT device pairing privileges, and emergency broadcast dispatch into the network.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSaveWarningModal({ show: false, payload: null, isEditing: false })} 
                className="flex-1 py-3.5 rounded-xl border border-gray-300 font-black text-xs bg-white text-gray-700 hover:bg-gray-50 active:scale-95 cursor-pointer shadow-xs"
              >
                Review Details
              </button>
              <button 
                onClick={confirmSaveAccount} 
                className="flex-1 py-3.5 rounded-xl font-black text-xs bg-[#0A3320] hover:bg-[#061E12] text-white active:scale-95 cursor-pointer shadow-lg transition-all"
              >
                Yes, Authorize Now
              </button>
            </div>

          </div>
        </div>
      )}

      {/* STATUS CHANGE CONFIRMATION MODAL */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/75 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl text-center border-4 border-amber-500 relative">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-amber-300">
              <AlertOctagon className="w-9 h-9 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">
              {statusModal.nextStatus === 'Deactivated' || statusModal.nextStatus === 'Offline' ? 'Deactivate Personnel Access?' : 'Restore Personnel Access?'}
            </h3>
            <p className="text-xs text-gray-600 mb-6">
              {statusModal.nextStatus === 'Deactivated' || statusModal.nextStatus === 'Offline'
                ? 'This action will revoke live telemetry transmission and emergency alerts dispatch.' 
                : 'This will re-establish full network privileges and live GPS telemetry feeds.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setStatusModal({ show: false, id: null, nextStatus: null, currentStatus: null })} className="flex-1 py-3.5 rounded-xl border border-gray-300 font-bold text-xs bg-white text-gray-700 cursor-pointer">Cancel</button>
              <button onClick={confirmStatusChange} className="flex-1 py-3.5 rounded-xl font-bold text-xs bg-[#0A3320] text-white cursor-pointer">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/75 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl text-center border-4 border-red-600">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Permanently Delete Account?</h3>
            <p className="text-xs text-gray-600 mb-6">This action cannot be undone and will purge historical logs.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ show: false, type: 'single', id: null })} className="flex-1 py-3 rounded-xl border border-gray-300 font-bold text-xs bg-white text-gray-700 cursor-pointer">Cancel</button>
              <button onClick={executeDelete} className="flex-1 py-3 rounded-xl font-bold text-xs bg-red-600 text-white cursor-pointer">Delete Forever</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#0A3320] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/40 text-xs font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <p className="whitespace-normal break-words">{toast}</p>
          </div>
        </div>
      )}

    </div>
  );
}