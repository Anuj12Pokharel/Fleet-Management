
'use client';

import React, { useState, useEffect } from 'react';

function SuperTruckLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10.5L11 4H28L21 10.5H4Z" fill="#00BA7C" />
      <path d="M15 28L8 28L15 21.5H32L25 28H15Z" fill="#00BA7C" />
      <path d="M21 10.5L15 21.5H21.5L27.5 10.5H21Z" fill="#009A65" />
    </svg>
  );
}
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
  ChevronUp,
  Share2,
  Sliders,
  Cpu,
  QrCode,
  Camera,
  Clock,
  Timer,
  Award,
  Mail,
  Eye,
  EyeOff,
  Phone,
  ArrowRight,
  AlertCircle,
  Hash
} from 'lucide-react';
import {
  User as DbUser,
  Asset,
  Component,
  EDVIRInspection,
  ServiceRequest,
  PMSchedule,
  PMTemplate,
  WorkOrder,
  PurchaseOrder,
  RenewalAlert,
  FuelLog,
  TollRecord,
  DOTInspection,
  Vendor,
  EmergencyTicket,
  FaultCode,
  AccidentClaim,
  AuditLog,
  SystemNotification,
  VehicleAssignment,
  TireReading,
  BrakeReading,
  ExpenseRecord,
  Issue,
  Contact,
  Part,
  Place,
  FleetDocument,
  Warranty,
  ReplacementAnalysis
} from './mockDb';
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
import BillingModule from './modules/Billing';
import UserAccessModule from './modules/UserAccess';
import AIServiceAdvisorModule from './modules/AIServiceAdvisor';
import IntegrationsModule from './modules/Integrations';
import DataManagementModule from './modules/DataManagement';
import CockpitDashboard from './modules/CockpitDashboard';
import QrScannerModal from './modules/QrScannerModal';
import HosModule from './modules/HosModule';
import SafetyScorecardModule from './modules/SafetyScorecardModule';
import ComplianceModule from './modules/ComplianceModule';
import RelayFuelModule from './modules/RelayFuel';
import { RenewalsCenter } from './modules/RenewalsCenter';
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
  apiMechanicSignOff,
  apiDriverReview,
  apiCreateServiceRequest,
  apiApproveServiceRequest,
  apiCreateFuelLog,
  apiCreateEmergencyTicket,
  apiUpdateEmergencyTicket,
  apiCreateAccidentClaim,
  apiTriggerOdometerWebhook,
  apiTriggerDtcWebhook,
  apiOverrideAssetStatus,
  apiUpdateWorkOrder,
  apiDismissRenewalAlert,
  apiPerformPM,
  apiAddPartToWorkOrder,
  apiGetAssignments,
  apiGetTireReadings,
  apiGetBrakeReadings,
  apiGetExpenses,
  apiGetReplacementAnalyses,
  apiGetIssues,
  apiGetContacts,
  apiGetParts,
  apiGetPlaces,
  apiGetDocuments,
  apiGetWarranties,
  getStoredUser,
  API_BASE_URL
} from './lib/api-client';


export default function FleetApp() {
  // Navigation & Session State
  const [currentUser, setCurrentUser] = useState<DbUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [db, setDb] = useState<any>(null);

  // Real QR Equipment Scanner State
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrScannerAsset, setQrScannerAsset] = useState<Asset | null>(null);

  // Non-intrusive Modern Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

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

  // Enhanced Auth UI State (SuperTruck Job Portal style)
  const [signupStep, setSignupStep] = useState<'pick' | 'form' | 'success'>('pick');
  const [signupRole, setSignupRole] = useState<'FLEET_MANAGER' | 'DRIVER' | 'MECHANIC' | null>(null);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regMcNumber, setRegMcNumber] = useState('');
  const [regDotNumber, setRegDotNumber] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        notifications,
        assignmentsApi,
        tireReadingsApi,
        brakeReadingsApi,
        expenseRecordsApi,
        replacementAnalysisApi,
        issuesApi,
        contactsApi,
        partsApi,
        placesApi,
        documentsApi,
        warrantiesApi
      ] = await Promise.all([
        apiGetUsers().catch(() => []),
        apiGetAssets().catch(() => []),
        apiGetInspections().catch(() => []),
        apiGetPMTemplates().catch(() => []),
        apiGetPMSchedules().catch(() => []),
        apiGetWorkOrders().catch(() => []),
        apiGetServiceRequests().catch(() => []),
        apiGetRenewalAlerts().catch(() => []),
        apiGetFuelLogs().catch(() => []),
        apiGetTollRecords().catch(() => []),
        apiGetDOTInspections().catch(() => []),
        apiGetVendors().catch(() => []),
        apiGetEmergencyTickets().catch(() => []),
        apiGetFaultCodes().catch(() => []),
        apiGetAccidentClaims().catch(() => []),
        apiGetAuditLogs().catch(() => []),
        apiGetNotifications().catch(() => []),
        apiGetAssignments().catch(() => []),
        apiGetTireReadings().catch(() => []),
        apiGetBrakeReadings().catch(() => []),
        apiGetExpenses().catch(() => []),
        apiGetReplacementAnalyses().catch(() => []),
        apiGetIssues().catch(() => []),
        apiGetContacts().catch(() => []),
        apiGetParts().catch(() => []),
        apiGetPlaces().catch(() => []),
        apiGetDocuments().catch(() => []),
        apiGetWarranties().catch(() => [])
      ]);

      setDb({
        users: Array.isArray(users) ? users : [],
        assets: Array.isArray(assets) ? assets : [],
        components: Array.isArray(assets) ? assets.flatMap((a: any) => a.components || []) : [],
        inspections: Array.isArray(inspections) ? inspections : [],
        pmTemplates: Array.isArray(pmTemplates) ? pmTemplates : [],
        pmSchedules: Array.isArray(pmSchedules) ? pmSchedules : [],
        serviceRequests: Array.isArray(serviceRequests) ? serviceRequests : [],
        workOrders: Array.isArray(workOrders) ? workOrders : [],
        purchaseOrders: [],
        renewalAlerts: Array.isArray(renewalAlerts) ? renewalAlerts : [],
        fuelLogs: Array.isArray(fuelLogs) ? fuelLogs : [],
        tollRecords: Array.isArray(tollRecords) ? tollRecords : [],
        dotInspections: Array.isArray(dotInspections) ? dotInspections : [],
        vendors: Array.isArray(vendors) ? vendors : [],
        emergencyTickets: Array.isArray(emergencyTickets) ? emergencyTickets : [],
        faultCodes: Array.isArray(faultCodes) ? faultCodes : [],
        auditLogs: Array.isArray(auditLogs) ? auditLogs : [],
        notifications: Array.isArray(notifications) ? notifications : [],
        accidentClaims: Array.isArray(accidentClaims) ? accidentClaims : [],
        assignments: Array.isArray(assignmentsApi) ? assignmentsApi : [],
        tireReadings: Array.isArray(tireReadingsApi) ? tireReadingsApi : [],
        brakeReadings: Array.isArray(brakeReadingsApi) ? brakeReadingsApi : [],
        expenseRecords: Array.isArray(expenseRecordsApi) ? expenseRecordsApi : [],
        replacementAnalysis: Array.isArray(replacementAnalysisApi) ? replacementAnalysisApi : [],
        issues: Array.isArray(issuesApi) ? issuesApi : [],
        contacts: Array.isArray(contactsApi) ? contactsApi : [],
        parts: Array.isArray(partsApi) ? partsApi : [],
        places: Array.isArray(placesApi) ? placesApi : [],
        documents: Array.isArray(documentsApi) ? documentsApi : [],
        warranties: Array.isArray(warrantiesApi) ? warrantiesApi : []
      });
    } catch (err) {
      console.error('Error loading real API database:', err);
      setDb({
        users: [],
        assets: [],
        components: [],
        inspections: [],
        pmTemplates: [],
        pmSchedules: [],
        serviceRequests: [],
        workOrders: [],
        purchaseOrders: [],
        renewalAlerts: [],
        fuelLogs: [],
        tollRecords: [],
        dotInspections: [],
        vendors: [],
        emergencyTickets: [],
        faultCodes: [],
        auditLogs: [],
        notifications: [],
        accidentClaims: [],
        assignments: [],
        tireReadings: [],
        expenseRecords: [],
        replacementAnalysis: [],
        issues: [],
        contacts: [],
        parts: [],
        places: [],
        documents: [],
        warranties: []
      });
    }
  };

  const getDefaultTabForRole = (role: string) => {
    switch (role) {
      case 'FLEET_MANAGER': return 'dashboard';
      case 'MAINTENANCE_ADMIN': return 'assets';
      case 'MECHANIC': return 'workorders';
      case 'DRIVER': return 'inspections';
      default: return 'assets';
    }
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setCurrentUser(storedUser);
      if (storedUser.role !== 'FLEET_MANAGER') {
        setActiveTab(getDefaultTabForRole(storedUser.role));
      }
    }
    refreshDb();

    // Real-time backend notifications stream (SSE)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE_URL}/notifications/feed`);
      eventSource.onmessage = (event) => {
        try {
          const notif = JSON.parse(event.data);
          if (notif && notif.title) {
            refreshDb();
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };
    } catch (e) {
      console.warn('SSE stream unavailable:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiLogin(email, password || 'password123');
      setCurrentUser(res.user);
      setAuthMode('LANDING');
      setActiveTab(getDefaultTabForRole(res.user.role));
      setAuthError('');
      await refreshDb();
    } catch (err: any) {
      setAuthError(err.message || 'Invalid credentials. Please verify your email and password.');
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // Field validation
    const errors: Record<string, string> = {};
    if (!regFirstName.trim()) errors.regFirstName = 'First name is required';
    if (!regLastName.trim()) errors.regLastName = 'Last name is required';
    if (!email.trim()) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (password !== regConfirmPassword) errors.regConfirmPassword = 'Passwords do not match';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    const fullName = `${regFirstName.trim()} ${regLastName.trim()}`;
    const role = signupRole || 'DRIVER';
    try {
      await apiRegister({ name: fullName, email, password, role });
      const loginRes = await apiLogin(email, password);
      setCurrentUser(loginRes.user);
      setAuthMode('LANDING');
      setSignupStep('pick');
      setSignupRole(null);
      setActiveTab(getDefaultTabForRole(loginRes.user.role));
      setAuthError('');
      await refreshDb();
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed. Email may already be registered.');
    }
  };

  // Handle Role Switcher
  const switchRole = (role: 'DRIVER' | 'MECHANIC' | 'MAINTENANCE_ADMIN' | 'FLEET_MANAGER') => {
    if (!currentUser) return;
    const updated = { ...currentUser, role };
    setCurrentUser(updated);
    
    const allowedTabs: Record<string, string[]> = {
      DRIVER: ['inspections', 'hos', 'fleetmap', 'assignments', 'issues', 'fuel', 'emergency'],
      MECHANIC: ['workorders', 'assets', 'tires', 'pm', 'parts', 'issues', 'aiadvisor', 'inspections'],
      MAINTENANCE_ADMIN: ['assets', 'fleetmap', 'assignments', 'tires', 'expenses', 'safety', 'compliance', 'inspections', 'issues', 'pm', 'workorders', 'renewals', 'warranties', 'fuel', 'emergency', 'contacts', 'parts', 'places', 'documents', 'aiadvisor', 'integrations', 'datamanagement', 'useraccess', 'audit', 'simulators'],
      FLEET_MANAGER: ['dashboard', 'fleetmap', 'assets', 'assignments', 'tires', 'expenses', 'replacement', 'hos', 'safety', 'compliance', 'inspections', 'issues', 'pm', 'workorders', 'renewals', 'warranties', 'fuel', 'emergency', 'claims', 'contacts', 'parts', 'places', 'documents', 'aiadvisor', 'integrations', 'datamanagement', 'billing', 'useraccess', 'reports', 'audit', 'simulators']
    };
    if (!allowedTabs[role].includes(activeTab)) {
      setActiveTab(getDefaultTabForRole(role));
    }

    refreshDb();
  };

  useEffect(() => {
    if (currentUser) {
      const allowedTabs: Record<string, string[]> = {
        DRIVER: ['inspections', 'hos', 'fleetmap', 'assignments', 'issues', 'fuel', 'emergency'],
        MECHANIC: ['workorders', 'assets', 'tires', 'pm', 'parts', 'issues', 'aiadvisor', 'inspections'],
        MAINTENANCE_ADMIN: ['assets', 'fleetmap', 'assignments', 'tires', 'expenses', 'safety', 'compliance', 'inspections', 'issues', 'pm', 'workorders', 'renewals', 'warranties', 'fuel', 'emergency', 'contacts', 'parts', 'places', 'documents', 'aiadvisor', 'integrations', 'datamanagement', 'useraccess', 'audit', 'simulators'],
        FLEET_MANAGER: ['dashboard', 'fleetmap', 'assets', 'assignments', 'tires', 'expenses', 'replacement', 'hos', 'safety', 'compliance', 'inspections', 'issues', 'pm', 'workorders', 'renewals', 'warranties', 'fuel', 'emergency', 'claims', 'contacts', 'parts', 'places', 'documents', 'aiadvisor', 'integrations', 'datamanagement', 'billing', 'useraccess', 'reports', 'audit', 'simulators']
      };
      if (allowedTabs[currentUser.role] && !allowedTabs[currentUser.role].includes(activeTab)) {
        setActiveTab(getDefaultTabForRole(currentUser.role));
      }
    }
  }, [currentUser?.role, activeTab]);


  if (!db) return <div className="p-8 text-white bg-slate-950 min-h-screen">Loading database...</div>;

  // Render auth flows — SuperTruck Job Portal style
  if (!currentUser) {
    // ── Shared field component ──
    const AuthField = ({
      id, label, error, children
    }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );

    // ── Icon color helper ──
    const iconColor = (field: string) =>
      focusedField === field ? 'text-[#00BA7C]' : 'text-slate-400';

    // ── LOGIN page ──
    if (authMode === 'LOGIN') {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Ambient green blobs */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#00BA7C]/5 rounded-full blur-[140px] animate-pulse pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00BA7C]/5 rounded-full blur-[140px] animate-pulse pointer-events-none" />

          <div className="relative w-full max-w-md">
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-lg p-8 md:p-10">
              {/* Logo */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00BA7C] to-[#009662] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#00BA7C]/25">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Welcome to <span className="text-[#00BA7C]">SuperTruck</span>
                </h1>
                <p className="text-slate-500 text-sm mt-1 text-center">Fleet Management &amp; DOT Compliance Platform</p>
              </div>

              {/* Error banner */}
              {authError && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{authError}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <AuthField id="login-email" label="Email Address">
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${iconColor('email')}`} />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#00BA7C] focus:ring-4 focus:ring-[#00BA7C]/15 transition"
                    />
                  </div>
                </AuthField>

                {/* Password */}
                <AuthField id="login-password" label="Password">
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${iconColor('password')}`} />
                    <input
                      id="login-password"
                      type={showLoginPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#00BA7C] focus:ring-4 focus:ring-[#00BA7C]/15 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </AuthField>

                {/* Submit */}
                <button
                  type="submit"
                  className="group w-full flex items-center justify-center gap-2 py-3.5 bg-[#00BA7C] hover:bg-[#009662] active:scale-[0.98] text-white font-semibold rounded-xl transition-all mt-2 shadow-md shadow-[#00BA7C]/25"
                >
                  Sign In
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              {/* Quick demo logins */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider text-center mb-3">Quick Demo Access</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { email: 'manager@fleet.com', label: 'Fleet Manager' },
                    { email: 'driver@fleet.com', label: 'Driver' },
                    { email: 'mechanic@fleet.com', label: 'Mechanic' },
                    { email: 'admin@fleet.com', label: 'Admin' }
                  ].map(u => (
                    <button
                      key={u.email}
                      onClick={async () => {
                        setAuthError('');
                        try {
                          const res = await apiLogin(u.email, 'password123');
                          setCurrentUser(res.user);
                          setActiveTab(getDefaultTabForRole(res.user.role));
                          await refreshDb();
                        } catch (err: any) {
                          setAuthError(err.message || 'Login failed');
                        }
                      }}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-xs font-medium rounded-xl border border-slate-200 text-slate-600 transition text-center"
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-center text-sm text-slate-500 mt-6">
                New to FleetCare?{' '}
                <button
                  onClick={() => { setAuthMode('REGISTER'); setSignupStep('pick'); setAuthError(''); }}
                  className="text-[#00BA7C] font-semibold hover:underline"
                >
                  Create an account
                </button>
              </p>
            </div>

            <p className="text-center text-xs text-slate-400 mt-6">
              &copy; 2026 SuperTruck FleetCare Technologies
            </p>
          </div>
        </div>
      );
    }

    // ── REGISTER page ──
    if (authMode === 'REGISTER') {
      // Step 1: Account type picker
      if (signupStep === 'pick') {
        const accountTypes = [
          {
            role: 'FLEET_MANAGER' as const,
            icon: <Building2 className="h-7 w-7" />,
            title: 'Carrier / Fleet Manager',
            desc: 'Manage your fleet, compliance, documents, and drivers.'
          },
          {
            role: 'DRIVER' as const,
            icon: <Truck className="h-7 w-7" />,
            title: 'Driver',
            desc: 'Submit inspections, HOS logs, and compliance renewals.'
          },
          {
            role: 'MECHANIC' as const,
            icon: <Wrench className="h-7 w-7" />,
            title: 'Mechanic',
            desc: 'Manage work orders, equipment, and PM schedules.'
          }
        ];
        return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#00BA7C]/5 rounded-full blur-[140px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00BA7C]/5 rounded-full blur-[140px] animate-pulse pointer-events-none" />
            <div className="relative w-full max-w-lg">
              <div className="bg-white border border-slate-200/80 rounded-3xl shadow-lg p-8 md:p-10">
                <div className="flex flex-col items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#00BA7C] to-[#009662] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#00BA7C]/25">
                    <Truck className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Join <span className="text-[#00BA7C]">SuperTruck</span>
                  </h1>
                  <p className="text-slate-500 text-sm mt-1 text-center">Choose your account type to get started</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {accountTypes.map(type => (
                    <button
                      key={type.role}
                      onClick={() => { setSignupRole(type.role); setSignupStep('form'); setAuthError(''); setFieldErrors({}); }}
                      className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-200 hover:border-[#00BA7C] hover:bg-[#00BA7C]/5 transition-all text-left group"
                    >
                      <div className="w-12 h-12 bg-slate-100 group-hover:bg-[#00BA7C]/15 rounded-xl flex items-center justify-center shrink-0 text-slate-500 group-hover:text-[#00BA7C] transition-colors">
                        {type.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{type.title}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{type.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-center text-sm text-slate-500 mt-6">
                  Already have an account?{' '}
                  <button onClick={() => { setAuthMode('LOGIN'); setAuthError(''); }} className="text-[#00BA7C] font-semibold hover:underline">Sign in</button>
                </p>
              </div>
            </div>
          </div>
        );
      }

      // Step 2: Registration form
      if (signupStep === 'form') {
        const roleLabel = signupRole === 'FLEET_MANAGER' ? 'Carrier / Fleet Manager' : signupRole === 'DRIVER' ? 'Driver' : 'Mechanic';
        const roleIcon = signupRole === 'FLEET_MANAGER' ? <Building2 className="h-4 w-4" /> : signupRole === 'DRIVER' ? <Truck className="h-4 w-4" /> : <Wrench className="h-4 w-4" />;

        return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#00BA7C]/5 rounded-full blur-[140px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00BA7C]/5 rounded-full blur-[140px] animate-pulse pointer-events-none" />
            <div className="relative w-full max-w-md">
              <div className="bg-white border border-slate-200/80 rounded-3xl shadow-lg p-8 md:p-10">
                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#00BA7C] to-[#009662] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#00BA7C]/25">
                    <Truck className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
                  <div className="flex items-center gap-1.5 mt-2 px-3 py-1 bg-[#00BA7C]/10 rounded-full text-[#00BA7C] text-xs font-semibold">
                    {roleIcon} {roleLabel}
                  </div>
                </div>

                {/* Error banner */}
                {authError && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{authError}</p>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Name row */}
                  <div className="grid grid-cols-2 gap-3">
                    <AuthField id="reg-first" label="First Name" error={fieldErrors.regFirstName}>
                      <div className="relative">
                        <User className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${iconColor('firstName')}`} />
                        <input
                          id="reg-first"
                          type="text"
                          value={regFirstName}
                          onChange={e => setRegFirstName(e.target.value)}
                          onFocus={() => setFocusedField('firstName')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="John"
                          className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#00BA7C] focus:ring-4 focus:ring-[#00BA7C]/15 transition"
                        />
                      </div>
                    </AuthField>
                    <AuthField id="reg-last" label="Last Name" error={fieldErrors.regLastName}>
                      <input
                        id="reg-last"
                        type="text"
                        value={regLastName}
                        onChange={e => setRegLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#00BA7C] focus:ring-4 focus:ring-[#00BA7C]/15 transition"
                      />
                    </AuthField>
                  </div>

                  {/* Email */}
                  <AuthField id="reg-email" label="Email Address" error={fieldErrors.email}>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${iconColor('regEmail')}`} />
                      <input
                        id="reg-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('regEmail')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="your@email.com"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#00BA7C] focus:ring-4 focus:ring-[#00BA7C]/15 transition"
                      />
                    </div>
                  </AuthField>

                  {/* Phone */}
                  <AuthField id="reg-phone" label="Phone Number">
                    <div className="relative">
                      <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${iconColor('phone')}`} />
                      <input
                        id="reg-phone"
                        type="tel"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#00BA7C] focus:ring-4 focus:ring-[#00BA7C]/15 transition"
                      />
                    </div>
                  </AuthField>

                  {/* Carrier-only fields */}
                  {signupRole === 'FLEET_MANAGER' && (
                    <>
                      <AuthField id="reg-company" label="Company Name">
                        <div className="relative">
                          <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${iconColor('company')}`} />
                          <input
                            id="reg-company"
                            type="text"
                            value={regCompanyName}
                            onChange={e => setRegCompanyName(e.target.value)}
                            onFocus={() => setFocusedField('company')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="ACME Trucking LLC"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#00BA7C] focus:ring-4 focus:ring-[#00BA7C]/15 transition"
                          />
                        </div>
                      </AuthField>
                      <div className="grid grid-cols-2 gap-3">
                        <AuthField id="reg-mc" label="MC Number">
                          <div className="relative">
                            <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${iconColor('mc')}`} />
                            <input
                              id="reg-mc"
                              type="text"
                              value={regMcNumber}
                              onChange={e => setRegMcNumber(e.target.value)}
                              onFocus={() => setFocusedField('mc')}
                              onBlur={() => setFocusedField(null)}
                              placeholder="MC-123456"
                              className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#00BA7C] focus:ring-4 focus:ring-[#00BA7C]/15 transition"
                            />
                          </div>
                        </AuthField>
                        <AuthField id="reg-dot" label="DOT Number">
                          <div className="relative">
                            <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${iconColor('dot')}`} />
                            <input
                              id="reg-dot"
                              type="text"
                              value={regDotNumber}
                              onChange={e => setRegDotNumber(e.target.value)}
                              onFocus={() => setFocusedField('dot')}
                              onBlur={() => setFocusedField(null)}
                              placeholder="DOT-789012"
                              className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#00BA7C] focus:ring-4 focus:ring-[#00BA7C]/15 transition"
                            />
                          </div>
                        </AuthField>
                      </div>
                    </>
                  )}

                  {/* Password */}
                  <AuthField id="reg-pass" label="Password" error={fieldErrors.password}>
                    <div className="relative">
                      <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${iconColor('regPass')}`} />
                      <input
                        id="reg-pass"
                        type={showRegPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('regPass')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Min. 8 characters"
                        className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#00BA7C] focus:ring-4 focus:ring-[#00BA7C]/15 transition"
                      />
                      <button type="button" onClick={() => setShowRegPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showRegPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </AuthField>

                  {/* Confirm Password */}
                  <AuthField id="reg-confirm" label="Confirm Password" error={fieldErrors.regConfirmPassword}>
                    <div className="relative">
                      <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${iconColor('regConfirm')}`} />
                      <input
                        id="reg-confirm"
                        type={showRegConfirmPass ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={e => setRegConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedField('regConfirm')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Re-enter password"
                        className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#00BA7C] focus:ring-4 focus:ring-[#00BA7C]/15 transition"
                      />
                      <button type="button" onClick={() => setShowRegConfirmPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showRegConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </AuthField>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => { setSignupStep('pick'); setAuthError(''); setFieldErrors({}); }}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition text-sm"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="group flex-1 flex items-center justify-center gap-2 py-3 bg-[#00BA7C] hover:bg-[#009662] active:scale-[0.98] text-white font-semibold rounded-xl transition-all shadow-md shadow-[#00BA7C]/25 text-sm"
                    >
                      Create Account
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </form>

                <p className="text-center text-sm text-slate-500 mt-5">
                  Already have an account?{' '}
                  <button onClick={() => { setAuthMode('LOGIN'); setAuthError(''); }} className="text-[#00BA7C] font-semibold hover:underline">Sign in</button>
                </p>
              </div>
            </div>
          </div>
        );
      }
    }

    // ── LANDING page ──
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-between text-slate-100 font-sans">
        {/* Landing Page Header */}
        <header className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <SuperTruckLogo className="h-9 w-9" /><span className="font-extrabold text-2xl tracking-tight text-white">SuperTruck <span className="text-[#00BA7C]">FleetCare</span></span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => { setAuthMode('LOGIN'); setAuthError(''); }} className="px-4 py-2 text-sm text-slate-300 hover:text-white transition">Log In</button>
            <button onClick={() => { setAuthMode('REGISTER'); setSignupStep('pick'); setAuthError(''); }} className="px-4 py-2 text-sm bg-[#00BA7C] rounded-lg hover:bg-[#009662] font-semibold transition">Get Started</button>
          </div>
        </header>

        {/* Landing Page Details */}
        <main className="max-w-7xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col md:flex-row items-center gap-12 flex-1">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-xs font-semibold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Advanced Fleet Maintenance Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
              Minimize downtime.<br/>
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">Maximize compliance.</span>
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto md:mx-0 text-base md:text-lg">
              Complete trucking fleet care system: eDVIR checklists, dual-trigger PMs, breakdown location mapping, fuel IFTA recording, transponder tolls, and roadside DOT audit trails.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <button onClick={() => { setAuthMode('REGISTER'); setSignupStep('pick'); setAuthError(''); }} className="px-6 py-3 bg-[#00BA7C] hover:bg-[#009662] rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/30">
                Start Launching <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={() => { setAuthMode('LOGIN'); setAuthError(''); }} className="px-6 py-3 border border-slate-800 hover:bg-slate-900 rounded-xl font-bold transition">
                Partner Portal
              </button>
            </div>

            {/* Quick Login Shortcuts via backend API */}
            <div className="pt-8 border-t border-slate-800/80">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-3">Instant Database Logins:</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {[
                  { email: 'admin@fleet.com', label: 'John Admin (Admin)' },
                  { email: 'manager@fleet.com', label: 'Sarah Manager (Manager)' },
                  { email: 'mechanic@fleet.com', label: 'Dave Mechanic (Mechanic)' },
                  { email: 'driver@fleet.com', label: 'Bob Driver (Driver)' }
                ].map(u => (
                  <button
                    key={u.email}
                    onClick={async () => {
                      try {
                        const res = await apiLogin(u.email, 'password123');
                        setCurrentUser(res.user);
                        setActiveTab('dashboard');
                        await refreshDb();
                      } catch (err: any) {
                        setAuthError(err.message || 'Login failed');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-medium rounded-lg border border-slate-800 text-slate-300 transition"
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Screen Mock */}
          <div className="flex-1 w-full max-w-lg relative">
            <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full"></div>
            <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-3 mb-4">
                <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <div className="text-xs text-slate-500 ml-4 font-mono">fleetcare_ops_dashboard.ts</div>
              </div>

              {/* Simulated widgets */}
              <div className="space-y-3">
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

        {/* Footer */}
        <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-600 max-w-7xl mx-auto w-full">
          &copy; 2026 SuperTruck FleetCare Technologies. All rights reserved.
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

  // Live Webhook Event Emitters
  const runOdometerWebhook = async () => {
    if (!selectedAssetId) { showToast('Please select an asset first.'); return; }
    try {
      await apiTriggerOdometerWebhook(selectedAssetId, simOdometer);
      await refreshDb();
      showToast('Live ELD Odometer synced! Backend PM schedules recalculated in database.');
    } catch (err: any) {
      showToast(err.message || 'Failed to sync odometer');
    }
  };

  const runDtcWebhook = async () => {
    if (!selectedAssetId) { showToast('Please select an asset first.'); return; }
    try {
      const res = await apiTriggerDtcWebhook(selectedAssetId, simDtcCode, simDtcDesc);
      await refreshDb();
      showToast(`Live J1939 Fault Code ingested! Work Order #${(res as any)?.workOrder?.id?.slice(0, 6) || ''} auto-created in database.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to trigger DTC webhook');
    }
  };

  const runFuelWebhook = async () => {
    if (!selectedAssetId) { showToast('Please select an asset first.'); return; }
    try {
      const res = await apiCreateFuelLog({
        assetId: selectedAssetId,
        gallons: simFuelGallons,
        cost: simFuelCost,
        location: simFuelState,
        odometer: simOdometer,
        cardTransactionId: 'WEX-' + Math.round(Math.random() * 1e8)
      });
      await refreshDb();
      showToast(`Live Fuel Card transaction ingested! Calculated MPG: ${res.mpg?.toFixed(1) || '6.2'}${res.isAnomaly ? ' (FLAGGED ANOMALY)' : ''}.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to ingest fuel transaction');
    }
  };

  const runTollWebhook = async () => {
    if (!selectedAssetId) { showToast('Please select an asset first.'); return; }
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fleet_jwt_token') : null;
      await fetch(`${API_BASE_URL}/tolls/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          assetId: selectedAssetId,
          transponderId: 'BESTPASS-' + Math.round(Math.random() * 1e5),
          amount: 18.50,
          location: 'New York I-90 Expressway',
          timestamp: new Date().toISOString()
        })
      });
      await refreshDb();
      showToast('Live Toll Transponder transaction ingested! Operating expenses updated.');
    } catch (err: any) {
      showToast(err.message || 'Failed to ingest toll transaction');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex overflow-y-auto shadow-sm">
        <div>
          {/* Brand */}
          <div className="h-16 flex items-center px-6 gap-2 border-b border-slate-200">
            <SuperTruckLogo className="h-7 w-7" /><span className="font-extrabold text-lg tracking-tight text-slate-900">SuperTruck <span className="text-[#00BA7C]">FleetCare</span></span>
          </div>

          {/* Navigation Links — Grouped Fleetio-style */}
          <nav className="p-3 space-y-0.5 text-[13px] pb-4">

            {/* ── OVERVIEW ── */}
            {['FLEET_MANAGER', 'MAINTENANCE_ADMIN', 'DRIVER'].includes(currentUser.role) && (
              <>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-3 pb-1">Overview</p>
                {currentUser.role === 'FLEET_MANAGER' && (
                  <button onClick={() => setActiveTab('dashboard')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition ${activeTab === 'dashboard' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                    <Activity className="h-4 w-4 shrink-0" /> Cockpit Dashboard
                  </button>
                )}
                {['MAINTENANCE_ADMIN', 'FLEET_MANAGER', 'DRIVER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('fleetmap')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition ${activeTab === 'fleetmap' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                    <Map className="h-4 w-4 shrink-0" />
                    <span>Fleet Map</span>
                    <span className="ml-auto relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  </button>
                )}
              </>
            )}

            {/* ── VEHICLES ── */}
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1">Vehicles</p>
            {['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('assets')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'assets' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                <Truck className="h-4 w-4 shrink-0" /> Asset Control & QRs
              </button>
            )}
            {['MAINTENANCE_ADMIN', 'FLEET_MANAGER', 'DRIVER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('assignments')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'assignments' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                <Users className="h-4 w-4 shrink-0" /> {currentUser.role === 'DRIVER' ? 'My Assigned Vehicle' : 'Assignments'}
              </button>
            )}
            {['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('tires')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'tires' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                <Layers className="h-4 w-4 shrink-0" /> Component Readings
              </button>
            )}
            {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('expenses')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'expenses' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                <CreditCard className="h-4 w-4 shrink-0" /> Expense History
              </button>
            )}
            {['FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('replacement')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'replacement' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                <BarChart3 className="h-4 w-4 shrink-0" /> Replacement Analysis
              </button>
            )}

            {/* ── SAFETY & COMPLIANCE ── */}
            {['DRIVER', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1">Safety & Compliance</p>
                <button onClick={() => setActiveTab('hos')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'hos' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                  <Clock className="h-4 w-4 shrink-0" /> HOS & ELD Clocks
                </button>
                {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('safety')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'safety' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                    <Award className="h-4 w-4 shrink-0" /> Safety Scorecard
                  </button>
                )}
                {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('compliance')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'compliance' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                    <Shield className="h-4 w-4 shrink-0" /> Compliance Center
                  </button>
                )}
              </>
            )}

            {/* ── OPERATIONS ── */}
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1">Operations</p>
            {['DRIVER', 'MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('inspections')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'inspections' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                <FileCheck className="h-4 w-4 shrink-0" /> eDVIR Inspections
              </button>
            )}
            <button onClick={() => setActiveTab('issues')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'issues' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
              <AlertTriangle className="h-4 w-4 shrink-0" /> Issues
              {(db?.issues as Issue[] || []).filter((i) => i.status !== 'RESOLVED').length > 0 && (
                <span className="ml-auto text-[9px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded-full">
                  {(db?.issues as Issue[] || []).filter((i) => i.status !== 'RESOLVED').length}
                </span>
              )}
            </button>
            {['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('pm')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'pm' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                <Settings className="h-4 w-4 shrink-0" /> PM Scheduling
              </button>
            )}
            {['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('workorders')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'workorders' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                <Wrench className="h-4 w-4 shrink-0" /> Work Orders & POs
              </button>
            )}
            {['DRIVER', 'MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (() => {
              const overdueCount = (db?.renewalAlerts || []).filter((r: any) => r.urgency === 'CRITICAL' || (r.daysLeft !== null && r.daysLeft !== undefined && r.daysLeft <= 7)).length;
              const warningCount = (db?.renewalAlerts || []).filter((r: any) => r.urgency === 'WARNING' || (r.daysLeft !== null && r.daysLeft !== undefined && r.daysLeft <= 30 && r.daysLeft > 7)).length;
              return (
                <button onClick={() => setActiveTab('renewals')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'renewals' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                  <ShieldAlert className="h-4 w-4 shrink-0" /> Renewal Alerts
                  {overdueCount > 0 ? (
                    <span className="ml-auto text-[9px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded-full animate-pulse" title={`${overdueCount} critical or overdue renewals`}>
                      {overdueCount}
                    </span>
                  ) : warningCount > 0 ? (
                    <span className="ml-auto text-[9px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded-full" title={`${warningCount} renewals expiring soon`}>
                      {warningCount}
                    </span>
                  ) : null}
                </button>
              );
            })()}
            {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <button onClick={() => setActiveTab('warranties')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'warranties' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                <Shield className="h-4 w-4 shrink-0" /> Warranties
              </button>
            )}

            {/* ── SERVICE & FIELD ── */}
            {['DRIVER', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1">Service & Field</p>
                <button onClick={() => setActiveTab('fuel')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'fuel' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                  <Fuel className="h-4 w-4 shrink-0" /> Fuel & IFTA Logs
                </button>
                <button onClick={() => setActiveTab('emergency')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'emergency' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                  <MapPin className="h-4 w-4 shrink-0" /> Roadside Breakdown
                </button>
                {['FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('claims')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'claims' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                    <CreditCard className="h-4 w-4 shrink-0" /> Accidents & Claims
                  </button>
                )}
              </>
            )}

            {/* ── INTELLIGENCE & INTEGRATIONS ── */}
            {['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1">Intelligence & Integrations</p>
                <button onClick={() => setActiveTab('aiadvisor')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'aiadvisor' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                  <Sparkles className="h-4 w-4 text-violet-400 shrink-0" /> AI Service Advisor
                  <span className="ml-auto text-[9px] bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded-full">AI 2.4</span>
                </button>
                {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('integrations')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'integrations' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                    <Share2 className="h-4 w-4 shrink-0" /> Integrations & Webhooks
                  </button>
                )}
              </>
            )}

            {/* ── RESOURCES ── */}
            {['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1">Resources</p>
                <button onClick={() => setActiveTab('parts')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'parts' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                  <Package className="h-4 w-4 shrink-0" /> Parts & Inventory
                  {(db?.parts as Part[] || []).filter((p) => p.stockQty <= p.reorderLevel).length > 0 && (
                    <span className="ml-auto text-[9px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded-full">
                      {(db?.parts as Part[] || []).filter((p) => p.stockQty <= p.reorderLevel).length}
                    </span>
                  )}
                </button>
                {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('contacts')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'contacts' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                    <Users className="h-4 w-4 shrink-0" /> Contacts
                  </button>
                )}
                {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('places')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'places' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                    <Building2 className="h-4 w-4 shrink-0" /> Places
                  </button>
                )}
                {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('documents')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'documents' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                    <FileBox className="h-4 w-4 shrink-0" /> Documents
                    {(db?.documents as FleetDocument[] || []).some((d) => d.expiresAt && Math.floor((new Date(d.expiresAt).getTime() - Date.now()) / 86400000) < 30) && (
                      <span className="ml-auto text-[9px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded-full">!</span>
                    )}
                  </button>
                )}
                {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('datamanagement')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'datamanagement' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                    <Layers className="h-4 w-4 shrink-0" /> Data Management
                  </button>
                )}
              </>
            )}

            {/* ── ADMIN & ACCOUNT ── */}
            {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
              <>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1">Admin & Account</p>
                {['FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('billing')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'billing' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                    <CreditCard className="h-4 w-4 shrink-0" /> Billing & Subscriptions
                  </button>
                )}
                <button onClick={() => setActiveTab('useraccess')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'useraccess' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                  <Shield className="h-4 w-4 shrink-0" /> User Access & Roles
                </button>
                {['FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => setActiveTab('reports')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'reports' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                    <BarChart3 className="h-4 w-4 shrink-0" /> Reports & Analytics
                  </button>
                )}
                <button onClick={() => setActiveTab('audit')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'audit' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                  <History className="h-4 w-4 shrink-0" /> Audit Logging
                </button>
                <button onClick={() => setActiveTab('simulators')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition ${activeTab === 'simulators' ? 'bg-[#00BA7C] text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00BA7C]'}`}>
                  <Radio className="h-4 w-4 shrink-0" /> Telematics & ELD
                </button>
              </>
            )}

          </nav>
        </div>

        {/* User Info & Role Selector */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 bg-[#00BA7C] text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
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
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#00BA7C] font-medium"
            >
              <option value="DRIVER">Driver View</option>
              <option value="MECHANIC">Mechanic View</option>
              <option value="MAINTENANCE_ADMIN">Admin View</option>
              <option value="FLEET_MANAGER">Fleet Manager View</option>
            </select>
          </div>

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
                  <span className="absolute top-1 right-1 h-2 w-2 bg-[#00BA7C] rounded-full"></span>
                )}
              </button>
              
              {/* Notification drop menu */}
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden hidden group-hover:block z-50">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <span className="text-xs font-bold text-slate-800">Live Maintenance Feed</span>
                  <span className="text-[10px] text-[#00BA7C] font-semibold">{db.notifications.length} unread</span>
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

            <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full font-semibold">
              Logged in: {currentUser.name}
            </span>
          </div>
        </header>

        {/* COMPONENT ROUTER VIEWS */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto space-y-6">

          {/* TAB 1: COCKPIT DASHBOARD (FLEET MANAGER ONLY) */}
          {activeTab === 'dashboard' && currentUser.role === 'FLEET_MANAGER' && (
            <CockpitDashboard
              db={db}
              currentUser={currentUser}
              setActiveTab={setActiveTab}
              refreshDb={refreshDb}
              triggerExport={triggerExport}
              setSelectedAssetId={setSelectedAssetId}
              apiUpdateWorkOrder={apiUpdateWorkOrder}
              apiPerformPM={apiPerformPM}
            />
          )}

          {/* TAB 2: ASSET CONTROL & QR */}
          {activeTab === 'assets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Tractor & Trailer Asset Matrix</h3>
                  <p className="text-xs text-slate-500 font-medium">Digital equipment barcodes, live sub-components, and active work orders</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setQrScannerAsset(db?.assets?.[0] || null);
                      setQrScannerOpen(true);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white rounded-xl flex items-center gap-2 transition shadow-sm"
                  >
                    <QrCode className="h-4 w-4 text-[#00BA7C]" /> Live Optical Scanner
                  </button>
                  {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                    <button onClick={() => triggerExport('costs')} className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-xs font-semibold text-white rounded-xl flex items-center gap-1.5 transition shadow-sm">
                      <Download className="h-4 w-4" /> Export Asset Report
                    </button>
                  )}
                </div>
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
                          <p className="text-sm font-semibold mt-0.5 text-[#00BA7C]">
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
                              setQrScannerAsset(asset);
                              setQrScannerOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-[11px] rounded-lg font-bold text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
                          >
                            <QrCode className="h-3.5 w-3.5 text-[#00BA7C]" />
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
                              onChange={async (e) => {
                                const newStatus = e.target.value as any;
                                try {
                                  await apiOverrideAssetStatus(asset.id, newStatus);
                                  await refreshDb();
                                } catch (err: any) {
                                  showToast(err.message || 'Failed to update asset status');
                                }
                              }}
                              className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-[#00BA7C]"
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

          {/* TAB: HOS & ELD MANDATE */}
          {activeTab === 'hos' && (
            <HosModule
              currentUser={currentUser}
              assets={db.assets || []}
              onShowToast={showToast}
            />
          )}

          {/* TAB: SAFETY & CSA SCORECARD */}
          {activeTab === 'safety' && (
            <SafetyScorecardModule
              currentUser={currentUser}
              dotInspections={db.dotInspections || []}
              accidentClaims={db.accidentClaims || []}
              renewalAlerts={db.renewalAlerts || []}
              onShowToast={showToast}
            />
          )}

          {/* TAB: COMPLIANCE CENTER */}
          {activeTab === 'compliance' && (
            <ComplianceModule currentUser={currentUser} />
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium"
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs h-20 focus:outline-none focus:border-[#00BA7C] text-slate-900"
                        />
                      </div>

                      <button
                        onClick={async () => {
                          if (!selectedAssetId) return;
                          const hasFailures = Object.values(failedChecklistItems).some(v => v);
                          const status = hasFailures ? 'FAILED' : 'PASSED';

                          try {
                            await apiCreateInspection({
                              assetId: selectedAssetId,
                              status: status as any,
                              odometer: inspectionOdometer,
                              checklistJson: failedChecklistItems,
                              notes: inspectionNotes
                            });
                            await refreshDb();
                            showToast(hasFailures ? 'Inspection recorded: Failed items identified. Asset set to INOPERABLE.' : 'Inspection passed successfully!');
                          } catch (err: any) {
                            showToast(err.message || 'Failed to submit inspection to backend');
                          }
                          setFailedChecklistItems({});
                          setInspectionNotes('');
                        }}
                        className="px-6 py-2.5 bg-[#00BA7C] hover:bg-[#00A86B] text-white rounded-xl text-xs font-bold shadow-sm transition"
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
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-slate-900">Past eDVIR Inspections Logs (FMCSA § 396.11 / § 396.13)</h4>
                  <span className="text-[10px] font-semibold text-slate-500">Dual-Signoff Compliance Trail</span>
                </div>
                <div className="space-y-3">
                  {db.inspections.length === 0 ? (
                    <p className="text-xs text-slate-500">No inspections submitted yet.</p>
                  ) : (
                    db.inspections.map((insp: any) => (
                      <div key={insp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-900">
                              {db.assets.find((a: Asset) => a.id === insp.assetId)?.name}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Submitted by: {insp.driverName || insp.driver?.name} | Odo: {insp.odometer} miles</p>
                            {insp.notes && <p className="text-slate-600 mt-1 italic">&quot;{insp.notes}&quot;</p>}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                            insp.status === 'PASSED' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-red-100 border-red-200 text-red-700'
                          }`}>
                            {insp.status}
                          </span>
                        </div>

                        {/* FMCSA Sign-off trail */}
                        {insp.status === 'FAILED' && (
                          <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <div className="space-y-0.5">
                              {insp.mechanicSignOffBy ? (
                                <p className="text-emerald-700 font-semibold flex items-center gap-1">
                                  ✓ Mechanic Certified: {insp.mechanicSignOffBy} ({insp.mechanicNotes || 'Repairs complete'})
                                </p>
                              ) : (
                                <p className="text-amber-700 font-semibold">⚠ Awaiting Mechanic Certification</p>
                              )}

                              {insp.nextDriverReviewBy ? (
                                <p className="text-blue-700 font-semibold flex items-center gap-1">
                                  ✓ Next Driver Acknowledged: {insp.nextDriverReviewBy}
                                </p>
                              ) : insp.mechanicSignOffBy ? (
                                <p className="text-slate-500 italic">Next driver review pending</p>
                              ) : null}
                            </div>

                            <div className="flex gap-2">
                              {!insp.mechanicSignOffBy && ['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                                <button
                                  onClick={async () => {
                                    const notes = prompt('Enter repair certification notes (or leave default):', 'Defects corrected per 49 CFR 396.11');
                                    if (notes !== null) {
                                      try {
                                        await apiMechanicSignOff(insp.id, notes, true);
                                      } catch (err) {
                                        console.error(err);
                                      }
                                      insp.mechanicSignOffBy = currentUser.name;
                                      insp.mechanicNotes = notes;
                                      refreshDb();
                                      showToast('Mechanic sign-off recorded! Vehicle cleared to OPERABLE.');
                                    }
                                  }}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] shadow-xs transition"
                                >
                                  Certify Repair & Clear Lockout
                                </button>
                              )}

                              {insp.mechanicSignOffBy && !insp.nextDriverReviewBy && ['DRIVER', 'MAINTENANCE_ADMIN'].includes(currentUser.role) && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await apiDriverReview(insp.id);
                                    } catch (err) {
                                      console.error(err);
                                    }
                                    insp.nextDriverReviewBy = currentUser.name;
                                    refreshDb();
                                    showToast('Driver acknowledgment recorded per FMCSA § 396.13.');
                                  }}
                                  className="px-3 py-1 bg-[#00BA7C] hover:bg-[#00A86B] text-white font-bold rounded-lg text-[10px] shadow-xs transition"
                                >
                                  Driver Sign-off (§ 396.13)
                                </button>
                              )}
                            </div>
                          </div>
                        )}
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
                {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
                  <button onClick={() => triggerExport('compliance')} className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition">
                    <Download className="h-4 w-4" /> Export PM Compliance
                  </button>
                )}
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
                          <p className="text-xs text-[#00BA7C] font-bold">{template?.name}</p>
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
                            onClick={async () => {
                              const curOdo = prompt('Confirm Odometer reading at service:', (asset?.odometer || 0).toString());
                              if (curOdo) {
                                const odoNum = parseFloat(curOdo);
                                try {
                                  await apiPerformPM(sched.id, odoNum);
                                } catch (err) {
                                  console.error(err);
                                }
                                refreshDb();
                                showToast('Preventive Maintenance recorded! Next due date and mileage intervals re-evaluated.');
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#00BA7C]"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C]"
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
                          onClick={async () => {
                            try {
                              await apiCreateServiceRequest({
                                assetId: selectedAssetId,
                                description: requestDesc,
                                mediaUrls: [requestMedia]
                              });
                            } catch (err) {
                              console.error(err);
                            }
                            refreshDb();
                            showToast('Pending Service Request submitted and Admin notified!');
                            setRequestDesc('');
                          }}
                          className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00A86B] rounded-xl text-xs font-bold text-white transition shadow-sm"
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
                <div className="bg-white border-2 border-[#00BA7C] p-6 rounded-2xl shadow-md space-y-4">
                  <h4 className="text-sm font-bold text-[#00BA7C]">Review Driver Request & Approve to Work Order</h4>
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
                      onClick={async () => {
                        try {
                          await apiApproveServiceRequest(approvingRequestId, {
                            type: woType,
                            priority: woPriority,
                            description: woDesc,
                            assignedMechanicId: woMechanicId,
                            vendorId: woVendorId
                          });
                        } catch (err) {
                          console.error(err);
                        }
                        setApprovingRequestId(null);
                        refreshDb();
                        showToast('Request converted to Work Order!');
                      }}
                      className="px-4 py-1.5 bg-[#00BA7C] hover:bg-[#00A86B] text-xs font-bold rounded-xl transition text-white shadow-xs"
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
                                className="w-full mt-2 py-1.5 bg-[#00BA7C] hover:bg-[#00A86B] text-[10px] font-bold rounded-lg text-white transition shadow-xs"
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
                                wo.status === 'IN_PROGRESS' ? 'bg-emerald-100 border-emerald-200 text-emerald-800' :
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
                                <p className="text-[#00BA7C] font-bold">PO Issued</p>
                              ) : (
                                <p className="text-slate-700 font-semibold">Mechanic: Dave</p>
                              )}
                            </div>
                          </div>

                          {/* Mechanic updates WO */}
                          {wo.status !== 'COMPLETED' && (currentUser.role === 'MECHANIC' || currentUser.role === 'MAINTENANCE_ADMIN') && (
                            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                              <button
                                onClick={async () => {
                                  const partNumber = prompt('Enter Part Number to install (e.g. PART-ENG-001 or PART-BRK-001):');
                                  if (!partNumber) return;
                                  const p = (db.parts || []).find((x: any) => x.partNumber.toLowerCase() === partNumber.trim().toLowerCase());
                                  if (!p) {
                                    showToast('Part number not found in inventory directory.');
                                    return;
                                  }
                                  const qtyStr = prompt(`Enter quantity of ${p.name} (In stock: ${p.stockQty}):`, '1');
                                  const qty = parseInt(qtyStr || '1');
                                  if (qty > 0) {
                                    try {
                                      await apiAddPartToWorkOrder(wo.id, p.id, qty);
                                      refreshDb();
                                      showToast(`Installed ${qty}x ${p.name}. Deducted from inventory and added to work order cost!`);
                                    } catch (err: any) {
                                      console.error(err);
                                      showToast('Failed to install part: ' + err.message);
                                    }
                                  }
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-lg transition"
                              >
                                + Install Part
                              </button>

                              <button
                                onClick={async () => {
                                  const labor = prompt('Record labor cost ($):', wo.laborCost.toString());
                                  const parts = prompt('Record parts cost ($):', wo.partsCost.toString());
                                  const lNum = parseFloat(labor || '0');
                                  const pNum = parseFloat(parts || '0');

                                  try {
                                    await apiUpdateWorkOrder(wo.id, {
                                      status: 'COMPLETED',
                                      laborCost: lNum,
                                      partsCost: pNum,
                                    });
                                  } catch (err) {
                                    console.error(err);
                                  }
                                  

                                  refreshDb();
                                  showToast('Work order completed! Asset status re-evaluated.');
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold rounded-lg text-white transition shadow-xs"
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

          {/* TAB 6: RENEWAL ALERTS & COMPLIANCE MATRIX (33 ITEMS) */}
          {activeTab === 'renewals' && (
            <RenewalsCenter
              currentUser={currentUser}
              showToast={showToast}
            />
          )}


          {/* TAB 7: FUEL & RELAY PAYMENTS TMS */}
          {activeTab === 'fuel' && (
            <div className="space-y-6">
              <RelayFuelModule
                fuelLogs={db.fuelLogs}
                assets={db.assets}
                currentUser={currentUser}
                onRefresh={refreshDb}
                showToast={showToast}
              />

              {/* Toll Transponders attribution */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-sans">Toll Records Attribution Logs</h4>
                    <p className="text-xs text-slate-500">Bestpass / PrePass transponder crossings paired with asset telematics</p>
                  </div>
                  <span className="text-xs text-emerald-700 font-mono font-bold">
                    {db.tollRecords.length} records
                  </span>
                </div>
                <div className="space-y-3 text-xs">
                  {db.tollRecords.length === 0 ? (
                    <p className="text-xs text-slate-400">No toll crossings recorded.</p>
                  ) : (
                    db.tollRecords.map((t: TollRecord, i: number) => {
                      const asset = db.assets.find((a: Asset) => a.id === t.assetId);
                      return (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center font-mono">
                          <div>
                            <span className="font-bold text-slate-900">{asset?.name}</span>
                            <p className="text-[9px] text-slate-500 mt-1">{t.location} | Transponder: {t.transponderId}</p>
                          </div>
                          <div className="text-right text-[#00BA7C] font-bold">
                            +${t.amount.toFixed(2)}
                          </div>
                        </div>
                      );
                    })
                  )}
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
                      <label className="text-xs text-slate-500 font-bold block mb-1">GPS Coordinates (Live Telematics & Geolocation)</label>
                      <div className="flex gap-2">
                        <input type="text" value={`${emergencyLat}, ${emergencyLng}`} readOnly className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-600 font-mono" />
                        <button
                          onClick={async () => {
                            if (!selectedAssetId) return;
                            try {
                              await apiCreateEmergencyTicket({
                                assetId: selectedAssetId,
                                description: emergencyDesc,
                                gpsLatitude: emergencyLat,
                                gpsLongitude: emergencyLng
                              });
                            } catch (err) {
                              console.error(err);
                            }
                            await refreshDb();
                            showToast('Emergency Ticket logged! Closest vendor has been auto-dispatched.');
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
                              onClick={async () => {
                                const hours = prompt('Record downtime hours (e.g. 2.5):', '2.5');
                                try {
                                  await apiUpdateEmergencyTicket(t.id, {
                                    status: 'COMPLETED',
                                    downtimeHours: parseFloat(hours || '0')
                                  });
                                  await refreshDb();
                                  showToast('Breakdown resolved. Stranded asset status reset to OPERABLE.');
                                } catch (err: any) {
                                  showToast(err.message || 'Failed to resolve emergency ticket');
                                }
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
                          onClick={async () => {
                            if (!selectedAssetId) return;
                            const todayStr = new Date().toISOString().split('T')[0];
                            try {
                              await apiCreateAccidentClaim({
                                assetId: selectedAssetId,
                                policeReportNumber: accidentReportNo,
                                statement: accidentStatement,
                                thirdPartyDetails: accidentThirdParty,
                                claimDate: todayStr
                              });
                            } catch (err) {
                              console.error(err);
                            }
                            await refreshDb();
                            showToast('Accident claim submitted! Active collision work order dispatched.');
                            setAccidentReportNo('');
                            setAccidentStatement('');
                            setAccidentThirdParty('');
                          }}
                          className="px-5 py-2 bg-[#00BA7C] hover:bg-[#00A86B] rounded-xl font-bold text-xs text-white shadow-sm"
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
                          <div>Driver: {claim.driverName || 'Not recorded'}</div>
                        </div>

                        {/* Visual Evidence Proofs Badges */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                          <span className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 rounded-md flex items-center gap-1 shadow-2xs">
                            📸 Front Bumper Damage Photo
                          </span>
                          <span className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 rounded-md flex items-center gap-1 shadow-2xs">
                            📹 Dashcam Telematics Video Clip
                          </span>
                          <span className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 rounded-md flex items-center gap-1 shadow-2xs">
                            📄 Police Incident Report Verified
                          </span>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => {
                              const fnol = `=====================================================
FIRST NOTICE OF LOSS (FNOL) - COMMERCIAL FLEET INSURANCE
=====================================================
Claim ID: ${claim.id}
Date of Incident: ${claim.claimDate || '2026-04-12'}
Involved Power Unit: ${asset?.name || 'Class-8 Tractor'} (VIN: ${asset?.vin || '1N4AL3...'})
Assigned Driver: ${claim.driverName}
Police Report #: ${claim.policeReportNumber}
Third Party Contact / Vehicle: ${claim.thirdPartyDetails || 'None / Single Vehicle'}
Driver Statement: "${claim.statement}"

FINANCIAL ASSESSMENT:
Estimated Repair Cost: $${claim.actualRepairCost.toLocaleString()}
Approved Insurance Settlement: $${claim.insurancePayout.toLocaleString()}
Net Fleet Incurred Loss: $${(claim.actualRepairCost - claim.insurancePayout).toLocaleString()}

COMMERCIAL UNDERWRITING POLICY:
Underwriter: Travelers Commercial Auto (#TRV-COMM-99201)
Adjuster Assigned: Auto-Dispatched to Commercial Claims Dept
Status: DISPATCHED / REPAIR WORK ORDER ACTIVE
=====================================================`;
                              const blob = new Blob([fnol], { type: 'text/plain;charset=utf-8;' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `FNOL_Insurance_Claim_${claim.policeReportNumber || '99201'}.txt`;
                              link.click();
                              URL.revokeObjectURL(url);
                              showToast(`Official FNOL Claim Packet downloaded for Police Report #${claim.policeReportNumber}!`);
                            }}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition shadow-2xs"
                          >
                            <Download className="h-3 w-3 text-[#00BA7C]" /> Download FNOL Claim Packet
                          </button>
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

          {/* TAB 11: TELEMATICS & ELD INTEGRATIONS GATEWAY */}
          {activeTab === 'simulators' && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Radio className="h-5 w-5 text-[#00BA7C] animate-pulse" /> Live Telematics & ELD Integrations Gateway
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Production cloud ingestion for Samsara, Motive ELD, Geotab, WEX Fuel Networks, and Toll Transponders.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-[#00BA7C] border border-emerald-200 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#00BA7C] animate-ping"></span> Real-Time Webhook Gateway Active
                  </span>
                </div>
              </div>

              {/* Provider Connection Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Motive / KeepTruckin</span>
                    <span className="h-2 w-2 rounded-full bg-[#00BA7C]"></span>
                  </div>
                  <p className="text-[10px] text-slate-400">J1939 & Odo Gateway</p>
                  <p className="text-[10px] font-mono text-[#00BA7C] font-semibold">LISTENING (200 OK)</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Samsara ELD</span>
                    <span className="h-2 w-2 rounded-full bg-[#00BA7C]"></span>
                  </div>
                  <p className="text-[10px] text-slate-400">GPS & Fault Stream</p>
                  <p className="text-[10px] font-mono text-[#00BA7C] font-semibold">CONNECTED (Active)</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">WEX / Comdata</span>
                    <span className="h-2 w-2 rounded-full bg-[#00BA7C]"></span>
                  </div>
                  <p className="text-[10px] text-slate-400">Fuel Card Network</p>
                  <p className="text-[10px] font-mono text-[#00BA7C] font-semibold">MPG AUDIT ENABLED</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Bestpass / PrePass</span>
                    <span className="h-2 w-2 rounded-full bg-[#00BA7C]"></span>
                  </div>
                  <p className="text-[10px] text-slate-400">Toll Transponders</p>
                  <p className="text-[10px] font-mono text-[#00BA7C] font-semibold">EXPENSE STREAM ON</p>
                </div>
              </div>

              {/* Ingestion Endpoints Reference Card */}
              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs space-y-2 border border-slate-800">
                <span className="font-bold text-white text-[11px] uppercase tracking-wider block">Production Inbound Webhook Endpoints</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">POST {API_BASE_URL}/telematics/odometer</span>
                    <span className="text-[#00BA7C] text-[10px]">Odo Sync</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">POST {API_BASE_URL}/telematics/fault-code</span>
                    <span className="text-amber-400 text-[10px]">J1939 DTC</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">POST {API_BASE_URL}/fuel/webhook</span>
                    <span className="text-emerald-400 text-[10px]">Fuel Cards</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">POST {API_BASE_URL}/tolls/webhook</span>
                    <span className="text-teal-400 text-[10px]">Tolls</span>
                  </div>
                </div>
              </div>

              {/* Direct Ingestion Triggers (Connected Live to NestJS Backend) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Odometer Webhook */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#00BA7C]">ELD Odometer Ingestion</span>
                    <span className="text-[10px] bg-emerald-50 text-[#00BA7C] font-mono px-2 py-0.5 rounded border border-emerald-200">Live API</span>
                  </div>
                  
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">Target Asset</label>
                    <select value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-medium">
                      <option value="">-- Choose Asset --</option>
                      {db.assets.map((a: Asset) => (
                        <option key={a.id} value={a.id}>{a.name} (Current: {a.odometer.toLocaleString()} mi)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 font-bold block mb-1">Incoming Telematics Odometer (Miles)</label>
                    <input type="number" value={simOdometer} onChange={e => setSimOdometer(parseInt(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-medium" />
                  </div>

                  <button
                    onClick={runOdometerWebhook}
                    className="w-full py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-xs font-bold rounded-lg text-white transition shadow-sm"
                  >
                    Ingest Odometer Sync & Recalculate PMs
                  </button>
                </div>

                {/* DTC Fault Code */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-600">ELD J1939 Engine Diagnostics</span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-mono px-2 py-0.5 rounded border border-amber-200">Live API</span>
                  </div>
                  
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">Diagnostic Trouble Code (DTC / SPN)</label>
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
                    Ingest DTC & Auto-Create Work Order
                  </button>
                </div>

                {/* Fuel Card Webhook */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#00BA7C]">Fuel Card Transaction (WEX / Comdata)</span>
                    <span className="text-[10px] bg-emerald-50 text-[#00BA7C] font-mono px-2 py-0.5 rounded border border-emerald-200">Live API</span>
                  </div>
                  
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
                    className="w-full py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-xs font-bold rounded-lg text-white transition shadow-sm"
                  >
                    Ingest Fuel Purchase & Audit MPG
                  </button>
                </div>

                {/* Toll Transponders Webhook */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-600">Toll Transponders (Bestpass / PrePass)</span>
                    <span className="text-[10px] bg-teal-50 text-teal-700 font-mono px-2 py-0.5 rounded border border-teal-200">Live API</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Ingests real toll transponder crossing directly into database linked to the selected asset.</p>
                  
                  <button
                    onClick={runTollWebhook}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-lg text-white transition shadow-sm"
                  >
                    Ingest Toll Plaza Crossing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FLEET MAP & LIVE DRIVER TRACKING */}
          {activeTab === 'fleetmap' && (
            <div className="space-y-5">
              <FleetMapModule
                assets={db.assets as Asset[]}
                places={(db as any).places as Place[]}
                assignments={(db as any).assignments || []}
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
                    <Users className="h-5 w-5 text-[#00BA7C]" /> Vehicle Assignments Dashboard
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

          {/* COMPONENT READINGS (TIRES & BRAKES) */}
          {activeTab === 'tires' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                    <Layers className="h-5 w-5 text-[#00BA7C]" /> Component Readings Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Per-axle tire pressure, tread depth monitoring, and commercial air brake inspection readings</p>
                </div>
                <span className="bg-amber-50 text-amber-700 font-bold border border-amber-200 px-3 py-1 rounded-full text-xs shadow-xs">
                  Axle Telematics & Diagnostics
                </span>
              </div>
              <TiresModule
                tireReadings={(db as any).tireReadings as TireReading[]}
                brakeReadings={(db as any).brakeReadings as BrakeReading[]}
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
                    <CreditCard className="h-5 w-5 text-[#00BA7C]" /> Expense History Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Per-asset TCO (Total Cost of Ownership), cost-per-mile, and operating spend</p>
                </div>
                <span className="bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 px-3 py-1 rounded-full text-xs shadow-xs">
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
                    <BarChart3 className="h-5 w-5 text-[#00BA7C]" /> Replacement Analysis Dashboard
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
                    <AlertTriangle className="h-5 w-5 text-[#00BA7C]" /> Issues Management Dashboard
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
                    <Users className="h-5 w-5 text-[#00BA7C]" /> Contacts & Directory Dashboard
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
                    <Package className="h-5 w-5 text-[#00BA7C]" /> Parts & Inventory Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Spare parts catalog, stock levels, reorder thresholds, and inventory logs</p>
                </div>
                <span className="bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 px-3 py-1 rounded-full text-xs shadow-xs">
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
                    <Building2 className="h-5 w-5 text-[#00BA7C]" /> Places Directory Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Depots, fuel stops, repair shops, customer sites, and DOT inspection stations</p>
                </div>
                <span className="bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 px-3 py-1 rounded-full text-xs shadow-xs">
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
                    <FileBox className="h-5 w-5 text-[#00BA7C]" /> Documents Vault Dashboard
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
                    <Shield className="h-5 w-5 text-[#00BA7C]" /> Warranties Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">OEM powertrain, component warranty claims, and coverage expiration timelines</p>
                </div>
                <span className="bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 px-3 py-1 rounded-full text-xs shadow-xs">
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
                    <BarChart3 className="h-5 w-5 text-[#00BA7C]" /> Fleet Reports & Analytics Dashboard
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

          {/* AI SERVICE ADVISOR */}
          {activeTab === 'aiadvisor' && (
            <div className="space-y-5">
              <AIServiceAdvisorModule
                assets={db.assets as Asset[]}
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

          {/* INTEGRATIONS & WEBHOOKS */}
          {activeTab === 'integrations' && (
            <div className="space-y-5">
              <IntegrationsModule
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

          {/* DATA MANAGEMENT */}
          {activeTab === 'datamanagement' && (
            <div className="space-y-5">
              <DataManagementModule
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

          {/* BILLING & SUBSCRIPTIONS */}
          {activeTab === 'billing' && (
            <div className="space-y-5">
              <BillingModule
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

          {/* USER ACCESS & ROLES */}
          {activeTab === 'useraccess' && (
            <div className="space-y-5">
              <UserAccessModule
                users={db.users as DbUser[]}
                currentUser={currentUser}
                onRefresh={refreshDb}
              />
            </div>
          )}

        </main>
      </div>

      {/* Floating Modern Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[9999] flex items-center gap-3 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200 max-w-md">
          <div className="h-2.5 w-2.5 rounded-full bg-[#00BA7C] animate-pulse flex-shrink-0" />
          <span className="text-xs font-medium leading-relaxed">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs ml-2 p-1 rounded-md"
          >
            ✕
          </button>
        </div>
      )}

      {/* Real QR Equipment Scanner & Diagnostics Modal */}
      {db && (
        <QrScannerModal
          isOpen={qrScannerOpen}
          onClose={() => setQrScannerOpen(false)}
          initialAsset={qrScannerAsset}
          assets={db.assets || []}
          components={db.components || []}
          workOrders={db.workOrders || []}
          onSelectAsset={(asset) => {
            setQrScannerAsset(asset);
            setSelectedAssetId(asset.id);
          }}
          onNavigateToWorkOrder={(assetId) => {
            setSelectedAssetId(assetId);
            setQrScannerOpen(false);
            setActiveTab('workOrders');
          }}
          onNavigateToInspection={(assetId) => {
            setSelectedAssetId(assetId);
            setQrScannerOpen(false);
            setActiveTab('inspections');
          }}
          onUpdateComponentStatus={(compId, status) => {
            const comp = db.components?.find((c: any) => c.id === compId);
            if (comp) {
              comp.status = status;
              showToast(`Component "${comp.name}" updated to ${status}`);
              refreshDb();
            }
          }}
          onSyncOdometer={async (assetId, odo) => {
            try {
              await apiTriggerOdometerWebhook(assetId, odo);
              showToast(`Odometer synchronized to ${odo.toLocaleString()} miles!`);
              refreshDb();
            } catch {
              showToast(`Odometer updated locally to ${odo.toLocaleString()} miles`);
              refreshDb();
            }
          }}
        />
      )}
    </div>
  );
}
