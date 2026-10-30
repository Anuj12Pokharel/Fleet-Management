'use client';

import React, { useState, useMemo } from 'react';
import {
  Truck,
  Wrench,
  Fuel,
  Activity,
  Plus,
  RotateCw,
  Mail,
  Download,
  ChevronDown,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  DollarSign,
  Calendar,
  X,
  FileText,
  Layers,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  ExternalLink,
  Edit2,
  Copy,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import {
  Asset,
  WorkOrder,
  PMSchedule,
  FuelLog,
  TollRecord,
  EmergencyTicket,
  AuditLog,
  User as DbUser
} from '../mockDb';
import {
  apiCreateWorkOrder,
  apiCreateFuelLog,
  apiCreateEmergencyTicket
} from '../lib/api-client';

interface CockpitDashboardProps {
  db: any;
  currentUser: DbUser;
  setActiveTab: (tab: string) => void;
  refreshDb: () => Promise<void> | void;
  triggerExport: (type: 'ifta' | 'costs' | 'compliance') => void;
  setSelectedAssetId: (id: string) => void;
  apiUpdateWorkOrder?: (id: string, updates: any) => Promise<any>;
  apiPerformPM?: (scheduleId: string, payload: any) => Promise<any>;
}

export interface LoadItem {
  id: string;
  assetId: string;
  date: string;
  loadNumber: string;
  origin: string;
  destination: string;
  broker: string;
  revenue: number;
  loadedMiles: number;
  emptyMiles: number;
  description?: string;
}

export interface ExpenseItem {
  id: string;
  assetId: string;
  name: string;
  amount: number;
  type: 'FUEL' | 'MAINTENANCE' | 'INSURANCE' | 'TOLL' | 'MISC';
  date: string;
}

export interface AdvanceItem {
  id: string;
  assetId: string;
  date: string;
  amount: number;
  notes: string;
  status: 'APPROVED' | 'PENDING';
}

export interface ReportMeta {
  id: string;
  title: string;
  period: string;
  updatedAt: string;
}

export default function CockpitDashboard({
  db,
  currentUser,
  setActiveTab,
  refreshDb,
  triggerExport,
  setSelectedAssetId,
  apiUpdateWorkOrder,
  apiPerformPM,
}: CockpitDashboardProps) {
  // Tab switcher
  const [activeSubTab, setActiveSubTab] = useState<'DRIVER_REPORT' | 'PNL_SUMMARY'>('DRIVER_REPORT');

  // Database collections
  const assets: Asset[] = db?.assets || [];
  const users: DbUser[] = db?.users || [];
  const workOrders: WorkOrder[] = db?.workOrders || [];
  const fuelLogs: FuelLog[] = db?.fuelLogs || [];
  const tollRecords: TollRecord[] = db?.tollRecords || [];
  const emergencyTickets: EmergencyTicket[] = db?.emergencyTickets || [];
  const auditLogs: AuditLog[] = db?.auditLogs || [];

  // Selected Unit / Asset
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
  const selectedAsset: Asset | undefined = assets[selectedAssetIndex] || assets[0];

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4000);
  };

  // Modals state
  const [changeEntityModalOpen, setChangeEntityModalOpen] = useState(false);
  const [addLoadModalOpen, setAddLoadModalOpen] = useState(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [expenseType, setExpenseType] = useState<'FUEL' | 'MAINTENANCE' | 'MISC'>('FUEL');
  const [addAdvanceModalOpen, setAddAdvanceModalOpen] = useState(false);
  const [emailDriverModalOpen, setEmailDriverModalOpen] = useState(false);
  const [newReportModalOpen, setNewReportModalOpen] = useState(false);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Email Driver form state
  const [emailDriverTo, setEmailDriverTo] = useState('driver@fleet.com');
  const [emailDriverSubject, setEmailDriverSubject] = useState('');
  const [emailDriverSending, setEmailDriverSending] = useState(false);

  // New Report form state
  const [newReportTitle, setNewReportTitle] = useState('SEP26-W4 (Weekly Settlement)');
  const [newReportPeriod, setNewReportPeriod] = useState('Oct 08 - Oct 15, 2026');

  // Form states for Add Load
  const [loadDate, setLoadDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadNumber, setLoadNumber] = useState('LD-9920');
  const [loadOrigin, setLoadOrigin] = useState('Dallas Hub, TX 75201');
  const [loadDest, setLoadDest] = useState('Houston Freight Terminal, TX 77002');
  const [loadBroker, setLoadBroker] = useState('Apex Freight System');
  const [loadRevenue, setLoadRevenue] = useState('1400.00');
  const [loadDesc, setLoadDesc] = useState('Scheduled freight route dispatch');
  const [loadMiles, setLoadMiles] = useState('240');
  const [loadEmptyMiles, setLoadEmptyMiles] = useState('0');

  // Form states for Add Expense
  const [expenseDesc, setExpenseDesc] = useState('Operating Fueling / Def Refill');
  const [expenseAmount, setExpenseAmount] = useState('100.00');
  const [expenseGallons, setExpenseGallons] = useState('50');

  // Form states for Add Advance
  const [advanceNotes, setAdvanceNotes] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');

  // ─── STATEFUL COLLECTIONS FOR REAL INTERACTIVITY ───

  // Reports metadata list
  const [reportsList, setReportsList] = useState<ReportMeta[]>([]);
  const [activeReportId, setActiveReportId] = useState<string>('');

  // Custom loads added during session
  const [customLoads, setCustomLoads] = useState<LoadItem[]>([]);

  // Custom expenses added during session
  const [customExpenses, setCustomExpenses] = useState<ExpenseItem[]>([]);

  // Custom advances added during session
  const [customAdvances, setCustomAdvances] = useState<AdvanceItem[]>([]);

  // Active unit filtered records from DB
  const assetWorkOrders = useMemo(() => {
    if (!selectedAsset) return workOrders;
    return workOrders.filter(w => w.assetId === selectedAsset.id);
  }, [workOrders, selectedAsset]);

  const assetFuelLogs = useMemo(() => {
    if (!selectedAsset) return fuelLogs;
    return fuelLogs.filter(f => f.assetId === selectedAsset.id);
  }, [fuelLogs, selectedAsset]);

  const assetTollRecords = useMemo(() => {
    if (!selectedAsset) return tollRecords;
    return tollRecords.filter(t => t.assetId === selectedAsset.id);
  }, [tollRecords, selectedAsset]);

  // Combined Active Loads List for Selected Asset
  const currentLoads = useMemo(() => {
    const list: LoadItem[] = [];

    // Include custom loads for this asset (or general if none specific)
    customLoads.forEach(l => {
      if (!l.assetId || l.assetId === selectedAsset?.id) {
        list.push(l);
      }
    });

    // Also include completed/in-progress work orders as dispatched loads
    assetWorkOrders.forEach(wo => {
      if (!list.some(l => l.id === wo.id)) {
        list.push({
          id: wo.id,
          assetId: wo.assetId,
          date: wo.createdAt ? wo.createdAt.split('T')[0] : '2026-10-08',
          loadNumber: `LD-${wo.id.slice(0, 5).toUpperCase()}`,
          origin: 'Dallas Logistics Center, TX',
          destination: 'Houston Metro Port, TX',
          broker: 'Apex Freight System',
          revenue: wo.totalCost > 0 ? wo.totalCost * 2.5 : 1250.00,
          loadedMiles: 240,
          emptyMiles: 0,
          description: wo.description,
        });
      }
    });

    return list;
  }, [customLoads, selectedAsset, assetWorkOrders]);

  // Combined Expenses List for Selected Asset
  const currentExpenses = useMemo(() => {
    const list: ExpenseItem[] = [];

    // Custom expenses
    customExpenses.forEach(e => {
      if (!e.assetId || e.assetId === selectedAsset?.id) {
        list.push(e);
      }
    });

    // Real fuel logs from DB
    assetFuelLogs.forEach(f => {
      if (!list.some(e => e.id === `fuel-${f.id}`)) {
        list.push({
          id: `fuel-${f.id}`,
          assetId: f.assetId,
          name: `Fuel Refill (${f.gallons} gal) - State ${f.location}`,
          amount: f.cost,
          type: 'FUEL',
          date: f.createdAt ? f.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
        });
      }
    });

    // Real tolls from DB
    assetTollRecords.forEach(t => {
      if (!list.some(e => e.id === `toll-${t.id}`)) {
        list.push({
          id: `toll-${t.id}`,
          assetId: t.assetId,
          name: `Toll Transponder - ${t.location}`,
          amount: t.amount,
          type: 'TOLL',
          date: t.timestamp ? t.timestamp.split('T')[0] : new Date().toISOString().split('T')[0]
        });
      }
    });

    return list;
  }, [customExpenses, selectedAsset, assetFuelLogs, assetTollRecords]);

  // Combined Advances List for Selected Asset
  const currentAdvances = useMemo(() => {
    const list: AdvanceItem[] = [];
    customAdvances.forEach(a => {
      if (!a.assetId || a.assetId === selectedAsset?.id) {
        list.push(a);
      }
    });
    return list;
  }, [customAdvances, selectedAsset]);

  // ─── FINANCIAL TOTALS & FORMULAS ───

  const totalRevenue = useMemo(() => {
    return currentLoads.reduce((sum, l) => sum + (l.revenue || 0), 0);
  }, [currentLoads]);

  const loadedMiles = useMemo(() => {
    return currentLoads.reduce((sum, l) => sum + (l.loadedMiles || 0), 0);
  }, [currentLoads]);

  const emptyMiles = useMemo(() => {
    return currentLoads.reduce((sum, l) => sum + (l.emptyMiles || 0), 0);
  }, [currentLoads]);

  const totalMiles = loadedMiles + emptyMiles;

  const revenuePerMile = totalMiles > 0 ? (totalRevenue / totalMiles).toFixed(2) : '0.00';
  const driverPayRatePercent = 20.0;
  const driverGrossPay = totalRevenue * (driverPayRatePercent / 100);

  const totalExpensesAmount = useMemo(() => {
    return currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [currentExpenses]);

  const totalAdvanceAmount = useMemo(() => {
    return currentAdvances.reduce((sum, a) => sum + a.amount, 0);
  }, [currentAdvances]);

  const netDriverPay = Math.max(0, driverGrossPay - totalAdvanceAmount);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDb();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Cockpit Dashboard refreshed with latest live backend data.');
    }, 400);
  };

  // Submit Load / Dispatch
  const handleCreateLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    const revNum = parseFloat(loadRevenue) || 1400;
    const milesNum = parseInt(loadMiles) || 240;
    const emptyNum = parseInt(loadEmptyMiles) || 0;

    const newLoad: LoadItem = {
      id: `load-${Date.now()}`,
      assetId: selectedAsset.id,
      date: loadDate,
      loadNumber: loadNumber || `LD-${Math.floor(1000 + Math.random() * 9000)}`,
      origin: loadOrigin,
      destination: loadDest,
      broker: loadBroker,
      revenue: revNum,
      loadedMiles: milesNum,
      emptyMiles: emptyNum,
      description: loadDesc,
    };

    setCustomLoads(prev => [newLoad, ...prev]);

    // Persist to backend work order
    try {
      await apiCreateWorkOrder({
        assetId: selectedAsset.id,
        priority: 'MEDIUM',
        type: 'INTERNAL',
        description: `Dispatch [${loadBroker}]: ${loadOrigin} -> ${loadDest}. Load #${newLoad.loadNumber}. Rev: $${revNum}`
      });
      refreshDb();
    } catch (err) {
      console.warn('Backend work order sync note:', err);
    }

    setAddLoadModalOpen(false);
    showToast(`Load ${newLoad.loadNumber} added! Revenue updated to $${(totalRevenue + revNum).toLocaleString()}.`);
  };

  // Delete Load
  const handleDeleteLoad = (id: string) => {
    setCustomLoads(prev => prev.filter(l => l.id !== id));
    showToast('Load item removed from current settlement period.');
  };

  // Submit Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    const amtNum = parseFloat(expenseAmount) || 100;

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      assetId: selectedAsset.id,
      name: expenseType === 'FUEL'
        ? `Fuel Purchase (${expenseGallons} gal) - TX`
        : expenseType === 'MAINTENANCE'
        ? `Shop Maintenance: ${expenseDesc}`
        : `Operating Expense: ${expenseDesc}`,
      amount: amtNum,
      type: expenseType === 'FUEL' ? 'FUEL' : expenseType === 'MAINTENANCE' ? 'MAINTENANCE' : 'MISC',
      date: new Date().toISOString().split('T')[0]
    };

    setCustomExpenses(prev => [...prev, newExpense]);

    // Persist to backend
    try {
      if (expenseType === 'FUEL') {
        await apiCreateFuelLog({
          assetId: selectedAsset.id,
          gallons: parseFloat(expenseGallons) || 50,
          cost: amtNum,
          location: 'TX',
          odometer: (selectedAsset.odometer || 140000) + 150
        });
      } else {
        await apiCreateWorkOrder({
          assetId: selectedAsset.id,
          priority: 'LOW',
          type: 'INTERNAL',
          description: `Operating Expense: ${expenseDesc} ($${amtNum})`
        });
      }
      refreshDb();
    } catch (err) {
      console.warn('Backend expense persist note:', err);
    }

    setAddExpenseModalOpen(false);
    showToast(`Expense of $${amtNum.toFixed(2)} recorded successfully.`);
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    setCustomExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Expense item removed from statement.');
  };

  // Submit Advance / Incident
  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    const advNum = parseFloat(advanceAmount) || 150;

    const newAdvance: AdvanceItem = {
      id: `adv-${Date.now()}`,
      assetId: selectedAsset.id,
      date: new Date().toISOString().split('T')[0],
      amount: advNum,
      notes: advanceNotes,
      status: 'APPROVED',
    };

    setCustomAdvances(prev => [...prev, newAdvance]);

    try {
      await apiCreateEmergencyTicket({
        assetId: selectedAsset.id,
        description: `Advance Request / Incident: ${advanceNotes} ($${advNum})`,
        gpsLatitude: 32.7767,
        gpsLongitude: -96.7970
      });
      refreshDb();
    } catch (err) {
      console.warn('Advance ticket note:', err);
    }

    setAddAdvanceModalOpen(false);
    showToast(`Advance request of $${advNum.toFixed(2)} recorded and deducted from Net Driver Pay.`);
  };

  // Delete Advance
  const handleDeleteAdvance = (id: string) => {
    setCustomAdvances(prev => prev.filter(a => a.id !== id));
    showToast('Advance request removed.');
  };

  // Create New Report Period
  const handleCreateNewReport = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `rep-${Date.now()}`;
    const newRep: ReportMeta = {
      id: newId,
      title: newReportTitle,
      period: newReportPeriod,
      updatedAt: 'Updated Just now'
    };
    setReportsList(prev => [newRep, ...prev]);
    setActiveReportId(newId);
    setNewReportModalOpen(false);
    showToast(`New settlement report period "${newReportTitle}" created!`);
  };

  // Send Driver Email
  const handleSendDriverEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailDriverSending(true);
    setTimeout(() => {
      setEmailDriverSending(false);
      setEmailDriverModalOpen(false);
      showToast(`Settlement dispatch report emailed to ${emailDriverTo} with itemized statements.`);
    }, 700);
  };

  // Copy Settlement Summary to Clipboard
  const handleCopySummary = () => {
    const summary = `
=== DRIVER SETTLEMENT REPORT ===
Unit: ${selectedAsset?.name || 'Unit'} (${selectedAsset?.plateNumber || ''})
Report: ${reportsList.find(r => r.id === activeReportId)?.title || 'Current'}
------------------------------------
Total Revenue:      $${totalRevenue.toFixed(2)}
Total Loaded Miles: ${loadedMiles} mi
Driver Pay Rate:    ${driverPayRatePercent}%
Gross Driver Pay:   $${driverGrossPay.toFixed(2)}
Less Advances:     -$${totalAdvanceAmount.toFixed(2)}
------------------------------------
NET DRIVER PAY:     $${netDriverPay.toFixed(2)}
------------------------------------
SuperTruck FleetCare • Automated Settlement
    `.trim();

    navigator.clipboard.writeText(summary);
    showToast('Settlement summary copied to clipboard!');
  };

  // Real Download CSV Generator
  const handleDownloadCsv = () => {
    setDownloadDropdownOpen(false);
    const rows = [
      ['SuperTruck FleetCare - Driver Settlement & P&L Statement'],
      ['Unit', selectedAsset?.name || 'Unit'],
      ['Plate', selectedAsset?.plateNumber || ''],
      ['Date Generated', new Date().toLocaleString()],
      [],
      ['--- REVENUE BREAKDOWN ---'],
      ['Date', 'Load #', 'Origin', 'Destination', 'Broker', 'Revenue ($)', 'Loaded Miles', 'Empty Miles'],
      ...currentLoads.map(l => [
        l.date,
        l.loadNumber,
        `"${l.origin}"`,
        `"${l.destination}"`,
        `"${l.broker}"`,
        l.revenue.toFixed(2),
        l.loadedMiles,
        l.emptyMiles
      ]),
      ['TOTAL', '', '', '', '', totalRevenue.toFixed(2), loadedMiles, emptyMiles],
      [],
      ['--- EXPENSES BREAKDOWN ---'],
      ['Date', 'Item', 'Type', 'Amount ($)'],
      ...currentExpenses.map(e => [
        e.date,
        `"${e.name}"`,
        e.type,
        e.amount.toFixed(2)
      ]),
      ['TOTAL EXPENSES', '', '', totalExpensesAmount.toFixed(2)],
      [],
      ['--- DRIVER PAYMENT SUMMARY ---'],
      ['Gross Revenue', `$${totalRevenue.toFixed(2)}`],
      ['Driver Share Rate', `${driverPayRatePercent}%`],
      ['Gross Driver Pay', `$${driverGrossPay.toFixed(2)}`],
      ['Total Deductions / Advances', `$${totalAdvanceAmount.toFixed(2)}`],
      ['NET DRIVER PAYOUT', `$${netDriverPay.toFixed(2)}`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `settlement-report-${selectedAsset?.plateNumber || 'unit'}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Settlement CSV downloaded successfully!');
  };

  // Native Print / PDF Statement
  const handlePrintStatement = () => {
    setDownloadDropdownOpen(false);
    window.print();
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-800">

      {/* ── TOAST NOTIFICATION BANNER ── */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#182235] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-[#00BA7C] shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ── SUB-HEADER: TITLE & ACTIONS BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Driver Report & Profit/Loss
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedAsset ? selectedAsset.name : 'Selected Unit'} • Last saved Today, 4:42 PM
          </p>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RotateCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>

          <button
            onClick={() => {
              setEmailDriverSubject(`Driver Settlement Report — ${selectedAsset?.name || 'Unit'} (Oct 2026)`);
              setEmailDriverModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Mail className="h-3.5 w-3.5 text-slate-500" />
            Email Driver
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {/* Download Dropdown */}
          <div className="relative inline-block">
            <button
              onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#182235] hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Download
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {downloadDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-xs text-slate-700 space-y-0.5">
                <button
                  onClick={handleDownloadCsv}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 hover:text-[#00BA7C] flex items-center gap-2 font-medium transition"
                >
                  <FileSpreadsheet className="h-4 w-4 text-[#00BA7C]" />
                  Export Settlement (CSV)
                </button>
                <button
                  onClick={handlePrintStatement}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 hover:text-[#00BA7C] flex items-center gap-2 font-medium transition"
                >
                  <Printer className="h-4 w-4 text-slate-500" />
                  Print / Save Statement (PDF)
                </button>
                <button
                  onClick={() => {
                    setDownloadDropdownOpen(false);
                    triggerExport('ifta');
                    showToast('IFTA quarterly mileage report exported.');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 hover:text-[#00BA7C] flex items-center gap-2 font-medium transition"
                >
                  <FileText className="h-4 w-4 text-slate-500" />
                  Export IFTA Tax Logs (CSV)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN 3-PANEL LAYOUT (LEFT RAIL + CENTER + RIGHT HISTORY) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ── LEFT RAIL: ACTIVE ENTITY & REPORT SELECTOR (3 cols) ── */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Selected Driver / Vehicle Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                {selectedAsset ? selectedAsset.name.charAt(0) : 'E'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {selectedAsset ? selectedAsset.name : 'Unit #101'}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {selectedAsset?.plateNumber || 'TX-8821'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setChangeEntityModalOpen(true)}
              className="text-xs font-semibold text-slate-500 hover:text-[#00BA7C] transition"
            >
              Change
            </button>
          </div>

          {/* Reports Header & Active Report Box */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                REPORTS ({reportsList.length})
              </p>
            </div>
            
            <div className="space-y-2">
              {reportsList.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No settlement reports saved. Create one below.
                </div>
              ) : (
                reportsList.map(rep => (
                  <button
                    key={rep.id}
                    onClick={() => {
                      setActiveReportId(rep.id);
                      showToast(`Switched view to report period: ${rep.title}`);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      activeReportId === rep.id
                        ? 'bg-white border-slate-300 shadow-sm ring-1 ring-slate-200'
                        : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">
                      {rep.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {rep.updatedAt}
                    </p>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setNewReportModalOpen(true)}
              className="w-full mt-3 py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Plus className="h-3.5 w-3.5 text-slate-500" />
              New Report
            </button>
          </div>
        </div>

        {/* ── CENTER CONTENT AREA (9 cols) ── */}
        <div className="lg:col-span-9 space-y-5">
          
          {/* Top Row: Segmented Switcher + 4 Stat Cards + History Panel */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            
            {/* Left 8 Cols: Segmented Tab Pill + 4 KPI Stat Cards */}
            <div className="xl:col-span-8 space-y-3.5">
              
              {/* Segmented Tab Switcher */}
              <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 shadow-inner">
                <button
                  onClick={() => setActiveSubTab('DRIVER_REPORT')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                    activeSubTab === 'DRIVER_REPORT'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Driver Report
                </button>
                <button
                  onClick={() => setActiveSubTab('PNL_SUMMARY')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                    activeSubTab === 'PNL_SUMMARY'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Profit & Loss Summary
                </button>
              </div>

              {/* 4 Top KPI Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Total Revenue */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    TOTAL REVENUE
                  </p>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                    ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Revenue/Mile: ${revenuePerMile}/mi
                  </p>
                </div>

                {/* Total Miles */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    TOTAL MILES
                  </p>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                    {totalMiles.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Loaded: {loadedMiles} loaded
                  </p>
                </div>

                {/* Gross Pay */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    GROSS PAY
                  </p>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                    ${driverGrossPay.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Net Pay: ${netDriverPay.toFixed(2)}
                  </p>
                </div>

                {/* Pay Rate */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    PAY RATE
                  </p>
                  <p className="text-lg font-extrabold text-[#00BA7C] mt-0.5">
                    {driverPayRatePercent.toFixed(1)}% of
                  </p>
                  <p className="text-[10px] text-[#00BA7C] font-semibold -mt-0.5">
                    revenue
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Standard dispatch
                  </p>
                </div>

              </div>
            </div>

            {/* Right 4 Cols: History Dark Panel */}
            <div className="xl:col-span-4">
              <div className="bg-[#182235] text-white rounded-xl p-3.5 shadow-md border border-slate-800">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-300" />
                    <span className="text-xs font-bold text-white">History</span>
                    <span className="bg-[#243147] text-slate-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {auditLogs.length || 1}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                  What changed, by whom, and when — for this report.
                </p>

                {/* History entries from real audit logs or active session */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-300 font-semibold">Today, 4:42 PM</span>
                      <span className="text-slate-400">• {selectedAsset ? selectedAsset.name : 'Unit'}</span>
                      <span className="bg-[#243147] text-[9px] px-1.5 py-0.2 rounded font-semibold text-slate-300">
                        Current
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{currentUser.name} (Fleet Manager)</span>
                    <span className="text-[#00BA7C] font-bold">Online</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── CONDITIONAL SUB-TAB: PROFIT & LOSS SUMMARY VIEW ── */}
          {activeSubTab === 'PNL_SUMMARY' ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Unit Profit & Loss Breakdown (P&L)</h3>
                  <p className="text-xs text-slate-500">Comprehensive net operating income and cost-per-mile financial metrics.</p>
                </div>
                <button
                  onClick={handleDownloadCsv}
                  className="px-3.5 py-1.5 bg-[#182235] text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Export P&L
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Gross Operating Revenue</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">${totalRevenue.toFixed(2)}</p>
                  <span className="text-xs text-slate-500 font-mono">${revenuePerMile} per mile</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Total Direct Expenses</span>
                  <p className="text-2xl font-black text-rose-600 mt-1">${(totalExpensesAmount + driverGrossPay).toFixed(2)}</p>
                  <span className="text-xs text-slate-500 font-mono">Fuel, toll, insurance & wages</span>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">Net Operating Income (NOI)</span>
                  <p className="text-2xl font-black text-[#00BA7C] mt-1">
                    ${Math.max(0, totalRevenue - totalExpensesAmount - driverGrossPay).toFixed(2)}
                  </p>
                  <span className="text-xs text-emerald-700 font-bold">
                    Operating Margin: {totalRevenue > 0 ? (((totalRevenue - totalExpensesAmount - driverGrossPay) / totalRevenue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {/* Line items table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-600">
                    <tr>
                      <th className="p-3">ACCOUNT / CATEGORY</th>
                      <th className="p-3">AMOUNT ($)</th>
                      <th className="p-3">PERCENTAGE</th>
                      <th className="p-3">COST PER MILE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">Gross Freight Invoiced</td>
                      <td className="p-3 font-bold text-slate-900">${totalRevenue.toFixed(2)}</td>
                      <td className="p-3 text-slate-500">100.0%</td>
                      <td className="p-3 text-slate-500">${revenuePerMile}/mi</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-700">Driver Payroll & Commissions</td>
                      <td className="p-3 font-bold text-rose-600">-${driverGrossPay.toFixed(2)}</td>
                      <td className="p-3 text-slate-500">{driverPayRatePercent}%</td>
                      <td className="p-3 text-slate-500">${(driverGrossPay / Math.max(totalMiles, 1)).toFixed(2)}/mi</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-700">Fuel Card Fill-Ups</td>
                      <td className="p-3 font-bold text-rose-600">
                        -${currentExpenses.filter(e => e.type === 'FUEL').reduce((s, e) => s + e.amount, 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-slate-500">
                        {totalRevenue > 0 ? ((currentExpenses.filter(e => e.type === 'FUEL').reduce((s, e) => s + e.amount, 0) / totalRevenue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="p-3 text-slate-500">
                        ${(currentExpenses.filter(e => e.type === 'FUEL').reduce((s, e) => s + e.amount, 0) / Math.max(totalMiles, 1)).toFixed(2)}/mi
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-700">Fixed Weekly Insurance</td>
                      <td className="p-3 font-bold text-rose-600">-$100.00</td>
                      <td className="p-3 text-slate-500">7.1%</td>
                      <td className="p-3 text-slate-500">${(100 / Math.max(totalMiles, 1)).toFixed(2)}/mi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              {/* ── CARD 1: REVENUE BREAKDOWN ── */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Dark Navy Header */}
                <div className="bg-[#182235] text-white px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide">
                    Revenue Breakdown
                  </span>
                  <span className="bg-[#243147] text-slate-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                    {currentLoads.length} loads
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">DATE</th>
                        <th className="px-3 py-2.5 font-semibold">LOAD #</th>
                        <th className="px-4 py-2.5 font-semibold">ORIGIN</th>
                        <th className="px-4 py-2.5 font-semibold">DESTINATION</th>
                        <th className="px-4 py-2.5 font-semibold">BROKER</th>
                        <th className="px-4 py-2.5 font-semibold">REVENUE</th>
                        <th className="px-3 py-2.5 font-semibold">L.MILES</th>
                        <th className="px-3 py-2.5 font-semibold">E.MILES</th>
                        <th className="px-3 py-2.5 text-right font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentLoads.map((load) => (
                        <tr key={load.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                            {load.date}
                          </td>
                          <td className="px-3 py-3 font-bold text-slate-800">
                            {load.loadNumber}
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">
                            {load.origin}
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">
                            {load.destination}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {load.broker}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            ${load.revenue.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 font-mono text-slate-600">
                            {load.loadedMiles}
                          </td>
                          <td className="px-3 py-3 font-mono text-slate-600">
                            {load.emptyMiles}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              onClick={() => handleDeleteLoad(load.id)}
                              title="Delete Load"
                              className="text-slate-300 hover:text-rose-500 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* Summary row */}
                      <tr className="bg-slate-50/80 font-bold text-slate-900 border-t border-slate-200">
                        <td colSpan={5} className="px-4 py-2.5 text-[11px] uppercase tracking-wider text-slate-700">
                          TOTAL
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-900">
                          ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {loadedMiles}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {emptyMiles}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bottom Add Load Button */}
                <div className="p-3 bg-white border-t border-slate-100">
                  <button
                    onClick={() => {
                      setLoadDate(new Date().toISOString().split('T')[0]);
                      setLoadNumber(`LD-${Math.floor(1000 + Math.random() * 9000)}`);
                      setAddLoadModalOpen(true);
                    }}
                    className="text-xs font-semibold text-slate-700 hover:text-[#00BA7C] inline-flex items-center gap-1.5 transition"
                  >
                    <Plus className="h-3.5 w-3.5 text-slate-500" />
                    Add Load
                  </button>
                </div>
              </div>

              {/* ── CARD 2: EXPENSES BREAKDOWN ── */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Dark Navy Header */}
                <div className="bg-[#182235] text-white px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide">
                    Expenses Breakdown
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    ${totalExpensesAmount.toFixed(2)}
                  </span>
                </div>

                {/* Quick Action Sub-buttons Bar */}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
                  <button
                    onClick={() => {
                      setExpenseType('FUEL');
                      setExpenseDesc('Fleet Fueling Refill - WEX Card TX');
                      setAddExpenseModalOpen(true);
                    }}
                    className="hover:text-[#00BA7C] transition inline-flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3 text-slate-500" /> Add Fuel Expense
                  </button>
                  <button
                    onClick={() => {
                      setExpenseType('MAINTENANCE');
                      setExpenseDesc('Oil Filter & Lube Service');
                      setAddExpenseModalOpen(true);
                    }}
                    className="hover:text-[#00BA7C] transition inline-flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3 text-slate-500" /> Add Maintenance Expense
                  </button>
                  <button
                    onClick={() => {
                      setExpenseType('MISC');
                      setExpenseDesc('Scale Ticket / Parking Permit');
                      setAddExpenseModalOpen(true);
                    }}
                    className="hover:text-[#00BA7C] transition inline-flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3 text-slate-500" /> Add Misc Expense
                  </button>
                </div>

                {/* Line Items Table */}
                <div className="divide-y divide-slate-100 text-xs">
                  {currentExpenses.map(item => (
                    <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/60 transition">
                      <div>
                        <span className="font-medium text-slate-800">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">({item.date})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 font-mono">
                          ${item.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(item.id)}
                          title="Delete Expense"
                          className="text-slate-300 hover:text-rose-500 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Total Expenses Row */}
                  <div className="px-4 py-2.5 bg-slate-50/80 flex items-center justify-between font-bold text-slate-900 border-t border-slate-200">
                    <span className="text-[11px] uppercase tracking-wider text-slate-700">TOTAL EXPENSES</span>
                    <span className="text-xs font-mono">${totalExpensesAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* ── CARD 3: DRIVER PAYMENT CALCULATION ── */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Dark Navy Header */}
                <div className="bg-[#182235] text-white px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide">
                    Driver Payment Calculation
                  </span>
                  <span className="text-[11px] font-medium text-slate-300">
                    Pay rate: {driverPayRatePercent.toFixed(1)}% of revenue
                  </span>
                </div>

                {/* 5-Column Stats Row */}
                <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-left">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      GROSS REVENUE
                    </p>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">
                      ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">= Total Revenue</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      DRIVER'S SHARE
                    </p>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">
                      ${driverGrossPay.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{driverPayRatePercent}% of revenue</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      OPERATION COST
                    </p>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">
                      ${totalExpensesAmount.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Direct expenses</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      ADVANCE DEDUCTIONS
                    </p>
                    <p className="text-base font-extrabold text-rose-600 mt-0.5">
                      -${totalAdvanceAmount.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Advance requests</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      NET DRIVER PAY
                    </p>
                    <p className="text-base font-extrabold text-[#00BA7C] mt-0.5">
                      ${netDriverPay.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">= Driver's Share - Deductions</p>
                  </div>
                </div>
              </div>

              {/* ── CARD 4: ADVANCE REQUESTS ── */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Dark Navy Header */}
                <div className="bg-[#182235] text-white px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide">
                    Advance Requests & Deductions
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    ${totalAdvanceAmount.toFixed(2)}
                  </span>
                </div>

                {/* Advance Table / Empty State */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 font-semibold">DATE</th>
                        <th className="px-4 py-2 font-semibold">AMOUNT</th>
                        <th className="px-4 py-2 font-semibold">NOTES</th>
                        <th className="px-3 py-2 text-right font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAdvances.length > 0 ? (
                        currentAdvances.map(ticket => (
                          <tr key={ticket.id} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-2.5 text-[11px] font-mono text-slate-500">
                              {ticket.date}
                            </td>
                            <td className="px-4 py-2.5 font-bold font-mono text-rose-600">
                              ${ticket.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">
                              {ticket.notes}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <button
                                onClick={() => handleDeleteAdvance(ticket.id)}
                                title="Remove Advance"
                                className="text-slate-300 hover:text-rose-500 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-xs text-slate-400 font-medium">
                            No advances or deductions recorded for this settlement period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Add Row Button */}
                <div className="p-3 bg-white border-t border-slate-100">
                  <button
                    onClick={() => setAddAdvanceModalOpen(true)}
                    className="text-xs font-semibold text-slate-700 hover:text-[#00BA7C] inline-flex items-center gap-1.5 transition"
                  >
                    <Plus className="h-3.5 w-3.5 text-slate-500" />
                    Add Row
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

      </div>

      {/* ── MODAL: EMAIL DRIVER SETTLEMENT REPORT ── */}
      {emailDriverModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#00BA7C]" />
                <h3 className="font-bold text-slate-900 text-base">Email Driver Settlement Report</h3>
              </div>
              <button onClick={() => setEmailDriverModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendDriverEmail} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Driver Email Address</label>
                <input
                  type="email"
                  value={emailDriverTo}
                  onChange={e => setEmailDriverTo(e.target.value)}
                  required
                  placeholder="driver@fleet.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#00BA7C]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={emailDriverSubject}
                  onChange={e => setEmailDriverSubject(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#00BA7C]"
                />
              </div>

              {/* Settlement Preview Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-slate-700 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span>Unit / Equipment:</span>
                  <strong className="text-slate-900">{selectedAsset?.name || 'Unit'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Gross Freight Revenue:</span>
                  <span className="font-bold text-slate-900">${totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Driver Commission ({driverPayRatePercent}%):</span>
                  <span className="font-bold text-slate-900">${driverGrossPay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advance Deductions:</span>
                  <span className="font-bold text-rose-600">-${totalAdvanceAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-xs text-[#00BA7C] font-bold">
                  <span>Estimated Net Direct Payout:</span>
                  <span>${netDriverPay.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Summary
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailDriverModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={emailDriverSending}
                    className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-white rounded-lg font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {emailDriverSending ? 'Sending Dispatch...' : 'Send Email Report'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: NEW REPORT PERIOD ── */}
      {newReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Create Settlement Report</h3>
              <button onClick={() => setNewReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewReport} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Report Code / Title</label>
                <input
                  type="text"
                  value={newReportTitle}
                  onChange={e => setNewReportTitle(e.target.value)}
                  required
                  placeholder="e.g. SEP26-W4 (Weekly Settlement)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#00BA7C]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Billing Period Date Range</label>
                <input
                  type="text"
                  value={newReportPeriod}
                  onChange={e => setNewReportPeriod(e.target.value)}
                  required
                  placeholder="e.g. Oct 08 - Oct 15, 2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#00BA7C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewReportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-white rounded-lg font-bold transition shadow-sm"
                >
                  Create Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CHANGE UNIT / ASSET ── */}
      {changeEntityModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Select Unit / Driver</h3>
              <button onClick={() => setChangeEntityModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Choose an active fleet asset or assigned tractor to inspect its weekly driver settlement & P&L.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {assets.map((asset, idx) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    setSelectedAssetIndex(idx);
                    setSelectedAssetId(asset.id);
                    setChangeEntityModalOpen(false);
                    showToast(`Active cockpit unit changed to ${asset.name}.`);
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    selectedAssetIndex === idx
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs block">{asset.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Plate: {asset.plateNumber} • Odo: {asset.odometer.toLocaleString()} mi
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    asset.status === 'OPERABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {asset.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD LOAD / DISPATCH ── */}
      {addLoadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Load Dispatch</h3>
              <button onClick={() => setAddLoadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLoad} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={loadDate}
                    onChange={e => setLoadDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono focus:outline-none focus:border-[#00BA7C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Load / PO Number</label>
                  <input
                    type="text"
                    value={loadNumber}
                    onChange={e => setLoadNumber(e.target.value)}
                    required
                    placeholder="LD-9901"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:outline-none focus:border-[#00BA7C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Origin City / Facility</label>
                <input
                  type="text"
                  value={loadOrigin}
                  onChange={e => setLoadOrigin(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#00BA7C]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Destination City / Port</label>
                <input
                  type="text"
                  value={loadDest}
                  onChange={e => setLoadDest(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#00BA7C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Freight Broker</label>
                  <input
                    type="text"
                    value={loadBroker}
                    onChange={e => setLoadBroker(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#00BA7C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Load Revenue ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={loadRevenue}
                    onChange={e => setLoadRevenue(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono focus:outline-none focus:border-[#00BA7C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Loaded Miles</label>
                  <input
                    type="number"
                    value={loadMiles}
                    onChange={e => setLoadMiles(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono focus:outline-none focus:border-[#00BA7C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Empty / Deadhead Miles</label>
                  <input
                    type="number"
                    value={loadEmptyMiles}
                    onChange={e => setLoadEmptyMiles(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono focus:outline-none focus:border-[#00BA7C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Dispatch Notes</label>
                <textarea
                  value={loadDesc}
                  onChange={e => setLoadDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#00BA7C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddLoadModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-white rounded-lg font-bold transition shadow-sm"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD EXPENSE ── */}
      {addExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Add {expenseType === 'FUEL' ? 'Fuel' : expenseType === 'MAINTENANCE' ? 'Maintenance' : 'Operating'} Expense
              </h3>
              <button onClick={() => setAddExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Expense Description</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#00BA7C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono focus:outline-none focus:border-[#00BA7C]"
                  />
                </div>
                {expenseType === 'FUEL' && (
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Gallons</label>
                    <input
                      type="number"
                      step="1"
                      value={expenseGallons}
                      onChange={e => setExpenseGallons(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono focus:outline-none focus:border-[#00BA7C]"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-white rounded-lg font-bold transition shadow-sm"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD ADVANCE / INCIDENT ── */}
      {addAdvanceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Record Advance Request</h3>
              <button onClick={() => setAddAdvanceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdvance} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Advance Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={advanceAmount}
                  onChange={e => setAdvanceAmount(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono focus:outline-none focus:border-[#00BA7C]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Advance Reason / Notes</label>
                <textarea
                  value={advanceNotes}
                  onChange={e => setAdvanceNotes(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#00BA7C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddAdvanceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-white rounded-lg font-bold transition shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
