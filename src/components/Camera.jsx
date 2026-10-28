import { useState } from 'react';
import { Maximize, ChevronRight, Play, VideoOff, Camera as CameraIcon, Clock, X } from 'lucide-react';

export default function Camera() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedClips, setSelectedClips] = useState([1]);

  // Video playback modal state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeClip, setActiveClip] = useState(null);

  // Filter state
  const [tempDate, setTempDate] = useState('');
  const [tempCam, setTempCam] = useState('All cameras');
  const [activeDate, setActiveDate] = useState('');
  const [activeCam, setActiveCam] = useState('All cameras');

  const clips = [
    { id: 1, cam: 'Camera 1', date: '2025-06-16', time: '10:30', duration: '12:45', loc: 'North Transport Terminal' },
    { id: 2, cam: 'Camera 2', date: '2025-06-16', time: '09:55', duration: '08:20', loc: 'Central Public Market' },
    { id: 3, cam: 'Camera 1', date: '2025-06-15', time: '16:10', duration: '15:00', loc: 'North Transport Terminal' },
    { id: 4, cam: 'Camera 3', date: '2025-06-15', time: '14:22', duration: '06:18', loc: 'South Highway Junction' },
    { id: 5, cam: 'Camera 2', date: '2025-06-14', time: '11:04', duration: '10:30', loc: 'Central Public Market' },
  ];

  const filteredClips = clips.filter(clip => {
    const matchDate = activeDate ? clip.date === activeDate : true;
    const matchCam = activeCam !== 'All cameras' ? clip.cam === activeCam : true;
    return matchDate && matchCam;
  });

  const toggleClip = (id) => {
    setSelectedClips(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleApplyFilters = () => {
    setActiveDate(tempDate);
    setActiveCam(tempCam);
  };

  const handleClearFilters = () => {
    setTempDate('');
    setTempCam('All cameras');
    setActiveDate('');
    setActiveCam('All cameras');
  };

  const openVideoModal = (clipData) => {
    // Determine if the camera is offline based on the top cards (Camera 3 is offline)
    const isCameraOffline = clipData.cam === 'Camera 3';
    
    setActiveClip({ 
      ...clipData, 
      isOffline: clipData.isOffline || isCameraOffline 
    });
    
    setShowVideoModal(true);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#F8FAF9]">
      
      {/* Top Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase mb-2">Site coverage</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Camera Monitoring</h2>
        <p className="text-sm text-gray-500">CCTV previews and recorded clip management for all deployment posts.</p>
      </div>

      {/* Live Camera Feeds */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        
        {/* Camera 1 */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
          <div className="h-48 bg-[#1A221F] relative flex items-center justify-center border-b border-gray-200 overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)' }}></div>
            <div className="absolute inset-0 opacity-10" style={{ transform: 'perspective(500px) rotateX(60deg)', backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, white 40px, white 42px)' }}></div>
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded text-[9px] font-bold text-white tracking-wider">LIVE · CAM-001</div>
            <button className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-sm p-2 rounded-lg text-white transition-colors cursor-pointer">
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-5 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[9px] font-bold text-gray-400 tracking-wider mb-0.5">CAM-001</p>
                <h3 className="text-lg font-bold text-gray-900">Camera 1</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
              </span>
            </div>
            <div className="space-y-1 mb-5">
              <p className="text-xs text-gray-500 flex items-center gap-1.5"><CameraIcon className="w-3.5 h-3.5 text-gray-400"/> North Transport Terminal</p>
              <p className="text-xs text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400"/> Last connection: Today, 10:47 AM</p>
            </div>
            <button 
              onClick={() => openVideoModal(clips.find(c => c.cam === 'Camera 1') || { cam: 'Camera 1', date: 'LIVE', time: 'Now', loc: 'North Transport Terminal' })}
              className="mt-auto w-full py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors flex justify-center items-center gap-1 cursor-pointer"
            >
              View recordings <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Camera 2 */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
          <div className="h-48 bg-[#1A221F] relative flex items-center justify-center border-b border-gray-200 overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)' }}></div>
            <div className="absolute inset-0 opacity-10" style={{ transform: 'perspective(500px) rotateX(60deg)', backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, white 40px, white 42px)' }}></div>
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded text-[9px] font-bold text-white tracking-wider">LIVE · CAM-002</div>
            <button className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-sm p-2 rounded-lg text-white transition-colors cursor-pointer">
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-5 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[9px] font-bold text-gray-400 tracking-wider mb-0.5">CAM-002</p>
                <h3 className="text-lg font-bold text-gray-900">Camera 2</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
              </span>
            </div>
            <div className="space-y-1 mb-5">
              <p className="text-xs text-gray-500 flex items-center gap-1.5"><CameraIcon className="w-3.5 h-3.5 text-gray-400"/> Central Public Market</p>
              <p className="text-xs text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400"/> Last connection: Today, 10:46 AM</p>
            </div>
            <button 
              onClick={() => openVideoModal(clips.find(c => c.cam === 'Camera 2') || { cam: 'Camera 2', date: 'LIVE', time: 'Now', loc: 'Central Public Market' })}
              className="mt-auto w-full py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors flex justify-center items-center gap-1 cursor-pointer"
            >
              View recordings <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Camera 3 (Offline) */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
          <div className="h-48 bg-[#111] relative flex flex-col items-center justify-center border-b border-gray-200 overflow-hidden">
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded text-[9px] font-bold text-gray-500 tracking-wider">LIVE · CAM-003</div>
            
            <VideoOff className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-sm font-bold text-red-500 tracking-widest uppercase mb-1">Camera Offline</p>
            <p className="text-[10px] text-gray-500">Stream unavailable</p>
            
            <button className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-sm p-2 rounded-lg text-gray-400 transition-colors cursor-pointer">
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-5 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[9px] font-bold text-gray-400 tracking-wider mb-0.5">CAM-003</p>
                <h3 className="text-lg font-bold text-gray-900">Camera 3</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Offline
              </span>
            </div>
            <div className="space-y-1 mb-5">
              <p className="text-xs text-gray-500 flex items-center gap-1.5"><CameraIcon className="w-3.5 h-3.5 text-gray-400"/> South Highway Junction</p>
              <p className="text-xs text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400"/> Last connection: Today, 9:56 AM</p>
            </div>
            <button 
              onClick={() => openVideoModal({ cam: 'Camera 3', date: 'OFFLINE', time: 'N/A', loc: 'South Highway Junction', isOffline: true })}
              className="mt-auto w-full py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors flex justify-center items-center gap-1 cursor-pointer"
            >
              View recordings <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Recorded Clips Section */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden mb-8">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Recorded clips</h3>
            <p className="text-xs text-gray-500">Recordings retained for deployment posts.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 flex items-end gap-4 bg-gray-50/50 border-b border-gray-100">
          <div className="w-48">
            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
            <input 
              type="date" 
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320]" 
            />
          </div>
          <div className="w-56">
            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Camera</label>
            <select 
              value={tempCam}
              onChange={(e) => setTempCam(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] bg-white cursor-pointer"
            >
              <option value="All cameras">All cameras</option>
              <option value="Camera 1">Camera 1</option>
              <option value="Camera 2">Camera 2</option>
              <option value="Camera 3">Camera 3</option>
            </select>
          </div>
          <button 
            onClick={handleApplyFilters}
            className="bg-[#0A3320] hover:bg-[#061E12] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            Apply filters
          </button>
          <button 
            onClick={handleClearFilters}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Clear filters
          </button>
        </div>

        {/* Table */}
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
              {filteredClips.length > 0 ? (
                filteredClips.map((clip) => (
                  <tr key={clip.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">{clip.cam}</td>
                    <td className="py-4 px-6 font-medium text-gray-600">{clip.date}</td>
                    <td className="py-4 px-6 font-medium text-gray-600">{clip.time}</td>
                    <td className="py-4 px-6 font-medium text-gray-600">{clip.duration}</td>
                    <td className="py-4 px-6 font-medium text-gray-600">{clip.loc}</td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => openVideoModal(clip)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-emerald-700" /> Play clip
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => setShowExportModal(true)}
                          className="px-4 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Export
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 font-medium">
                    No recorded clips match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- VIDEO PLAYBACK MODAL ----------------- */}
      {showVideoModal && activeClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-4xl shadow-xl animate-in zoom-in-95 duration-200 m-4">
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{activeClip.cam} - Playback</h3>
                <p className="text-xs text-gray-500 font-medium">{activeClip.date} · {activeClip.time} · {activeClip.loc}</p>
              </div>
              <button 
                onClick={() => setShowVideoModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-2 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conditional Render: Offline vs Video Player */}
            {activeClip.isOffline || activeClip.date === 'OFFLINE' ? (
              <div className="w-full aspect-video bg-[#111] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-gray-200">
                <VideoOff className="w-12 h-12 text-red-500 mb-3" />
                <p className="text-base font-bold text-red-500 tracking-widest uppercase mb-1">No Video Available</p>
                <p className="text-xs text-gray-500">Camera is currently offline.</p>
              </div>
            ) : (
              <div className="w-full aspect-video bg-black rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-gray-200">
                <Play className="w-16 h-16 text-white/40 absolute hover:text-white/60 transition-colors cursor-pointer" />
                
                {/* OSD (On-Screen Display) watermark */}
                <div className="absolute bottom-4 left-4 text-white text-xs font-bold tracking-wider bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded">
                  {activeClip.cam.toUpperCase()} REC {activeClip.date} {activeClip.time}
                </div>
                
                {/* Fake progress bar */}
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/20">
                  <div className="h-full bg-emerald-500 w-1/3"></div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ----------------- EXPORT MODAL ----------------- */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-xl animate-in zoom-in-95 duration-200 m-4">
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Export recorded clips</h3>
              <p className="text-sm text-gray-500">Select the clips to include in the export.</p>
            </div>

            {/* Modal Filters matching new rules (1 Date, 1 Camera) */}
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

            {/* Checkbox List */}
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-8">
              {clips.map((clip, idx) => (
                <label key={clip.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${idx !== clips.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedClips.includes(clip.id)}
                    onChange={() => toggleClip(clip.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#0A3320] focus:ring-[#0A3320] accent-[#0A3320] cursor-pointer"
                  />
                  <span className="text-xs text-gray-700 font-medium">
                    {clip.cam} · {clip.date} · {clip.time}
                  </span>
                </label>
              ))}
            </div>
            
            {/* Modal Actions */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#0A3320] text-white hover:bg-[#061E12] transition-colors cursor-pointer shadow-sm"
              >
                Export selected
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}