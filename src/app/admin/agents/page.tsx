'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, ShieldAlert, CheckCircle, Clock, XCircle, 
  Edit2, Trash2, Mail, Phone, MapPin, Percent, DollarSign, Info
} from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';
import InlineLoader from '@/components/InlineLoader';
import { useModalStore } from '@/hooks/useModalStore';

interface Agent {
  id: string;
  phone: string;
  email: string | null;
  fullName: string | null;
  companyName: string | null;
  commissionType: string;
  commissionPercentage: number;
  commissionFixedAmount: number;
  gstNumber: string | null;
  address: string | null;
  adminNotes: string | null;
  accountStatus: string;
  createdAt: string;
}

export default function AdminAgentsPage() {
  const { showAlert, showConfirm } = useModalStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor Modal
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Form Fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [commissionType, setCommissionType] = useState('PERCENTAGE');
  const [commissionPercentage, setCommissionPercentage] = useState('0');
  const [commissionFixedAmount, setCommissionFixedAmount] = useState('0');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [accountStatus, setAccountStatus] = useState('ACTIVE');

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedAgent(null);
    setPhone('');
    setEmail('');
    setFullName('');
    setPassword('');
    setCompanyName('');
    setCommissionType('PERCENTAGE');
    setCommissionPercentage('0');
    setCommissionFixedAmount('0');
    setGstNumber('');
    setAddress('');
    setAdminNotes('');
    setAccountStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (agent: Agent) => {
    setIsEditing(true);
    setSelectedAgent(agent);
    setPhone(agent.phone);
    setEmail(agent.email || '');
    setFullName(agent.fullName || '');
    setPassword(''); // leave blank unless changing
    setCompanyName(agent.companyName || '');
    setCommissionType(agent.commissionType);
    setCommissionPercentage(String(agent.commissionPercentage));
    setCommissionFixedAmount(String(agent.commissionFixedAmount));
    setGstNumber(agent.gstNumber || '');
    setAddress(agent.address || '');
    setAdminNotes(agent.adminNotes || '');
    setAccountStatus(agent.accountStatus);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !fullName || (!isEditing && !password)) {
      showAlert('Required Fields', 'Please fill out Name, Phone, and Password.', 'info');
      return;
    }

    setModalLoading(true);
    const payload = {
      phone,
      email: email || null,
      fullName,
      password: password || undefined,
      companyName: companyName || null,
      commissionType,
      commissionPercentage: parseFloat(commissionPercentage) || 0,
      commissionFixedAmount: parseFloat(commissionFixedAmount) || 0,
      gstNumber: gstNumber || null,
      address: address || null,
      adminNotes: adminNotes || null,
      accountStatus,
    };

    try {
      const url = isEditing 
        ? `/api/v1/admin/agents/${selectedAgent?.id}` 
        : '/api/v1/admin/agents';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showAlert('Success', isEditing ? 'Agent partner updated successfully.' : 'Agent partner registered successfully.', 'success');
        setIsModalOpen(false);
        fetchAgents();
      } else {
        const data = await res.json();
        showAlert('Error', data.error || 'Operation failed', 'error');
      }
    } catch {
      showAlert('Error', 'Network request failed.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      'Delete Agent Partner',
      'Are you sure you want to permanently delete this agent partner?'
    );
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/v1/admin/agents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showAlert('Success', 'Agent deleted successfully.', 'success');
        setIsModalOpen(false);
        fetchAgents();
      } else {
        const data = await res.json();
        showAlert('Error', data.error || 'Delete failed', 'error');
      }
    } catch {
      showAlert('Error', 'Network request failed.', 'error');
    }
  };

  const filteredAgents = agents.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      (a.fullName && a.fullName.toLowerCase().includes(q)) ||
      a.phone.includes(q) ||
      (a.companyName && a.companyName.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Travel Agent Directory
          </h1>
          <p className="text-stone-500 mt-1">Manage B2B agent partners, customize commission plans, and audit invoices.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 self-start rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-amber-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Register Agent Partner
        </button>
      </div>

      {/* Filter panel */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input 
          type="text" 
          placeholder="Search by Agent name, company name, email or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-amber-500 transition-all shadow-sm"
        />
      </div>

      {/* List content */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-xs font-bold text-stone-400 uppercase tracking-wider">
                <th className="px-6 py-4">Agent Name</th>
                <th className="px-6 py-4">Company Details</th>
                <th className="px-6 py-4">Phone / Contact</th>
                <th className="px-6 py-4">Commission Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <InlineLoader size="md" />
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-stone-400">
                    <Users className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="font-bold text-stone-700">No agent partners registered</h3>
                    <p className="text-xs text-stone-400 mt-1">Register agents to configure discount codes and margins.</p>
                  </td>
                </tr>
              ) : (
                filteredAgents.map((a) => (
                  <tr 
                    key={a.id} 
                    onClick={() => openEditModal(a)}
                    className="hover:bg-stone-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-stone-900">{a.fullName}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-stone-850">{a.companyName || 'Individual Partner'}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{a.email || 'No email'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-stone-600">{a.phone}</td>
                    <td className="px-6 py-4 font-bold text-amber-800">
                      {a.commissionType === 'FIXED' 
                        ? `₹${a.commissionFixedAmount} Fixed`
                        : `${a.commissionPercentage}% Percentage`
                      }
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        a.accountStatus === 'ACTIVE'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {a.accountStatus === 'ACTIVE' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(a);
                        }}
                        className="p-2 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="bg-stone-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                  {isEditing ? 'Modify Agent Partner' : 'Register Agent Partner'}
                </h3>
                <p className="text-xs text-stone-400 mt-1">Configure profile details and margin payout rates</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white p-1"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border-2 border-stone-200 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border-2 border-stone-200 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-2 border-stone-200 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    {isEditing ? 'Passcode Password (optional)' : 'Passcode Password *'}
                  </label>
                  <input
                    type="password"
                    required={!isEditing}
                    placeholder={isEditing ? 'Unchanged' : ''}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-stone-200 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Company / Entity Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full border-2 border-stone-200 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">GST Number</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full border-2 border-stone-200 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="border-t border-stone-100 pt-4 mt-2">
                <h4 className="text-xs font-black uppercase text-amber-800 tracking-widest mb-3">Commission Configuration</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <CustomSelect
                    label="Commission Type"
                    value={commissionType}
                    onChange={(val) => setCommissionType(val)}
                    options={[
                      { value: 'PERCENTAGE', label: 'Percentage-Based (%)' },
                      { value: 'FIXED', label: 'Fixed Rate (₹)' },
                    ]}
                  />

                  {commissionType === 'PERCENTAGE' ? (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Commission Percentage (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={commissionPercentage}
                        onChange={(e) => setCommissionPercentage(e.target.value)}
                        className="w-full border-2 border-stone-200 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Fixed Amount per Booking (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={commissionFixedAmount}
                        onChange={(e) => setCommissionFixedAmount(e.target.value)}
                        className="w-full border-2 border-stone-200 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Business Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full border-2 border-stone-200 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Internal Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full border-2 border-stone-200 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <CustomSelect
                  label="Account Status"
                  value={accountStatus}
                  onChange={(val) => setAccountStatus(val)}
                  options={[
                    { value: 'ACTIVE', label: 'Active Partner' },
                    { value: 'BLOCKED', label: 'Suspended / Blocked' },
                  ]}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between border-t border-stone-100 pt-4 mt-6 shrink-0">
                <div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedAgent!.id)}
                      className="flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2.5 rounded-xl text-xs font-bold border border-red-200 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" /> Delete Agent
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-stone-500 hover:bg-stone-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex items-center gap-1.5 bg-stone-900 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                  >
                    {modalLoading && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                    {isEditing ? 'Save Changes' : 'Register Agent'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
