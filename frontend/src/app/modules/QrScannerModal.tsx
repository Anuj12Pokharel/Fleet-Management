'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Truck,
  Wrench,
  FileCheck,
  Printer,
  RefreshCw,
  Search,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  Activity,
  Sliders
} from 'lucide-react';
import { Asset, Component, WorkOrder, User as DbUser } from '../mockDb';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAsset?: Asset | null;
  assets: Asset[];
  components: Component[];
  workOrders: WorkOrder[];
  onSelectAsset?: (asset: Asset) => void;
  onNavigateToWorkOrder?: (assetId: string) => void;
  onNavigateToInspection?: (assetId: string) => void;
  onUpdateComponentStatus?: (componentId: string, status: 'OPERABLE' | 'NEEDS_ATTENTION' | 'INOPERABLE') => void;
  onSyncOdometer?: (assetId: string, odo: number) => void;
}

export default function QrScannerModal({
  isOpen,
  onClose,
  initialAsset,
  assets = [],
  components = [],
  workOrders = [],
  onSelectAsset,
  onNavigateToWorkOrder,
  onNavigateToInspection,
  onUpdateComponentStatus,
  onSyncOdometer
}: QrScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'SCANNER' | 'DIAGNOSTICS' | 'BADGE'>('SCANNER');
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(initialAsset || (assets[0] || null));
  const [searchManualVin, setSearchManualVin] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [newOdo, setNewOdo] = useState<string>('');
  const [inlineFeedback, setInlineFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setInlineFeedback({ message, type });
    setTimeout(() => {
      setInlineFeedback(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize selected asset if initialAsset changes
  useEffect(() => {
    if (initialAsset) {
      setScannedAsset(initialAsset);
      setActiveTab('DIAGNOSTICS');
      setNewOdo(Math.round(initialAsset.odometer).toString());
    } else if (assets.length > 0 && !scannedAsset) {
      setScannedAsset(assets[0]);
      setNewOdo(Math.round(assets[0].odometer).toString());
    }
  }, [initialAsset, assets]);

  // Handle Camera Feed
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        setCameraError('Camera access not supported by browser.');
      }
    } catch (err: any) {
      setCameraError('Camera permission denied or device camera busy. Optical simulator ready.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'SCANNER') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Handle Scanning an Asset
  const handleSelectScanned = (asset: Asset) => {
    setScannedAsset(asset);
    setNewOdo(Math.round(asset.odometer).toString());
    setActiveTab('DIAGNOSTICS');
    if (onSelectAsset) onSelectAsset(asset);
  };

  // Manual VIN or Barcode lookup
  const handleLookupVin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchManualVin.trim()) return;
    const found = assets.find(a =>
      a.vin.toLowerCase().includes(searchManualVin.trim().toLowerCase()) ||
      a.plateNumber.toLowerCase().includes(searchManualVin.trim().toLowerCase()) ||
      a.name.toLowerCase().includes(searchManualVin.trim().toLowerCase())
    );
    if (found) {
      handleSelectScanned(found);
      setSearchManualVin('');
      showFeedback(`Located ${found.name} (${found.vin})`, 'success');
    } else {
      showFeedback(`No equipment matching "${searchManualVin}" found in active fleet registry.`, 'error');
    }
  };

  // Sub-components for scanned asset
  const assetComponents = components.filter(c => c.assetId === scannedAsset?.id);
  const assetWorkOrders = workOrders.filter(w => w.assetId === scannedAsset?.id);

  // QR Code URL
  const qrCodeUrl = scannedAsset
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=ASSET-${encodeURIComponent(scannedAsset.vin)}`
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* ── TOP MODAL HEADER ── */}
        <div className="bg-[#182235] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#00BA7C] flex items-center justify-center text-white shadow-sm">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Digital QR Code & Equipment Scanner
              </h2>
              <p className="text-[11px] text-slate-400">
                Optical camera reading, J1939 component diagnostics, and asset inspection tags
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── SUB-TABS NAVIGATION ── */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 px-4 pt-2">
          <button
            onClick={() => setActiveTab('SCANNER')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'SCANNER'
                ? 'border-[#00BA7C] text-[#00BA7C] bg-white rounded-t-lg'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Camera className="h-4 w-4" />
            Live Optical Camera
          </button>

          <button
            onClick={() => setActiveTab('DIAGNOSTICS')}
            disabled={!scannedAsset}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'DIAGNOSTICS'
                ? 'border-[#00BA7C] text-[#00BA7C] bg-white rounded-t-lg'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Activity className="h-4 w-4" />
            Scanned Diagnostics {scannedAsset ? `(${scannedAsset.name.split(' ')[0]})` : ''}
          </button>

          <button
            onClick={() => setActiveTab('BADGE')}
            disabled={!scannedAsset}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'BADGE'
                ? 'border-[#00BA7C] text-[#00BA7C] bg-white rounded-t-lg'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <QrCode className="h-4 w-4" />
            Asset QR Badge Label
          </button>
        </div>

        {/* ── TAB CONTENT BODY ── */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">

          {/* Inline Feedback Banner */}
          {inlineFeedback && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
              inlineFeedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <div className="flex items-center gap-2">
                {inlineFeedback.type === 'error' ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                )}
                <span>{inlineFeedback.message}</span>
              </div>
              <button
                onClick={() => setInlineFeedback(null)}
                className="text-slate-400 hover:text-slate-700 text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* ═════════ TAB 1: OPTICAL SCANNER ═════════ */}
          {activeTab === 'SCANNER' && (
            <div className="space-y-4">
              {/* Camera Scanner Viewfinder */}
              <div className="relative w-full h-64 sm:h-72 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex flex-col items-center justify-center">
                
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />

                {/* Animated HUD Reticle Over Video */}
                <div className="relative z-10 w-48 h-48 border-2 border-emerald-400/80 rounded-2xl flex flex-col items-center justify-between p-3 pointer-events-none">
                  {/* Neon laser scan beam */}
                  <div className="w-full h-0.5 bg-[#00BA7C] shadow-[0_0_12px_#00BA7C] animate-pulse" />

                  {/* Corner Targets */}
                  <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-300" />
                  <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-300" />
                  <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-300" />
                  <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-300" />

                  <span className="text-[10px] font-mono tracking-widest text-emerald-300 bg-slate-950/70 px-2 py-0.5 rounded border border-emerald-500/40">
                    ALIGN QR CODE
                  </span>
                </div>

                {/* Camera fallback status notice */}
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-center p-4 space-y-2 z-5">
                    <QrCode className="h-10 w-10 text-emerald-400 animate-bounce" />
                    <p className="text-xs text-slate-300 font-semibold max-w-xs">
                      Optical Scanner Ready. Point camera at physical truck QR code or choose asset below.
                    </p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                    >
                      Enable Live Webcam
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Barcode / VIN Manual Lookup */}
              <form onSubmit={handleLookupVin} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchManualVin}
                    onChange={e => setSearchManualVin(e.target.value)}
                    placeholder="Enter VIN, License Plate, or Scan Payload (e.g. 1N4AL3...)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-[#00BA7C]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#182235] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                >
                  Lookup
                </button>
              </form>

              {/* Fleet Units Direct Instant Selector */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Unit to Simulate Physical QR Tag Read:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto">
                  {assets.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => handleSelectScanned(asset)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                        scannedAsset?.id === asset.id
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm ring-1 ring-emerald-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <strong className="text-xs text-slate-900 block truncate">{asset.name}</strong>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          VIN: {asset.vin}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Plate: {asset.plateNumber} &bull; {asset.odometer.toLocaleString()} mi
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═════════ TAB 2: SCANNED DIAGNOSTICS & TELEMATICS ═════════ */}
          {activeTab === 'DIAGNOSTICS' && scannedAsset && (
            <div className="space-y-4">
              {/* Asset Identity Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      IDENTIFIED EQUIPMENT
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                      <Truck className="h-5 w-5 text-[#00BA7C]" />
                      {scannedAsset.name}
                    </h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    scannedAsset.status === 'OPERABLE'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : scannedAsset.status === 'NEEDS_ATTENTION'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-rose-100 text-rose-800 border-rose-200'
                  }`}>
                    {scannedAsset.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-sans">VIN Number</span>
                    <strong className="text-slate-800 text-[11px] truncate block">{scannedAsset.vin}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-sans">License Plate</span>
                    <strong className="text-slate-800">{scannedAsset.plateNumber}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-sans">Type</span>
                    <strong className="text-slate-800">{scannedAsset.type}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-sans">Odometer</span>
                    <strong className="text-slate-800">{scannedAsset.odometer.toLocaleString()} mi</strong>
                  </div>
                </div>

                {/* Inline Odometer Sync */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-500 font-semibold text-[11px]">Sync New Odometer:</span>
                  <input
                    type="number"
                    value={newOdo}
                    onChange={e => setNewOdo(e.target.value)}
                    className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      const num = parseFloat(newOdo);
                      if (num && onSyncOdometer) {
                        onSyncOdometer(scannedAsset.id, num);
                        scannedAsset.odometer = num;
                        showFeedback(`Odometer updated to ${num.toLocaleString()} miles.`, 'success');
                      }
                    }}
                    className="px-2.5 py-1 bg-[#00BA7C] text-white rounded-lg text-[11px] font-bold hover:bg-[#00A86B] transition"
                  >
                    Update
                  </button>
                </div>
              </div>

              {/* Sub-Components Checklist */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#00BA7C]" />
                    Monitored Sub-Components ({assetComponents.length})
                  </span>
                  <span className="text-[10px] text-slate-400">Click to toggle component health</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {assetComponents.length > 0 ? (
                    assetComponents.map(comp => (
                      <div
                        key={comp.id}
                        className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            comp.status === 'OPERABLE' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          <div>
                            <strong className="text-slate-800 block text-[11px]">{comp.name}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {comp.status}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const nextStatus = comp.status === 'OPERABLE' ? 'NEEDS_ATTENTION' : 'OPERABLE';
                            comp.status = nextStatus;
                            if (onUpdateComponentStatus) {
                              onUpdateComponentStatus(comp.id, nextStatus);
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                            comp.status === 'OPERABLE'
                              ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {comp.status === 'OPERABLE' ? 'Flag Defect' : 'Clear / Operable'}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 col-span-2 italic py-2">
                      No component subgroups explicitly registered for this asset.
                    </p>
                  )}
                </div>
              </div>

              {/* Work Orders & Maintenance Status */}
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                  <Wrench className="h-4 w-4 text-amber-500" />
                  Active Shop Work Orders ({assetWorkOrders.length})
                </span>

                <div className="space-y-1.5">
                  {assetWorkOrders.length > 0 ? (
                    assetWorkOrders.map(wo => (
                      <div key={wo.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-slate-800">WO #{wo.id.slice(0, 6)}</strong>
                          <p className="text-[11px] text-slate-500 truncate max-w-sm">{wo.description}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {wo.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#00BA7C] shrink-0" />
                      <span>Zero open work orders on this equipment. Unit is field-cleared.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                    if (onNavigateToWorkOrder && scannedAsset) {
                      onNavigateToWorkOrder(scannedAsset.id);
                    }
                  }}
                  className="px-4 py-2 bg-[#182235] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  Create Work Order
                </button>

                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                    if (onNavigateToInspection && scannedAsset) {
                      onNavigateToInspection(scannedAsset.id);
                    }
                  }}
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  Start eDVIR Inspection
                </button>

                <button
                  onClick={() => setActiveTab('BADGE')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  View QR Badge
                </button>
              </div>
            </div>
          )}

          {/* ═════════ TAB 3: ASSET QR BADGE LABEL ═════════ */}
          {activeTab === 'BADGE' && scannedAsset && (
            <div className="space-y-4">
              <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 max-w-sm mx-auto shadow-md text-center space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-xs text-slate-900 tracking-wider uppercase">
                    SuperTruck FleetCare
                  </span>
                  <span className="text-[10px] bg-slate-900 text-white font-mono px-2 py-0.5 rounded font-bold">
                    {scannedAsset.type}
                  </span>
                </div>

                {/* QR Code Image */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block shadow-inner">
                  {/* Real image rendered from dynamic public QR API */}
                  <img
                    src={qrCodeUrl}
                    alt={`QR Code for ${scannedAsset.vin}`}
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <div className="space-y-0.5 text-xs font-mono">
                  <strong className="text-sm font-bold text-slate-900 block font-sans">
                    {scannedAsset.name}
                  </strong>
                  <p className="text-slate-600 font-bold">PLATE: {scannedAsset.plateNumber}</p>
                  <p className="text-[11px] text-slate-400">VIN: {scannedAsset.vin}</p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1">
                    FMCSA TAG • COMPLIANT DUAL-FREQUENCY NFC/QR
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-[#182235] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  Print QR Sticker Label
                </button>

                <button
                  onClick={() => setActiveTab('DIAGNOSTICS')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Back to Diagnostics
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ── MODAL FOOTER ── */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 px-5 flex justify-between items-center text-xs text-slate-500">
          <span>
            {scannedAsset ? `Inspecting ${scannedAsset.name}` : 'Ready for scan input'}
          </span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
