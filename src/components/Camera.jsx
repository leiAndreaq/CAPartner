import { useState } from 'react';
import { Maximize, ChevronRight, Play, X, VideoOff, Camera as CameraIcon, Clock, Volume2, VolumeX, CheckCircle, Smartphone, User, Download } from 'lucide-react';

export default function Camera() {
  const [activeTab, setActiveTab] = useState('cctv'); // 'cctv' o 'enforcers'
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedClips, setSelectedClips] = useState([1]);
  const [selectedCamera, setSelectedCamera] = useState(null); 
  const [selectedClip, setSelectedClip] = useState(null);     
  const [selectedEnforcerMedia, setSelectedEnforcerMedia] = useState(null); 
  const [toastMessage, setToastMessage] = useState(null);     

  const [isMuted, setIsMuted] = useState(false);

  const [filters, setFilters] = useState({ date: '', camera: 'All cameras' });
  const [appliedFilters, setAppliedFilters] = useState({ date: '', camera: 'All cameras' });

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const cameras = [
    { id: 1, name: 'Camera 1', code: 'CAM-001', status: 'Online', loc: 'North Transport Terminal', lastConn: 'Today, 10:47 AM' },
    { id: 2, name: 'Camera 2', code: 'CAM-002', status: 'Online', loc: 'Central Public Market', lastConn: 'Today, 10:46 AM' },
    { id: 3, name: 'Camera 3', code: 'CAM-003', status: 'Offline', loc: 'South Highway Junction', lastConn: 'Today, 9:56 AM' },
  ];

  const clips = [
    { id: 1, cam: 'Camera 1', date: '2025-06-16', time: '10:30', duration: '12:45', loc: 'North Transport Terminal' },
    { id: 2, cam: 'Camera 2', date: '2025-06-16', time: '09:55', duration: '08:20', loc: 'Central Public Market' },
    { id: 3, cam: 'Camera 1', date: '2025-06-15', time: '16:10', duration: '15:00', loc: 'North Transport Terminal' },
    { id: 4, cam: 'Camera 3', date: '2025-06-15', time: '14:22', duration: '06:18', loc: 'South Highway Junction' },
    { id: 5, cam: 'Camera 2', date: '2025-06-14', time: '11:04', duration: '10:30', loc: 'Central Public Market' },
  ];

  const enforcerMediaList = [
    { id: 1, enforcer: 'Miguel Reyes · ENF-2401', type: 'Video Capture', date: 'Today, 10:45 AM', duration: '00:45', loc: 'Terminal Road, Brgy. San Roque', desc: 'Na-record ang pagharang sa ilegal na pumarada sa terminal.' },
    { id: 2, enforcer: 'Andrea Dela Cruz · ENF-2402', type: 'Video Capture', date: 'Today, 09:20 AM', duration: '01:12', loc: 'Mabini Street, Market District', desc: 'Inspeksyon sa tindahan at dokumentasyon ng insidente.' },
    { id: 3, enforcer: 'Jose Santos · ENF-2403', type: 'Video Capture', date: 'Yesterday, 04:15 PM', duration: '00:30', loc: 'South Highway Junction', desc: 'Ulat sa sirang street light at hazard sa kalsada.' },
  ];

  const toggleClip = (id) => {
    setSelectedClips(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const visibleClips = clips.filter((clip) => {
    const matchesCamera = appliedFilters.camera === 'All cameras' || clip.cam === appliedFilters.camera;
    const matchesDate = !appliedFilters.date || clip.date === appliedFilters.date;
    return matchesCamera && matchesDate;
  });

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const reset = { date: '', camera: 'All cameras' };
    setFilters(reset);
    setAppliedFilters(reset);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto bg-[#F8FAF9] relative">
      
      {/* Top Header & Tab Switching */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase mb-2">Site coverage & mobile telemetry</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Camera & Media Monitoring</h2>
          <p className="text-sm text-gray-500">CCTV feeds, recorded clips, and video evidence captured by enforcers via app.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-gray-200/70 p-1 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('cctv')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cctv' ? 'bg-[#0A3320] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            CCTV Feeds & Clips
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('enforcers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'enforcers' ? 'bg-[#0A3320] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Captured by Enforcers
          </button>
        </div>
      </div>

      {activeTab === 'cctv' ? (
        <>
          {/* Live Camera Feeds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
            {cameras.map((cam) => {
              const isOnline = cam.status === 'Online';

              return (
                <div 
                  key={cam.id} 
                  className={`bg-white rounded-2xl border overflow-hidden shadow-sm flex flex-col transition-all ${
                    !isOnline ? 'border-red-200 bg-red-50/20' : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className={`h-48 relative flex items-center justify-center border-b border-gray-200 overflow-hidden ${
                    isOnline ? 'bg-[#1A221F]' : 'bg-[#111]'
                  }`}>
                    {isOnline ? (
                      <>
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)' }}></div>
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded text-[9px] font-bold text-white tracking-wider">LIVE · {cam.code}</div>
                        
                        <button
                          type="button"
                          onClick={() => setSelectedCamera(cam)}
                          className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-bold text-white tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Maximize className="w-3 h-3" /> Full screen
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded text-[9px] font-bold text-gray-500 tracking-wider">LIVE · {cam.code}</div>
                        <div className="text-center p-4">
                          <VideoOff className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <p className="text-sm font-bold text-red-500 tracking-widest uppercase mb-0.5">Camera Offline</p>
                          <p className="text-[10px] text-gray-400">Stream unavailable</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 tracking-wider mb-0.5">{cam.code}</p>
                        <h3 className="text-lg font-bold text-gray-900">{cam.name}</h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                        isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span> {cam.status}
                      </span>
                    </div>

                    <div className="space-y-1 mb-5">
                      <p className="text-xs text-gray-500 flex items-center gap-1.5"><CameraIcon className="w-3.5 h-3.5 text-gray-400"/> {cam.loc}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400"/> Last connection: {cam.lastConn}</p>
                    </div>

                    <button
                      type="button"
                      disabled={!isOnline}
                      onClick={() => setSelectedCamera(cam)}
                      className={`mt-auto w-full py-2.5 border rounded-xl text-xs font-bold transition-colors flex justify-center items-center gap-1 ${
                        isOnline 
                          ? 'border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer' 
                          : 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                      }`}
                    >
                      View full screen & feed <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recorded Clips Section */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Recorded clips</h3>
                <p className="text-xs text-gray-500">Recordings retained for deployment posts.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowExportModal(true)}
                className="bg-[#0A3320] hover:bg-[#061E12] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Export clips
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:flex xl:flex-wrap gap-4 bg-gray-50/50 border-b border-gray-100">
              <div className="sm:w-48 xl:w-48">
                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320]"
                />
              </div>
              <div className="sm:w-56 xl:w-56">
                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Camera</label>
                <select
                  value={filters.camera}
                  onChange={(e) => setFilters(prev => ({ ...prev, camera: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] bg-white cursor-pointer"
                >
                  <option>All cameras</option>
                  <option>Camera 1</option>
                  <option>Camera 2</option>
                  <option>Camera 3</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="bg-[#0A3320] hover:bg-[#061E12] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer w-full sm:w-auto"
              >
                Apply filters
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer w-full sm:w-auto"
              >
                Clear filters
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/30 border-b border-gray-200 text-[9px] font-bold tracking-wider text-gray-400 uppercase">
                    <th className="py-4 px-6">CAMERA NAME</th>
                    <th className="py-4 px-6">RECORDING DATE</th>
                    <th className="py-4 px-6">START TIME</th>
                    <th className="py-4 px-6">DURATION</th>
                    <th className="py-4 px-6">LOCATION</th>
                    <th className="py-4 px-6 text-center">PLAYBACK</th>
                    <th className="py-4 px-6 text-center">EXPORT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {visibleClips.map((clip) => (
                    <tr key={clip.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900">{clip.cam}</td>
                      <td className="py-4 px-6 font-medium text-gray-600">{clip.date}</td>
                      <td className="py-4 px-6 font-medium text-gray-600">{clip.time}</td>
                      <td className="py-4 px-6 font-medium text-gray-600">{clip.duration}</td>
                      <td className="py-4 px-6 font-medium text-gray-600">{clip.loc}</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => setSelectedClip(clip)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-emerald-700" /> Play clip
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <button 
                            type="button"
                            onClick={() => setShowExportModal(true)}
                            className="px-4 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Export
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ========================================================== */
        /* CAPTURED BY ENFORCERS (RESPONSIVE TABLE + MOBILE CARD VIEW) */
        /* ========================================================== */
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden mb-8 animate-in fade-in duration-300">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Enforcer Mobile App Video Evidence</h3>
              <p className="text-xs text-gray-500">Mga video at ebidensyang isinumite ng mga enforcer nang direkta mula sa kanilang CAPartner app.</p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 self-start">
              Total Submissions: {enforcerMediaList.length}
            </span>
          </div>

          {/* Desktop Table View (hidden on mobile/tablet) */}
          <div className="hidden xl:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-[9px] font-bold tracking-wider text-gray-400 uppercase">
                  <th className="py-4 px-6">ENFORCER DETAILS</th>
                  <th className="py-4 px-6">MEDIA TYPE</th>
                  <th className="py-4 px-6">TIMESTAMP</th>
                  <th className="py-4 px-6">LOCATION / DESCRIPTION</th>
                  <th className="py-4 px-6 text-center">PLAYBACK EVIDENCE</th>
                  <th className="py-4 px-6 text-center">DOWNLOAD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {enforcerMediaList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p>{item.enforcer.split(' · ')[0]}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{item.enforcer.split(' · ')[1]}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {item.type} ({item.duration})
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-600">{item.date}</td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-gray-800">{item.loc}</p>
                      <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedEnforcerMedia(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-emerald-700" /> Watch Video
                      </button>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => showToast(`Downloaded media evidence from ${item.enforcer.split(' · ')[0]}`)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View (Lumalabas sa mobile at tablet para hindi masira ang layout) */}
          <div className="xl:hidden divide-y divide-gray-100">
            {enforcerMediaList.map((item) => (
              <div key={item.id} className="p-5 flex flex-col gap-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.enforcer.split(' · ')[0]}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{item.enforcer.split(' · ')[1]}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 shrink-0">
                    {item.type}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                    <span>Timestamp:</span>
                    <span>{item.date}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{item.loc}</p>
                    <p className="text-gray-600 text-[11px] mt-0.5">{item.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedEnforcerMedia(item)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-emerald-700" /> Watch Video ({item.duration})
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast(`Downloaded media evidence from ${item.enforcer.split(' · ')[0]}`)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- FULL-SCREEN LIVE FEED MODAL ----------------- */}
      {selectedCamera && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="bg-[#111614] w-full max-w-5xl rounded-3xl shadow-2xl border border-emerald-900/50 overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-200">
            
            <div className="bg-[#0A3320] px-6 py-4 flex items-center justify-between border-b border-emerald-900/60">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <div>
                  <h3 className="text-base font-bold tracking-tight">{selectedCamera.name} — Full Screen Live Feed</h3>
                  <p className="text-[10px] text-emerald-200/70">{selectedCamera.loc} ({selectedCamera.code})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCamera(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-[60dvh] bg-[#080C0A] flex items-center justify-center overflow-hidden border-b border-emerald-900/40">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(255,255,255,0.05) 15px, rgba(255,255,255,0.05) 16px)' }}></div>
              
              <div className="text-center z-10 p-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  <CameraIcon className="w-8 h-8" />
                </div>
                <p className="text-lg font-bold text-white mb-1">Live Feed Active ({selectedCamera.code})</p>
                <p className="text-xs text-emerald-200/60">Backend stream socket ready for HLS / WebRTC connection.</p>
              </div>

              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-extrabold tracking-widest text-emerald-400 border border-emerald-500/20">
                🔴 HD 1080P · 60FPS
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-[#0A3320]/60 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCamera(null)}
                  className="px-5 py-2.5 rounded-xl bg-white text-[#0A3320] hover:bg-emerald-50 text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Close Full Screen
                </button>

                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title={isMuted ? "Unmute Audio" : "Mute Audio"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-300">SECURE COMMAND FEED</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ----------------- ENFORCER MEDIA PREVIEW MODAL ----------------- */}
      {selectedEnforcerMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Enforcer Video Evidence</h3>
                <p className="text-xs text-gray-500">{selectedEnforcerMedia.enforcer}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnforcerMedia(null)}
                className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-[#1A221F] p-5 text-white border border-gray-200 mb-5">
              <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-gray-300">
                <span>{selectedEnforcerMedia.loc}</span>
                <span>{selectedEnforcerMedia.date}</span>
              </div>
              <div className="h-48 rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center">
                <div className="text-center p-4">
                  <Play className="mx-auto mb-2 h-10 w-10 text-emerald-400 animate-pulse" />
                  <p className="text-xs font-bold text-white">Playing Enforcer Upload ({selectedEnforcerMedia.duration})</p>
                  <p className="text-[11px] text-emerald-200/70 mt-1">{selectedEnforcerMedia.desc}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  showToast(`Downloaded evidence from ${selectedEnforcerMedia.enforcer.split(' · ')[0]}`);
                  setSelectedEnforcerMedia(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download video
              </button>
              <button
                type="button"
                onClick={() => setSelectedEnforcerMedia(null)}
                className="px-5 py-2.5 rounded-xl bg-[#0A3320] text-white font-bold text-xs hover:bg-[#061E12] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PLAY CLIP PREVIEW MODAL ----------------- */}
      {selectedClip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Playback Preview — {selectedClip.cam}</h3>
              <button
                type="button"
                onClick={() => setSelectedClip(null)}
                className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-[#1A221F] p-5 text-white border border-gray-200 mb-5">
              <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-gray-300">
                <span>{selectedClip.cam}</span>
                <span>{selectedClip.date} · {selectedClip.time}</span>
              </div>
              <div className="h-48 rounded-xl border border-white/10 bg-gradient-to-br from-slate-800 via-slate-700 to-emerald-900/80 flex items-center justify-center">
                <div className="text-center">
                  <Play className="mx-auto mb-2 h-10 w-10 text-emerald-400" />
                  <p className="text-xs font-bold text-white">Playing Recorded Segment ({selectedClip.duration})</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowExportModal(true);
                  setSelectedClip(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs transition-colors cursor-pointer"
              >
                Export this clip
              </button>
              <button
                type="button"
                onClick={() => setSelectedClip(null)}
                className="px-5 py-2.5 rounded-xl bg-[#0A3320] text-white font-bold text-xs hover:bg-[#061E12] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- EXPORT MODAL ----------------- */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Export recorded clips</h3>
              <p className="text-sm text-gray-500">Select the clips to include in the export package.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Camera</label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] bg-white cursor-pointer">
                  <option>All cameras</option>
                  <option>Camera 1</option>
                  <option>Camera 2</option>
                  <option>Camera 3</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320]" />
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden mb-8 max-h-52 overflow-y-auto">
              {clips.map((clip, idx) => (
                <label key={clip.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${idx !== clips.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedClips.includes(clip.id)}
                    onChange={() => toggleClip(clip.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#0A3320] focus:ring-[#0A3320] accent-[#0A3320] cursor-pointer"
                  />
                  <span className="text-xs text-gray-700 font-medium">
                    {clip.cam} · {clip.date} · {clip.time} ({clip.duration})
                  </span>
                </label>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-xs bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowExportModal(false);
                  showToast(`Successfully exported ${selectedClips.length} recorded clips.`);
                }}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-[#0A3320] text-white hover:bg-[#061E12] transition-colors cursor-pointer shadow-sm"
              >
                Export selected ({selectedClips.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODERN TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-[120] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-[#0A3320] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/30">
            <div className="bg-[#115E3E] rounded-full p-1 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold tracking-wide">{toastMessage}</p>
          </div>
        </div>
      )}

    </div>
  );
}