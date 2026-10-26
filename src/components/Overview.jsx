import { Users, CheckCircle2, AlertTriangle, WifiOff, MapPin, Shield, Clock, ChevronRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export default function Overview() {
  const enforcers = [
    { 
      id: 1, name: 'Miguel Reyes', badge: 'ENF-2401', status: 'Normal', post: 'North Transport Terminal', 
      hr: '78 BPM', temp: '36.6 °C', motion: 'Moving', battery: '86%', coords: [14.6507, 120.9822], 
      color: 'emerald', locType: 'CURRENT LOCATION', address: 'Terminal Road, Brgy. San Roque', 
      internet: true, lora: true, time: 'Updated Today, 10:45:12 AM' 
    },
    { 
      id: 2, name: 'Andrea Dela Cruz', badge: 'ENF-2402', status: 'Attention', post: 'Central Public Market', 
      hr: '104 BPM', temp: '37.8 °C', motion: 'Stationary', battery: '64%', coords: [14.6488, 120.9850], 
      color: 'amber', locType: 'CURRENT LOCATION', address: 'Mabini Street, Market District', 
      internet: true, lora: true, time: 'Updated Today, 10:43:08 AM' 
    },
    { 
      id: 3, name: 'Jose Santos', badge: 'ENF-2403', status: 'Offline', post: 'South Highway Junction', 
      hr: 'No data', temp: 'No data', motion: 'No Signal', battery: '18%', coords: [14.6450, 120.9880], 
      color: 'red', locType: 'LAST KNOWN LOCATION', address: 'South Highway, Brgy. Mabuhay', 
      internet: false, lora: false, time: 'Updated Today, 10:21:44 AM' 
    }
  ];

  const colors = {
    emerald: { border: 'border-t-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    amber: { border: 'border-t-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
    red: { border: 'border-t-red-500', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
      
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase mb-2">Operations Dashboard</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Enforcer Overview</h2>
          <p className="text-sm text-gray-500">Monitor enforcer safety, location, and device connectivity.</p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
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

      {/* Enforcer Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
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
                <div className="p-3.5 border-r border-gray-100">
                  <p className="text-[8px] tracking-widest text-gray-400 uppercase font-bold mb-1">Motion</p>
                  <p className="text-sm font-bold text-gray-900">{enf.motion}</p>
                </div>
                <div className="p-3.5">
                  <p className="text-[8px] tracking-widest text-gray-400 uppercase font-bold mb-1">Battery</p>
                  <p className="text-sm font-bold text-gray-900">{enf.battery}</p>
                </div>
              </div>

              {/* Location Text */}
              <div className="flex gap-2.5 mb-4">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase mb-0.5">{enf.locType}</p>
                  <p className="text-xs font-semibold text-gray-800">{enf.address}</p>
                </div>
              </div>

              {/* Connectivity Status */}
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

              {/* Card Mini-Map without attribution tag */}
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
                
                {/* Floating Label */}
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded shadow-sm z-[1000] border border-gray-100">
                  <p className="text-[8px] font-bold text-gray-700">{enf.post}</p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-medium">{enf.time}</span>
                </div>
                <button className="bg-[#0A3320] hover:bg-[#061E12] text-white py-2 px-4 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors">
                  View details <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              
            </div>
          );
        })}
      </div>

      {/* Main Live Deployment Map without attribution tag */}
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

    </div>
  );
}