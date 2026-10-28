import { useState } from 'react';
import { Users, CheckCircle2, AlertTriangle, WifiOff, MapPin, Shield, Clock, ChevronRight, X, Heart, Thermometer, Battery, Activity, Radio, Wifi } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export default function Overview() {
  const [selectedEnforcer, setSelectedEnforcer] = useState(null);

  const enforcers = [
    { 
      id: 1, name: 'Miguel Reyes', badge: 'ENF-2401', status: 'Normal', post: 'North Transport Terminal', 
      hr: '78 BPM', temp: '36.6 °C', motion: 'Moving', battery: '86%', coords: [14.6507, 120.9822], 
      color: 'emerald', locType: 'CURRENT LOCATION', address: 'Terminal Road, Brgy. San Roque', 
      internet: true, lora: true, time: 'Updated Today, 10:45:12 AM',
      deviceModel: 'EnfWear Pro v2', ip: '192.168.1.104', signalStrength: 'Excellent (-65 dBm)'
    },
    { 
      id: 2, name: 'Andrea Dela Cruz', badge: 'ENF-2402', status: 'Attention', post: 'Central Public Market', 
      hr: '104 BPM', temp: '37.8 °C', motion: 'Stationary', battery: '64%', coords: [14.6488, 120.9850], 
      color: 'amber', locType: 'CURRENT LOCATION', address: 'Mabini Street, Market District', 
      internet: true, lora: true, time: 'Updated Today, 10:43:08 AM',
      deviceModel: 'EnfWear Pro v2', ip: '192.168.1.112', signalStrength: 'Good (-78 dBm)'
    },
    { 
      id: 3, name: 'Jose Santos', badge: 'ENF-2403', status: 'Offline', post: 'South Highway Junction', 
      hr: 'No data', temp: 'No data', motion: 'No Signal', battery: '18%', coords: [14.6450, 120.9880], 
      color: 'red', locType: 'LAST KNOWN LOCATION', address: 'South Highway, Brgy. Mabuhay', 
      internet: false, lora: false, time: 'Updated Today, 10:21:44 AM',
      deviceModel: 'EnfWear Pro v1', ip: '192.168.1.130', signalStrength: 'No Signal'
    }
  ];

  const colors = {
    emerald: { border: 'border-t-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    amber: { border: 'border-t-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
    red: { border: 'border-t-red-500', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto bg-gray-50/50">
      
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase mb-2">Operations Dashboard</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Enforcer Overview</h2>
          <p className="text-sm text-gray-500">Monitor enforcer safety, location, and device connectivity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Users className="w-6 h-6" /></div>
          <div><p className="text-xs text-gray-500">Total enforcers</p><h3 className="text-2xl font-bold text-gray-900">3</h3><p className="text-[10px] text-gray-400">Assigned to active posts</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600"><CheckCircle2 className="w-6 h-6" /></div>
          <div><p className="text-xs text-gray-500">Normal</p><h3 className="text-2xl font-bold text-gray-900">1</h3><p className="text-[10px] text-gray-400">All sample checks in range</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><AlertTriangle className="w-6 h-6" /></div>
          <div><p className="text-xs text-gray-500">Requires attention</p><h3 className="text-2xl font-bold text-gray-900">1</h3><p className="text-[10px] text-gray-400">Review warning</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600"><WifiOff className="w-6 h-6" /></div>
          <div><p className="text-xs text-gray-500">Offline</p><h3 className="text-2xl font-bold text-gray-900">1</h3><p className="text-[10px] text-gray-400">Last known positions retained</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 mb-8">
        {enforcers.map((enf) => {
          const theme = colors[enf.color];
          
          return (
            <div key={enf.id} className={`bg-white rounded-2xl shadow-sm border-t-[3px] border border-gray-100 p-6 flex flex-col ${theme.border}`}>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-3 items-center">
                  <div className="relative">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${theme.bg} ${theme.text}`}>
                      {enf.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${theme.dot}`}></div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Enforcer {enf.id}</p>
                    <h4 className="font-bold text-gray-900 text-sm leading-tight">{enf.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></div>
                      <p className="text-[10px] text-gray-500 font-medium">Badge {enf.badge}</p>
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${theme.bg} ${theme.text} flex items-center gap-1.5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></span> {enf.status}
                </span>
              </div>

              <div className="bg-[#F8FAF9] border border-gray-100 rounded-xl p-3.5 mb-5 flex flex-col justify-center">
                <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase mb-1">Assigned Deployment Post</p>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <p className="text-sm font-semibold text-gray-800">{enf.post}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 border border-gray-100 rounded-xl overflow-hidden mb-5">
                <div className="p-3.5 border-r border-b border-gray-100">
                  <p className="text-[8px] tracking-widest text-gray-400 uppercase font-bold mb-1">Heart Rate</p>
                  <p className="text-sm font-bold text-gray-900">{enf.hr}</p>
                </div>
                <div className="p-3.5 border-b border-gray-100">
                  <p className="text-[8px] tracking-widest text-gray-400 uppercase font-bold mb-1">Body Temp</p>
                  <p className="text-sm font-bold text-gray-900">{enf.temp}</p>
                </div>
                <div className="p-3.5 border-r border-b border-gray-100">
                  <p className="text-[8px] tracking-widest text-gray-400 uppercase font-bold mb-1">Motion</p>
                  <p className="text-sm font-bold text-gray-900">{enf.motion}</p>
                </div>
                <div className="p-3.5">
                  <p className="text-[8px] tracking-widest text-gray-400 uppercase font-bold mb-1">Battery</p>
                  <p className="text-sm font-bold text-gray-900">{enf.battery}</p>
                </div>
              </div>

              <div className="flex gap-2.5 mb-4">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase mb-0.5">{enf.locType}</p>
                  <p className="text-xs font-semibold text-gray-800">{enf.address}</p>
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${enf.internet ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <span className="text-[10px] text-gray-500 font-medium">Internet {enf.internet ? 'Online' : 'Offline'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${enf.lora ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <span className="text-[10px] text-gray-500 font-medium">LoRa {enf.lora ? 'Online' : 'Offline'}</span>
                </div>
              </div>

              {/* OpenStreetMap Card View */}
              <div className="h-28 rounded-xl mb-4 relative overflow-hidden border border-gray-200/60 z-0 shadow-inner">
                <MapContainer 
                  center={enf.coords} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  attributionControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={enf.coords} />
                </MapContainer>
                
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded shadow-sm z-[1000] border border-gray-100">
                  <p className="text-[8px] font-bold text-gray-700">{enf.post}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-medium">{enf.time}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEnforcer(enf)}
                  className="bg-[#0A3320] hover:bg-[#061E12] text-white py-2 px-4 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  View details <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[500px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Live deployment map</h3>
            <p className="text-xs text-gray-500">Real-time GPS tracking via OpenStreetMap</p>
          </div>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 z-0">
          <MapContainer 
            center={[14.6488, 120.9850]} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {enforcers.map((enf) => (
              <Marker key={enf.id} position={enf.coords}>
                <Popup className="font-sans">
                  <strong>{enf.name}</strong><br/>{enf.post}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* --- FULL DETAILED ENFORCER VIEW DETAILS MODAL --- */}
      {selectedEnforcer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-[#0A3320] px-6 py-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-lg border border-white/20">
                  {selectedEnforcer.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{selectedEnforcer.name}</h3>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      {selectedEnforcer.badge}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 mt-0.5">{selectedEnforcer.post}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedEnforcer(null)} 
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 space-y-6 bg-gray-50/50">
              
              {/* Status & Last Update */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Operational Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      selectedEnforcer.status === 'Normal' ? 'bg-emerald-50 text-emerald-700' :
                      selectedEnforcer.status === 'Attention' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        selectedEnforcer.status === 'Normal' ? 'bg-emerald-500' :
                        selectedEnforcer.status === 'Attention' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      {selectedEnforcer.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Device Battery</p>
                    <div className="flex items-center gap-1.5 justify-end font-bold text-sm text-gray-900">
                      <Battery className="w-4 h-4 text-emerald-600" />
                      {selectedEnforcer.battery}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Motion State</p>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900">
                      <Activity className="w-4 h-4 text-blue-600" />
                      {selectedEnforcer.motion}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Timestamp</p>
                    <p className="text-xs font-semibold text-gray-700">{selectedEnforcer.time.replace('Updated ', '')}</p>
                  </div>
                </div>
              </div>

              {/* Real-time Vitals */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Live Telemetry & Vitals</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 mb-1">
                      <Heart className="w-3.5 h-3.5 fill-red-600" /> Heart Rate
                    </div>
                    <p className="text-lg font-black text-gray-900">{selectedEnforcer.hr}</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-1">
                      <Thermometer className="w-3.5 h-3.5" /> Body Temp
                    </div>
                    <p className="text-lg font-black text-gray-900">{selectedEnforcer.temp}</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-1">
                      <Wifi className="w-3.5 h-3.5" /> Internet
                    </div>
                    <p className="text-sm font-bold text-gray-900 mt-1">{selectedEnforcer.internet ? 'Online' : 'Offline'}</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 mb-1">
                      <Radio className="w-3.5 h-3.5" /> LoRa Radio
                    </div>
                    <p className="text-sm font-bold text-gray-900 mt-1">{selectedEnforcer.lora ? 'Connected' : 'Disconnected'}</p>
                  </div>
                </div>
              </div>

              {/* Device & Location Information */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Hardware & Exact Location</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-0.5 font-medium">Wearable Model</span>
                    <span className="font-bold text-gray-900">{selectedEnforcer.deviceModel}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5 font-medium">Network IP Address</span>
                    <span className="font-bold text-gray-900">{selectedEnforcer.ip}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5 font-medium">Signal Quality</span>
                    <span className="font-bold text-gray-900">{selectedEnforcer.signalStrength}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{selectedEnforcer.locType}</p>
                    <p className="text-xs font-bold text-gray-900 mt-0.5">{selectedEnforcer.address} ({selectedEnforcer.post})</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">GPS Coordinates: {selectedEnforcer.coords[0]}, {selectedEnforcer.coords[1]}</p>
                  </div>
                </div>

                {/* Embedded OpenStreetMap sa Modal */}
                <div className="h-44 rounded-xl overflow-hidden border border-gray-200 relative z-0 shadow-inner">
                  <MapContainer 
                    center={selectedEnforcer.coords} 
                    zoom={16} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    attributionControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={selectedEnforcer.coords} />
                  </MapContainer>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
              <button 
                type="button"
                onClick={() => setSelectedEnforcer(null)}
                className="bg-[#0A3320] hover:bg-[#061E12] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}