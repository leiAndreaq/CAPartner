import { useState, useEffect } from 'react';
import { Camera, User, Lock, Save, LogOut } from 'lucide-react';

export default function Settings({ onLogout, userProfile, onUpdateProfile }) {
  // Initialize the form state with the global user profile from App.jsx
  const [profile, setProfile] = useState({
    fullName: userProfile?.fullName || '',
    username: userProfile?.username || '',
    email: userProfile?.email || ''
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Keep local state in sync if global state changes unexpectedly
  useEffect(() => {
    if (userProfile) {
      setProfile({
        fullName: userProfile.fullName,
        username: userProfile.username,
        email: userProfile.email
      });
    }
  }, [userProfile]);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  // Auto-generate initials for the avatar
  const getInitials = (name) => {
    if (!name) return 'AM';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Save the changes to the global state
  const saveProfile = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        ...userProfile, // preserve the role
        fullName: profile.fullName,
        username: profile.username,
        email: profile.email
      });
      // Optional: you could add a toast notification here indicating success
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#F8FAF9]">
      
      {/* Top Page Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase mb-2">System configuration</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Settings</h2>
        <p className="text-sm text-gray-500">Manage your administrator profile, credentials, and system access.</p>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-6">
        
        {/* LEFT COLUMN: Profile Card */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-8 flex flex-col items-center">
            
            {/* Avatar */}
            <div className="relative mb-5">
              <div className="w-24 h-24 bg-[#0A3320] rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-sm">
                {getInitials(userProfile?.fullName)}
              </div>
              <button className="absolute -bottom-2 -right-2 bg-[#0A3320] border-2 border-white text-white p-1.5 rounded-xl hover:bg-[#061E12] transition-colors cursor-pointer shadow-sm">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Name & Badge (using global state so it reflects saved data immediately) */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">{userProfile?.fullName}</h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full mb-8">
              {userProfile?.role}
            </span>

            {/* Details List */}
            <div className="w-full space-y-4 border-t border-gray-100 pt-6 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Username</span>
                <span className="text-xs font-bold text-gray-900">@{userProfile?.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Access Level</span>
                <span className="text-xs font-bold text-emerald-700">Full Control</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Session
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button 
              onClick={onLogout}
              className="w-full mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>

          </div>
        </div>

        {/* RIGHT COLUMN: Form Cards */}
        <div className="flex flex-col gap-6">
          
          {/* Administrator Details Form */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-8">
            
            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#0A3320] shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Administrator Details</h3>
                <p className="text-xs text-gray-500">Update your display name, username, and notification email.</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] bg-white transition-all" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
                <input 
                  type="text" 
                  name="username"
                  value={profile.username}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] bg-white transition-all" 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] bg-white transition-all" 
                />
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end">
              <button 
                onClick={saveProfile}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A3320] text-white hover:bg-[#061E12] font-bold text-sm transition-colors cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" /> Save Profile Changes
              </button>
            </div>
          </div>

          {/* Security & Password Form */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-8">
            
            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Security & Password</h3>
                <p className="text-xs text-gray-500">Ensure your account is using a secure password to prevent unauthorized access.</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-6">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Current Password</label>
                <input 
                  type="password" 
                  name="current"
                  value={passwords.current}
                  onChange={handlePasswordChange}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] bg-white transition-all" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
                <input 
                  type="password" 
                  name="new"
                  value={passwords.new}
                  onChange={handlePasswordChange}
                  placeholder="Create a new password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] bg-white transition-all" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <input 
                  type="password" 
                  name="confirm"
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#0A3320] focus:ring-1 focus:ring-[#0A3320] bg-white transition-all" 
                />
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setPasswords({ current: '', new: '', confirm: '' })}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A3320] text-white hover:bg-[#061E12] font-bold text-sm transition-colors cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" /> Update Password
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}