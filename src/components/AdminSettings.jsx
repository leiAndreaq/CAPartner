import { useState, useRef } from 'react';
import { User, Lock, Shield, CheckCircle, Save, Camera, Upload, ShieldAlert, AlertOctagon, X, AlertCircle } from 'lucide-react';

export default function AdminSettings({ adminProfile, setAdminProfile }) {
  // This screen controls the current administrator account. It keeps the editable
  // profile data locally until the user confirms the save action so the app can
  // validate inputs before updating the global admin state.
  const [formData, setFormData] = useState({
    name: adminProfile?.name || 'Alex Mendoza',
    username: adminProfile?.username || 'alex.admin',
    email: adminProfile?.email || 'alex.mendoza@capartner.sys',
    role: 'System Administrator',
    avatar: adminProfile?.avatar || null
  });

  // Password form values are kept separate from the profile form because they are
  // sensitive and need their own validation rules before the save warning modal appears.
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // This holds the validation error message that appears under the password fields
  // when the user enters incomplete or mismatched values.
  const [passwordError, setPasswordError] = useState(null);

  // Toast is a lightweight success banner shown after profile or password updates.
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  // The confirmation modal is used as a security checkpoint before changing account
  // data that affects admin access or system-level credentials.
  const [saveWarningModal, setSaveWarningModal] = useState({ show: false, actionType: null, payload: null });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // Reset the password validation message whenever the user edits the form again.
  const handlePasswordChange = (field, value) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
    if (passwordError) setPasswordError(null);
  };

  // Reads the selected image file, converts it into a base64 data URL, and updates
  // the admin avatar locally before saving it into the main app profile state.
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

  // Opens the save confirmation for profile changes. This separates the editing
  // workflow from the final commit so the user explicitly confirms the update.
  const handleInitiateProfileUpdate = (e) => {
    e.preventDefault();
    setSaveWarningModal({
      show: true,
      actionType: 'profile',
      payload: formData
    });
  };

  // Validates the password form before allowing a save. All fields must be filled,
  // and the new password must exactly match the confirmation field.
  const handleInitiatePasswordUpdate = (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('New passwords do not match. Please try again.');
      return;
    }

    setSaveWarningModal({
      show: true,
      actionType: 'password',
      payload: passwords
    });
  };

  // Confirms the selected action and commits the update to the app state.
  // Profile edits update admin profile, while password changes clear sensitive fields.
  const confirmSave = () => {
    if (saveWarningModal.actionType === 'profile') {
      if (setAdminProfile) {
        setAdminProfile(saveWarningModal.payload);
      }
      showToast('Admin profile information successfully updated and saved.');
    }
    else if (saveWarningModal.actionType === 'password') {
      showToast('Admin password successfully changed.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError(null);
    }
    setSaveWarningModal({ show: false, actionType: null, payload: null });
  };

  // Generates a two-letter avatar when no profile photo is available.
  const getInitials = (name) => {
    if (!name) return 'AM';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Shared Tailwind styling is centralized here so both profile and password inputs
  // follow the same layout and validation feedback pattern.
  const baseInputClass = "w-full rounded-xl px-4 py-3 text-xs sm:text-sm transition-all duration-300 font-medium focus:outline-none border";
  const normalInputClass = "border-gray-200 bg-gray-50/50 text-gray-900 focus:border-emerald-600 focus:bg-white";
  const errorInputClass = "border-red-500 bg-red-50/30 text-red-900 shadow-[0_0_12px_rgba(239,68,68,0.2)] focus:border-red-600 focus:ring-2 focus:ring-red-500/20";

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto bg-[#F8FAF9] relative font-sans">

      {/* Main page title and context text. This gives the admin a quick summary of
          what can be managed from this screen before they start editing fields. */}
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase mb-2">Administrator Security</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Admin Profile & Settings</h2>
        <p className="text-sm text-gray-500">Manage your administrator credentials, profile picture, username, and login password.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">

        {/* Left summary card: this section acts like a profile header. It previews the
            current admin identity, role, and access details before the user edits them. */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm flex flex-col items-center text-center">
          
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

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 bg-[#0A3320] hover:bg-[#115E3E] text-white p-2 rounded-xl shadow-lg border-2 border-white transition-all cursor-pointer flex items-center justify-center"
              title="Upload photo"
            >
              <Camera className="w-4 h-4" />
            </button>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-2 text-center"
            >
              <Upload className="w-5 h-5 mb-1 text-emerald-400" />
              <span className="text-[10px] font-bold leading-tight">Click to Upload</span>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
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

        {/* Right side contains all editable admin information. This is the main data
            entry area for name, username, email, and password updates. */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile form: this is where basic identity details are maintained. It updates
              the formData state and triggers a confirmation modal before committing changes. */}
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

            <form onSubmit={handleInitiateProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`${baseInputClass} ${normalInputClass}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`${baseInputClass} ${normalInputClass}`}
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
                  className={`${baseInputClass} ${normalInputClass}`}
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0A3320] text-white text-xs font-bold hover:bg-[#061E12] transition-all shadow-sm cursor-pointer">
                  <Save className="w-4 h-4" /> Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          {/* Password form: this area enforces multiple validation checks to protect the
              administrator account and provide immediate feedback if any input is invalid. */}
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

            <form onSubmit={handleInitiatePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={passwords.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  className={`${baseInputClass} ${normalInputClass}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={passwords.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={`${baseInputClass} ${passwordError ? errorInputClass : normalInputClass}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={passwords.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={`${baseInputClass} ${passwordError ? errorInputClass : normalInputClass}`}
                  />
                </div>
              </div>

              {/* Red Warning Message Kapag Nagka-Error */}
              {passwordError && (
                <div className="flex items-center gap-1.5 text-red-500 mt-2 bg-red-50 p-2.5 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-xs font-bold">{passwordError}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button type="submit" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0A3320] text-white text-xs font-bold hover:bg-[#061E12] transition-all shadow-sm cursor-pointer">
                  <Shield className="w-4 h-4" /> Update Password
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

      {/* ========================================================== */}
      {/* MANDATORY IMPORTANT WARNING CONFIRMATION MODAL              */}
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
              {saveWarningModal.actionType === 'profile' ? 'Confirm Profile Modifications?' : 'Confirm Password Change?'}
            </h3>

            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-6 text-left shadow-xs">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-amber-900 uppercase tracking-wide mb-1">WARNING: MASTER ACCESS IMPACT</p>
                  <p className="text-xs font-semibold text-amber-950 leading-relaxed whitespace-normal break-words">
                    {saveWarningModal.actionType === 'profile' 
                      ? 'Saving these edits will instantly update the primary administrator credentials across the system. Ensure all details are correct.' 
                      : 'Changing the password will update the master login credentials. You may be required to sign in again after this change.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSaveWarningModal({ show: false, actionType: null, payload: null })} 
                className="flex-1 py-3.5 rounded-xl border border-gray-300 font-black text-xs bg-white text-gray-700 hover:bg-gray-50 active:scale-95 cursor-pointer shadow-xs transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSave} 
                className="flex-1 py-3.5 rounded-xl font-black text-xs bg-[#0A3320] hover:bg-[#061E12] text-white active:scale-95 cursor-pointer shadow-lg transition-all"
              >
                Yes, Authorize Now
              </button>
            </div>

          </div>
        </div>
      )}

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