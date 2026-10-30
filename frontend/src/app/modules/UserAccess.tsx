'use client';
import React, { useState } from 'react';
import {
  User as DbUser,
  RoleDefinition,
  SecuritySettingsConfig,
  RecordSetConfig,
  getStore,
  setStore,
  getSingleStore,
  setSingleStore,
  initialRoleDefinitions,
  initialSecuritySettings,
  initialRecordSets
} from '../mockDb';
import { apiRegister } from '../lib/api-client';
import {
  Users,
  Shield,
  Key,
  Lock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  Filter,
  Search,
  ExternalLink
} from 'lucide-react';

interface Props {
  users: DbUser[];
  currentUser: DbUser;
  onRefresh: () => void;
}

export default function UserAccess({ users, currentUser, onRefresh }: Props) {
  const [activeTab, setActiveTab] = useState<'users' | 'security' | 'roles' | 'recordsets'>('users');
  const [search, setSearch] = useState('');

  // Stores
  const [roleDefs, setRoleDefs] = useState<RoleDefinition[]>(() => getStore('roleDefinitions', initialRoleDefinitions));
  const [security, setSecurity] = useState<SecuritySettingsConfig>(() => getSingleStore('securitySettings', initialSecuritySettings));
  const [recordSets, setRecordSets] = useState<RecordSetConfig[]>(() => getStore('recordSets', initialRecordSets));

  // Modals
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'DRIVER' as DbUser['role'] });

  const [editRoleModal, setEditRoleModal] = useState<RoleDefinition | null>(null);
  const [createRoleModal, setCreateRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const [createRecordSetModal, setCreateRecordSetModal] = useState(false);
  const [newRecordSetName, setNewRecordSetName] = useState('');
  const [newRecordSetDesc, setNewRecordSetDesc] = useState('');

  // Handle Invite User
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;
    try {
      await apiRegister({
        name: inviteForm.name,
        email: inviteForm.email,
        password: 'password123',
        role: inviteForm.role
      });
      setInviteModal(false);
      setInviteForm({ name: '', email: '', role: 'DRIVER' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create user account');
    }
  };

  // Handle Save Security
  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSingleStore('securitySettings', security);
    alert('Security policies updated successfully.');
    onRefresh();
  };

  // Handle Create Role
  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;
    const newRole: RoleDefinition = {
      id: 'role-' + Math.random().toString(36).substr(2, 8),
      roleName: newRoleName,
      description: newRoleDesc,
      userCount: 0,
      permissions: {
        assets: { view: true, create: false, edit: false, delete: false, approve: false },
        workOrders: { view: true, create: false, edit: false, delete: false, approve: false },
        inspections: { view: true, create: true, edit: false, delete: false, approve: false },
        fuel: { view: false, create: false, edit: false, delete: false, approve: false },
        parts: { view: false, create: false, edit: false, delete: false, approve: false },
        reports: { view: false, create: false, edit: false, delete: false, approve: false },
        billing: { view: false, create: false, edit: false, delete: false, approve: false }
      }
    };
    const updated = [...roleDefs, newRole];
    setStore('roleDefinitions', updated);
    setRoleDefs(updated);
    setCreateRoleModal(false);
    setNewRoleName('');
    setNewRoleDesc('');
    onRefresh();
  };

  // Handle Save Role Permissions
  const handleSaveRolePermissions = () => {
    if (!editRoleModal) return;
    const updated = roleDefs.map(r => r.id === editRoleModal.id ? editRoleModal : r);
    setStore('roleDefinitions', updated);
    setRoleDefs(updated);
    setEditRoleModal(null);
    onRefresh();
  };

  // Handle Create Record Set
  const handleCreateRecordSet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordSetName) return;
    const newRs: RecordSetConfig = {
      id: 'rs-' + Math.random().toString(36).substr(2, 8),
      name: newRecordSetName,
      description: newRecordSetDesc,
      assetCount: 0,
      assignedUsers: [currentUser.name]
    };
    const updated = [...recordSets, newRs];
    setStore('recordSets', updated);
    setRecordSets(updated);
    setCreateRecordSetModal(false);
    setNewRecordSetName('');
    setNewRecordSetDesc('');
    onRefresh();
  };

  const filteredUsers = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-[#00BA7C]" />
            User Access & Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your team member accounts, enforce organizational security policies, custom roles & granular permission matrix.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'users' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Users className="h-3.5 w-3.5" /> Manage Users
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'security' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Shield className="h-3.5 w-3.5" /> Security
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'roles' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Key className="h-3.5 w-3.5" /> Roles
          </button>
          <button
            onClick={() => setActiveTab('recordsets')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'recordsets' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Filter className="h-3.5 w-3.5" /> Record Sets
          </button>
        </div>
      </div>

      {/* ── TAB 1: MANAGE USERS ── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users by name, email, or role..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C]"
              />
            </div>
            <button
              onClick={() => setInviteModal(true)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" /> Invite User
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-slate-500 text-[11px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        {(u.role || 'DRIVER').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => alert(`User permissions for ${u.name} are active.`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition"
                      >
                        Edit Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: SECURITY ── */}
      {activeTab === 'security' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-3xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Security & Authentication Policies</h2>
            <p className="text-xs text-slate-500">Enforce enterprise-level security controls across all fleet user logins.</p>
          </div>

          <form onSubmit={handleSaveSecurity} className="space-y-5">
            {/* 2FA */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-xs text-slate-900">Enforce Two-Factor Authentication (2FA)</p>
                <p className="text-[11px] text-slate-500">Require all users to verify logins using an authenticator app (TOTP) or SMS.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.twoFactorRequired}
                  onChange={e => setSecurity({ ...security, twoFactorRequired: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00BA7C]"></div>
              </label>
            </div>

            {/* Session Timeout */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Session Idle Timeout</label>
                <select
                  value={security.sessionTimeoutMinutes}
                  onChange={e => setSecurity({ ...security, sessionTimeoutMinutes: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                  <option value={480}>8 Hours (Shift Length)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Minimum Password Length</label>
                <select
                  value={security.passwordMinLength}
                  onChange={e => setSecurity({ ...security, passwordMinLength: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                >
                  <option value={8}>8 Characters</option>
                  <option value={10}>10 Characters</option>
                  <option value={12}>12 Characters (Strong)</option>
                </select>
              </div>
            </div>

            {/* IP Whitelist */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">IP Address Whitelist (Optional)</label>
              <input
                type="text"
                value={security.ipWhitelist}
                onChange={e => setSecurity({ ...security, ipWhitelist: e.target.value })}
                placeholder="e.g. 192.168.1.0/24, 203.0.113.5 (Leave blank to allow all IPs)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-mono"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-lg transition shadow-sm"
            >
              Save Security Policies
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 3: ROLES & PERMISSION MATRIX ── */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Roles & Permission Matrix</h2>
              <p className="text-xs text-slate-500">Define access rules and granular capabilities across each operational domain.</p>
            </div>
            <button
              onClick={() => setCreateRoleModal(true)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Create Custom Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleDefs.map(role => (
              <div key={role.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{role.roleName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                  </div>
                  <button
                    onClick={() => setEditRoleModal(role)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                  >
                    Edit Matrix
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <p className="text-slate-400 font-bold">Assets</p>
                    <p className="font-bold text-slate-800">{role.permissions.assets.edit ? 'Full Access' : role.permissions.assets.view ? 'View Only' : 'No Access'}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <p className="text-slate-400 font-bold">Work Orders</p>
                    <p className="font-bold text-slate-800">{role.permissions.workOrders.edit ? 'Manage' : role.permissions.workOrders.view ? 'View Only' : 'No Access'}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <p className="text-slate-400 font-bold">Billing</p>
                    <p className="font-bold text-slate-800">{role.permissions.billing.view ? 'Enabled' : 'Restricted'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: RECORD SETS ── */}
      {activeTab === 'recordsets' && (
        <div className="space-y-6 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Record Sets & Data Segmentation</h2>
              <p className="text-xs text-slate-500">Scope vehicles, work orders, and parts visibility to specific operational teams or branches.</p>
            </div>
            <button
              onClick={() => setCreateRecordSetModal(true)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Record Set
            </button>
          </div>

          <div className="space-y-3">
            {recordSets.map(rs => (
              <div key={rs.id} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{rs.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{rs.description}</p>
                  <p className="text-[11px] text-[#00BA7C] font-semibold mt-1">Assigned Users: {rs.assignedUsers.join(', ')}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                    {rs.assetCount} Vehicles Scoped
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. INVITE USER MODAL */}
      {inviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Invite Team Member</h3>
              <button onClick={() => setInviteModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleInviteUser} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                  required
                  placeholder="e.g. Marcus Vance"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                  placeholder="e.g. marcus@fleet.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">System Role</label>
                <select
                  value={inviteForm.role}
                  onChange={e => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold"
                >
                  <option value="DRIVER">Driver</option>
                  <option value="MECHANIC">Mechanic Technician</option>
                  <option value="MAINTENANCE_ADMIN">Maintenance Admin</option>
                  <option value="FLEET_MANAGER">Fleet Manager</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInviteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-lg transition shadow-sm"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT ROLE PERMISSIONS MATRIX MODAL */}
      {editRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Permission Matrix: {editRoleModal.roleName}</h3>
                <p className="text-xs text-slate-500">{editRoleModal.description}</p>
              </div>
              <button onClick={() => setEditRoleModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Module</th>
                    <th className="p-3 text-center">View</th>
                    <th className="p-3 text-center">Create</th>
                    <th className="p-3 text-center">Edit</th>
                    <th className="p-3 text-center">Delete</th>
                    <th className="p-3 text-center">Approve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(editRoleModal.permissions).map(([moduleKey, perms]) => (
                    <tr key={moduleKey}>
                      <td className="p-3 font-bold text-slate-900 capitalize">{moduleKey.replace(/([A-Z])/g, ' $1')}</td>
                      {(['view', 'create', 'edit', 'delete', 'approve'] as const).map(action => (
                        <td key={action} className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={perms[action]}
                            onChange={e => {
                              const updatedPermissions = {
                                ...editRoleModal.permissions,
                                [moduleKey]: {
                                  ...perms,
                                  [action]: e.target.checked
                                }
                              };
                              setEditRoleModal({
                                ...editRoleModal,
                                permissions: updatedPermissions
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-[#00BA7C] focus:ring-[#00BA7C]"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditRoleModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRolePermissions}
                className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-lg transition shadow-sm"
              >
                Save Matrix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CREATE CUSTOM ROLE MODAL */}
      {createRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Create Custom Role</h3>
              <button onClick={() => setCreateRoleModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateRole} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Role Name</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  required
                  placeholder="e.g. Dispatch Coordinator"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Role Description</label>
                <input
                  type="text"
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  required
                  placeholder="e.g. Scopes vehicle dispatches and driver assignment logs"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateRoleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-lg transition shadow-sm"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CREATE RECORD SET MODAL */}
      {createRecordSetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add Record Set</h3>
              <button onClick={() => setCreateRecordSetModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateRecordSet} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Record Set Name</label>
                <input
                  type="text"
                  value={newRecordSetName}
                  onChange={e => setNewRecordSetName(e.target.value)}
                  required
                  placeholder="e.g. East Coast Fleet Division"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={newRecordSetDesc}
                  onChange={e => setNewRecordSetDesc(e.target.value)}
                  required
                  placeholder="e.g. Scopes Philadelphia and New Jersey terminals"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateRecordSetModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-lg transition shadow-sm"
                >
                  Save Record Set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
