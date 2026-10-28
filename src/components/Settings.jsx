import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, CheckCircle, Mail, X, ShieldAlert, CheckSquare, Square } from 'lucide-react';

export default function Settings({ onLogout }) {
  // Mock data para sa personnel / officer accounts
  const [accounts, setAccounts] = useState([
    { id: 1, name: 'nigger', email: 'niggas@gmail.com', badge: 'ENF-2404', role: 'New assignment', status: 'Active' },
    { id: 2, name: 'Miguel Reyes', email: 'miguel.reyes@gmail.com', badge: 'ENF-2401', role: 'North Transport Terminal', status: 'Active' },
    { id: 3, name: 'Andrea Dela Cruz', email: 'andrea.delacruz@gmail.com', badge: 'ENF-2402', role: 'Sector A Patrolling', status: 'Active' },
    { id: 4, name: 'Jose Santos', email: 'jose.santos@gmail.com', badge: 'ENF-2403', role: 'South Highway Monitoring', status: 'Active' },
  ]);

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Sector A Patrolling' });
  const [toast, setToast] = useState(null);

  // States para sa Selection, Delete Confirmation, at Bulk Delete
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ show: false, type: 'single', id: null });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormData({ name: '', email: '', role: 'New assignment' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc) => {
    setEditingAccount(acc);
    setFormData({ name: acc.name, email: acc.email, role: acc.role });
    setIsModalOpen(true);
  };

  const handleSaveAccount = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast('Please fill in all required fields.');
      return;
    }

    if (editingAccount) {
      setAccounts(prev => prev.map(acc => acc.id === editingAccount.id ? { ...acc, name: formData.name, email: formData.email } : acc));
      showToast(`Account for ${formData.name} successfully updated.`);
    } else {
      const newAcc = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        badge: `ENF-${Math.floor(1000 + Math.random() * 9000)}`,
        role: formData.role,
        status: 'Active'
      };
      setAccounts(prev => [newAcc, ...prev]);
      showToast(`Enforcer account for ${formData.name} successfully created.`);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (id) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === id) {
        const newStatus = acc.status === 'Active' ? 'Deactivated' : 'Active';
        showToast(`Account ${acc.name} has been ${newStatus.toLowerCase()}.`);
        return { ...acc, status: newStatus };
      }
      return acc;
    }));
  };

  // --- SELECT ALL & CHECKBOX HANDLERS ---
  const handleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map(acc => acc.id));
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // --- DELETE EXECUTION ---
  const executeDelete = () => {
    if (deleteModal.type === 'single') {
      setAccounts(prev => prev.filter(acc => acc.id !== deleteModal.id));
      setSelectedIds(prev => prev.filter(item => item !== deleteModal.id));
      showToast('Personnel account permanently deleted.');
    } else if (deleteModal.type === 'bulk') {
      setAccounts(prev => prev.filter(acc => !selectedIds.includes(acc.id)));
      setSelectedIds([]);
      showToast(`Successfully deleted ${selectedIds.length} accounts.`);
    }
    setDeleteModal({ show: false, type: 'single', id: null });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto bg-[#F8FAF9] relative font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.15em] text-[#0A3320] uppercase mb-2">System Configuration</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Personnel account management</h2>
        <p className="text-sm text-gray-500">Create, edit, and manage officer accounts and system access levels.</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 max-w-5xl">
        
        {/* Account Management Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-gray-950">Personnel Accounts</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {accounts.length} accounts
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Create, edit, and deactivate enforcer accounts. Passwords are never displayed.</p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Select All Checkbox Button */}
              {accounts.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors bg-white shadow-xs cursor-pointer"
                >
                  {selectedIds.length === accounts.length ? (
                    <CheckSquare className="w-4 h-4 text-[#0A3320]" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  {selectedIds.length === accounts.length ? 'Deselect All' : 'Select All'}
                </button>
              )}

              {/* Bulk Delete Button (Makikita lang kapag may naka-select) */}
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setDeleteModal({ show: true, type: 'bulk', id: null })}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete Selected ({selectedIds.length})
                </button>
              )}

              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A3320] text-white text-xs font-bold hover:bg-[#061E12] transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add new account
              </button>
            </div>
          </div>

          {/* Accounts List */}
          <div className="divide-y divide-gray-100">
            {accounts.length > 0 ? (
              accounts.map((acc) => {
                const isSelected = selectedIds.includes(acc.id);
                return (
                  <div key={acc.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      {/* Checkbox para sa individual select */}
                      <button
                        type="button"
                        onClick={() => handleSelectOne(acc.id)}
                        className="text-gray-400 hover:text-[#0A3320] transition-colors cursor-pointer shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-[#0A3320]" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300" />
                        )}
                      </button>

                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0A3320] font-bold flex items-center justify-center text-base border border-emerald-100 shrink-0">
                        {acc.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 text-sm sm:text-base">{acc.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            acc.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {acc.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{acc.badge} · {acc.email} · {acc.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5 bg-white shadow-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-400" /> Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(acc.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border shadow-xs ${
                          acc.status === 'Active'
                            ? 'bg-amber-50 text-amber-700 border-amber-200/60 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100'
                        }`}
                      >
                        {acc.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      {/* Delete Individual Account Button */}
                      <button
                        onClick={() => setDeleteModal({ show: true, type: 'single', id: acc.id })}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 transition-colors cursor-pointer shadow-xs"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-gray-400 font-medium">
                No personnel accounts found.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* CREATE / EDIT ENFORCER ACCOUNT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6 pr-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {editingAccount ? 'Edit Enforcer Account' : 'Create enforcer account'}
              </h3>
              <p className="text-xs text-gray-500">
                {editingAccount ? 'Update personnel credentials and access details.' : 'Register a new field officer into the monitoring network.'}
              </p>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan Dela Cruz"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              {/* Notice Banner */}
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-4 text-xs text-emerald-900">
                <div className="rounded-full bg-emerald-100 p-1.5 text-emerald-700 shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <p className="leading-relaxed font-medium">
                  Upon creation, the system will automatically email a temporary password and secure setup instructions to the provided address.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl border border-gray-200 font-bold text-xs bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-bold text-xs bg-[#0A3320] text-white hover:bg-[#061E12] transition-colors shadow-lg shadow-[#0A3320]/20 cursor-pointer"
                >
                  {editingAccount ? 'Save Changes' : 'Create account'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* DELETE CONFIRMATION & IMPORTANT WARNING MODAL              */}
      {/* ========================================================== */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-red-100">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {deleteModal.type === 'bulk' ? `Delete ${selectedIds.length} Accounts` : 'Delete Personnel Account'}
            </h3>
            
            <div className="bg-red-50/70 border border-red-200/60 rounded-2xl p-4 mb-6 text-left">
              <p className="text-[10px] font-bold tracking-wider text-red-800 uppercase mb-1">Important Warning</p>
              <p className="text-xs text-red-900/80 leading-relaxed">
                {deleteModal.type === 'bulk'
                  ? `Are you sure you want to permanently delete these ${selectedIds.length} selected accounts? This action cannot be undone and will revoke all associated access privileges.`
                  : 'Are you sure you want to permanently delete this personnel account? This action cannot be undone and will revoke all associated command center access.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ show: false, type: 'single', id: null })}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-xs bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg cursor-pointer"
              >
                Yes, Delete
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