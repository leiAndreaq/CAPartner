import { useState, useRef } from 'react';
import { User, Lock, Shield, CheckCircle, Save, Camera, Upload } from 'lucide-react';

export default function AdminSettings({ adminProfile, setAdminProfile }) {
  // Local form states para sa admin details
  const [formData, setFormData] = useState({
    name: adminProfile?.name || 'Alex Mendoza',
    username: adminProfile?.username || 'alex.admin',
    email: adminProfile?.email || 'alex.mendoza@capartner.sys',
    role: 'System Administrator',
    avatar: adminProfile?.avatar || null
  });

  // Password fields state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // Pag-handle ng pag-upload ng profile picture
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedAvatar = reader.result;
        setFormData(prev => ({ ...prev, avatar: updatedAvatar }));
        if (setAdminProfile) {
          setAdminProfile(prev => ({ ...prev, avatar: updatedAvatar }));
        }
        showToast('Profile picture successfully updated.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    if (setAdminProfile) {
      setAdminProfile(formData);
    }
    showToast('Admin profile information successfully updated and saved.');
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      showToast('Please fill in all password fields.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast('New passwords do not match.');
      return;
    }
    showToast('Admin password successfully changed.');
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // Kuhanin ang initials kung walang uploaded photo (hal. "Alex Mendoza" -> "AM")
  const getInitials = (name) => {
    if (!name) return 'AM';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto bg-[#F8FAF9] relative font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase mb-2">Administrator Security</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Admin Profile & Settings</h2>
        <p className="text-sm text-gray-500">Manage your administrator credentials, profile picture, username, and login password.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
        
        {/* Left Column: Admin Card Summary & Profile Picture Upload */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm flex flex-col items-center text-center">
          
          {/* Avatar with Upload Indicator & Camera Badge */}
          <div className="relative group mb-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-2xl bg-[#0A3320] text-white font-black text-2xl flex items-center justify-center overflow-hidden shadow-md border-2 border-emerald-100 cursor-pointer transition-transform group-hover:scale-105"
            >
              {formData.avatar ? (
                <img src={formData.avatar} alt="Admin Profile" className="w-full h-full object-cover" />
              ) : (
                getInitials(formData.name)
              )}
            </div>

            {/* Camera Floating Indicator Badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 bg-[#0A3320] hover:bg-[#115E3E] text-white p-2 rounded-xl shadow-lg border-2 border-white transition-all cursor-pointer flex items-center justify-center"
              title="Upload photo"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Hover overlay text para mas madaling ma-intindihan */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-2 text-center"
            >
              <Upload className="w-5 h-5 mb-1 text-emerald-400" />
              <span className="text-[10px] font-bold leading-tight">Click to Upload Photo</span>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mt-2">{formData.name}</h3>
          <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mt-1.5 border border-emerald-100">
            {formData.role}
          </p>
          
          <div className="w-full border-t border-gray-100 my-6"></div>

          <div className="w-full text-left space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Username</span>
              <span className="font-bold text-gray-900">@{formData.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Access Level</span>
              <span className="font-bold text-emerald-700">Full Control</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Status</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">● Active Session</span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Edit Profile / Username Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#0A3320]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-950">Administrator Details</h3>
                <p className="text-xs text-gray-500">Update your display name, username, and notification email.</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0A3320] text-white text-xs font-bold hover:bg-[#061E12] transition-all shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-950">Security & Password</h3>
                <p className="text-xs text-gray-500">Ensure your account is using a secure password to prevent unauthorized access.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0A3320] text-white text-xs font-bold hover:bg-[#061E12] transition-all shadow-sm cursor-pointer"
                >
                  <Shield className="w-4 h-4" /> Update Password
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-[#0A3320] text-white px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3 border border-emerald-500/30">
            <div className="bg-[#115E3E] rounded-full p-1 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold tracking-wide">{toast}</p>
          </div>
        </div>
      )}

    </div>
  );
}