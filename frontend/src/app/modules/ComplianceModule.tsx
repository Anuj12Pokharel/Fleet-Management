'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Clock, Camera,
  Truck, User, FileText, MapPin, RefreshCw, ChevronDown, ChevronUp,
  Bell, Activity, Flag, Route, Fuel, Package
} from 'lucide-react';
import {
  apiGetComplianceDashboard,
  apiRequestPhoto,
  apiLogKYMiles,
  apiGetAssets,
} from '../lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

type UrgencyLevel = 'OK' | 'WARNING' | 'CRITICAL' | 'EXPIRED' | 'UNKNOWN';

interface DriverCompliance {
  id: string;
  driverId: string | null;
  name: string;
  phone: string;
  email: string;
  cdl: { number: string | null; expiry: string | null; daysLeft: number | null; urgency: UrgencyLevel };
  medicalCert: { expiry: string | null; daysLeft: number | null; urgency: UrgencyLevel };
  hos: { violations: string[]; hasViolation: boolean; status: string; driveMinutesLeft: number | null; shiftMinutesLeft: number | null; cycleMinutesLeft: number | null };
}

interface VehicleCompliance {
  id: string;
  name: string;
  type: string;
  vin: string;
  plateNumber: string;
  status: string;
  annualInspection: { expiryDate: string | null; daysLeft: number | null; urgency: UrgencyLevel };
  iftaDecal: { expiryDate: string | null; daysLeft: number | null; urgency: UrgencyLevel; note: string };
  dotDecal: { hasDecal: boolean; note: string };
  coi: { expiryDate: string | null; daysLeft: number | null; urgency: UrgencyLevel };
}

interface ComplianceDashboard {
  generatedAt: string;
  summary: {
    overallStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
    totalAlerts: number;
    driverAlerts: number;
    vehicleAlerts: number;
    driversChecked: number;
    vehiclesChecked: number;
  };
  drivers: DriverCompliance[];
  vehicles: VehicleCompliance[];
  fleetDocuments: any[];
  statePermits: { state: string; notes: string; requiresPermit: boolean; reportKYMiles: boolean }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function urgencyColor(u: UrgencyLevel): string {
  switch (u) {
    case 'EXPIRED': return '#ef4444';
    case 'CRITICAL': return '#f97316';
    case 'WARNING': return '#eab308';
    case 'OK': return '#22c55e';
    default: return '#6b7280';
  }
}

function urgencyBg(u: UrgencyLevel): string {
  switch (u) {
    case 'EXPIRED': return 'rgba(239,68,68,0.12)';
    case 'CRITICAL': return 'rgba(249,115,22,0.12)';
    case 'WARNING': return 'rgba(234,179,8,0.12)';
    case 'OK': return 'rgba(34,197,94,0.12)';
    default: return 'rgba(107,114,128,0.12)';
  }
}

function UrgencyBadge({ urgency, label }: { urgency: UrgencyLevel; label?: string }) {
  const labels: Record<UrgencyLevel, string> = {
    EXPIRED: 'EXPIRED',
    CRITICAL: 'CRITICAL',
    WARNING: 'WARNING',
    OK: 'OK',
    UNKNOWN: 'NO DATA',
  };
  return (
    <span style={{
      background: urgencyBg(urgency),
      color: urgencyColor(urgency),
      border: `1px solid ${urgencyColor(urgency)}40`,
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
    }}>
      {label ?? labels[urgency]}
    </span>
  );
}

function DaysLeftPill({ days, urgency }: { days: number | null; urgency: UrgencyLevel }) {
  if (days === null) return <span style={{ color: '#6b7280', fontSize: 12 }}>—</span>;
  const text = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d left`;
  return (
    <span style={{ color: urgencyColor(urgency), fontWeight: 700, fontSize: 13 }}>{text}</span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ComplianceModule({ currentUser }: { currentUser?: any }) {
  const [data, setData] = useState<ComplianceDashboard | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'drivers' | 'vehicles' | 'documents' | 'permits'>('drivers');
  const [expandedDrivers, setExpandedDrivers] = useState<Set<string>>(new Set());
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set());
  const [photoModal, setPhotoModal] = useState<{ open: boolean; type: 'TIRE' | 'TRUCK_APPEARANCE'; assetId: string; driverId: string } | null>(null);
  const [kyModal, setKyModal] = useState<{ open: boolean; assetId: string } | null>(null);
  const [kyMiles, setKyMiles] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, assetList] = await Promise.all([
        apiGetComplianceDashboard(),
        apiGetAssets(),
      ]);
      setData(dash);
      setAssets(assetList);
    } catch (e: any) {
      setError(e.message || 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handlePhotoRequest = async () => {
    if (!photoModal) return;
    try {
      await apiRequestPhoto({ driverId: photoModal.driverId, type: photoModal.type, assetId: photoModal.assetId });
      setPhotoModal(null);
      showFeedback(`📷 Photo request sent successfully`);
    } catch (e: any) {
      showFeedback(`Error: ${e.message}`);
    }
  };

  const handleKYLog = async () => {
    if (!kyModal || !kyMiles) return;
    try {
      await apiLogKYMiles({ assetId: kyModal.assetId, miles: parseFloat(kyMiles) });
      setKyModal(null);
      setKyMiles('');
      showFeedback(`✅ KY miles logged: ${kyMiles} miles recorded for IFTA`);
    } catch (e: any) {
      showFeedback(`Error: ${e.message}`);
    }
  };

  const toggleDriver = (id: string) => {
    setExpandedDrivers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleVehicle = (id: string) => {
    setExpandedVehicles(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const statusConfig = {
    COMPLIANT: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Fully Compliant', icon: '✅' },
    AT_RISK: { color: '#eab308', bg: 'rgba(234,179,8,0.1)', label: 'At Risk', icon: '⚠️' },
    NON_COMPLIANT: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Non-Compliant', icon: '🚨' },
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const s: React.CSSProperties = { fontFamily: "'Inter', 'Outfit', sans-serif" };

  if (loading) return (
    <div style={{ ...s, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '4px solid #334155', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading compliance data...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ ...s, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <XCircle size={36} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
      <p style={{ color: '#ef4444', fontWeight: 600 }}>{error}</p>
      <button onClick={load} style={{ marginTop: 12, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
    </div>
  );

  if (!data) return null;

  const { summary, drivers, vehicles, fleetDocuments, statePermits } = data;
  const sc = statusConfig[summary.overallStatus];

  const sections = [
    { id: 'drivers', label: 'Drivers', icon: User, count: summary.driverAlerts, alert: summary.driverAlerts > 0 },
    { id: 'vehicles', label: 'Vehicles', icon: Truck, count: summary.vehicleAlerts, alert: summary.vehicleAlerts > 0 },
    { id: 'documents', label: 'Fleet Documents', icon: FileText, count: fleetDocuments.filter((d: any) => d.urgency !== 'OK').length, alert: false },
    { id: 'permits', label: 'State Permits', icon: MapPin, count: statePermits.length, alert: false },
  ] as const;

  return (
    <div style={{ ...s, minHeight: '100vh', background: 'transparent', padding: '0 0 40px' }}>

      {/* Toast Feedback */}
      {actionFeedback && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '14px 24px', borderRadius: 12, fontWeight: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', maxWidth: 400 }}>
          {actionFeedback}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', padding: 12, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Compliance Center</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Updated {new Date(data.generatedAt).toLocaleTimeString()}</p>
          </div>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Overall Status Banner */}
      <div style={{ background: sc.bg, border: `1px solid ${sc.color}30`, borderRadius: 16, padding: '20px 28px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 36 }}>{sc.icon}</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: sc.color }}>{sc.label}</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
              {summary.totalAlerts === 0 ? 'All compliance checks passed' : `${summary.totalAlerts} alert${summary.totalAlerts === 1 ? '' : 's'} require attention`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { label: 'Drivers Checked', val: summary.driversChecked, icon: User },
            { label: 'Vehicles Checked', val: summary.vehiclesChecked, icon: Truck },
            { label: 'Total Alerts', val: summary.totalAlerts, icon: Bell, color: summary.totalAlerts > 0 ? '#ef4444' : '#22c55e' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: (stat as any).color || '#f1f5f9' }}>{stat.val}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {sections.map(sec => {
          const Icon = sec.icon;
          const active = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: active ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#1e293b',
                border: active ? 'none' : '1px solid #334155',
                color: active ? '#fff' : '#94a3b8',
                padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
                fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
              }}
            >
              <Icon size={15} />
              {sec.label}
              {sec.count > 0 && (
                <span style={{ background: sec.alert ? '#ef4444' : '#334155', color: sec.alert ? '#fff' : '#94a3b8', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                  {sec.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── DRIVERS SECTION ───────────────────────────────────────────────────── */}
      {activeSection === 'drivers' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <User size={18} color="#3b82f6" />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Driver Compliance</h2>
            <span style={{ color: '#64748b', fontSize: 13 }}>— CDL • Medical Certificate • HOS Logs (Last 5 Days)</span>
          </div>

          {drivers.length === 0 ? (
            <EmptyState icon={User} message="No driver contacts found. Add drivers in Contacts with CDL and Medical Certificate expiry dates." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {drivers.map(driver => {
                const hasAlert = driver.cdl.urgency !== 'OK' || driver.medicalCert.urgency !== 'OK' || driver.hos.hasViolation;
                const expanded = expandedDrivers.has(driver.id);
                const tractors = assets.filter(a => a.type === 'TRACTOR');

                return (
                  <div key={driver.id} style={{ background: '#1e293b', border: `1px solid ${hasAlert ? '#ef444440' : '#334155'}`, borderRadius: 14, overflow: 'hidden' }}>
                    {/* Driver Row */}
                    <div
                      onClick={() => toggleDriver(driver.id)}
                      style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: hasAlert ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: hasAlert ? '#ef4444' : '#22c55e' }}>
                            {driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{driver.name}</div>
                          <div style={{ color: '#64748b', fontSize: 12 }}>{driver.phone || driver.email}</div>
                        </div>
                      </div>

                      {/* Status Pills */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: '#64748b', fontSize: 11 }}>CDL</span>
                          <UrgencyBadge urgency={driver.cdl.urgency} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: '#64748b', fontSize: 11 }}>MED</span>
                          <UrgencyBadge urgency={driver.medicalCert.urgency} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: '#64748b', fontSize: 11 }}>HOS</span>
                          <UrgencyBadge urgency={driver.hos.hasViolation ? 'CRITICAL' : 'OK'} label={driver.hos.hasViolation ? 'VIOLATION' : 'CLEAN'} />
                        </div>
                        {expanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expanded && (
                      <div style={{ borderTop: '1px solid #334155', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                        {/* CDL */}
                        <ComplianceCard
                          title="Commercial Driver's License (CDL)"
                          icon={FileText}
                          urgency={driver.cdl.urgency}
                          details={[
                            { label: 'CDL Number', value: driver.cdl.number || 'Not recorded' },
                            { label: 'Expiry', value: driver.cdl.expiry ? new Date(driver.cdl.expiry).toLocaleDateString() : 'Not set' },
                            { label: 'Status', value: <DaysLeftPill days={driver.cdl.daysLeft} urgency={driver.cdl.urgency} /> },
                          ]}
                          alarmNote="Alarm set 30 days before expiry"
                        />

                        {/* Medical Certificate */}
                        <ComplianceCard
                          title="Medical Certificate"
                          icon={Activity}
                          urgency={driver.medicalCert.urgency}
                          details={[
                            { label: 'Expiry', value: driver.medicalCert.expiry ? new Date(driver.medicalCert.expiry).toLocaleDateString() : 'Not set' },
                            { label: 'Status', value: <DaysLeftPill days={driver.medicalCert.daysLeft} urgency={driver.medicalCert.urgency} /> },
                          ]}
                          alarmNote="Must be active — alarm 30 days before expiry"
                        />

                        {/* HOS */}
                        <ComplianceCard
                          title="HOS Logs (Last 5 Days)"
                          icon={Clock}
                          urgency={driver.hos.hasViolation ? 'CRITICAL' : 'OK'}
                          details={[
                            { label: 'Status', value: <span style={{ color: driver.hos.hasViolation ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{driver.hos.hasViolation ? '⚠ Violations Detected' : '✓ No Violations'}</span> },
                            ...(driver.hos.violations.map(v => ({ label: 'Violation', value: v }))),
                            ...(driver.hos.driveMinutesLeft !== null ? [
                              { label: 'Drive time left', value: `${Math.floor((driver.hos.driveMinutesLeft ?? 0) / 60)}h ${(driver.hos.driveMinutesLeft ?? 0) % 60}m` },
                              { label: 'Shift time left', value: `${Math.floor((driver.hos.shiftMinutesLeft ?? 0) / 60)}h ${(driver.hos.shiftMinutesLeft ?? 0) % 60}m` },
                            ] : []),
                          ]}
                          alarmNote="Checked daily — logs reviewed every 30 min"
                        />

                        {/* Photo Requests */}
                        {tractors.length > 0 && (
                          <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                              <Camera size={16} color="#3b82f6" />
                              <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>Photo Requests</span>
                            </div>
                            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>Randomly request photos of tires or truck appearance</p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {tractors.map(asset => (
                                <React.Fragment key={asset.id}>
                                  <button onClick={() => setPhotoModal({ open: true, type: 'TIRE', assetId: asset.id, driverId: driver.driverId || driver.id })}
                                    style={{ fontSize: 12, background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                                    🔍 Tire Photo — {asset.name}
                                  </button>
                                  <button onClick={() => setPhotoModal({ open: true, type: 'TRUCK_APPEARANCE', assetId: asset.id, driverId: driver.driverId || driver.id })}
                                    style={{ fontSize: 12, background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                                    🚛 Appearance Photo — {asset.name}
                                  </button>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── VEHICLES SECTION ───────────────────────────────────────────────── */}
      {activeSection === 'vehicles' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Truck size={18} color="#3b82f6" />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Vehicle Compliance</h2>
            <span style={{ color: '#64748b', fontSize: 13 }}>— Annual Inspection • IFTA Decal • DOT Decals • Lights • Tires • Brakes • Air Bag</span>
          </div>

          {vehicles.length === 0 ? (
            <EmptyState icon={Truck} message="No vehicles found. Add assets to track vehicle compliance." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {vehicles.map(vehicle => {
                const hasAlert = vehicle.annualInspection.urgency !== 'OK' || vehicle.coi.urgency !== 'OK';
                const expanded = expandedVehicles.has(vehicle.id);

                return (
                  <div key={vehicle.id} style={{ background: '#1e293b', border: `1px solid ${hasAlert ? '#ef444440' : '#334155'}`, borderRadius: 14, overflow: 'hidden' }}>
                    <div onClick={() => toggleVehicle(vehicle.id)} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: vehicle.type === 'TRACTOR' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Truck size={20} color={vehicle.type === 'TRACTOR' ? '#3b82f6' : '#a855f7'} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>{vehicle.name}</div>
                          <div style={{ color: '#64748b', fontSize: 12 }}>{vehicle.type} • Plate: {vehicle.plateNumber} • VIN: {vehicle.vin.slice(-6)}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: '#64748b', fontSize: 11 }}>Annual Insp</span>
                          <UrgencyBadge urgency={vehicle.annualInspection.urgency} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: '#64748b', fontSize: 11 }}>IFTA</span>
                          <UrgencyBadge urgency={vehicle.iftaDecal.urgency} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: '#64748b', fontSize: 11 }}>DOT</span>
                          <UrgencyBadge urgency={vehicle.dotDecal.hasDecal ? 'OK' : 'UNKNOWN'} label={vehicle.dotDecal.hasDecal ? 'ON' : 'MISSING'} />
                        </div>
                        {expanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                      </div>
                    </div>

                    {expanded && (
                      <div style={{ borderTop: '1px solid #334155', padding: 20 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
                          <ComplianceCard
                            title="Annual Inspection Sticker"
                            icon={FileText}
                            urgency={vehicle.annualInspection.urgency}
                            details={[
                              { label: 'Expiry', value: vehicle.annualInspection.expiryDate ? new Date(vehicle.annualInspection.expiryDate).toLocaleDateString() : 'Not recorded' },
                              { label: 'Status', value: <DaysLeftPill days={vehicle.annualInspection.daysLeft} urgency={vehicle.annualInspection.urgency} /> },
                            ]}
                            alarmNote="Required for Tractor & Trailer — alarm 30 days before"
                          />
                          <ComplianceCard
                            title="Current FY IFTA Decal"
                            icon={Package}
                            urgency={vehicle.iftaDecal.urgency}
                            details={[
                              { label: 'Expiry', value: vehicle.iftaDecal.expiryDate ? new Date(vehicle.iftaDecal.expiryDate).toLocaleDateString() : 'Not recorded' },
                              { label: 'Status', value: <DaysLeftPill days={vehicle.iftaDecal.daysLeft} urgency={vehicle.iftaDecal.urgency} /> },
                              { label: 'Placement', value: vehicle.iftaDecal.note },
                            ]}
                          />
                          <ComplianceCard
                            title="DOT Decals"
                            icon={Shield}
                            urgency={vehicle.dotDecal.hasDecal ? 'OK' : 'UNKNOWN'}
                            details={[
                              { label: 'On Vehicle', value: vehicle.dotDecal.hasDecal ? '✓ Confirmed' : '— Not recorded' },
                              { label: 'Placement', value: vehicle.dotDecal.note },
                            ]}
                          />
                          <ComplianceCard
                            title="Insurance (COI)"
                            icon={Shield}
                            urgency={vehicle.coi.urgency}
                            details={[
                              { label: 'Expiry', value: vehicle.coi.expiryDate ? new Date(vehicle.coi.expiryDate).toLocaleDateString() : 'Not recorded' },
                              { label: 'Status', value: <DaysLeftPill days={vehicle.coi.daysLeft} urgency={vehicle.coi.urgency} /> },
                            ]}
                          />
                        </div>

                        {/* Operational checks */}
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
                          <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#f1f5f9', fontSize: 13 }}>Operational Checks (Driver Responsibility)</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                            {[
                              { item: 'Lights', note: 'All must be working — checked by driver pre-trip', ok: true },
                              { item: 'Tyre Tread', note: 'Must be within legal limit (4/32" steer, 2/32" other)', ok: null },
                              { item: 'Brakes', note: 'Must be within adjustment limits', ok: null },
                              { item: 'Air Bags', note: 'Must not leak — checked pre-trip', ok: null },
                              { item: 'Truck Appearance', note: 'Clean truck — wash every 1-2 months', ok: null },
                            ].map(check => (
                              <div key={check.item} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '10px 14px' }}>
                                <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13, marginBottom: 4 }}>{check.item}</div>
                                <div style={{ color: '#64748b', fontSize: 11 }}>{check.note}</div>
                              </div>
                            ))}
                          </div>

                          {/* Photo request buttons */}
                          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button onClick={() => setPhotoModal({ open: true, type: 'TIRE', assetId: vehicle.id, driverId: '' })}
                              style={{ fontSize: 12, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                              📷 Request Tire Photo
                            </button>
                            <button onClick={() => setPhotoModal({ open: true, type: 'TRUCK_APPEARANCE', assetId: vehicle.id, driverId: '' })}
                              style={{ fontSize: 12, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                              📷 Request Truck Appearance Photo
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DOCUMENTS SECTION ─────────────────────────────────────────────── */}
      {activeSection === 'documents' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <FileText size={18} color="#3b82f6" />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Fleet Documents</h2>
            <span style={{ color: '#64748b', fontSize: 13 }}>— COI • Authority • IFTA License • Registration</span>
          </div>

          {/* Static compliance items for fleet-wide docs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Certificate of Insurance (COI)', icon: '🛡️', note: 'Must not expire — alarm 30 days before', type: 'COI' },
              { label: 'Operating Authority (MC/FF Number)', icon: '📋', note: 'Must remain active — check FMCSA portal', type: 'AUTHORITY' },
              { label: 'IFTA License', icon: '⛽', note: 'Interstate Fuel Tax Agreement — required for travel across states', type: 'IFTA' },
              { label: 'IRP Registration', icon: '🚛', note: 'International Registration Plan — apportioned plates', type: 'IRP' },
            ].map(doc => {
              const fleetDoc = fleetDocuments.find((d: any) => d.name.toLowerCase().includes(doc.type.toLowerCase()));
              const u = fleetDoc?.urgency ?? 'UNKNOWN';
              return (
                <div key={doc.label} style={{ background: '#1e293b', border: `1px solid ${urgencyBg(u) !== 'rgba(107,114,128,0.12)' ? urgencyColor(u) + '40' : '#334155'}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 22 }}>{doc.icon}</span>
                    <UrgencyBadge urgency={u} />
                  </div>
                  <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14, marginBottom: 6 }}>{doc.label}</div>
                  {fleetDoc ? (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                      Expires: {new Date(fleetDoc.expiresAt).toLocaleDateString()} · <DaysLeftPill days={fleetDoc.daysLeft} urgency={u} />
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Not tracked — add in Documents module</div>
                  )}
                  <div style={{ fontSize: 11, color: '#475569', borderTop: '1px solid #334155', paddingTop: 8 }}>{doc.note}</div>
                </div>
              );
            })}
          </div>

          {fleetDocuments.length > 0 && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #334155' }}>
                <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>Tracked Documents ({fleetDocuments.length})</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Name', 'Type', 'Expires', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fleetDocuments.map((doc: any) => (
                    <tr key={doc.id} style={{ borderTop: '1px solid #1e293b' }}>
                      <td style={{ padding: '12px 20px', color: '#f1f5f9', fontWeight: 500, fontSize: 13 }}>{doc.name}</td>
                      <td style={{ padding: '12px 20px', color: '#64748b', fontSize: 12 }}>{doc.type}</td>
                      <td style={{ padding: '12px 20px', color: '#94a3b8', fontSize: 12 }}>{doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '12px 20px' }}><UrgencyBadge urgency={doc.urgency} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── STATE PERMITS SECTION ─────────────────────────────────────────── */}
      {activeSection === 'permits' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <MapPin size={18} color="#3b82f6" />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>State Permit Requirements</h2>
            <span style={{ color: '#64748b', fontSize: 13 }}>— Flagged on state entry</span>
          </div>

          <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Flag size={16} color="#eab308" />
            <span style={{ color: '#eab308', fontSize: 13, fontWeight: 600 }}>Drivers are flagged automatically when entering these states. KY miles must be reported every entry.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {statePermits.map(permit => (
              <div key={permit.state} style={{ background: '#1e293b', border: `1px solid ${permit.reportKYMiles ? 'rgba(239,68,68,0.3)' : '#334155'}`, borderRadius: 14, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: permit.reportKYMiles ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.12)', borderRadius: 8, padding: '4px 12px' }}>
                      <span style={{ fontWeight: 900, fontSize: 18, color: permit.reportKYMiles ? '#ef4444' : '#3b82f6' }}>{permit.state}</span>
                    </div>
                    {permit.reportKYMiles && <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: 0.5 }}>REPORT MILES</span>}
                  </div>
                  <Flag size={14} color={permit.reportKYMiles ? '#ef4444' : '#64748b'} />
                </div>
                <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>{permit.notes}</p>
                {permit.reportKYMiles && (
                  <div style={{ marginTop: 4 }}>
                    <button
                      onClick={() => setKyModal({ open: true, assetId: assets[0]?.id || '' })}
                      style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                      📊 Log KY Miles Entry
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PHOTO REQUEST MODAL ───────────────────────────────────────────── */}
      {photoModal && (
        <Modal onClose={() => setPhotoModal(null)}>
          <div style={{ padding: 28, maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ background: 'rgba(59,130,246,0.15)', padding: 10, borderRadius: 10 }}>
                <Camera size={22} color="#3b82f6" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: 17, fontWeight: 700 }}>Send Photo Request</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>
                  {photoModal.type === 'TIRE' ? 'Request tire tread photo from driver' : 'Request truck appearance photo from driver'}
                </p>
              </div>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              {photoModal.type === 'TIRE'
                ? '📷 Driver will be notified to send a current photo of tire tread. Tread depth must be within legal limits (4/32" steer axle, 2/32" other axles).'
                : '🚛 Driver will be notified to send a photo of the truck exterior. Trucks should be clean — wash required every 1-2 months.'}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPhotoModal(null)} style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: 8, padding: '10px 0', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handlePhotoRequest} style={{ flex: 2, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', color: '#fff', borderRadius: 8, padding: '10px 0', cursor: 'pointer', fontWeight: 700 }}>
                📨 Send Request
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── KY MILES MODAL ───────────────────────────────────────────────── */}
      {kyModal && (
        <Modal onClose={() => setKyModal(null)}>
          <div style={{ padding: 28, maxWidth: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ background: 'rgba(239,68,68,0.15)', padding: 10, borderRadius: 10 }}>
                <Route size={22} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: 17, fontWeight: 700 }}>Log KY Miles</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>Kentucky Weight Distance Tax entry</p>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>VEHICLE</label>
              <select value={kyModal.assetId} onChange={e => setKyModal({ ...kyModal, assetId: e.target.value })}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 8, padding: '9px 12px', fontSize: 13 }}>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>MILES IN KENTUCKY</label>
              <input type="number" value={kyMiles} onChange={e => setKyMiles(e.target.value)} placeholder="e.g. 152.4"
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 8, padding: '9px 12px', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setKyModal(null)} style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: 8, padding: '10px 0', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleKYLog} style={{ flex: 2, background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', color: '#fff', borderRadius: 8, padding: '10px 0', cursor: 'pointer', fontWeight: 700 }}>
                ✅ Log Miles
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ComplianceCard({
  title, icon: Icon, urgency, details, alarmNote
}: {
  title: string;
  icon: any;
  urgency: UrgencyLevel;
  details: { label: string; value: React.ReactNode }[];
  alarmNote?: string;
}) {
  return (
    <div style={{ background: urgencyBg(urgency), border: `1px solid ${urgencyColor(urgency)}30`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon size={15} color={urgencyColor(urgency)} />
        <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 13 }}>{title}</span>
        <span style={{ marginLeft: 'auto' }}><UrgencyBadge urgency={urgency} /></span>
      </div>
      {details.map((d, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
          <span style={{ color: '#64748b', fontSize: 11 }}>{d.label}</span>
          <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500, textAlign: 'right' }}>{d.value}</span>
        </div>
      ))}
      {alarmNote && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${urgencyColor(urgency)}20`, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Bell size={10} color="#64748b" />
          <span style={{ fontSize: 10, color: '#475569' }}>{alarmNote}</span>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
      <Icon size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
      <p style={{ fontSize: 14, maxWidth: 360, margin: '0 auto' }}>{message}</p>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, boxShadow: '0 40px 80px rgba(0,0,0,0.6)', width: '100%', maxWidth: 480 }}>
        {children}
      </div>
    </div>
  );
}
