'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  Clock, User, Truck, Building2, Calendar, Search, Plus, Edit3, Trash2,
  ExternalLink, UploadCloud, Check, X, Filter, Download, RefreshCw,
  FileCheck, AlertCircle, FileText, CheckSquare, Sparkles, HelpCircle,
  ChevronRight, BadgePercent, ArrowUpRight
} from 'lucide-react';
import {
  ApiComplianceRenewal,
  apiGetComplianceRenewals,
  apiGetRenewalsSummary,
  apiSaveComplianceRenewalAdmin,
  apiDeleteComplianceRenewal,
  apiSubmitDriverRenewal,
  apiSubmitEquipmentRenewal,
  apiVerifyComplianceRenewal,
  apiGetUsers,
  apiGetAssets,
  ApiUser,
  ApiAsset,
} from '../lib/api-client';

// ─── 33 COMPLIANCE ITEMS TAXONOMY ───────────────────────────────────────────

export interface ComplianceItemMeta {
  type: string;
  scope: 'DRIVER' | 'EQUIPMENT' | 'CARRIER';
  title: string;
  defaultLeadDays: number;
  hasExpiry: boolean;
  frequency: string;
  regulatoryCode: string;
  description: string;
  placeholderRef: string;
  extraFieldType?: 'MILEAGE' | 'STATES' | 'NONE';
}

export const COMPLIANCE_ITEMS_CATALOG: ComplianceItemMeta[] = [
  // ── DRIVER (9 Items) ──
  {
    type: 'DRIVER_CDL',
    scope: 'DRIVER',
    title: 'CDL (Commercial Driver License)',
    defaultLeadDays: 60,
    hasExpiry: true,
    frequency: 'Every 4-5 Years',
    regulatoryCode: '49 CFR § 383.23',
    description: 'Valid state-issued Commercial Driver License with required classes and endorsements.',
    placeholderRef: 'e.g. DL-TX-9842187',
  },
  {
    type: 'DRIVER_MEDICAL_CARD',
    scope: 'DRIVER',
    title: 'Medical Certificate Active (MCSA-5876)',
    defaultLeadDays: 30,
    hasExpiry: true,
    frequency: 'Every 1-2 Years',
    regulatoryCode: '49 CFR § 391.43',
    description: 'Medical Examiner Certificate issued by a certified National Registry Medical Examiner.',
    placeholderRef: 'e.g. NRCME #8841029',
  },
  {
    type: 'DRIVER_HOS_LOG',
    scope: 'DRIVER',
    title: 'HOS Log (Hours of Service)',
    defaultLeadDays: 7,
    hasExpiry: true,
    frequency: 'Continuous / 7-Day Cycle',
    regulatoryCode: '49 CFR Part 395',
    description: 'ELD electronic log record ensuring 70-hour / 8-day and 11-hour drive time compliance.',
    placeholderRef: 'e.g. Motive ELD Cycle #401',
  },
  {
    type: 'DRIVER_TWIC_CARD',
    scope: 'DRIVER',
    title: 'TWIC Card',
    defaultLeadDays: 60,
    hasExpiry: true,
    frequency: 'Every 5 Years',
    regulatoryCode: '46 CFR § 10.203',
    description: 'Transportation Worker Identification Credential for secure maritime facilities and ports.',
    placeholderRef: 'e.g. TWIC #TW994821',
  },
  {
    type: 'DRIVER_HAZMAT_ENDORSEMENT',
    scope: 'DRIVER',
    title: 'HAZMAT or other Endorsement',
    defaultLeadDays: 60,
    hasExpiry: true,
    frequency: 'Every 4-5 Years',
    regulatoryCode: '49 CFR § 383.93',
    description: 'Hazardous Materials (H), Tanker (N), Double/Triple (T), or X Endorsement & TSA clearance.',
    placeholderRef: 'e.g. TSA TSA-882194-H',
  },
  {
    type: 'DRIVER_ANNUAL_CLEARINGHOUSE_QUERY',
    scope: 'DRIVER',
    title: 'Annual Clearing House Query',
    defaultLeadDays: 30,
    hasExpiry: true,
    frequency: 'Every 12 Months',
    regulatoryCode: '49 CFR § 382.701(b)',
    description: 'Mandatory annual query in the FMCSA Drug & Alcohol Clearinghouse for past violations.',
    placeholderRef: 'e.g. D&A Query ID #Q-9921',
  },
  {
    type: 'DRIVER_ANNUAL_MVR_SELF_CERT',
    scope: 'DRIVER',
    title: 'Annual MVR & Violations Certified by Driver',
    defaultLeadDays: 30,
    hasExpiry: true,
    frequency: 'Every 12 Months',
    regulatoryCode: '49 CFR § 391.27',
    description: 'Driver annual certificate of violations and carrier review of official driving record (MVR).',
    placeholderRef: 'e.g. MVR-CERT-2026-01',
  },
  {
    type: 'DRIVER_PRE_EMPLOYMENT_DRUG_TEST',
    scope: 'DRIVER',
    title: 'Pre-Employment Drug Test',
    defaultLeadDays: 0,
    hasExpiry: false,
    frequency: 'Permanent / Once on Hire',
    regulatoryCode: '49 CFR § 382.301',
    description: 'Verified negative DOT 5-panel drug screen result prior to operating CMV. Permanent record.',
    placeholderRef: 'e.g. CCF Specimen #9948201',
  },
  {
    type: 'DRIVER_RANDOM_DRUG_TEST',
    scope: 'DRIVER',
    title: 'Random Drug Test Pool',
    defaultLeadDays: 30,
    hasExpiry: true,
    frequency: 'Quarterly Random Pool',
    regulatoryCode: '49 CFR § 382.305',
    description: 'Enrolled in DOT-compliant consortium random testing pool. Tracks days since last screening.',
    placeholderRef: 'e.g. Pool Consortium #PC-8821',
  },

  // ── EQUIPMENT (8 Items) ──
  {
    type: 'EQUIPMENT_TITLE',
    scope: 'EQUIPMENT',
    title: 'Equipment Title',
    defaultLeadDays: 0,
    hasExpiry: false,
    frequency: 'Permanent (Optional)',
    regulatoryCode: 'State DMV',
    description: 'Certificate of Title proving vehicle ownership or lienholder retention.',
    placeholderRef: 'e.g. Title #TX-9928410',
  },
  {
    type: 'EQUIPMENT_REGISTRATION',
    scope: 'EQUIPMENT',
    title: 'Registration / Cab Card',
    defaultLeadDays: 45,
    hasExpiry: true,
    frequency: 'Annual',
    regulatoryCode: 'IRP / State DMV',
    description: 'Apportioned Cab Card or State vehicle registration with valid plate and weight group.',
    placeholderRef: 'e.g. Plate #TX-P9942',
  },
  {
    type: 'EQUIPMENT_COI',
    scope: 'EQUIPMENT',
    title: 'Vehicle Certificate of Insurance (COI)',
    defaultLeadDays: 30,
    hasExpiry: true,
    frequency: 'Annual Policy',
    regulatoryCode: 'Carrier Risk Policy',
    description: 'Specific vehicle inclusion certificate on the master commercial auto physical damage & liability.',
    placeholderRef: 'e.g. COI-VEH-8820',
  },
  {
    type: 'EQUIPMENT_DOT_ANNUAL_INSPECTION',
    scope: 'EQUIPMENT',
    title: 'Annual Inspection (DOT § 396.17)',
    defaultLeadDays: 30,
    hasExpiry: true,
    frequency: 'Every 12 Months',
    regulatoryCode: '49 CFR § 396.17',
    description: 'Mandatory periodic 12-month vehicle safety inspection with decal & certified brake report.',
    placeholderRef: 'e.g. Decal #DOT-2026-991',
  },
  {
    type: 'EQUIPMENT_IFTA_DECAL',
    scope: 'EQUIPMENT',
    title: 'Current FY IFTA Decal',
    defaultLeadDays: 45,
    hasExpiry: true,
    frequency: 'Annual (Expires Dec 31)',
    regulatoryCode: 'IFTA Articles',
    description: 'Valid exterior IFTA fuel tax decals affixed to both sides of the tractor cab.',
    placeholderRef: 'e.g. Decal Pair #26-884109',
  },
  {
    type: 'EQUIPMENT_PM_SERVICE',
    scope: 'EQUIPMENT',
    title: 'Last PM & Next PM Mileage',
    defaultLeadDays: 14,
    hasExpiry: true,
    frequency: 'Mileage / 90 Days',
    regulatoryCode: '49 CFR § 396.3',
    description: 'Preventative maintenance schedule tracking engine hours, service dates, and next target mileage.',
    placeholderRef: 'e.g. PM-B at 125,000 mi',
    extraFieldType: 'MILEAGE',
  },
  {
    type: 'EQUIPMENT_LEASE_AGREEMENT',
    scope: 'EQUIPMENT',
    title: 'Lease Agreement',
    defaultLeadDays: 30,
    hasExpiry: true,
    frequency: 'As Contracted (Optional)',
    regulatoryCode: '49 CFR Part 376',
    description: 'Truth-in-Leasing compliant equipment lease agreement if equipment is leased or owner-operated.',
    placeholderRef: 'e.g. Lease #PENSKE-8841',
  },
  {
    type: 'EQUIPMENT_FORM_2290_HVUT',
    scope: 'EQUIPMENT',
    title: 'Latest Form 2290 (HVUT Schedule 1)',
    defaultLeadDays: 45,
    hasExpiry: true,
    frequency: 'Annual (Due Aug 31)',
    regulatoryCode: 'IRS 26 CFR Part 41',
    description: 'Heavy Vehicle Use Tax Form 2290 IRS e-file watermarked Schedule 1 receipt for 55,000+ lbs GVW.',
    placeholderRef: 'e.g. IRS-EFILE-2026-2290',
  },

  // ── CARRIER (16 Items) ──
  {
    type: 'CARRIER_OPERATING_AUTHORITY',
    scope: 'CARRIER',
    title: 'Operating Authority',
    defaultLeadDays: 60,
    hasExpiry: true,
    frequency: 'Permanent / Active Status',
    regulatoryCode: '49 U.S.C. § 13902',
    description: 'Federal motor carrier operating authority certificate (MC/FF/MX) issued by FMCSA.',
    placeholderRef: 'e.g. MC-984210 / USDOT 3881920',
  },
  {
    type: 'CARRIER_IFTA_LICENSE',
    scope: 'CARRIER',
    title: 'Master IFTA License',
    defaultLeadDays: 60,
    hasExpiry: true,
    frequency: 'Annual (Expires Dec 31)',
    regulatoryCode: 'IFTA Agreement',
    description: 'Company-level International Fuel Tax Agreement carrier operating license issued by base state.',
    placeholderRef: 'e.g. IFTA-TX-992014',
  },
  {
    type: 'CARRIER_STATE_ABC_PERMITS',
    scope: 'CARRIER',
    title: 'Permits If Any (State Permit, ABC Permit)',
    defaultLeadDays: 30,
    hasExpiry: true,
    frequency: 'Varies by State',
    regulatoryCode: 'State Alcohol & Tax Depts',
    description: 'Alcoholic Beverage Commission (ABC) transit permits, trip permits, and state regulatory clearances.',
    placeholderRef: 'e.g. ABC-PERMIT-44109',
  },
  {
    type: 'CARRIER_EIN',
    scope: 'CARRIER',
    title: 'EIN (Employer Identification Number)',
    defaultLeadDays: 0,
    hasExpiry: false,
    frequency: 'Permanent (No Expiry)',
    regulatoryCode: 'IRS Form SS-4',
    description: 'Federal Employer Identification Number issued by the IRS for business tax reporting.',
    placeholderRef: 'e.g. 12-3456789',
  },
  {
    type: 'CARRIER_STATE_REGISTRATION',
    scope: 'CARRIER',
    title: 'State Corporate Registration',
    defaultLeadDays: 60,
    hasExpiry: true,
    frequency: 'Annual / Biennial Report',
    regulatoryCode: 'Secretary of State',
    description: 'Certificate of Good Standing and annual franchise report with the home state Secretary of State.',
    placeholderRef: 'e.g. SOS Entity #80291410',
  },
  {
    type: 'CARRIER_QUARTERLY_IFTA',
    scope: 'CARRIER',
    title: 'Quarterly IFTA Tax Filing',
    defaultLeadDays: 15,
    hasExpiry: true,
    frequency: 'Quarterly (Apr/Jul/Oct/Jan 31)',
    regulatoryCode: 'IFTA R300',
    description: 'Quarterly fuel tax return submission and tax payment reconciliation for all jurisdiction miles.',
    placeholderRef: 'e.g. 2026-Q1-IFTA-FILING',
  },
  {
    type: 'CARRIER_MCS_150',
    scope: 'CARRIER',
    title: 'MCS-150 (Biennial FMCSA Update)',
    defaultLeadDays: 60,
    hasExpiry: true,
    frequency: 'Every 2 Years',
    regulatoryCode: '49 CFR § 390.19',
    description: 'Mandatory biennial motor carrier identification report update schedule based on USDOT number.',
    placeholderRef: 'e.g. MCS150-CONF-99214',
  },
  {
    type: 'CARRIER_UCR',
    scope: 'CARRIER',
    title: 'UCR (Unified Carrier Registration)',
    defaultLeadDays: 45,
    hasExpiry: true,
    frequency: 'Annual (Calendar Year)',
    regulatoryCode: '49 U.S.C. § 14504a',
    description: 'Annual interstate carrier registration fee payment receipt across participating states.',
    placeholderRef: 'e.g. UCR-2026-99410',
  },
  {
    type: 'CARRIER_BOC_3',
    scope: 'CARRIER',
    title: 'Process Agent (BOC-3 Filing)',
    defaultLeadDays: 0,
    hasExpiry: false,
    frequency: 'Permanent / Active',
    regulatoryCode: '49 CFR Part 366',
    description: 'Blanket designation of process agents on file with the FMCSA in all 50 US states.',
    placeholderRef: 'e.g. Agency: National Resident Agent',
  },
  {
    type: 'CARRIER_SCAC',
    scope: 'CARRIER',
    title: 'SCAC (Standard Carrier Alpha Code)',
    defaultLeadDays: 45,
    hasExpiry: true,
    frequency: 'Annual (NMFTA)',
    regulatoryCode: 'NMFTA SCAC Rules',
    description: 'Unique two-to-four letter code used to identify transportation companies in freight systems.',
    placeholderRef: 'e.g. SCAC: STAI',
  },
  {
    type: 'CARRIER_HAZMAT_CERTIFICATE',
    scope: 'CARRIER',
    title: 'HAZMAT Certificate (PHMSA)',
    defaultLeadDays: 60,
    hasExpiry: true,
    frequency: 'Annual or 3-Year',
    regulatoryCode: '49 CFR Part 107',
    description: 'Pipeline and Hazardous Materials Safety Administration (PHMSA) hazmat transport registration.',
    placeholderRef: 'e.g. PHMSA Reg #042926 550 098Y',
  },
  {
    type: 'CARRIER_STATE_WEIGHT_DISTANCE',
    scope: 'CARRIER',
    title: 'State Weight-Distance Permits (NY HUT, NM WD, KY KYU, OR HWY)',
    defaultLeadDays: 45,
    hasExpiry: true,
    frequency: 'Annual / Quarterly',
    regulatoryCode: 'NY/NM/KY/OR State Tax',
    description: 'Active weight-distance tax accounts & permits for New York (HUT), New Mexico (WD), Kentucky (KYU), and Oregon (HWY).',
    placeholderRef: 'e.g. KYU: 99420 | NY HUT: 882194',
    extraFieldType: 'STATES',
  },
  {
    type: 'CARRIER_AUTO_LIABILITY_INSURANCE',
    scope: 'CARRIER',
    title: 'Auto / Commercial Public Liability',
    defaultLeadDays: 45,
    hasExpiry: true,
    frequency: 'Annual Policy',
    regulatoryCode: '49 CFR § 387.9 ($1M CSL)',
    description: 'Primary public liability insurance policy meeting federal $750,000 to $5,000,000 minimum limits.',
    placeholderRef: 'e.g. Policy #TRV-COMM-99214',
  },
  {
    type: 'CARRIER_MCS_90',
    scope: 'CARRIER',
    title: 'Form MCS-90 Endorsement',
    defaultLeadDays: 45,
    hasExpiry: true,
    frequency: 'Coterminous with Policy',
    regulatoryCode: '49 CFR § 387.7(d)',
    description: 'Federally required endorsement for motor carrier policies of insurance for public liability.',
    placeholderRef: 'e.g. MCS90-ATTACHED-TRV',
  },
  {
    type: 'CARRIER_CARGO_INSURANCE',
    scope: 'CARRIER',
    title: 'Cargo Insurance Policy',
    defaultLeadDays: 45,
    hasExpiry: true,
    frequency: 'Annual Policy',
    regulatoryCode: 'Carrier Cargo Standard',
    description: 'Motor truck cargo coverage policy ($100k-$250k standard limit) protecting shippers against freight loss.',
    placeholderRef: 'e.g. Policy #CARGO-99210-CHUBB',
  },
  {
    type: 'CARRIER_IRP_ACCOUNT',
    scope: 'CARRIER',
    title: 'IRP Master Account Renewal',
    defaultLeadDays: 60,
    hasExpiry: true,
    frequency: 'Annual',
    regulatoryCode: 'IRP Plan Agreement',
    description: 'International Registration Plan master apportioned fleet account with the base jurisdiction DMV.',
    placeholderRef: 'e.g. IRP Account #TX-IRP-9924',
  },
];

// Helper to look up metadata
export function getItemMeta(type: string): ComplianceItemMeta | undefined {
  return COMPLIANCE_ITEMS_CATALOG.find((i) => i.type === type);
}

// ─── PROPS ──────────────────────────────────────────────────────────────────

interface RenewalsCenterProps {
  currentUser: ApiUser;
  showToast: (msg: string) => void;
}

export function RenewalsCenter({ currentUser, showToast }: RenewalsCenterProps) {
  // Role checks
  const isManager = currentUser.role === 'FLEET_MANAGER' || currentUser.role === 'MAINTENANCE_ADMIN';
  const isDriver = currentUser.role === 'DRIVER';
  const isMechanic = currentUser.role === 'MECHANIC';

  // Sub-tabs: All, Driver, Equipment, Carrier, Verification
  const defaultTab = isDriver ? 'driver' : isMechanic ? 'equipment' : 'all';
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'driver' | 'equipment' | 'carrier' | 'verification'>(defaultTab);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'HEALTHY'>('ALL');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState('');
  const [selectedAssetFilter, setSelectedAssetFilter] = useState('');

  // Data
  const [renewals, setRenewals] = useState<ApiComplianceRenewal[]>([]);
  const [summary, setSummary] = useState<any>({
    total: 0,
    criticalOverdue: 0,
    warning30d: 0,
    upcoming60d: 0,
    healthy: 0,
    pendingVerification: 0,
  });
  const [loading, setLoading] = useState(false);

  // Reference lookups
  const [drivers, setDrivers] = useState<ApiUser[]>([]);
  const [assets, setAssets] = useState<ApiAsset[]>([]);

  // Modals
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showMechanicModal, setShowMechanicModal] = useState(false);
  const [editingRenewal, setEditingRenewal] = useState<ApiComplianceRenewal | null>(null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ open: boolean; item: ApiComplianceRenewal | null; reason: string }>({
    open: false,
    item: null,
    reason: '',
  });

  // Master Form State
  const [formScope, setFormScope] = useState<'DRIVER' | 'EQUIPMENT' | 'CARRIER'>('DRIVER');
  const [formType, setFormType] = useState<string>('DRIVER_CDL');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDriverId, setFormDriverId] = useState('');
  const [formAssetId, setFormAssetId] = useState('');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formAlertLeadDays, setFormAlertLeadDays] = useState(30);
  const [formTargetMileage, setFormTargetMileage] = useState('');
  const [formReferenceNumber, setFormReferenceNumber] = useState('');
  const [formDocumentUrl, setFormDocumentUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formMvrSelfCertified, setFormMvrSelfCertified] = useState(false);

  // ── LOAD DATA ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allRenewals, sum, usersList, assetsList] = await Promise.all([
        apiGetComplianceRenewals(),
        apiGetRenewalsSummary().catch(() => null),
        apiGetUsers().catch(() => []),
        apiGetAssets().catch(() => []),
      ]);

      setRenewals(allRenewals || []);
      if (sum) setSummary(sum);
      setDrivers((usersList || []).filter((u: ApiUser) => u.role === 'DRIVER'));
      setAssets(assetsList || []);
    } catch (err: any) {
      console.error('Failed to load renewals data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update form defaults when type changes
  const handleTypeSelect = (typeKey: string) => {
    setFormType(typeKey);
    const meta = getItemMeta(typeKey);
    if (meta) {
      setFormTitle(meta.title);
      setFormDescription(meta.description);
      setFormAlertLeadDays(meta.defaultLeadDays);
    }
  };

  // Open Master Edit Modal
  const openEditModal = (item: ApiComplianceRenewal) => {
    setEditingRenewal(item);
    setFormScope(item.scope);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormDriverId(item.driverId || '');
    setFormAssetId(item.assetId || '');
    setFormIssueDate(item.issueDate ? item.issueDate.split('T')[0] : '');
    setFormExpiryDate(item.expiryDate ? item.expiryDate.split('T')[0] : '');
    setFormAlertLeadDays(item.alertLeadDays || 30);
    setFormTargetMileage(item.targetMileage ? String(item.targetMileage) : '');
    setFormReferenceNumber(item.referenceNumber || '');
    setFormDocumentUrl(item.documentUrl || '');
    setFormNotes(item.notes || '');
    setShowMasterModal(true);
  };

  // Open Master New Modal
  const openNewModal = (defaultScope: 'DRIVER' | 'EQUIPMENT' | 'CARRIER' = 'DRIVER') => {
    setEditingRenewal(null);
    setFormScope(defaultScope);
    const firstItem = COMPLIANCE_ITEMS_CATALOG.find((i) => i.scope === defaultScope) || COMPLIANCE_ITEMS_CATALOG[0];
    setFormType(firstItem.type);
    setFormTitle(firstItem.title);
    setFormDescription(firstItem.description);
    setFormAlertLeadDays(firstItem.defaultLeadDays);
    setFormDriverId('');
    setFormAssetId('');
    setFormIssueDate('');
    setFormExpiryDate('');
    setFormTargetMileage('');
    setFormReferenceNumber('');
    setFormDocumentUrl('');
    setFormNotes('');
    setFormMvrSelfCertified(false);
    setShowMasterModal(true);
  };

  // Open Driver Self-Service Modal
  const openDriverSelfService = () => {
    setEditingRenewal(null);
    setFormScope('DRIVER');
    setFormType('DRIVER_CDL');
    const meta = getItemMeta('DRIVER_CDL')!;
    setFormTitle(meta.title);
    setFormDescription(meta.description);
    setFormDriverId(currentUser.id);
    setFormIssueDate('');
    setFormExpiryDate('');
    setFormAlertLeadDays(60);
    setFormReferenceNumber('');
    setFormDocumentUrl('');
    setFormNotes('');
    setFormMvrSelfCertified(false);
    setShowDriverModal(true);
  };

  // Open Mechanic Equipment Modal
  const openMechanicEquipmentModal = () => {
    setEditingRenewal(null);
    setFormScope('EQUIPMENT');
    setFormType('EQUIPMENT_DOT_ANNUAL_INSPECTION');
    const meta = getItemMeta('EQUIPMENT_DOT_ANNUAL_INSPECTION')!;
    setFormTitle(meta.title);
    setFormDescription(meta.description);
    setFormAssetId(assets[0]?.id || '');
    setFormIssueDate(new Date().toISOString().split('T')[0]);
    // Default 1 year out
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setFormExpiryDate(nextYear.toISOString().split('T')[0]);
    setFormAlertLeadDays(30);
    setFormTargetMileage('');
    setFormReferenceNumber('');
    setFormDocumentUrl('');
    setFormNotes('');
    setShowMechanicModal(true);
  };

  // ── SUBMIT HANDLERS ───────────────────────────────────────────────────────

  // Master Save (Admin/Fleet Manager)
  const handleMasterSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiSaveComplianceRenewalAdmin({
        id: editingRenewal?.id,
        scope: formScope,
        type: formType,
        title: formTitle,
        description: formDescription,
        driverId: formScope === 'DRIVER' ? formDriverId || null : null,
        assetId: formScope === 'EQUIPMENT' ? formAssetId || null : null,
        issueDate: formIssueDate || null,
        expiryDate: formExpiryDate || null,
        alertLeadDays: Number(formAlertLeadDays) || 30,
        targetMileage: formTargetMileage ? Number(formTargetMileage) : null,
        referenceNumber: formReferenceNumber || null,
        documentUrl: formDocumentUrl || null,
        notes: formNotes || null,
      });
      showToast(editingRenewal ? 'Compliance renewal updated successfully!' : 'New compliance record added!');
      setShowMasterModal(false);
      setEditingRenewal(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save renewal record');
    }
  };

  // Driver Submission
  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formType === 'DRIVER_ANNUAL_MVR_SELF_CERT' && !formMvrSelfCertified) {
      showToast('Please check the driver certification declaration under § 391.27 before submitting.');
      return;
    }
    try {
      await apiSubmitDriverRenewal({
        type: formType,
        title: formTitle,
        description: formDescription,
        driverId: currentUser.id,
        issueDate: formIssueDate || null,
        expiryDate: formExpiryDate || null,
        alertLeadDays: Number(formAlertLeadDays) || 30,
        referenceNumber: formReferenceNumber || null,
        documentUrl: formDocumentUrl || null,
        notes: formMvrSelfCertified
          ? `[Self-Certified by Driver]: "I certify under 49 CFR § 391.27 that I have disclosed all traffic violations or confirm zero violations in the preceding 12 months."\n${formNotes}`
          : formNotes,
      });
      showToast('Your credential has been submitted for Fleet Manager verification!');
      setShowDriverModal(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit credential');
    }
  };

  // Mechanic Submission
  const handleMechanicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAssetId) {
      showToast('Please choose the target vehicle / trailer.');
      return;
    }
    try {
      await apiSubmitEquipmentRenewal({
        type: formType,
        title: formTitle,
        description: formDescription,
        assetId: formAssetId,
        issueDate: formIssueDate || null,
        expiryDate: formExpiryDate || null,
        alertLeadDays: Number(formAlertLeadDays) || 30,
        targetMileage: formTargetMileage ? Number(formTargetMileage) : null,
        referenceNumber: formReferenceNumber || null,
        documentUrl: formDocumentUrl || null,
        notes: formNotes || null,
      });
      showToast('Equipment inspection record logged and verified!');
      setShowMechanicModal(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to log equipment inspection');
    }
  };

  // Delete Renewal
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await apiDeleteComplianceRenewal(id);
      showToast('Compliance record deleted.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete record');
    }
  };

  // Manager Verify / Approve
  const handleVerify = async (id: string, approved: boolean, reason?: string) => {
    try {
      await apiVerifyComplianceRenewal(id, approved, reason);
      showToast(approved ? 'Compliance credential verified and approved!' : 'Credential rejected.');
      setRejectModal({ open: false, item: null, reason: '' });
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to verify credential');
    }
  };

  // ── FILTERING LOGIC ───────────────────────────────────────────────────────

  const filteredRenewals = useMemo(() => {
    return renewals.filter((item) => {
      // Sub-tab filter
      if (activeSubTab === 'driver' && item.scope !== 'DRIVER') return false;
      if (activeSubTab === 'equipment' && item.scope !== 'EQUIPMENT') return false;
      if (activeSubTab === 'carrier' && item.scope !== 'CARRIER') return false;
      if (activeSubTab === 'verification' && item.verificationStatus !== 'PENDING_VERIFICATION') return false;

      // Urgency filter
      if (urgencyFilter === 'CRITICAL' && item.urgency !== 'CRITICAL') return false;
      if (urgencyFilter === 'WARNING' && item.urgency !== 'WARNING' && item.urgency !== 'INFO') return false;
      if (urgencyFilter === 'HEALTHY' && item.urgency !== 'OK' && item.urgency !== 'NO_EXPIRY') return false;

      // Entity filters
      if (selectedDriverFilter && item.driverId !== selectedDriverFilter) return false;
      if (selectedAssetFilter && item.assetId !== selectedAssetFilter) return false;

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesType = item.type?.toLowerCase().includes(q);
        const matchesRef = item.referenceNumber?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesDriver = item.driverName?.toLowerCase().includes(q);
        const matchesAsset = item.assetName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesType && !matchesRef && !matchesDesc && !matchesDriver && !matchesAsset) {
          return false;
        }
      }

      return true;
    });
  }, [renewals, activeSubTab, urgencyFilter, selectedDriverFilter, selectedAssetFilter, searchTerm]);

  // Counts for sub-tabs
  const driverCount = renewals.filter((r) => r.scope === 'DRIVER').length;
  const equipmentCount = renewals.filter((r) => r.scope === 'EQUIPMENT').length;
  const carrierCount = renewals.filter((r) => r.scope === 'CARRIER').length;
  const pendingCount = renewals.filter((r) => r.verificationStatus === 'PENDING_VERIFICATION').length;

  // ── EXPORT AUDIT REPORT ───────────────────────────────────────────────────

  const handleExportComplianceReport = () => {
    const headers = [
      'Scope',
      'Compliance Item',
      'Entity / Subject',
      'Reference #',
      'Issue Date',
      'Expiry Date',
      'Days Left',
      'Urgency',
      'Status',
      'Entered By',
      'Verified By',
      'Notes',
    ];

    const rows = filteredRenewals.map((r) => [
      r.scope,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${(r.scope === 'DRIVER' ? r.driverName || 'Driver' : r.scope === 'EQUIPMENT' ? r.assetName || 'Equipment' : 'Carrier Legal').replace(/"/g, '""')}"`,
      `"${(r.referenceNumber || 'N/A').replace(/"/g, '""')}"`,
      r.issueDate ? r.issueDate.split('T')[0] : 'N/A',
      r.expiryDate ? r.expiryDate.split('T')[0] : 'No Expiry',
      r.daysLeft !== null && r.daysLeft !== undefined ? r.daysLeft : 'N/A',
      r.urgency || 'OK',
      r.verificationStatus,
      `"${(r.enteredByName || 'System').replace(/"/g, '""')}"`,
      `"${(r.verifiedByName || 'N/A').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FMCSA_DOT_Compliance_Renewals_Matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Official DOT / Carrier Compliance Matrix exported to CSV!');
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── HEADER & MASTER ACTION BAR ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-[#00BA7C] rounded-xl border border-emerald-100">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Renewal Alerts & FMCSA Compliance Matrix
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  33 Item DOT Standard
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Role-based compliance ledger covering Driver Credentials (9), Equipment DOT Inspections (8), and Carrier Regulatory Filings (16).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons based on User Role */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh Ledger"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportComplianceReport}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
          >
            <Download className="h-4 w-4 text-slate-500" /> Export Matrix CSV
          </button>

          {/* DRIVER Action */}
          {(isDriver || isManager) && (
            <button
              onClick={openDriverSelfService}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <User className="h-4 w-4" /> Upload My Credential
            </button>
          )}

          {/* MECHANIC Action */}
          {(isMechanic || isManager) && (
            <button
              onClick={openMechanicEquipmentModal}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Truck className="h-4 w-4" /> Log Equipment Inspection
            </button>
          )}

          {/* FLEET MANAGER Universal Add Button */}
          {isManager && (
            <button
              onClick={() => openNewModal('DRIVER')}
              className="px-4 py-2.5 bg-[#00BA7C] hover:bg-[#009b67] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Master Renewal
            </button>
          )}
        </div>
      </div>

      {/* ── KPI COUNTERS BAR ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Critical / Overdue */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={`cursor-pointer p-4 rounded-2xl border transition shadow-xs ${
            urgencyFilter === 'CRITICAL' ? 'bg-red-100 border-red-300 ring-2 ring-red-400' : 'bg-red-50 border-red-200 hover:bg-red-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Critical / Overdue</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-700 mt-2">
            {summary.criticalOverdue || renewals.filter((r) => r.urgency === 'CRITICAL').length}
          </div>
          <div className="text-[10px] text-red-600 font-semibold mt-0.5">Expired or ≤ 7 days</div>
        </div>

        {/* Action Needed (≤ 30d) */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'WARNING' ? 'ALL' : 'WARNING')}
          className={`cursor-pointer p-4 rounded-2xl border transition shadow-xs ${
            urgencyFilter === 'WARNING' ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-400' : 'bg-amber-50 border-amber-200 hover:bg-amber-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Action Needed</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {summary.warning30d || renewals.filter((r) => r.urgency === 'WARNING' || r.urgency === 'INFO').length}
          </div>
          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Expiring within 30 days</div>
        </div>

        {/* Upcoming (31-60d) */}
        <div className="p-4 rounded-2xl border bg-yellow-50 border-yellow-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-800">Upcoming Horizon</span>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-black text-yellow-800 mt-2">
            {summary.upcoming60d || renewals.filter((r) => (r.daysLeft ?? 0) > 30 && (r.daysLeft ?? 0) <= 60).length}
          </div>
          <div className="text-[10px] text-yellow-700 font-semibold mt-0.5">Expiring in 31-60 days</div>
        </div>

        {/* Healthy & No Expiry */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'HEALTHY' ? 'ALL' : 'HEALTHY')}
          className={`cursor-pointer p-4 rounded-2xl border transition shadow-xs ${
            urgencyFilter === 'HEALTHY' ? 'bg-emerald-100 border-emerald-300 ring-2 ring-emerald-400' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Current / Permanent</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {summary.healthy || renewals.filter((r) => r.urgency === 'OK' || r.urgency === 'NO_EXPIRY').length}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Compliant / No Expiry</div>
        </div>

        {/* Pending Manager Verification */}
        <div
          onClick={() => setActiveSubTab('verification')}
          className={`cursor-pointer p-4 rounded-2xl border transition shadow-xs ${
            activeSubTab === 'verification' ? 'bg-indigo-100 border-indigo-300 ring-2 ring-indigo-400' : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Pending Review</span>
            <FileCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-2">
            {pendingCount}
          </div>
          <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">Awaiting Manager Signoff</div>
        </div>

        {/* Total Ledger Count */}
        <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Total Tracked</span>
            <Shield className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {renewals.length}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Across Driver/Equip/Carrier</div>
        </div>
      </div>

      {/* ── SUB-TABS & SEARCH FILTER BAR ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Sub Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => { setActiveSubTab('all'); setUrgencyFilter('ALL'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Renewals
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-200">{renewals.length}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('driver')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'driver'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
              }`}
            >
              <User className="h-3.5 w-3.5" /> Driver Credentials (9)
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSubTab === 'driver' ? 'bg-sky-700 text-sky-100' : 'bg-slate-100 text-slate-600'}`}>{driverCount}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('equipment')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'equipment'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <Truck className="h-3.5 w-3.5" /> Equipment & Inspections (8)
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSubTab === 'equipment' ? 'bg-purple-700 text-purple-100' : 'bg-slate-100 text-slate-600'}`}>{equipmentCount}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('carrier')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'carrier'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" /> Carrier Regulatory & Permits (16)
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSubTab === 'carrier' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600'}`}>{carrierCount}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('verification')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'verification'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              <FileCheck className="h-3.5 w-3.5" /> Verification Queue
              {pendingCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500 text-white animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* Quick Notice */}
          <div className="text-[11px] text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredRenewals.length}</strong> compliance records
          </div>
        </div>

        {/* Search & Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, reference #, entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BA7C] text-xs font-medium"
            />
          </div>

          {/* Driver Filter */}
          <div>
            <select
              value={selectedDriverFilter}
              onChange={(e) => setSelectedDriverFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00BA7C] text-xs font-medium"
            >
              <option value="">-- All Assigned Drivers --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  👤 {d.name} ({d.email})
                </option>
              ))}
            </select>
          </div>

          {/* Asset Filter */}
          <div>
            <select
              value={selectedAssetFilter}
              onChange={(e) => setSelectedAssetFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00BA7C] text-xs font-medium"
            >
              <option value="">-- All Equipment / Assets --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  🚛 {a.name} ({a.plateNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00BA7C] text-xs font-medium"
            >
              <option value="ALL">Status: All Urgency Levels</option>
              <option value="CRITICAL">🚨 Critical / Overdue (≤ 7 days)</option>
              <option value="WARNING">⚠️ Action Needed (≤ 30 days)</option>
              <option value="HEALTHY">✅ Compliant / Permanent</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── COMPLIANCE RECORDS LISTING ── */}
      <div className="space-y-3">
        {filteredRenewals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No matching compliance renewals</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              No items match the active filters or scope. Use the action buttons above to log driver credentials, equipment inspections, or carrier filings.
            </p>
          </div>
        ) : (
          filteredRenewals.map((item) => {
            const meta = getItemMeta(item.type);
            const isCritical = item.urgency === 'CRITICAL';
            const isWarning = item.urgency === 'WARNING' || item.urgency === 'INFO';
            const isPending = item.verificationStatus === 'PENDING_VERIFICATION';

            // Card border & badge colors based on urgency
            const cardBg = isCritical
              ? 'bg-red-50/40 border-red-200'
              : isWarning
              ? 'bg-amber-50/30 border-amber-200'
              : 'bg-white border-slate-200';

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition shadow-xs hover:shadow-sm ${cardBg} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}
              >
                {/* Left: Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Scope Pill */}
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        item.scope === 'DRIVER'
                          ? 'bg-sky-100 text-sky-800 border-sky-300'
                          : item.scope === 'EQUIPMENT'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {item.scope}
                    </span>

                    {/* Verification Status Pill */}
                    {isPending ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Clock className="h-3 w-3 animate-spin text-amber-600" /> Pending Manager Verification
                      </span>
                    ) : item.verificationStatus === 'REJECTED' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-600" /> Rejected ({item.rejectionReason || 'See notes'})
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Verified
                      </span>
                    )}

                    {/* Regulatory Code Tag */}
                    {meta?.regulatoryCode && (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {meta.regulatoryCode}
                      </span>
                    )}

                    {/* Assigned Entity */}
                    {item.scope === 'DRIVER' && item.driverName && (
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <User className="h-3 w-3 text-sky-600" /> {item.driverName}
                      </span>
                    )}
                    {item.scope === 'EQUIPMENT' && item.assetName && (
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Truck className="h-3 w-3 text-purple-600" /> {item.assetName}
                      </span>
                    )}
                    {item.scope === 'CARRIER' && (
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-emerald-600" /> Fleet Operating Authority
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      {item.title}
                      {item.referenceNumber && (
                        <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          #{item.referenceNumber}
                        </span>
                      )}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                    )}
                  </div>

                  {/* Dates & Timeline */}
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-600 flex-wrap pt-1">
                    {item.issueDate && (
                      <div>
                        <span className="text-slate-400 font-sans">Issued:</span> {item.issueDate.split('T')[0]}
                      </div>
                    )}

                    {item.expiryDate ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-sans">Expires:</span> {item.expiryDate.split('T')[0]}
                        {item.daysLeft !== null && item.daysLeft !== undefined && (
                          <span
                            className={`font-bold px-2 py-0.2 rounded-full text-[10px] font-sans ${
                              item.daysLeft < 0
                                ? 'bg-red-600 text-white'
                                : item.daysLeft <= 7
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : item.daysLeft <= 30
                                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            }`}
                          >
                            {item.daysLeft < 0
                              ? `${Math.abs(item.daysLeft)} days overdue`
                              : item.daysLeft === 0
                              ? 'Expires today'
                              : `${item.daysLeft} days remaining`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-sans font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Permanent / No Expiration
                      </span>
                    )}

                    {item.targetMileage && (
                      <div className="text-purple-700 font-bold">
                        Target Mileage: {item.targetMileage.toLocaleString()} mi
                      </div>
                    )}
                  </div>

                  {/* Audit Trail Note */}
                  <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2 pt-1 border-t border-slate-100">
                    <span>
                      Entered by: <strong className="text-slate-600">{item.enteredByName}</strong> ({item.enteredByRole})
                    </span>
                    {item.verifiedByName && (
                      <>
                        <span>•</span>
                        <span>
                          Verified by: <strong className="text-emerald-700">{item.verifiedByName}</strong>
                        </span>
                      </>
                    )}
                    {item.notes && (
                      <>
                        <span>•</span>
                        <span className="italic truncate max-w-sm">"{item.notes}"</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                  {/* Document URL link */}
                  {item.documentUrl && (
                    <a
                      href={item.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                      title="View Attached Compliance Document"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-blue-600" /> View Doc
                    </a>
                  )}

                  {/* Manager Verify / Reject Quick Actions */}
                  {isManager && isPending && (
                    <>
                      <button
                        onClick={() => handleVerify(item.id, true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
                        title="Approve & Verify"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => setRejectModal({ open: true, item, reason: '' })}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
                        title="Reject with note"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </>
                  )}

                  {/* Fleet Manager Master Edit */}
                  {isManager && (
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                      title="Edit Compliance Record"
                    >
                      <Edit3 className="h-4 w-4 text-slate-600" />
                    </button>
                  )}

                  {/* Fleet Manager Delete */}
                  {isManager && (
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition border border-red-200"
                      title="Delete Record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── STATE WEIGHT-DISTANCE & PERMITS QUICK REFERENCE CARD ── */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-emerald-600" />
          <h4 className="text-sm font-bold text-slate-900">Mandatory State Weight-Distance & Road Tax Accounts</h4>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase">
            DOT & State Regulated
          </span>
        </div>
        <p className="text-xs text-slate-500">
          The four key states requiring independent motor carrier registration and mileage reporting separate from standard IFTA.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-center">
            <div className="font-black text-base text-slate-800">New York (HUT)</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-1">Highway Use Tax Decal & Quarterly Return</div>
          </div>
          <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-center">
            <div className="font-black text-base text-slate-800">New Mexico (WD)</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-1">Weight-Distance Tax Identification Permit</div>
          </div>
          <div className="p-3 rounded-xl border bg-red-50 border-red-200 text-center">
            <div className="font-black text-base text-red-700">Kentucky (KYU)</div>
            <div className="text-[10px] text-red-600 font-semibold mt-1">KYU Number & Quarterly Mileage Reporting</div>
          </div>
          <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-center">
            <div className="font-black text-base text-slate-800">Oregon (HWY)</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-1">Weight-Mile Tax Bond & Monthly Mileage</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 1: FLEET MANAGER MASTER ADD / EDIT MODAL (ALL 33 ITEMS)
         ═══════════════════════════════════════════════════════════════════════ */}
      {showMasterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#00BA7C]" />
                  {editingRenewal ? 'Edit Compliance Renewal Record' : 'Add Compliance Renewal (Master Form)'}
                </h3>
                <p className="text-xs text-slate-500">
                  Fleet Manager Master Control across Driver, Equipment, and Carrier Regulatory domains.
                </p>
              </div>
              <button
                onClick={() => { setShowMasterModal(false); setEditingRenewal(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleMasterSave} className="space-y-4 text-xs">
              {/* Scope Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Compliance Domain / Scope *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['DRIVER', 'EQUIPMENT', 'CARRIER'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setFormScope(s);
                        const firstItem = COMPLIANCE_ITEMS_CATALOG.find((i) => i.scope === s) || COMPLIANCE_ITEMS_CATALOG[0];
                        handleTypeSelect(firstItem.type);
                      }}
                      className={`py-2 rounded-xl font-bold border transition ${
                        formScope === s
                          ? s === 'DRIVER'
                            ? 'bg-sky-600 text-white border-sky-600'
                            : s === 'EQUIPMENT'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s === 'DRIVER' ? '👤 Driver (9)' : s === 'EQUIPMENT' ? '🚛 Equipment (8)' : '🏢 Carrier (16)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Item Type Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Compliance Item (from 33 Standard Checklist) *</label>
                <select
                  value={formType}
                  onChange={(e) => handleTypeSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold text-xs focus:ring-2 focus:ring-[#00BA7C]"
                >
                  {COMPLIANCE_ITEMS_CATALOG.filter((i) => i.scope === formScope).map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.title} {item.regulatoryCode ? `— [${item.regulatoryCode}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entity Picker: Driver or Equipment */}
              {formScope === 'DRIVER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign to Driver *</label>
                  <select
                    value={formDriverId}
                    onChange={(e) => setFormDriverId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium text-xs focus:ring-2 focus:ring-[#00BA7C]"
                    required
                  >
                    <option value="">-- Choose Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formScope === 'EQUIPMENT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign to Vehicle / Trailer *</label>
                  <select
                    value={formAssetId}
                    onChange={(e) => setFormAssetId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium text-xs focus:ring-2 focus:ring-[#00BA7C]"
                    required
                  >
                    <option value="">-- Choose Equipment --</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.plateNumber} / VIN: {a.vin})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title & Reference # */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title / Headline *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium text-xs focus:ring-2 focus:ring-[#00BA7C]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reference / Decal / Document #</label>
                  <input
                    type="text"
                    placeholder={getItemMeta(formType)?.placeholderRef || 'e.g. Policy or Certificate #'}
                    value={formReferenceNumber}
                    onChange={(e) => setFormReferenceNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium text-xs focus:ring-2 focus:ring-[#00BA7C]"
                  />
                </div>
              </div>

              {/* Dates & Lead Days */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue / Effective Date</label>
                  <input
                    type="date"
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-[#00BA7C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expiration Date {getItemMeta(formType)?.hasExpiry ? '*' : '(Leave blank if No Expiry)'}
                  </label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-[#00BA7C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alert Notice Lead (Days)</label>
                  <input
                    type="number"
                    value={formAlertLeadDays}
                    onChange={(e) => setFormAlertLeadDays(parseInt(e.target.value) || 30)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-[#00BA7C]"
                  />
                </div>
              </div>

              {/* Target Mileage (for PM) */}
              {formType === 'EQUIPMENT_PM_SERVICE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Next Service Target Mileage</label>
                  <input
                    type="number"
                    placeholder="e.g. 150000"
                    value={formTargetMileage}
                    onChange={(e) => setFormTargetMileage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-[#00BA7C]"
                  />
                </div>
              )}

              {/* Document URL / Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Attachment URL / Cloud Scan</label>
                <input
                  type="text"
                  placeholder="https://... or /uploads/... (PDF, PNG, Scanned Certificate)"
                  value={formDocumentUrl}
                  onChange={(e) => setFormDocumentUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-[#00BA7C]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Regulatory Explanations</label>
                <textarea
                  rows={2}
                  placeholder="Additional audit notes, underwriting references, or inspection findings..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 text-xs focus:ring-2 focus:ring-[#00BA7C]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowMasterModal(false); setEditingRenewal(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00BA7C] hover:bg-[#009b67] text-white rounded-xl font-bold transition text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> {editingRenewal ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2: DRIVER SELF-SERVICE CREDENTIAL SUBMISSION
         ═══════════════════════════════════════════════════════════════════════ */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-sky-600" /> Driver Credential Self-Submission
                </h3>
                <p className="text-xs text-slate-500">
                  Submit your CDL, Medical Card, TWIC, or Annual MVR Self-Cert for fleet manager verification.
                </p>
              </div>
              <button
                onClick={() => setShowDriverModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDriverSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Credential Type *</label>
                <select
                  value={formType}
                  onChange={(e) => handleTypeSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold text-xs focus:ring-2 focus:ring-sky-600"
                >
                  {COMPLIANCE_ITEMS_CATALOG.filter((i) => i.scope === 'DRIVER').map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Guidance Banner for MVR Self-Cert */}
              {formType === 'DRIVER_ANNUAL_MVR_SELF_CERT' && (
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sky-900 space-y-2">
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-sky-600" /> FMCSA 49 CFR § 391.27 Certificate of Violations
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Federal regulations require all commercial motor vehicle drivers to furnish their employing carrier with a certified list of all traffic law violations or certify zero violations for the preceding 12 months.
                  </p>
                  <label className="flex items-start gap-2 pt-1 font-semibold text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formMvrSelfCertified}
                      onChange={(e) => setFormMvrSelfCertified(e.target.checked)}
                      className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>
                      I hereby certify under penalty of law that I have listed below all violations (or confirm zero violations) and that my driving privileges are in good standing.
                    </span>
                  </label>
                </div>
              )}

              {/* Reference # */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">License / Certificate / Specimen # *</label>
                <input
                  type="text"
                  placeholder={getItemMeta(formType)?.placeholderRef || 'e.g. CDL or Specimen Number'}
                  value={formReferenceNumber}
                  onChange={(e) => setFormReferenceNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium text-xs focus:ring-2 focus:ring-sky-600"
                  required
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-sky-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expiration Date {getItemMeta(formType)?.hasExpiry ? '*' : ''}
                  </label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-sky-600"
                    required={getItemMeta(formType)?.hasExpiry}
                  />
                </div>
              </div>

              {/* Document URL or upload path */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Link / Cloud Scan Link</label>
                <input
                  type="text"
                  placeholder="https://... or paste scan URL of your license / card"
                  value={formDocumentUrl}
                  onChange={(e) => setFormDocumentUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-sky-600"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Disclosures for Fleet Manager</label>
                <textarea
                  rows={2}
                  placeholder="Enter any state restrictions, endorsements, or notes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 text-xs focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition text-xs shadow-sm flex items-center gap-1.5"
                >
                  <UploadCloud className="h-4 w-4" /> Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 3: MECHANIC EQUIPMENT INSPECTION LOGGING
         ═══════════════════════════════════════════════════════════════════════ */}
      {showMechanicModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-purple-600" /> Mechanic Equipment Compliance Entry
                </h3>
                <p className="text-xs text-slate-500">
                  Record Annual DOT § 396.17 Inspections, IFTA Decals, Form 2290, and PM Service intervals.
                </p>
              </div>
              <button
                onClick={() => setShowMechanicModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleMechanicSubmit} className="space-y-4 text-xs">
              {/* Target Equipment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Power Unit / Trailer *</label>
                <select
                  value={formAssetId}
                  onChange={(e) => setFormAssetId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold text-xs focus:ring-2 focus:ring-purple-600"
                  required
                >
                  <option value="">-- Select Asset --</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.plateNumber} · ODO: {a.odometer?.toLocaleString()} mi)
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Equipment Compliance Item *</label>
                <select
                  value={formType}
                  onChange={(e) => handleTypeSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold text-xs focus:ring-2 focus:ring-purple-600"
                >
                  {COMPLIANCE_ITEMS_CATALOG.filter((i) => i.scope === 'EQUIPMENT').map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sticker / Decal / Cert Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Decal / Certificate / Sticker # *</label>
                <input
                  type="text"
                  placeholder={getItemMeta(formType)?.placeholderRef || 'e.g. Decal Serial #'}
                  value={formReferenceNumber}
                  onChange={(e) => setFormReferenceNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium text-xs focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inspection / Service Date</label>
                  <input
                    type="date"
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Decal / Certification Expiration Date</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Target Mileage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Next Service Due Mileage (Miles)</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={formTargetMileage}
                  onChange={(e) => setFormTargetMileage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Document Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brake Sheet / Inspection Certificate Scan Link</label>
                <input
                  type="text"
                  placeholder="https://... (Link to signed 43-point DOT inspection sheet)"
                  value={formDocumentUrl}
                  onChange={(e) => setFormDocumentUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mechanic Notes / Inspector Certification #</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Inspected by Shop #402. All brakes > 16/32, steer tires new, air system hold test passed."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 text-xs focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMechanicModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Save Equipment Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 4: REJECT SUBMISSION WITH NOTES (FLEET MANAGER)
         ═══════════════════════════════════════════════════════════════════════ */}
      {rejectModal.open && rejectModal.item && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-black text-red-600 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" /> Reject Compliance Credential
              </h3>
              <button
                onClick={() => setRejectModal({ open: false, item: null, reason: '' })}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide a clear reason for rejecting <strong>{rejectModal.item.title}</strong> submitted by {rejectModal.item.enteredByName}.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Scanned image is illegible; expiration date does not match official MCSA-5876; missing doctor signature."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-red-500"
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, item: null, reason: '' })}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleVerify(rejectModal.item!.id, false, rejectModal.reason)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

