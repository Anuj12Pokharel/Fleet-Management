'use client';

import React, { useState, useEffect } from 'react';
import DriverTrackingMapModule from './modules/DriverTrackingMap';
import { saveSupertuckConfig, getSupertuckConfig } from './lib/supertruck-api';
import {
  Truck,
  Wrench,
  ShieldAlert,
  FileText,
  Fuel,
  CreditCard,
  AlertTriangle,
  Building2,
  MapPin,
  Activity,
  FileCheck,
  History,
  User,
  LogOut,
  Settings,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Download,
  RefreshCw,
  Bell,
  Lock,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Map,
  Users,
  Package,
  FileBox,
  Shield,
  BarChart3,
  ClipboardList,
  Search,
  Layers,
  Radio,
  Key,
  ChevronUp
} from 'lucide-react';
import { getMockDb, mutators, getStore, setStore, User as DbUser, Asset, Component, EDVIRInspection, ServiceRequest, PMSchedule, PMTemplate, WorkOrder, PurchaseOrder, RenewalAlert, FuelLog, TollRecord, DOTInspection, Vendor, EmergencyTicket, FaultCode, AccidentClaim, AuditLog, SystemNotification, initialUsers, initialAssets, initialFuelLogs, initialTollRecords, VehicleAssignment, TireReading, ExpenseRecord, Issue, Contact, Part, Place, FleetDocument, Warranty, ReplacementAnalysis, initialAssignments, initialTireReadings, initialExpenseRecords, initialIssues, initialContacts, initialParts, initialPlaces, initialDocuments, initialWarranties, initialReplacementAnalysis } from './mockDb';
import FleetMapModule from './modules/FleetMap';
import AssignmentsModule from './modules/Assignments';
import TiresModule from './modules/Tires';
import ExpensesModule from './modules/Expenses';
import ReplacementModule from './modules/Replacement';
import IssuesModule from './modules/Issues';
import ContactsModule from './modules/Contacts';
import PartsModule from './modules/Parts';
import PlacesModule from './modules/Places';
import DocumentsModule from './modules/Documents';
import WarrantiesModule from './modules/Warranties';
import ReportsModule from './modules/Reports';
import {
  apiLogin,
  apiRegister,
  apiGetUsers,
  apiGetAssets,
  apiGetInspections,
  apiGetPMTemplates,
  apiGetPMSchedules,
  apiGetWorkOrders,
  apiGetServiceRequests,
  apiGetRenewalAlerts,
  apiGetFuelLogs,
  apiGetTollRecords,
  apiGetDOTInspections,
  apiGetVendors,
  apiGetEmergencyTickets,
  apiGetFaultCodes,
  apiGetAccidentClaims,
  apiGetAuditLogs,
  apiGetNotifications,
  apiCreateInspection,
  apiCreateServiceRequest,
  apiApproveServiceRequest,
  apiCreateFuelLog,
  apiCreateEmergencyTicket,
  apiCreateAccidentClaim,
  apiTriggerOdometerWebhook,
  apiTriggerDtcWebhook,
  getStoredUser
} from './lib/api-client';


export default function FleetApp() {
  // Navigation & Session State
  const [currentUser, setCurrentUser] = useState<DbUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [db, setDb] = useState<any>(null);

  // Supertruck API Config
  const [stTenantId, setStTenantId] = useState('');
  const [stToken, setStToken] = useState('');
  const [stConfigOpen, setStConfigOpen] = useState(false);
  const [stSaved, setStSaved] = useState(false);

  // Auth Forms
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'LANDING'>('LANDING');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [regRole, setRegRole] = useState<'DRIVER' | 'MECHANIC' | 'MAINTENANCE_ADMIN' | 'FLEET_MANAGER'>('DRIVER');
  const [authError, setAuthError] = useState('');

  // Form states for modules
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  
  // eDVIR Form state
  const [failedChecklistItems, setFailedChecklistItems] = useState<Record<string, boolean>>({});
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [inspectionOdometer, setInspectionOdometer] = useState<number>(0);
  
  // Repair Request Form state
  const [requestDesc, setRequestDesc] = useState('');
  const [requestMedia, setRequestMedia] = useState<string>('/uploads/broken_brake.jpg');
  
  // Work Order Creation state (Admin approving requests)
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [woType, setWoType] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL');
  const [woPriority, setWoPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'>('MEDIUM');
  const [woDesc, setWoDesc] = useState('');
  const [woMechanicId, setWoMechanicId] = useState('u3');
  const [woVendorId, setWoVendorId] = useState('v1');

  // Emergency Form State
  const [emergencyDesc, setEmergencyDesc] = useState('');
  const [emergencyLat, setEmergencyLat] = useState(32.7767);
  const [emergencyLng, setEmergencyLng] = useState(-96.7970);

  // Simulator Form State
  const [simOdometer, setSimOdometer] = useState(146000);
  const [simDtcCode, setSimDtcCode] = useState('SPN 651 FMI 5');
  const [simDtcDesc, setSimDtcDesc] = useState('Engine Cylinder #1 Injector Circuit Failed');
  const [simFuelGallons, setSimFuelGallons] = useState(130);
  const [simFuelCost, setSimFuelCost] = useState(455.00);
  const [simFuelState, setSimFuelState] = useState('TX');
  
  // Accident Claim Form State
  const [accidentReportNo, setAccidentReportNo] = useState('');
  const [accidentStatement, setAccidentStatement] = useState('');
  const [accidentThirdParty, setAccidentThirdParty] = useState('');
  const [accidentPayout, setAccidentPayout] = useState(4500);
  const [accidentRepairCost, setAccidentRepairCost] = useState(5200);

  // Sync db from NestJS API (with mockDb fallback)
  const refreshDb = async () => {
    try {
      const [
        users,
        assets,
        inspections,
        pmTemplates,
        pmSchedules,
        workOrders,
        serviceRequests,
        renewalAlerts,
        fuelLogs,
        tollRecords,
        dotInspections,
        vendors,
        emergencyTickets,
        faultCodes,
        accidentClaims,
        auditLogs,
        notifications
      ] = await Promise.all([
        apiGetUsers().catch(() => initialUsers),
        apiGetAssets().catch(() => initialAssets),
        apiGetInspections().catch(() => []),
        apiGetPMTemplates().catch(() => []),
        apiGetPMSchedules().catch(() => []),
        apiGetWorkOrders().catch(() => []),
        apiGetServiceRequests().catch(() => []),
        apiGetRenewalAlerts().catch(() => []),
        apiGetFuelLogs().catch(() => initialFuelLogs),
        apiGetTollRecords().catch(() => initialTollRecords),
        apiGetDOTInspections().catch(() => []),
        apiGetVendors().catch(() => []),
        apiGetEmergencyTickets().catch(() => []),
        apiGetFaultCodes().catch(() => []),
        apiGetAccidentClaims().catch(() => []),
        apiGetAuditLogs().catch(() => []),
        apiGetNotifications().catch(() => [])
      ]);

      const mockFallback = getMockDb();

      setDb({
        users: users.length > 0 ? users : mockFallback.users,
        assets: assets.length > 0 ? assets : mockFallback.assets,
        components: mockFallback.components,
        inspections: inspections.length > 0 ? inspections : mockFallback.inspections,
        pmTemplates: pmTemplates.length > 0 ? pmTemplates : mockFallback.pmTemplates,
        pmSchedules: pmSchedules.length > 0 ? pmSchedules : mockFallback.pmSchedules,
        serviceRequests: serviceRequests.length > 0 ? serviceRequests : mockFallback.serviceRequests,
        workOrders: workOrders.length > 0 ? workOrders : mockFallback.workOrders,
        purchaseOrders: mockFallback.purchaseOrders,
        renewalAlerts: renewalAlerts.length > 0 ? renewalAlerts : mockFallback.renewalAlerts,
        fuelLogs: fuelLogs.length > 0 ? fuelLogs : mockFallback.fuelLogs,
        tollRecords: tollRecords.length > 0 ? tollRecords : mockFallback.tollRecords,
        dotInspections: dotInspections.length > 0 ? dotInspections : mockFallback.dotInspections,
        vendors: vendors.length > 0 ? vendors : mockFallback.vendors,
        emergencyTickets: emergencyTickets.length > 0 ? emergencyTickets : mockFallback.emergencyTickets,
        faultCodes: faultCodes.length > 0 ? faultCodes : mockFallback.faultCodes,
        auditLogs: auditLogs.length > 0 ? auditLogs : mockFallback.auditLogs,
        notifications: notifications.length > 0 ? notifications : mockFallback.notifications,
        accidentClaims: accidentClaims.length > 0 ? accidentClaims : mockFallback.accidentClaims,
        assignments: getStore('assignments', initialAssignments),
        tireReadings: getStore('tireReadings', initialTireReadings),
        expenseRecords: getStore('expenseRecords', initialExpenseRecords),
        replacementAnalysis: getStore('replacementAnalysis', initialReplacementAnalysis),
        issues: getStore('issues', initialIssues),
        contacts: getStore('contacts', initialContacts),
        parts: getStore('parts', initialParts),
        places: getStore('places', initialPlaces),
        documents: getStore('documents', initialDocuments),
        warranties: getStore('warranties', initialWarranties)
      });
    } catch (err) {
      console.error('Error loading real API database:', err);
      setDb(getMockDb());
    }
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setCurrentUser(storedUser);
    }
    refreshDb();
    // Load saved Supertruck credentials
    const cfg = getSupertuckConfig();
    setStTenantId(cfg.tenantId);
    setStToken(cfg.token);
  }, []);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Try login to NestJS API with user password (default: password123)
      const res = await apiLogin(email, password || 'password123');
      setCurrentUser(res.user);
      setAuthMode('LANDING');
      setActiveTab('dashboard');
      setAuthError('');
      await refreshDb();
    } catch (err: any) {
      // Fallback mock login if API server not accessible or fallback user
      const u = mutators.login(email);
      if (u) {
        setCurrentUser(u);
        setAuthMode('LANDING');
        setActiveTab('dashboard');
        setAuthError('');
        refreshDb();
      } else {
        setAuthError(err.message || 'User not found. Use admin@fleet.com / password123.');
      }
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setAuthError('Please fill in all fields');
      return;
    }
    try {
      const newUser = await apiRegister({ name, email, password: password || 'password123', role: regRole });
      const loginRes = await apiLogin(email, password || 'password123');
      setCurrentUser(loginRes.user);
      setAuthMode('LANDING');
      setActiveTab('dashboard');
      setAuthError('');
      await refreshDb();
    } catch (err: any) {
      const dbInstance = getMockDb();
      const newUser: DbUser = {
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        role: regRole
      };
      dbInstance.users.push(newUser);
      localStorage.setItem('users', JSON.stringify(dbInstance.users));
      setCurrentUser(newUser);
      setAuthMode('LANDING');
      setActiveTab('dashboard');
      setAuthError('');
      refreshDb();
    }
  };

  // Handle Role Switcher
  const switchRole = (role: 'DRIVER' | 'MECHANIC' | 'MAINTENANCE_ADMIN' | 'FLEET_MANAGER') => {
    if (!currentUser) return;
    const updated = { ...currentUser, role };
    setCurrentUser(updated);
    
    const allowedTabs: Record<string, string[]> = {
      DRIVER: ['dashboard', 'fleetmap', 'assets', 'assignments', 'inspections', 'issues', 'fuel', 'emergency'],
      MECHANIC: ['dashboard', 'assets', 'tires', 'pm', 'workorders', 'parts', 'issues'],
      MAINTENANCE_ADMIN: ['dashboard', 'fleetmap', 'drivertracking', 'assets', 'assignments', 'tires', 'expenses', 'inspections', 'issues', 'pm', 'workorders', 'renewals', 'warranties', 'fuel', 'emergency', 'contacts', 'parts', 'places', 'documents', 'audit', 'simulators'],
      FLEET_MANAGER: ['dashboard', 'fleetmap', 'drivertracking', 'assets', 'assignments', 'tires', 'expenses', 'replacement', 'inspections', 'issues', 'pm', 'workorders', 'renewals', 'warranties', 'fuel', 'emergency', 'claims', 'contacts', 'parts', 'places', 'documents', 'reports', 'audit', 'simulators']
    };
    if (!allowedTabs[role].includes(activeTab)) {
      setActiveTab('dashboard');
    }

    refreshDb();
  };

  // Save Supertruck API credentials
  const handleSaveStConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupertuckConfig(stTenantId, stToken);
    setStSaved(true);
    setTimeout(() => setStSaved(false), 2000);
  };


  if (!db) return <div className="p-8 text-white bg-slate-950 min-h-screen">Loading database...</div>;

  // Render auth flows
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-between text-slate-100 font-sans">
        {/* Landing Page Header */}
        <header className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-indigo-500 stroke-[2]" />
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">FleetCare</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setAuthMode('LOGIN')} className="px-4 py-2 text-sm text-slate-300 hover:text-white transition">Log In</button>
            <button onClick={() => setAuthMode('REGISTER')} className="px-4 py-2 text-sm bg-indigo-600 rounded-lg hover:bg-indigo-500 font-semibold transition">Get Started</button>
          </div>
        </header>

        {/* Auth Forms Overlays */}
        {authMode === 'LOGIN' || authMode === 'REGISTER' ? (
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
              <button onClick={() => setAuthMode('LANDING')} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
              
              <h2 className="text-2xl font-bold text-center mb-2">
                {authMode === 'LOGIN' ? 'Welcome Back' : 'Create Fleet Account'}
              </h2>
              <p className="text-slate-400 text-sm text-center mb-6">
                {authMode === 'LOGIN' ? 'Access your fleet maintenance cockpit' : 'Set up your trucking maintenance platform'}
              </p>

              {authError && (
                <div className="bg-red-950/50 border border-red-500/50 text-red-200 text-xs p-3 rounded-lg mb-4">
                  {authError}
                </div>
              )}

              <form onSubmit={authMode === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">
                {authMode === 'REGISTER' && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-100" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="e.g. admin@fleet.com" className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-100" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-100" />
                </div>

                {authMode === 'REGISTER' && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Default System Role</label>
                    <select value={regRole} onChange={e => setRegRole(e.target.value as any)} className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-100">
                      <option value="DRIVER">Driver</option>
                      <option value="MECHANIC">Mechanic</option>
                      <option value="MAINTENANCE_ADMIN">Maintenance Admin</option>
                      <option value="FLEET_MANAGER">Fleet Manager</option>
                    </select>
                  </div>
                )}

                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-semibold text-sm transition mt-6 shadow-lg shadow-indigo-600/20">
                  {authMode === 'LOGIN' ? 'Log In' : 'Sign Up'}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-400">
                {authMode === 'LOGIN' ? (
                  <span>New to FleetCare? <button onClick={() => setAuthMode('REGISTER')} className="text-indigo-400 hover:underline">Create an account</button></span>
                ) : (
                  <span>Already have an account? <button onClick={() => setAuthMode('LOGIN')} className="text-indigo-400 hover:underline">Log in</button></span>
                )}
              </div>
            </div>
          </main>
        ) : (
          /* Landing Page Details */
          <main className="max-w-7xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col md:flex-row items-center gap-12 flex-1">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/50 text-xs font-semibold text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Advanced Fleet Maintenance Platform
              </div>
              <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
                Minimize downtime.<br/>
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">Maximize compliance.</span>
              </h1>
              <p className="text-slate-400 max-w-xl mx-auto md:mx-0 text-base md:text-lg">
                Complete trucking fleet care system: eDVIR checklists, dual-trigger PMs, breakdown location mapping, fuel IFTA recording, transponder tolls, and roadside DOT audit trails.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <button onClick={() => setAuthMode('REGISTER')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30">
                  Start Launching <ChevronRight className="h-4 w-4" />
                </button>
                <button onClick={() => setAuthMode('LOGIN')} className="px-6 py-3 border border-slate-800 hover:bg-slate-900 rounded-xl font-bold transition">
                  Partner Portal
                </button>
              </div>

              {/* Login Shortcuts for Testing */}
              <div className="pt-8 border-t border-slate-800/80">
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-3">Testing Quick-Logins:</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {initialUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setActiveTab('dashboard');
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-medium rounded-lg border border-slate-800 text-slate-300 transition"
                    >
                      {u.name} ({u.role.replace('_', ' ')})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Screen Mock */}
            <div className="flex-1 w-full max-w-lg relative">
              <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full"></div>
              <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-3 mb-4">
                  <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                  <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <div className="text-xs text-slate-500 ml-4 font-mono">fleetcare_ops_dashboard.ts</div>
                </div>

                {/* Simulated widget */}
                <div className="space-y-4">
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400 font-semibold">Active Fleet Health</span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">94%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full w-[94%]"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900">
                      <p className="text-xs text-slate-400">Open Work Orders</p>
                      <p className="text-2xl font-black text-white mt-1">4</p>
                    </div>
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900">
                      <p className="text-xs text-slate-400">Overdue PMs</p>
                      <p className="text-2xl font-black text-rose-500 mt-1">1</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Footer */}
        <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-600 max-w-7xl mx-auto w-full">
          &copy; 2026 FleetCare Technologies. All rights reserved.
        </footer>
      </div>
    );
  }

  // --- HELPER COMPONENT AND CALCULATIONS FOR DASHBOARD ---
  const activeAssets = db.assets;
  const inoperableCount = activeAssets.filter((a: Asset) => a.status === 'INOPERABLE').length;
  const attentionCount = activeAssets.filter((a: Asset) => a.status === 'NEEDS_ATTENTION').length;
  const healthyCount = activeAssets.filter((a: Asset) => a.status === 'OPERABLE').length;
  const fleetHealth = Math.round((healthyCount / activeAssets.length) * 100);

  const pmSchedules = db.pmSchedules;
  const overduePms = pmSchedules.filter((p: PMSchedule) => p.status === 'OVERDUE').length;
  const pmCompliance = Math.round(((pmSchedules.length - overduePms) / pmSchedules.length) * 100) || 100;

  const openWorkOrders = db.workOrders.filter((w: WorkOrder) => w.status !== 'COMPLETED').length;
  const activeAlerts = db.renewalAlerts.filter((r: RenewalAlert) => r.status === 'ACTIVE').length;

  const totalDowntime = db.emergencyTickets.reduce((sum: number, t: EmergencyTicket) => sum + t.downtimeHours, 0);

  // CSV Export Trigger functions
  const triggerExport = (type: 'ifta' | 'costs' | 'compliance') => {
    let headers = '';
    let rows = '';
    let filename = '';

    if (type === 'ifta') {
      headers = 'Transaction ID,Asset Name,State,Gallons,Cost,Odometer,MPG,Date\n';
      db.fuelLogs.forEach((f: FuelLog) => {
        const assetName = db.assets.find((a: Asset) => a.id === f.assetId)?.name || 'Unknown';
        rows += `"${f.cardTransactionId}","${assetName}","${f.location}",${f.gallons},${f.cost},${f.odometer},${f.mpg.toFixed(2)},"${f.createdAt}"\n`;
      });
      filename = 'ifta_filing_report.csv';
    } else if (type === 'costs') {
      headers = 'Asset Name,VIN,Odometer,Total Maintenance Cost,Total Fuel Cost,Total Toll Cost,Total Accidents Cost,Total Operating Cost\n';
      db.assets.forEach((asset: Asset) => {
        const maintCost = db.workOrders.filter((w: WorkOrder) => w.assetId === asset.id).reduce((s: number, w: WorkOrder) => s + w.totalCost, 0);
        const fuelCost = db.fuelLogs.filter((fl: FuelLog) => fl.assetId === asset.id).reduce((s: number, fl: FuelLog) => s + fl.cost, 0);
        const tollCost = db.tollRecords.filter((tr: TollRecord) => tr.assetId === asset.id).reduce((s: number, tr: TollRecord) => s + tr.amount, 0);
        const accidentCost = db.accidentClaims.filter((ac: AccidentClaim) => ac.assetId === asset.id).reduce((s: number, ac: AccidentClaim) => s + ac.actualRepairCost, 0);
        const totalCost = maintCost + fuelCost + tollCost + accidentCost;

        rows += `"${asset.name}","${asset.vin}",${asset.odometer},${maintCost.toFixed(2)},${fuelCost.toFixed(2)},${tollCost.toFixed(2)},${accidentCost.toFixed(2)},${totalCost.toFixed(2)}\n`;
      });
      filename = 'operating_cost_summary.csv';
    } else if (type === 'compliance') {
      headers = 'Asset Name,PM Template,Last Service Mileage,Next Due Mileage,Next Due Date,Status\n';
      db.pmSchedules.forEach((s: PMSchedule) => {
        const assetName = db.assets.find((a: Asset) => a.id === s.assetId)?.name || 'Unknown';
        const templateName = db.pmTemplates.find((t: PMTemplate) => t.id === s.templateId)?.name || 'Unknown';
        rows += `"${assetName}","${templateName}",${s.lastServiceOdometer},${s.nextDueOdometer},"${s.nextDueDate}","${s.status}"\n`;
      });
      filename = 'pm_compliance_report.csv';
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Webhook Event Emitters
  const runOdometerWebhook = () => {
    if (!selectedAssetId) return;
    mutators.telematicsOdometerUpdate(selectedAssetId, simOdometer);
    refreshDb();
    alert('Odometer synced! PM schedules re-evaluated.');
  };

  const runDtcWebhook = () => {
    if (!selectedAssetId) return;
    mutators.telematicsDtcCode(selectedAssetId, 'Motive Webhook', simDtcCode, simDtcDesc);
    refreshDb();
    alert('J1939 DTC Ingested! Active alerts and work order registered.');
  };

  const runFuelWebhook = () => {
    if (!selectedAssetId) return;
    const isAnomaly = simFuelGallons > 0 ? (simOdometer / simFuelGallons < 4.0) : false;
    const fuelLog: FuelLog = {
      id: 'f-' + Math.random().toString(36).substr(2, 9),
      assetId: selectedAssetId,
      cardTransactionId: 'WEX-' + Math.round(Math.random() * 1e8),
      gallons: simFuelGallons,
      cost: simFuelCost,
      location: simFuelState,
      odometer: simOdometer,
      mpg: simFuelGallons > 0 ? parseFloat((simOdometer / 15000).toFixed(1)) : 6.0, // mock MPG
      isAnomaly,
      createdAt: new Date().toISOString()
    };
    const currentLogs = getStore('fuelLogs', initialFuelLogs);
    currentLogs.unshift(fuelLog);
    setStore('fuelLogs', currentLogs);
    
    // Sync asset odometer
    const assets = getStore('assets', initialAssets);
    const updated = assets.map(a => a.id === selectedAssetId ? { ...a, odometer: simOdometer } : a);
    setStore('assets', updated);

    if (isAnomaly) {
      mutators.addNotification('COMPLIANCE', `Fuel MPG Anomaly`, `Asset dropped below average MPG target.`);
    }

    refreshDb();
    alert('Fuel transaction parsed and matched successfully!');
  };

  const runTollWebhook = () => {
    if (!selectedAssetId) return;
    const toll: TollRecord = {
      id: 'tl-' + Math.random().toString(36).substr(2, 9),
      assetId: selectedAssetId,
      transponderId: 'BESTPASS-' + Math.round(Math.random() * 1e5),
      amount: 18.50,
      location: 'New York I-90 Expressway',
      timestamp: new Date().toISOString()
    };
    const currentTolls = getStore('tollRecords', initialTollRecords);
    currentTolls.unshift(toll);
    setStore('tollRecords', currentTolls);
    refreshDb();
    alert('Toll transponder charge matched to asset cost profile.');
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex overflow-y-auto shadow-sm">
        <div>
          {/* Brand */}
          <div className="h-16 flex items-center px-6 gap-2 border-b border-slate-200">
            <Truck className="h-6 w-6 text-indigo-600" />
            <span className="font-extrabold text-xl text-slate-900">FleetCare</span>
          </div>

          {/* Navigation Links — Grouped Fleetio-style */}
          <nav className="p-3 space-y-0.5 text-[13px] pb-4">

            {/* ── OVERVIEW ── */}
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-3 pb-1">Overview</p>
            <button onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <Activity className="h-4 w-4 shrink-0" /> Cockpit Dashboard
            </button>
            {['MAINTENANCE_ADMIN', 'FLEET_MANAGER', 'DRIVER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('fleetmap')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition ${activeTab === 'fleetmap' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <Map className="h-4 w-4 shrink-0" /> Fleet Map
              </button>
            )}
            {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('drivertracking')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition ${
                  activeTab === 'drivertracking'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                }`}>
                <Radio className="h-4 w-4 shrink-0" />
                Live Tracking
                <span className="ml-auto relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </button>
            )}

            {/* ── VEHICLES ── */}
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1">Vehicles</p>
            <button onClick={() => setActiveTab('assets')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'assets' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <Truck className="h-4 w-4 shrink-0" /> Asset Control & QRs
            </button>
            {['MAINTENANCE_ADMIN', 'FLEET_MANAGER', 'DRIVER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('assignments')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'assignments' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <Users className="h-4 w-4 shrink-0" /> Assignments
              </button>
            )}
            {['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('tires')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'tires' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <Layers className="h-4 w-4 shrink-0" /> Tire Readings
              </button>
            )}
            {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('expenses')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'expenses' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <CreditCard className="h-4 w-4 shrink-0" /> Expense History
              </button>
            )}
            {['FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('replacement')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'replacement' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <BarChart3 className="h-4 w-4 shrink-0" /> Replacement Analysis
              </button>
            )}

            {/* ── OPERATIONS ── */}
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1">Operations</p>
            {['DRIVER', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('inspections')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'inspections' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <FileCheck className="h-4 w-4 shrink-0" /> eDVIR Inspections
              </button>
            )}
            <button onClick={() => setActiveTab('issues')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'issues' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <AlertTriangle className="h-4 w-4 shrink-0" /> Issues
              {(db?.issues as Issue[] || []).filter((i) => i.status !== 'RESOLVED').length > 0 && (
                <span className="ml-auto text-[9px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded-full">
                  {(db?.issues as Issue[] || []).filter((i) => i.status !== 'RESOLVED').length}
                </span>
              )}
            </button>
            {['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('pm')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'pm' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <Settings className="h-4 w-4 shrink-0" /> PM Scheduling
              </button>
            )}
            {['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('workorders')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'workorders' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <Wrench className="h-4 w-4 shrink-0" /> Work Orders & POs
              </button>
            )}
            {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('renewals')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'renewals' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <ShieldAlert className="h-4 w-4 shrink-0" /> Renewal Alerts
              </button>
            )}
            {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('warranties')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'warranties' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <Shield className="h-4 w-4 shrink-0" /> Warranties
              </button>
            )}

            {/* ── SERVICE & FIELD ── */}
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1">Service & Field</p>
            {['DRIVER', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('fuel')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'fuel' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <Fuel className="h-4 w-4 shrink-0" /> Fuel & IFTA Logs
              </button>
            )}
            {['DRIVER', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('emergency')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'emergency' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <MapPin className="h-4 w-4 shrink-0" /> Roadside Breakdown
              </button>
            )}
            {['FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('claims')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'claims' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <CreditCard className="h-4 w-4 shrink-0" /> Accidents & Claims
              </button>
            )}

            {/* ── RESOURCES ── */}
            {['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1">Resources</p>
                <button onClick={() => setActiveTab('parts')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'parts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <Package className="h-4 w-4 shrink-0" /> Parts & Inventory
                  {(db?.parts as Part[] || []).filter((p) => p.stockQty <= p.reorderLevel).length > 0 && (
                    <span className="ml-auto text-[9px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded-full">
                      {(db?.parts as Part[] || []).filter((p) => p.stockQty <= p.reorderLevel).length}
                    </span>
                  )}
                </button>
                {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('contacts')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'contacts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                    <Users className="h-4 w-4 shrink-0" /> Contacts
                  </button>
                )}
                {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('places')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'places' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                    <Building2 className="h-4 w-4 shrink-0" /> Places
                  </button>
                )}
                {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('documents')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'documents' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                    <FileBox className="h-4 w-4 shrink-0" /> Documents
                    {(db?.documents as FleetDocument[] || []).some((d) => d.expiresAt && Math.floor((new Date(d.expiresAt).getTime() - Date.now()) / 86400000) < 30) && (
                      <span className="ml-auto text-[9px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded-full">!</span>
                    )}
                  </button>
                )}
              </>
            )}

            {/* ── REPORTING ── */}
            {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1">Reporting</p>
                {['FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('reports')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                    <BarChart3 className="h-4 w-4 shrink-0" /> Reports
                  </button>
                )}
                <button onClick={() => setActiveTab('audit')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <History className="h-4 w-4 shrink-0" /> Audit Logging
                </button>
                <button onClick={() => setActiveTab('simulators')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'simulators' ? 'bg-violet-600 text-white font-bold shadow-sm' : 'text-violet-600 hover:bg-violet-50 hover:text-violet-700'}`}>
                  <Activity className="h-4 w-4 text-violet-600 shrink-0" /> ELD Webhook Sim
                </button>
              </>
            )}

          </nav>
        </div>

        {/* User Info & Role Selector */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
              {currentUser.name[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="space-y-1 mb-4">
            <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Role Switcher (Test Panel)</label>
            <select
              value={currentUser.role}
              onChange={(e) => switchRole(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
            >
              <option value="DRIVER">Driver View</option>
              <option value="MECHANIC">Mechanic View</option>
              <option value="MAINTENANCE_ADMIN">Admin View</option>
              <option value="FLEET_MANAGER">Fleet Manager View</option>
            </select>
          </div>

          {/* ── Supertruck API Config ── */}
          {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
            <div className="mb-3">
              <button
                onClick={() => setStConfigOpen(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 rounded-lg transition"
              >
                <span className="flex items-center gap-1.5"><Key className="h-3 w-3" /> Supertruck API</span>
                {stTenantId && stToken
                  ? <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">CONNECTED</span>
                  : <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full">DEMO</span>
                }
                {stConfigOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {stConfigOpen && (
                <form onSubmit={handleSaveStConfig} className="mt-2 space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Tenant ID</label>
                    <input
                      type="text"
                      value={stTenantId}
                      onChange={e => setStTenantId(e.target.value)}
                      placeholder="your-tenant-uuid"
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Bearer Token</label>
                    <input
                      type="password"
                      value={stToken}
                      onChange={e => setStToken(e.target.value)}
                      placeholder="eyJhbGci..."
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded transition"
                  >
                    {stSaved ? '✓ Saved!' : 'Save Credentials'}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">Leave blank to use Demo Mode</p>
                </form>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setCurrentUser(null);
              setAuthMode('LANDING');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 rounded-lg transition"
          >
            <LogOut className="h-3.5 w-3.5" /> Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* TOP BAR / HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-6 shadow-sm">
          <h2 className="text-lg font-bold capitalize flex items-center gap-2 text-slate-900">
            {activeTab.replace('-', ' ')} view
            {/* Mobile indicator */}
            <span className="md:hidden text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Mobile view</span>
          </h2>

          <div className="flex items-center gap-4">
            {/* Live notification alerts bar */}
            <div className="relative group">
              <button className="relative p-2 text-slate-500 hover:text-slate-900 transition">
                <Bell className="h-5 w-5" />
                {db.notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-indigo-600 rounded-full"></span>
                )}
              </button>
              
              {/* Notification drop menu */}
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden hidden group-hover:block z-50">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <span className="text-xs font-bold text-slate-800">Live Maintenance Feed</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">{db.notifications.length} unread</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {db.notifications.map((n: SystemNotification) => (
                    <div key={n.id} className="p-3 text-xs hover:bg-slate-50">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="h-5 w-[1px] bg-slate-200"></div>

            <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
              Logged in: {currentUser.name}
            </span>
          </div>
        </header>

        {/* COMPONENT ROUTER VIEWS */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto space-y-6">

          {/* TAB 1: COCKPIT DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {currentUser.role === 'DRIVER' ? (
                // --- DRIVER DASHBOARD ---
                <div className="space-y-6">
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-600" /> Welcome back, {currentUser.name} (Driver)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Check vehicle health status, log fuel logs, or file inspections below.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assigned Tractor Card */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-sm font-bold text-slate-900">Your Assigned Tractor</span>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-green-100 border border-green-200 text-green-700 uppercase">
                          OPERABLE
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tractor Model</span>
                          <span className="font-semibold text-slate-900">Tractor #101 (Peterbilt 579)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Plate Number</span>
                          <span className="font-mono text-slate-700">TX-TRK-101</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Odometer Reading</span>
                          <span className="font-mono text-slate-700">145,200.5 Miles</span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Trailer Card */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-sm font-bold text-slate-900">Linked Trailer</span>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-green-100 border border-green-200 text-green-700 uppercase">
                          OPERABLE
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Trailer Model</span>
                          <span className="font-semibold text-slate-900">Trailer #201 (Utility Dry Van)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Plate Number</span>
                          <span className="font-mono text-slate-700">TX-TRL-201</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Odometer Reading</span>
                          <span className="font-mono text-slate-700">89,300.2 Miles</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Driver Quick Actions */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-slate-900">Driver Quick Actions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setActiveTab('inspections')}
                        className="p-4 bg-indigo-50/70 hover:bg-indigo-100/90 border border-indigo-200 rounded-xl text-left transition space-y-2 group"
                      >
                        <div className="p-2 bg-indigo-600 rounded-lg text-white w-fit shadow-sm">
                          <FileCheck className="h-5 w-5" />
                        </div>
                        <p className="font-bold text-sm text-slate-900 group-hover:text-indigo-700">eDVIR Inspections</p>
                        <p className="text-[10px] text-slate-500">Complete checklists for Tractors and Trailers before each dispatch.</p>
                      </button>

                      <button
                        onClick={() => setActiveTab('fuel')}
                        className="p-4 bg-emerald-50/70 hover:bg-emerald-100/90 border border-emerald-200 rounded-xl text-left transition space-y-2 group"
                      >
                        <div className="p-2 bg-emerald-600 rounded-lg text-white w-fit shadow-sm">
                          <Fuel className="h-5 w-5" />
                        </div>
                        <p className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">Log Fuel purchase</p>
                        <p className="text-[10px] text-slate-500">Swipe a card transaction and verify gallons purchased.</p>
                      </button>

                      <button
                        onClick={() => setActiveTab('emergency')}
                        className="p-4 bg-red-50/70 hover:bg-red-100/90 border border-red-200 rounded-xl text-left transition space-y-2 group"
                      >
                        <div className="p-2 bg-red-600 rounded-lg text-white w-fit shadow-sm">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <p className="font-bold text-sm text-slate-900 group-hover:text-red-700">Roadside Breakdown</p>
                        <p className="text-[10px] text-slate-500">Log breakdown details, GPS coordinates, and get a matched mechanic.</p>
                      </button>
                    </div>
                  </div>
                </div>
              ) : currentUser.role === 'MECHANIC' ? (
                // --- MECHANIC DASHBOARD ---
                <div className="space-y-6">
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-indigo-600" /> Welcome back, {currentUser.name} (Mechanic)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Dave, check your open work order queue and parts/labor logs below.</p>
                    </div>
                    <button onClick={() => setActiveTab('workorders')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow-sm transition">
                      Work Orders Dashboard
                    </button>
                  </div>

                  {/* Active Job Cards */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-slate-900">Assigned Open Work Orders</h4>
                    <div className="space-y-3">
                      {db.workOrders
                        .filter((w: WorkOrder) => w.assignedMechanicId === 'u3' || w.assignedMechanicId === currentUser.id)
                        .map((w: WorkOrder) => {
                          const assetName = db.assets.find((a: Asset) => a.id === w.assetId)?.name;
                          return (
                            <div key={w.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{assetName}</span>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    w.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                                  }`}>
                                    {w.status}
                                  </span>
                                </div>
                                <p className="text-slate-600">"{w.description}"</p>
                                <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
                                  <span>Priority: {w.priority}</span>
                                  <span>Created: {new Date(w.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              {w.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => {
                                    const labor = parseFloat(prompt('Enter labor hours (e.g. 2.0):', '2.0') || '0');
                                    const parts = parseFloat(prompt('Enter parts cost ($):', '50.00') || '0');
                                    mutators.updateWorkOrder(w.id, {
                                      status: 'COMPLETED',
                                      laborCost: labor * 120, // rate
                                      partsCost: parts
                                    }, currentUser.name);
                                    refreshDb();
                                    alert('Work order marked as completed and asset health status restored.');
                                  }}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-500 font-bold text-[10px] rounded text-white shadow-sm transition"
                                >
                                  Complete WO
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                // --- ADMIN & MANAGER DASHBOARD ---
                <div className="space-y-6">
                  {/* Customizable Widget Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Health Score */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl relative overflow-hidden shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Fleet Health Score</p>
                          <h3 className="text-3xl font-black mt-1 text-slate-900">{fleetHealth}%</h3>
                        </div>
                        <div className="p-2.5 bg-green-50 border border-green-200 text-green-600 rounded-xl">
                          <Activity className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${fleetHealth > 80 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${fleetHealth}%` }}></div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono">{healthyCount} of {activeAssets.length} assets operational</p>
                    </div>

                    {/* PM Compliance */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl relative overflow-hidden shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">PM Compliance</p>
                          <h3 className="text-3xl font-black mt-1 text-slate-900">{pmCompliance}%</h3>
                        </div>
                        <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl">
                          <FileCheck className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${pmCompliance}%` }}></div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono">{overduePms} schedules require service attention</p>
                    </div>

                    {/* Open Work Orders */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl relative overflow-hidden shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Open Work Orders</p>
                          <h3 className="text-3xl font-black mt-1 text-slate-900">{openWorkOrders}</h3>
                          <p className="text-[10px] text-slate-500 mt-2 font-semibold">Active tasks inside shop</p>
                        </div>
                        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl">
                          <Wrench className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    {/* Active Expiry Alerts */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl relative overflow-hidden shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Compliance Alerts</p>
                          <h3 className={`text-3xl font-black mt-1 ${activeAlerts > 0 ? 'text-red-600' : 'text-slate-900'}`}>{activeAlerts}</h3>
                          <p className="text-[10px] text-slate-500 mt-2 font-semibold">Regulatory renewal timelines</p>
                        </div>
                        <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MIDDLE ROW: CHART & DOWNTIME METRICS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Fuel Cost Trends Widget (Fleet Manager Only) */}
                    {currentUser.role === 'FLEET_MANAGER' ? (
                      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm md:col-span-2 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <span className="text-sm font-bold text-slate-900">Fuel Cost & MPG Trends</span>
                          <button onClick={() => triggerExport('ifta')} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
                            <Download className="h-3.5 w-3.5" /> Export IFTA Logs
                          </button>
                        </div>

                        {/* Simulated SVG Graph */}
                        <div className="h-48 bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
                          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                            <span>June 1</span>
                            <span>June 5</span>
                            <span>June 10</span>
                            <span>June 15 (Today)</span>
                          </div>
                          <div className="relative flex-1 flex items-end justify-between px-4">
                            {/* Bar graph representing fuel purchases */}
                            <div className="w-8 bg-indigo-200 hover:bg-indigo-300 h-1/3 rounded-t transition-all group relative">
                              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 shadow-sm">$420</span>
                            </div>
                            <div className="w-8 bg-indigo-300 hover:bg-indigo-400 h-1/2 rounded-t transition-all group relative">
                              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 shadow-sm">$580</span>
                            </div>
                            <div className="w-8 bg-indigo-400 hover:bg-indigo-500 h-3/4 rounded-t transition-all group relative">
                              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 shadow-sm">$710</span>
                            </div>
                            <div className="w-8 bg-indigo-600 h-2/3 rounded-t relative">
                              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-indigo-600 text-white border border-indigo-700 px-1.5 py-0.5 rounded font-bold shadow-sm">$455</span>
                            </div>
                          </div>
                          <div className="text-center text-[10px] text-slate-500">Fuel Expenditure Trends per billing cycle</div>
                        </div>
                      </div>
                    ) : (
                      // Maintenance Admin view: show recent activities feed instead of pure financial trends
                      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm md:col-span-2 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <span className="text-sm font-bold text-slate-900">Active Service Operations Summary</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                            <span className="font-bold text-slate-500">Pending Requests</span>
                            <p className="text-2xl font-black text-slate-900 mt-1">
                              {db.serviceRequests.filter((r: any) => r.status === 'PENDING').length}
                            </p>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                            <span className="font-bold text-slate-500">Total Audit Logs</span>
                            <p className="text-2xl font-black text-slate-900 mt-1">
                              {db.auditLogs.length}
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-sans">Access other tabs via sidebar navigation to triage issues and schedule PM services.</p>
                      </div>
                    )}

                    {/* Downtime Metrics */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <span className="text-sm font-bold text-slate-900">Vehicle Downtime Stats</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-800 font-medium">Tractor #102</span>
                            <span className="text-slate-500 font-mono">1.5 hrs</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full" style={{ width: '45%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-800 font-medium">Trailer #202</span>
                            <span className="text-slate-500 font-mono">0.0 hrs</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: '0%' }}></div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                          <span>Cumulative Fleet Downtime:</span>
                          <span className="font-bold text-slate-900">{totalDowntime} hrs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RECENT WEBHOOK FEED / LOGS */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-900 mb-4">Live Telematics Fault Logs Ingestion Feed</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2.5">Asset ID</th>
                            <th className="py-2.5">Telematic Source</th>
                            <th className="py-2.5">DTC J1939 Code</th>
                            <th className="py-2.5">Description</th>
                            <th className="py-2.5">Action Taken</th>
                            <th className="py-2.5 text-right">Registered</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {db.faultCodes.map((fc: FaultCode) => {
                            const assetName = db.assets.find((a: Asset) => a.id === fc.assetId)?.name || 'Unknown';
                            return (
                              <tr key={fc.id} className="hover:bg-slate-50">
                                <td className="py-3 font-semibold text-slate-900">{assetName}</td>
                                <td className="py-3 text-slate-600">{fc.source}</td>
                                <td className="py-3 font-mono text-amber-600 font-bold">{fc.code}</td>
                                <td className="py-3 text-slate-600">{fc.description}</td>
                                <td className="py-3">
                                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                    Work Order Generated
                                  </span>
                                </td>
                                <td className="py-3 text-right text-slate-500">{new Date(fc.createdAt).toLocaleDateString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASSET CONTROL & QR */}
          {activeTab === 'assets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-lg font-bold text-slate-900">Tractor & Trailer Asset Matrix</h3>
                <button onClick={() => triggerExport('costs')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5 transition shadow-sm">
                  <Download className="h-4 w-4" /> Export Asset Report
                </button>
              </div>

              {/* Assets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {db.assets.map((asset: Asset) => {
                  const pairedTrailer = db.assets.find((a: Asset) => a.parentAssetId === asset.id);
                  const isBlocked = db.renewalAlerts.some((r: RenewalAlert) => r.assetId === asset.id && r.status === 'EXPIRED') || asset.status === 'INOPERABLE';

                  return (
                    <div key={asset.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative flex flex-col justify-between gap-4">
                      {/* Asset Header */}
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-extrabold text-base text-slate-900">{asset.name}</h4>
                          <p className="text-xs text-slate-500 font-mono">VIN: {asset.vin} | Plates: {asset.plateNumber}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          asset.status === 'OPERABLE' ? 'bg-green-100 text-green-700 border-green-200' :
                          asset.status === 'NEEDS_ATTENTION' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {asset.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Odometer Reading</p>
                          <p className="text-sm font-extrabold text-slate-900 mt-0.5">{asset.odometer.toLocaleString()} miles</p>
                        </div>
                        <div>
                          <p className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Asset Association</p>
                          <p className="text-sm font-semibold mt-0.5 text-indigo-600">
                            {asset.type === 'TRACTOR' ? (pairedTrailer ? `Paired to ${pairedTrailer.plateNumber}` : 'Solo Tractor') : (asset.parentAssetId ? 'Coupled to Cab' : 'Uncoupled')}
                          </p>
                        </div>
                      </div>

                      {/* Sub-components service history */}
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Sub-component groups status</p>
                        <div className="flex flex-wrap gap-2">
                          {db.components.filter((c: Component) => c.assetId === asset.id).map((c: Component) => (
                            <span key={c.id} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-[10px] text-slate-700 rounded-lg flex items-center gap-1.5 font-semibold">
                              <span className={`h-2 w-2 rounded-full ${c.status === 'OPERABLE' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Overrides */}
                      <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-2">
                        <div className="flex items-center gap-3">
                          {/* QR Code trigger */}
                          <button
                            onClick={() => {
                              alert(`Simulating Barcode Scanner: Fetching component history for asset: ${asset.name}`);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] rounded-lg font-bold text-slate-700 transition"
                          >
                            Scan QR Code
                          </button>

                          {isBlocked && (
                            <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-bold">
                              Dispatch Blocked
                            </span>
                          )}
                        </div>

                        {/* Admin Overrides */}
                        {(currentUser.role === 'MAINTENANCE_ADMIN' || currentUser.role === 'FLEET_MANAGER') && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 font-bold">Status Override:</span>
                            <select
                              value={asset.status}
                              onChange={(e) => {
                                mutators.overrideAssetStatus(asset.id, e.target.value as any, currentUser.name);
                                refreshDb();
                              }}
                              className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                            >
                              <option value="OPERABLE">OPERABLE</option>
                              <option value="NEEDS_ATTENTION">NEEDS_ATTENTION</option>
                              <option value="INOPERABLE">INOPERABLE</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: EDVIR INSPECTIONS */}
          {activeTab === 'inspections' && (
            <div className="space-y-6">
              {currentUser.role === 'DRIVER' || currentUser.role === 'MAINTENANCE_ADMIN' ? (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Submit New Digital Checklist</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Select Asset</label>
                      <select
                        value={selectedAssetId}
                        onChange={(e) => {
                          setSelectedAssetId(e.target.value);
                          setFailedChecklistItems({});
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                      >
                        <option value="">-- Choose Asset --</option>
                        {db.assets.map((a: Asset) => (
                          <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Current Odometer (Miles)</label>
                      <input
                        type="number"
                        placeholder="Odometer"
                        value={inspectionOdometer || ''}
                        onChange={e => setInspectionOdometer(parseInt(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                      />
                    </div>
                  </div>

                  {selectedAssetId && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Checklist items (Tap items to fail inspection status)</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {db.assets.find((a: Asset) => a.id === selectedAssetId)?.type === 'TRACTOR' ? (
                          ['Engine Fluid Levels', 'Air Brakes Pressure', 'Steering Linkage', 'Safety Lighting', 'Chassis Tires'].map((item) => (
                            <button
                              key={item}
                              onClick={() => {
                                setFailedChecklistItems(prev => ({ ...prev, [item]: !prev[item] }));
                              }}
                              className={`p-3 border rounded-xl text-left transition text-xs font-semibold flex justify-between items-center ${
                                failedChecklistItems[item] ? 'bg-red-50 border-red-300 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              <span>{item}</span>
                              <span className="text-[10px] uppercase font-bold">{failedChecklistItems[item] ? 'FAIL' : 'PASS'}</span>
                            </button>
                          ))
                        ) : (
                          ['Kingpin Connection', 'Sliding Tandem Rails', 'Door Seals Lock', 'Brake Lining Wear', 'Reflectors & Lights'].map((item) => (
                            <button
                              key={item}
                              onClick={() => {
                                setFailedChecklistItems(prev => ({ ...prev, [item]: !prev[item] }));
                              }}
                              className={`p-3 border rounded-xl text-left transition text-xs font-semibold flex justify-between items-center ${
                                failedChecklistItems[item] ? 'bg-red-50 border-red-300 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                                <span>{item}</span>
                                <span className="text-[10px] uppercase font-bold">{failedChecklistItems[item] ? 'FAIL' : 'PASS'}</span>
                            </button>
                          ))
                        )}
                      </div>

                      <div className="pt-2">
                        <label className="text-xs text-slate-500 font-bold block mb-1">Inspection Notes / Details</label>
                        <textarea
                          placeholder="Provide details for failing items..."
                          value={inspectionNotes}
                          onChange={e => setInspectionNotes(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs h-20 focus:outline-none focus:border-indigo-600 text-slate-900"
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (!selectedAssetId) return;
                          const hasFailures = Object.values(failedChecklistItems).some(v => v);
                          mutators.submitInspection({
                            assetId: selectedAssetId,
                            driverName: currentUser.name,
                            status: hasFailures ? 'FAILED' : 'PASSED',
                            odometer: inspectionOdometer,
                            checklistJson: failedChecklistItems,
                            notes: inspectionNotes
                          });
                          refreshDb();
                          alert(hasFailures ? 'Inspection failed! Asset status updated to INOPERABLE.' : 'Inspection passed successfully!');
                          setFailedChecklistItems({});
                          setInspectionNotes('');
                        }}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        Submit Inspection Form
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 p-4 rounded-xl text-slate-600 text-xs font-medium">
                  Inspectors and Driver accounts can submit new inspection reports. Logged in as {currentUser.role}.
                </div>
              )}

              {/* Log files list */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Past eDVIR Inspections Logs</h4>
                <div className="space-y-3">
                  {db.inspections.length === 0 ? (
                    <p className="text-xs text-slate-500">No inspections submitted yet.</p>
                  ) : (
                    db.inspections.map((insp: EDVIRInspection) => (
                      <div key={insp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900">
                            {db.assets.find((a: Asset) => a.id === insp.assetId)?.name}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">Submitted by: {insp.driverName} | Odo: {insp.odometer} miles</p>
                          {insp.notes && <p className="text-slate-600 mt-1.5 italic">&quot;{insp.notes}&quot;</p>}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                          insp.status === 'PASSED' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-red-100 border-red-200 text-red-700'
                        }`}>
                          {insp.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PM SCHEDULING */}
          {activeTab === 'pm' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Preventive Maintenance Schedules</h3>
                <button onClick={() => triggerExport('compliance')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition">
                  <Download className="h-4 w-4" /> Export PM Compliance
                </button>
              </div>

              {/* PM Schedules List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {db.pmSchedules.map((sched: PMSchedule) => {
                  const asset = db.assets.find((a: Asset) => a.id === sched.assetId);
                  const template = db.pmTemplates.find((t: PMTemplate) => t.id === sched.templateId);

                  return (
                    <div key={sched.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-extrabold text-base text-slate-900">{asset?.name}</h4>
                          <p className="text-xs text-indigo-600 font-bold">{template?.name}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          sched.status === 'COMPLIANT' ? 'bg-green-100 border-green-200 text-green-700' :
                          sched.status === 'DUE' ? 'bg-amber-100 border-amber-200 text-amber-700' :
                          'bg-red-100 border-red-200 text-red-700'
                        }`}>
                          {sched.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">Dual Intervals Trigger</p>
                          <p className="text-slate-800 font-bold mt-1">Odo: {sched.nextDueOdometer.toLocaleString()} miles</p>
                          <p className="text-slate-600">Days: {new Date(sched.nextDueDate).toLocaleDateString()}</p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">Last Serviced</p>
                          <p className="text-slate-800 font-bold mt-1">Odo: {sched.lastServiceOdometer.toLocaleString()} miles</p>
                          <p className="text-slate-600">Date: {sched.lastServiceDate}</p>
                        </div>
                      </div>

                      {/* Steps list */}
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Checklist Steps</p>
                        <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc font-medium">
                          {template?.stepsJson.map((step: string) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Perform Service button for Mechanics/Admins */}
                      {(currentUser.role === 'MECHANIC' || currentUser.role === 'MAINTENANCE_ADMIN' || currentUser.role === 'FLEET_MANAGER') && (
                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => {
                              const curOdo = prompt('Confirm Odometer reading at service:', (asset?.odometer || 0).toString());
                              if (curOdo) {
                                mutators.performPM(sched.id, parseFloat(curOdo), currentUser.name);
                                refreshDb();
                                alert('Preventive Maintenance recorded! Next due date and mileage intervals re-evaluated.');
                              }
                            }}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-xl text-white shadow-xs transition"
                          >
                            Mark PM Complete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: WORK ORDERS & SERVICE REQUESTS */}
          {activeTab === 'workorders' && (
            <div className="space-y-6">
              {/* Driver Repair requests */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Submit Repair Request with Media</h3>
                
                {currentUser.role === 'DRIVER' || currentUser.role === 'MAINTENANCE_ADMIN' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Select Broken Asset</label>
                      <select
                        value={selectedAssetId}
                        onChange={e => setSelectedAssetId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                      >
                        <option value="">-- Choose Asset --</option>
                        {db.assets.map((a: Asset) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Diagnostic Issue / Text Description</label>
                      <input
                        type="text"
                        placeholder="Describe issue (e.g. Brake grinding, check engine light...)"
                        value={requestDesc}
                        onChange={e => setRequestDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Photo Upload (Simulated path)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={requestMedia}
                          onChange={e => setRequestMedia(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono"
                        />
                        <button
                          onClick={() => {
                            mutators.submitServiceRequest({
                              assetId: selectedAssetId,
                              driverName: currentUser.name,
                              description: requestDesc,
                              mediaUrls: [requestMedia]
                            });
                            refreshDb();
                            alert('Pending Service Request submitted and Admin notified!');
                            setRequestDesc('');
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition shadow-sm"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Drivers and Admin users can submit repair logs. Logged in as {currentUser.role}.</p>
                )}
              </div>

              {/* Admin approving request drawer overlay */}
              {approvingRequestId && (
                <div className="bg-white border-2 border-indigo-500 p-6 rounded-2xl shadow-md space-y-4">
                  <h4 className="text-sm font-bold text-indigo-600">Review Driver Request & Approve to Work Order</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Route Assignment Type</label>
                      <select value={woType} onChange={e => setWoType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-900">
                        <option value="INTERNAL">Internal Shop (Mechanic)</option>
                        <option value="EXTERNAL">External Vendor (Purchase Order)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Priority Scale</label>
                      <select value={woPriority} onChange={e => setWoPriority(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-900">
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="EMERGENCY">EMERGENCY</option>
                      </select>
                    </div>

                    {woType === 'INTERNAL' ? (
                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Assign Mechanic</label>
                        <select value={woMechanicId} onChange={e => setWoMechanicId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-900">
                          {db.users.filter((u: DbUser) => u.role === 'MECHANIC').map((u: DbUser) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Assign External Vendor</label>
                        <select value={woVendorId} onChange={e => setWoVendorId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-900">
                          {db.vendors.map((v: Vendor) => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <label className="text-xs text-slate-500 font-bold block mb-1">Repair Instructions</label>
                    <input type="text" value={woDesc} onChange={e => setWoDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900" />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setApprovingRequestId(null)} className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-xs rounded-xl transition text-slate-600 font-semibold">Cancel</button>
                    <button
                      onClick={() => {
                        mutators.approveRequest(approvingRequestId, {
                          type: woType,
                          priority: woPriority,
                          description: woDesc,
                          assignedMechanicId: woMechanicId,
                          vendorId: woVendorId
                        }, currentUser.name);
                        setApprovingRequestId(null);
                        refreshDb();
                        alert('Request converted to Work Order!');
                      }}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl transition text-white shadow-xs"
                    >
                      Approve & Dispatch
                    </button>
                  </div>
                </div>
              )}

              {/* Dual Listing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Requests */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">Pending Service Requests</h4>
                  
                  <div className="space-y-3">
                    {db.serviceRequests.length === 0 ? (
                      <p className="text-xs text-slate-500">No requests filed.</p>
                    ) : (
                      db.serviceRequests.map((r: ServiceRequest) => {
                        const assetName = db.assets.find((a: Asset) => a.id === r.assetId)?.name;
                        return (
                          <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-900">{assetName}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                r.status === 'PENDING' ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-green-100 border-green-200 text-green-700'
                              }`}>
                                {r.status}
                              </span>
                            </div>
                            <p className="text-slate-700">"{r.description}"</p>
                            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[9px]">
                              <span>Reporter: {r.driverName}</span>
                              <span>•</span>
                              <span>Attachment: {r.mediaUrls[0]}</span>
                            </div>

                            {r.status === 'PENDING' && (currentUser.role === 'MAINTENANCE_ADMIN' || currentUser.role === 'FLEET_MANAGER') && (
                              <button
                                onClick={() => {
                                  setApprovingRequestId(r.id);
                                  setWoDesc(r.description);
                                }}
                                className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold rounded-lg text-white transition shadow-xs"
                              >
                                Review & Convert to Work Order
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Work Orders */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 font-sans">Active Shop Work Orders</h4>
                  
                  <div className="space-y-3">
                    {db.workOrders.map((wo: WorkOrder) => {
                      const asset = db.assets.find((a: Asset) => a.id === wo.assetId);
                      
                      return (
                        <div key={wo.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-900">{asset?.name}</span>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {wo.id}</p>
                            </div>
                            <div className="flex gap-1.5 items-center">
                              <span className="px-1.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-700 rounded text-[9px] font-bold font-mono">{wo.priority}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                wo.status === 'OPEN' ? 'bg-amber-100 border-amber-200 text-amber-700' :
                                wo.status === 'IN_PROGRESS' ? 'bg-indigo-100 border-indigo-200 text-indigo-700' :
                                'bg-green-100 border-green-200 text-green-700'
                              }`}>
                                {wo.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <p className="text-slate-700">Instructions: "{wo.description}"</p>

                          <div className="grid grid-cols-2 gap-2 font-mono text-[10px] bg-white border border-slate-200 p-2 rounded.xl">
                            <div>
                              <p className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Costs Accrued</p>
                              <p className="text-slate-800 font-bold mt-0.5">Labor: ${wo.laborCost}</p>
                              <p className="text-slate-800 font-bold">Parts: ${wo.partsCost}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Assignment Profile</p>
                              <p className="text-slate-800 mt-0.5">Type: {wo.type}</p>
                              {wo.type === 'EXTERNAL' ? (
                                <p className="text-indigo-600 font-bold">PO Issued</p>
                              ) : (
                                <p className="text-slate-700 font-semibold">Mechanic: Dave</p>
                              )}
                            </div>
                          </div>

                          {/* Mechanic updates WO */}
                          {wo.status !== 'COMPLETED' && (currentUser.role === 'MECHANIC' || currentUser.role === 'MAINTENANCE_ADMIN') && (
                            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                              <button
                                onClick={() => {
                                  const labor = prompt('Record labor cost ($):', wo.laborCost.toString());
                                  const parts = prompt('Record parts cost ($):', wo.partsCost.toString());
                                  
                                  mutators.updateWorkOrder(wo.id, {
                                    status: 'COMPLETED',
                                    laborCost: parseFloat(labor || '0'),
                                    partsCost: parseFloat(parts || '0')
                                  }, currentUser.name);
                                  refreshDb();
                                  alert('Work order completed! Asset status re-evaluated.');
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold rounded-lg text-white transition ml-auto shadow-xs"
                              >
                                Mark Completed
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: RENEWAL ALERTS */}
          {activeTab === 'renewals' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {db.renewalAlerts.map((alert: RenewalAlert) => {
                  const asset = db.assets.find((a: Asset) => a.id === alert.assetId);
                  
                  const daysLeft = Math.ceil((new Date(alert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  let urgency: 'NONE' | 'INFO' | 'WARNING' | 'CRITICAL' = 'NONE';
                  if (daysLeft <= 0) urgency = 'CRITICAL';
                  else if (daysLeft <= 5) urgency = 'CRITICAL';
                  else if (daysLeft <= 15) urgency = 'WARNING';
                  else if (daysLeft <= 30) urgency = 'INFO';

                  return (
                    <div
                      key={alert.id}
                      className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition shadow-sm ${
                        urgency === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-900' :
                        urgency === 'WARNING' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                        'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            urgency === 'CRITICAL' ? 'bg-red-100 border-red-300 text-red-700' :
                            urgency === 'WARNING' ? 'bg-amber-100 border-amber-300 text-amber-700' :
                            'bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            {alert.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold">{asset?.name}</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900">{alert.description}</h4>
                        <p className="text-xs text-slate-500 font-mono">Expiration: {alert.expiryDate} ({daysLeft} days remaining)</p>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        {urgency === 'CRITICAL' && (
                          <span className="text-[10px] bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Dispatch Blocked
                          </span>
                        )}
                        {alert.status === 'ACTIVE' && (currentUser.role === 'MAINTENANCE_ADMIN' || currentUser.role === 'FLEET_MANAGER') && (
                          <button
                            onClick={() => {
                              mutators.dismissRenewalAlert(alert.id, currentUser.name);
                              refreshDb();
                              window.alert('Alert dismissed/updated successfully.');
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-bold rounded-lg text-slate-800 transition"
                          >
                            Resolve Alert
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: FUEL & TOLL RECORDS */}
          {activeTab === 'fuel' && (
            <div className="space-y-6">
              {/* Manual Fuel Card Swipe Form */}
              {['DRIVER', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 mb-6">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Fuel className="h-4.5 w-4.5 text-indigo-600" /> Log Fuel Card Transaction
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="text-slate-500 font-bold block mb-1">Select Asset</label>
                      <select
                        value={selectedAssetId}
                        onChange={e => {
                          setSelectedAssetId(e.target.value);
                          const asset = db.assets.find((a: Asset) => a.id === e.target.value);
                          if (asset) setInspectionOdometer(asset.odometer);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                      >
                        <option value="">-- Choose Asset --</option>
                        {db.assets.map((a: Asset) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-500 font-bold block mb-1">Gallons Purchased</label>
                      <input
                        type="number"
                        value={simFuelGallons}
                        onChange={e => setSimFuelGallons(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 font-bold block mb-1">Transaction Cost ($)</label>
                      <input
                        type="number"
                        value={simFuelCost}
                        onChange={e => setSimFuelCost(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 font-bold block mb-1">Odometer (Miles)</label>
                      <input
                        type="number"
                        value={inspectionOdometer || 0}
                        onChange={e => setInspectionOdometer(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 font-bold block mb-1">State Jurisdiction</label>
                      <select
                        value={simFuelState}
                        onChange={e => setSimFuelState(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                      >
                        <option value="TX">TX - Texas</option>
                        <option value="NV">NV - Nevada</option>
                        <option value="CA">CA - California</option>
                        <option value="AZ">AZ - Arizona</option>
                        <option value="NM">NM - New Mexico</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        if (!selectedAssetId) {
                          alert('Please select an asset first.');
                          return;
                        }
                        const targetOdo = inspectionOdometer || simOdometer;
                        const isAnomaly = simFuelGallons > 0 ? (targetOdo / simFuelGallons < 4.0) : false;
                        const fuelLog: FuelLog = {
                          id: 'f-' + Math.random().toString(36).substr(2, 9),
                          assetId: selectedAssetId,
                          cardTransactionId: 'WEX-' + Math.round(Math.random() * 1e8),
                          gallons: simFuelGallons,
                          cost: simFuelCost,
                          location: simFuelState,
                          odometer: targetOdo,
                          mpg: simFuelGallons > 0 ? parseFloat((targetOdo / 15000).toFixed(1)) : 6.0,
                          isAnomaly,
                          createdAt: new Date().toISOString()
                        };

                        const currentLogs = getStore('fuelLogs', initialFuelLogs);
                        currentLogs.unshift(fuelLog);
                        setStore('fuelLogs', currentLogs);

                        const assets = getStore('assets', initialAssets);
                        const updated = assets.map(a => a.id === selectedAssetId ? { ...a, odometer: targetOdo } : a);
                        setStore('assets', updated);

                        if (isAnomaly) {
                          mutators.addNotification('COMPLIANCE', `Fuel MPG Anomaly`, `Asset dropped below average MPG target.`);
                        }

                        mutators.syncPMSchedules(selectedAssetId, targetOdo);
                        refreshDb();
                        alert('Fuel transaction swiped and matched successfully!');
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xs text-white transition shadow-sm"
                    >
                      Log Swipe Transaction
                    </button>
                  </div>
                </div>
              )}

              {/* Fuel Card Ingestion matching logic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* IFTA calculations by Jurisdiction */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">IFTA Fuel Summary by State Jurisdiction</h4>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">TX - Texas</span>
                        <p className="text-[10px] text-slate-500 mt-1">2 transactions matched</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-900 font-bold">235 Gallons</p>
                        <p className="text-slate-500 mt-0.5">$825.00 cost</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">NV - Nevada</span>
                        <p className="text-[10px] text-slate-500 mt-1">1 transaction matched</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-900 font-bold">150 Gallons</p>
                        <p className="text-slate-500 mt-0.5">$580.00 cost</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Toll Transponders attribution */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 font-sans">Toll Records Attribution logs</h4>
                  <div className="space-y-3 text-xs">
                    {db.tollRecords.map((t: TollRecord, i: number) => {
                      const asset = db.assets.find((a: Asset) => a.id === t.assetId);
                      return (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center font-mono">
                          <div>
                            <span className="font-bold text-slate-900">{asset?.name}</span>
                            <p className="text-[9px] text-slate-500 mt-1">{t.location} | Transponder: {t.transponderId}</p>
                          </div>
                          <div className="text-right text-indigo-600 font-bold">
                            +${t.amount.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ROADSIDE BREAKDOWNS */}
          {activeTab === 'emergency' && (
            <div className="space-y-6">
              {currentUser.role === 'DRIVER' || currentUser.role === 'MAINTENANCE_ADMIN' ? (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Report Active Breakdown</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Select Stranded Vehicle</label>
                      <select value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium">
                        <option value="">-- Choose Asset --</option>
                        {db.assets.map((a: Asset) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Issue Description</label>
                      <input type="text" placeholder="e.g. Blown steer tyre, coolant leakage" value={emergencyDesc} onChange={e => setEmergencyDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900" />
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">GPS Coordinates (Dallas, TX Simulation)</label>
                      <div className="flex gap-2">
                        <input type="text" value={`${emergencyLat}, ${emergencyLng}`} readOnly className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-600 font-mono" />
                        <button
                          onClick={() => {
                            if (!selectedAssetId) return;
                            mutators.createEmergencyTicket({
                              assetId: selectedAssetId,
                              reporterName: currentUser.name,
                              description: emergencyDesc,
                              gpsLatitude: emergencyLat,
                              gpsLongitude: emergencyLng
                            });
                            refreshDb();
                            alert('Emergency Ticket logged! Closest vendor Dallas Truck & Engine has been auto-dispatched (ETA 35 mins).');
                            setEmergencyDesc('');
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold text-white transition shadow-sm"
                        >
                          Dispatched
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Drivers and Admins can create tickets.</p>
              )}

              {/* Tickets directory list */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h4 className="text-sm font-bold mb-4 text-slate-900">Active Breakdown Tickets</h4>
                <div className="space-y-4">
                  {db.emergencyTickets.map((t: EmergencyTicket) => {
                    const assetName = db.assets.find((a: Asset) => a.id === t.assetId)?.name;
                    const vendor = db.vendors.find((v: Vendor) => v.id === t.assignedVendorId);

                    return (
                      <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{assetName}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 border border-amber-200 text-amber-700 uppercase">
                            {t.status}
                          </span>
                        </div>
                        <p className="text-slate-700">"{t.description}"</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-mono text-[10px] text-slate-600 pt-2 border-t border-slate-200">
                          <div>GPS: {t.gpsLatitude.toFixed(4)}, {t.gpsLongitude.toFixed(4)}</div>
                          <div>Vendor: {vendor?.name || 'Searching...'}</div>
                          <div>ETA: 35 min</div>
                        </div>

                        {t.status !== 'COMPLETED' && (currentUser.role === 'MAINTENANCE_ADMIN' || currentUser.role === 'FLEET_MANAGER') && (
                          <div className="pt-2 border-t border-slate-200 flex justify-end">
                            <button
                              onClick={() => {
                                const hours = prompt('Record downtime hours (e.g. 2.5):', '2.5');
                                mutators.updateEmergencyTicket(t.id, {
                                  status: 'COMPLETED',
                                  downtimeHours: parseFloat(hours || '0')
                                }, currentUser.name);
                                refreshDb();
                                alert('Breakdown resolved. Stranded asset status reset to OPERABLE.');
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-[10px] text-white font-bold shadow-xs"
                            >
                              Resolve Breakdown
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: ACCIDENTS & CLAIMS */}
          {activeTab === 'claims' && (
            <div className="space-y-6">
              {currentUser.role === 'DRIVER' || currentUser.role === 'MAINTENANCE_ADMIN' ? (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">File New Incident Claim</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Involved Vehicle</label>
                      <select value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-medium">
                        <option value="">-- Choose Asset --</option>
                        {db.assets.map((a: Asset) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Police Report Number</label>
                      <input type="text" placeholder="e.g. POL-99201" value={accidentReportNo} onChange={e => setAccidentReportNo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900" />
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Third-party Contact</label>
                      <input type="text" placeholder="Driver name & phone" value={accidentThirdParty} onChange={e => setAccidentThirdParty(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="text-xs text-slate-500 font-bold block mb-1">Collision Driver Statement</label>
                    <textarea value={accidentStatement} onChange={e => setAccidentStatement(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs h-16 text-slate-900" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Insurance Payout ($)</label>
                      <input type="number" value={accidentPayout} onChange={e => setAccidentPayout(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Actual Collision Repair Cost ($)</label>
                      <div className="flex gap-2">
                        <input type="number" value={accidentRepairCost} onChange={e => setAccidentRepairCost(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900" />
                        <button
                          onClick={() => {
                            if (!selectedAssetId) return;
                            mutators.submitAccidentClaim({
                              assetId: selectedAssetId,
                              driverName: currentUser.name,
                              policeReportNumber: accidentReportNo,
                              statement: accidentStatement,
                              thirdPartyDetails: accidentThirdParty,
                              claimDate: new Date().toISOString().split('T')[0],
                              insurancePayout: accidentPayout,
                              actualRepairCost: accidentRepairCost
                            });
                            refreshDb();
                            alert('Accident claim submitted! Active collision work order dispatched.');
                            setAccidentReportNo('');
                            setAccidentStatement('');
                            setAccidentThirdParty('');
                          }}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xs text-white shadow-sm"
                        >
                          File Claim
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Drivers and Admins can log collisions.</p>
              )}

              {/* Claims analytics directory listing */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Incident Claims Log Book & True Cost of Ownership</h4>
                <div className="space-y-4">
                  {db.accidentClaims.map((claim: AccidentClaim) => {
                    const asset = db.assets.find((a: Asset) => a.id === claim.assetId);
                    return (
                      <div key={claim.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="font-bold text-slate-900">{asset?.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Report: {claim.policeReportNumber}</span>
                        </div>
                        <p className="text-slate-700 mt-1">Statement: "{claim.statement}"</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[9.5px] text-slate-600 pt-2">
                          <div>Insurance Payout: ${claim.insurancePayout.toLocaleString()}</div>
                          <div>Actual Repair: ${claim.actualRepairCost.toLocaleString()}</div>
                          <div>Net Loss: ${(claim.actualRepairCost - claim.insurancePayout).toLocaleString()}</div>
                          <div>Driver: {claim.driverName}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: AUDIT LOGGING */}
          {activeTab === 'audit' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Full System Audit Trail Log</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2.5">User Profile</th>
                      <th className="py-2.5">Action Code</th>
                      <th className="py-2.5">Target entity</th>
                      <th className="py-2.5">Entity identifier ID</th>
                      <th className="py-2.5 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {db.auditLogs.map((log: AuditLog) => (
                      <tr key={log.id} className="hover:bg-slate-50 text-slate-700">
                        <td className="py-3 font-semibold text-slate-900">{log.userName}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            log.action === 'OVERRIDE' ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3">{log.entityName}</td>
                        <td className="py-3 text-slate-500 truncate max-w-xs">{log.entityId}</td>
                        <td className="py-3 text-right text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 11: ELD WEBHOOK SIMULATORS */}
          {activeTab === 'simulators' && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Telematics & Webhook Event Simulator</h3>
                <p className="text-xs text-slate-500 mt-1">Submit mock requests to API layers to test PM calculations, fault logic, and anomalies detection.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Odometer Webhook */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <span className="font-bold text-indigo-600">ELD Odometer Sync Hook</span>
                  
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">Select Asset</label>
                    <select value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-medium">
                      <option value="">-- Choose Asset --</option>
                      {db.assets.map((a: Asset) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 font-bold block mb-1">New Odometer value (Miles)</label>
                    <input type="number" value={simOdometer} onChange={e => setSimOdometer(parseInt(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-medium" />
                  </div>

                  <button
                    onClick={runOdometerWebhook}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg text-white transition shadow-sm"
                  >
                    Send Odometer Sync Webhook
                  </button>
                </div>

                {/* DTC Fault Code */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <span className="font-bold text-amber-600">ELD J1939 Engine Fault Code Ingest</span>
                  
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">Diagnostic Trouble Code (DTC)</label>
                    <input type="text" value={simDtcCode} onChange={e => setSimDtcCode(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono" />
                  </div>

                  <div>
                    <label className="text-slate-500 font-bold block mb-1">Code Description</label>
                    <input type="text" value={simDtcDesc} onChange={e => setSimDtcDesc(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-medium" />
                  </div>

                  <button
                    onClick={runDtcWebhook}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-xs font-bold rounded-lg text-white transition shadow-sm"
                  >
                    Fire Check Engine Webhook
                  </button>
                </div>

                {/* Fuel Card Webhook */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <span className="font-bold text-indigo-600">Fuel Card Webhook (Comdata/WEX)</span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-500 font-bold block mb-1">Gallons</label>
                      <input type="number" value={simFuelGallons} onChange={e => setSimFuelGallons(parseInt(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-medium" />
                    </div>
                    <div>
                      <label className="text-slate-500 font-bold block mb-1">Cost ($)</label>
                      <input type="number" value={simFuelCost} onChange={e => setSimFuelCost(parseFloat(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-medium" />
                    </div>
                    <div>
                      <label className="text-slate-500 font-bold block mb-1">State</label>
                      <input type="text" value={simFuelState} onChange={e => setSimFuelState(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-medium" />
                    </div>
                  </div>

                  <button
                    onClick={runFuelWebhook}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg text-white transition shadow-sm"
                  >
                    Send Fuel Card webhook
                  </button>
                </div>

                {/* Toll Transponders Webhook */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <span className="font-bold text-emerald-600">Toll Transponders (Bestpass/PrePass)</span>
                  <p className="text-[10px] text-slate-500 font-medium">Injects a $18.50 toll transaction matched to the selected asset, appending to operating costs.</p>
                  
                  <button
                    onClick={runTollWebhook}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-lg text-white transition shadow-sm"
                  >
                    Send Toll Webhook
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── NEW MODULE TABS ─────────────────────────────────────── */}

          {/* FLEET MAP */}
          {activeTab === 'fleetmap' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <Map className="h-5 w-5 text-indigo-600" /> Fleet Map Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time asset telemetry, GPS tracking, and facility directory</p>
                </div>
                <span className="bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 px-3 py-1 rounded-full text-xs shadow-xs">
                  {db.assets.length} Assets Monitored
                </span>
              </div>
              <FleetMapModule
                assets={db.assets as Asset[]}
                places={(db as any).places as Place[]}
                isAdmin={['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role)}
                currentDriverId={currentUser.id}
              />
            </div>
          )}

          {/* DRIVER TRACKING (dedicated full tab) */}
          {activeTab === 'drivertracking' && (
            <div className="space-y-5">
              <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                    <Radio className="h-5 w-5 text-emerald-400" />
                    Live Driver Tracking
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Real-time GPS positions, route history, ETA, and tracking issue logs — powered by Supertruck AI</p>
                </div>
                <div className="flex items-center gap-3">
                  {stTenantId && stToken ? (
                    <span className="bg-emerald-900/50 text-emerald-400 font-bold border border-emerald-700 px-3 py-1 rounded-full text-xs">
                      ● Live API Connected
                    </span>
                  ) : (
                    <span className="bg-amber-900/50 text-amber-400 font-bold border border-amber-700 px-3 py-1 rounded-full text-xs">
                      ⚡ Demo Mode — Add API credentials in sidebar
                    </span>
                  )}
                </div>
              </div>
              <DriverTrackingMapModule
                isAdmin={['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role)}
                currentDriverId={currentUser.id}
              />
            </div>
          )}

          {/* ASSIGNMENTS */}
          {activeTab === 'assignments' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <Users className="h-5 w-5 text-indigo-600" /> Vehicle Assignments Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Driver-to-asset bindings, shift assignments, and vehicle handoff logs</p>
                </div>
                <span className="bg-green-50 text-green-700 font-bold border border-green-200 px-3 py-1 rounded-full text-xs shadow-xs">
                  Active Shift Control
                </span>
              </div>
              <AssignmentsModule
                assignments={(db as any).assignments as VehicleAssignment[]}
                assets={db.assets as Asset[]}
                users={db.users as DbUser[]}
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

          {/* TIRE READINGS */}
          {activeTab === 'tires' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <Layers className="h-5 w-5 text-indigo-600" /> Tire Health Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Per-axle PSI pressure checks, tread depth monitoring, and replacement alerts</p>
                </div>
                <span className="bg-amber-50 text-amber-700 font-bold border border-amber-200 px-3 py-1 rounded-full text-xs shadow-xs">
                  Tread & Axle Telematics
                </span>
              </div>
              <TiresModule
                tireReadings={(db as any).tireReadings as TireReading[]}
                assets={db.assets as Asset[]}
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

          {/* EXPENSE HISTORY */}
          {activeTab === 'expenses' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <CreditCard className="h-5 w-5 text-indigo-600" /> Expense History Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Per-asset TCO (Total Cost of Ownership), cost-per-mile, and operating spend</p>
                </div>
                <span className="bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 px-3 py-1 rounded-full text-xs shadow-xs">
                  TCO Financial Matrix
                </span>
              </div>
              <ExpensesModule
                expenseRecords={(db as any).expenseRecords as ExpenseRecord[]}
                assets={db.assets as Asset[]}
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

          {/* REPLACEMENT ANALYSIS */}
          {activeTab === 'replacement' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <BarChart3 className="h-5 w-5 text-indigo-600" /> Replacement Analysis Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Capital replacement forecasting & buy vs. repair decision matrix</p>
                </div>
                <span className="bg-violet-50 text-violet-700 font-bold border border-violet-200 px-3 py-1 rounded-full text-xs shadow-xs">
                  Lifecycle Intelligence
                </span>
              </div>
              <ReplacementModule
                replacementAnalysis={(db as any).replacementAnalysis as ReplacementAnalysis[]}
                assets={db.assets as Asset[]}
              />
            </div>
          )}

          {/* ISSUES */}
          {activeTab === 'issues' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-indigo-600" /> Issues Management Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Fault ticket triage, driver reports, and issue lifecycle tracking</p>
                </div>
                <span className="bg-amber-50 text-amber-700 font-bold border border-amber-200 px-3 py-1 rounded-full text-xs shadow-xs">
                  {(db?.issues as Issue[] || []).filter((i) => i.status !== 'RESOLVED').length || 0} Open Tickets
                </span>
              </div>
              <IssuesModule
                issues={(db as any).issues as Issue[]}
                assets={db.assets as Asset[]}
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

          {/* CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <Users className="h-5 w-5 text-indigo-600" /> Contacts & Directory Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Driver profiles, CDL/medical license expiration, and technician directory</p>
                </div>
                <span className="bg-slate-100 text-slate-700 font-bold border border-slate-200 px-3 py-1 rounded-full text-xs shadow-xs">
                  Team Roster
                </span>
              </div>
              <ContactsModule
                contacts={(db as any).contacts as Contact[]}
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

          {/* PARTS & INVENTORY */}
          {activeTab === 'parts' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <Package className="h-5 w-5 text-indigo-600" /> Parts & Inventory Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Spare parts catalog, stock levels, reorder thresholds, and inventory logs</p>
                </div>
                <span className="bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 px-3 py-1 rounded-full text-xs shadow-xs">
                  Inventory Vault
                </span>
              </div>
              <PartsModule
                parts={(db as any).parts as Part[]}
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

          {/* PLACES */}
          {activeTab === 'places' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <Building2 className="h-5 w-5 text-indigo-600" /> Places Directory Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Depots, fuel stops, repair shops, customer sites, and DOT inspection stations</p>
                </div>
                <span className="bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 px-3 py-1 rounded-full text-xs shadow-xs">
                  {(db?.places as Place[] || []).length || 0} Saved Locations
                </span>
              </div>
              <PlacesModule
                places={(db as any).places as Place[]}
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

          {/* DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <FileBox className="h-5 w-5 text-indigo-600" /> Documents Vault Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Centralized vehicle title, registration, insurance, and cab-card document vault</p>
                </div>
                <span className="bg-slate-100 text-slate-700 font-bold border border-slate-200 px-3 py-1 rounded-full text-xs shadow-xs">
                  Vault System
                </span>
              </div>
              <DocumentsModule
                documents={(db as any).documents as FleetDocument[]}
                assets={db.assets as Asset[]}
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

          {/* WARRANTIES */}
          {activeTab === 'warranties' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <Shield className="h-5 w-5 text-indigo-600" /> Warranties Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">OEM powertrain, component warranty claims, and coverage expiration timelines</p>
                </div>
                <span className="bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 px-3 py-1 rounded-full text-xs shadow-xs">
                  OEM Coverage
                </span>
              </div>
              <WarrantiesModule
                warranties={(db as any).warranties as Warranty[]}
                assets={db.assets as Asset[]}
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

          {/* REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <BarChart3 className="h-5 w-5 text-indigo-600" /> Fleet Reports & Analytics Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Pre-built executive reports, CSV data exports, and IFTA audit sheets</p>
                </div>
                <span className="bg-green-50 text-green-700 font-bold border border-green-200 px-3 py-1 rounded-full text-xs shadow-xs">
                  Export Engine
                </span>
              </div>
              <ReportsModule
                assets={db.assets as Asset[]}
                fuelLogs={db.fuelLogs as FuelLog[]}
                workOrders={db.workOrders as WorkOrder[]}
                inspections={db.inspections as any[]}
                pmSchedules={db.pmSchedules as PMSchedule[]}
                dotInspections={db.dotInspections as DOTInspection[]}
                parts={(db as any).parts as Part[]}
              />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
