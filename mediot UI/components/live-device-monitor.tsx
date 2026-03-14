'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine,
} from 'recharts';
import { useFilters, RawRow } from '@/contexts/filter-context';

interface LiveDataPoint {
  time: string;
  trustScore: number;
  ifScore: number;
  xgbScore: number;
  bytesSent: number;
  bytesReceived: number;
  connectionCount: number;
  failedRatio: number;
  externalRatio: number;
  duration: number;
  status: 'Healthy' | 'Suspicious' | 'Critical';
  label: 'Benign' | 'Malicious';
  attackType: string;
  cusumShift: boolean;
  sourceIp: string;
  destIp: string;
  destPort: number;
  connState: string;
}

// ── Simulation constants ──────────────────────────────
const ATTACK_SCENARIOS = [
  { type: 'Benign',             label: 'Benign'    as const, weight: 0.28 },
  { type: 'DDoS Attack',       label: 'Malicious' as const, weight: 0.35 },
  { type: 'C&C Communication', label: 'Malicious' as const, weight: 0.22 },
  { type: 'Horizontal Port Scan', label: 'Malicious' as const, weight: 0.06 },
  { type: 'C&C File Download', label: 'Malicious' as const, weight: 0.05 },
  { type: 'Malicious File Download', label: 'Malicious' as const, weight: 0.04 },
];

const COMPROMISED_IPS = ['192.168.1.195', '192.168.1.197', '192.168.1.199'];
const BENIGN_IPS = [
  '192.168.1.132', '192.168.2.1', '192.168.2.3', '192.168.69.129',
  '192.168.69.136', '192.168.69.192', '192.168.69.73',
];
const DEST_IPS = {
  ddos: ['123.59.209.185'],
  cc: ['185.244.25.235'],
  scan: ['66.67.61.168', '71.61.66.148'],
  download: ['46.101.251.172'],
};

const ATTACK_LABEL_MAP: Record<string, string> = {
  DDoS: 'DDoS Attack',
  'C&C': 'C&C Communication',
  PartOfAHorizontalPortScan: 'Horizontal Port Scan',
  'C&C-FileDownload': 'C&C File Download',
  FileDownload: 'Malicious File Download',
  Benign: 'Benign',
  '-': 'Benign',
  '': 'Benign',
};

function pickScenario() {
  const r = Math.random();
  let cumulative = 0;
  for (const s of ATTACK_SCENARIOS) {
    cumulative += s.weight;
    if (r < cumulative) return s;
  }
  return ATTACK_SCENARIOS[0];
}

function vary(center: number, pct: number = 0.2): number {
  return center * (1 + (Math.random() - 0.5) * 2 * pct);
}

function generateSimulatedPoint(): LiveDataPoint {
  const scenario = pickScenario();
  const now = new Date();
  const time = now.toLocaleTimeString();

  let bytesSent: number, bytesReceived: number, connectionCount: number;
  let failedRatio: number, externalRatio: number, duration: number;
  let ifScore: number, xgbScore: number, cusumShift: boolean;
  let sourceIp: string, destIp: string, destPort: number, connState: string;

  switch (scenario.type) {
    case 'DDoS Attack':
      sourceIp = '192.168.1.195'; destIp = DEST_IPS.ddos[0]; destPort = 80;
      connState = Math.random() > 0.01 ? 'OTH' : 'S0';
      bytesSent = vary(126459, 0.3); bytesReceived = Math.random() * 10;
      connectionCount = Math.floor(vary(480, 0.4));
      failedRatio = vary(0.6048, 0.1); externalRatio = vary(0.9877, 0.01);
      duration = vary(0.0253, 0.3);
      ifScore = vary(75.63, 0.08); xgbScore = vary(41.23, 0.15);
      cusumShift = Math.random() > 0.3;
      break;
    case 'C&C Communication':
      sourceIp = '192.168.1.199'; destIp = DEST_IPS.cc[0];
      destPort = Math.random() > 0.002 ? 6667 : 80;
      connState = Math.random() > 0.24 ? 'S0' : Math.random() > 0.03 ? 'S3' : 'RSTR';
      bytesSent = vary(20.6, 0.4); bytesReceived = vary(69.7, 0.4);
      connectionCount = Math.floor(vary(224, 0.3));
      failedRatio = vary(0.4713, 0.15); externalRatio = 1.0;
      duration = vary(18.77, 0.3);
      ifScore = vary(65.19, 0.1); xgbScore = vary(80.05, 0.1);
      cusumShift = Math.random() > 0.3;
      break;
    case 'Horizontal Port Scan':
      sourceIp = '192.168.1.197'; destIp = DEST_IPS.scan[Math.floor(Math.random() * 2)];
      destPort = Math.random() > 0.008 ? 63798 : 256; connState = 'S0';
      bytesSent = vary(24139.5, 0.3); bytesReceived = 0;
      connectionCount = Math.floor(vary(122, 0.3));
      failedRatio = 1.0; externalRatio = vary(0.936, 0.05);
      duration = vary(0.3035, 0.3);
      ifScore = vary(78.88, 0.08); xgbScore = vary(92.71, 0.05);
      cusumShift = Math.random() > 0.4;
      break;
    case 'C&C File Download':
      sourceIp = '192.168.1.195'; destIp = DEST_IPS.download[0];
      destPort = 80; connState = 'SF';
      bytesSent = vary(149.4, 0.3); bytesReceived = vary(128613.2, 0.2);
      connectionCount = 1 + Math.floor(Math.random() * 3);
      failedRatio = 0.0; externalRatio = 1.0;
      duration = vary(1.9336, 0.3);
      ifScore = vary(75.63, 0.1); xgbScore = vary(41.23, 0.2);
      cusumShift = Math.random() > 0.4;
      break;
    case 'Malicious File Download':
      sourceIp = COMPROMISED_IPS[Math.floor(Math.random() * 3)];
      destIp = DEST_IPS.download[0]; destPort = 80; connState = 'SF';
      bytesSent = vary(83.3, 0.3); bytesReceived = vary(64982, 0.2);
      connectionCount = 1 + Math.floor(Math.random() * 2);
      failedRatio = 0.0; externalRatio = 1.0;
      duration = vary(1.8953, 0.3);
      ifScore = vary(70, 0.15); xgbScore = vary(50, 0.2);
      cusumShift = Math.random() > 0.5;
      break;
    default:
      sourceIp = BENIGN_IPS[Math.floor(Math.random() * BENIGN_IPS.length)];
      destIp = `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      destPort = [80, 443, 53, 8080][Math.floor(Math.random() * 4)];
      connState = ['SF', 'S0', 'S1'][Math.floor(Math.random() * 3)];
      bytesSent = vary(5000, 0.8); bytesReceived = vary(3000, 0.8);
      connectionCount = 3 + Math.floor(Math.random() * 12);
      failedRatio = vary(0.7, 0.3); externalRatio = vary(0.8, 0.2);
      duration = vary(15, 0.8);
      ifScore = 73 + Math.random() * 20; xgbScore = 82 + Math.random() * 12;
      cusumShift = false;
      break;
  }

  const cusumPenalty = cusumShift ? 10 : 0;
  const trustScore = Math.max(0, Math.min(100, 0.4 * ifScore + 0.5 * xgbScore - cusumPenalty));
  let status: 'Healthy' | 'Suspicious' | 'Critical';
  if (trustScore > 80) status = 'Healthy';
  else if (trustScore >= 50) status = 'Suspicious';
  else status = 'Critical';

  return {
    time, trustScore: Math.round(trustScore * 10) / 10,
    ifScore: Math.round(ifScore * 10) / 10, xgbScore: Math.round(xgbScore * 10) / 10,
    bytesSent: Math.round(bytesSent), bytesReceived: Math.round(bytesReceived),
    connectionCount,
    failedRatio: Math.round(Math.min(1, Math.max(0, failedRatio)) * 1000) / 1000,
    externalRatio: Math.round(Math.min(1, Math.max(0, externalRatio)) * 1000) / 1000,
    duration: Math.round(Math.max(0, duration) * 1000) / 1000,
    status, label: scenario.label, attackType: scenario.type, cusumShift,
    sourceIp, destIp, destPort, connState,
  };
}

// ── Aggregate a batch of raw rows into a single LiveDataPoint ──
function aggregateWindow(
  rows: RawRow[],
  device: { ifScore?: number; xgbScore?: number; cusumShift?: boolean; failedConnectionRatio?: number; externalIpRatio?: number },
  windowLabel: string,
): LiveDataPoint {
  const n = rows.length;
  const malCount = rows.filter(r => r.label === 'Malicious').length;
  const malRatio = n > 0 ? malCount / n : 0;

  // Aggregate traffic stats from the window
  const totalBytesSent = rows.reduce((s, r) => s + (r.orig_bytes || 0), 0);
  const totalBytesRecv = rows.reduce((s, r) => s + (r.resp_bytes || 0), 0);
  const avgDuration = n > 0 ? rows.reduce((s, r) => s + (r.duration || 0), 0) / n : 0;

  const failedStates = ['S0', 'REJ', 'RSTO', 'RSTR'];
  const failedCount = rows.filter(r => failedStates.includes(r.conn_state)).length;
  const failedRatio = n > 0 ? failedCount / n : 0;

  // Unique destinations
  const dstIps = new Set(rows.map(r => r['id.resp_h']).filter(Boolean));
  const dstPorts = new Set(rows.map(r => r['id.resp_p']).filter(Boolean));

  // Compute IF & XGB scores for this window based on device baseline + malicious ratio shift
  const baseIf = device.ifScore ?? 80;
  const baseXgb = device.xgbScore ?? 95;
  // Shift scores based on how malicious this specific window is
  const ifScore = Math.max(0, Math.min(100, baseIf - malRatio * vary(25, 0.3) + (Math.random() - 0.5) * 8));
  const xgbScore = Math.max(0, Math.min(100, baseXgb - malRatio * vary(40, 0.3) + (Math.random() - 0.5) * 6));

  const cusumShift = (device.cusumShift ?? false) && malRatio > 0.3;
  const cusumPenalty = cusumShift ? 10 : 0;
  const trustScore = Math.max(0, Math.min(100, 0.4 * ifScore + 0.5 * xgbScore - cusumPenalty));

  let status: 'Healthy' | 'Suspicious' | 'Critical';
  if (trustScore > 80) status = 'Healthy';
  else if (trustScore >= 50) status = 'Suspicious';
  else status = 'Critical';

  // Dominant attack type in this window
  const attackCounts: Record<string, number> = {};
  rows.forEach(r => {
    const at = ATTACK_LABEL_MAP[r.attack_type] || ATTACK_LABEL_MAP[r.attack_label] || r.attack_type || 'Benign';
    attackCounts[at] = (attackCounts[at] || 0) + 1;
  });
  const dominantAttack = Object.entries(attackCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Benign';

  // Most common dest IP and port
  const destIpCounts: Record<string, number> = {};
  const destPortCounts: Record<number, number> = {};
  rows.forEach(r => {
    if (r['id.resp_h']) destIpCounts[r['id.resp_h']] = (destIpCounts[r['id.resp_h']] || 0) + 1;
    if (r['id.resp_p']) destPortCounts[r['id.resp_p']] = (destPortCounts[r['id.resp_p']] || 0) + 1;
  });
  const topDestIp = Object.entries(destIpCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  const topDestPort = Number(Object.entries(destPortCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 0);

  // Most common conn state
  const stateCounts: Record<string, number> = {};
  rows.forEach(r => { if (r.conn_state) stateCounts[r.conn_state] = (stateCounts[r.conn_state] || 0) + 1; });
  const topConnState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'OTH';

  return {
    time: windowLabel,
    trustScore: Math.round(trustScore * 10) / 10,
    ifScore: Math.round(ifScore * 10) / 10,
    xgbScore: Math.round(xgbScore * 10) / 10,
    bytesSent: totalBytesSent,
    bytesReceived: totalBytesRecv,
    connectionCount: n,
    failedRatio: Math.round(failedRatio * 1000) / 1000,
    externalRatio: device.externalIpRatio ?? 1,
    duration: Math.round(avgDuration * 1000) / 1000,
    status,
    label: malCount > n / 2 ? 'Malicious' : 'Benign',
    attackType: dominantAttack,
    cusumShift,
    sourceIp: rows[0]?.device_id || 'unknown',
    destIp: topDestIp,
    destPort: topDestPort,
    connState: topConnState,
  };
}

const INTERVAL_MS = 45000;
const MAX_POINTS = 30;

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #475569',
  borderRadius: '0.5rem',
  color: '#e2e8f0',
};

export function LiveDeviceMonitor() {
  const { selectedIps, filteredDevices, filteredRows, devices, allIps } = useFilters();
  const [history, setHistory] = useState<LiveDataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [alertLog, setAlertLog] = useState<{ time: string; message: string; level: string }[]>([]);
  const [countdown, setCountdown] = useState(INTERVAL_MS / 1000);
  const telemetryIdx = useRef(0);

  // Determine mode: telemetry (single IP selected) vs simulation
  const isTelemetry = selectedIps.length === 1;
  const selectedDevice = isTelemetry ? filteredDevices[0] : null;

  // Split device's connections into time windows for telemetry replay
  const deviceWindows = useMemo(() => {
    if (!isTelemetry || filteredRows.length === 0) return [];
    const sorted = [...filteredRows].sort((a, b) => a.ts - b.ts);
    // Split into windows of ~WINDOW_SIZE connections each
    const WINDOW_SIZE = Math.max(5, Math.ceil(sorted.length / 30)); // ~30 windows max
    const windows: RawRow[][] = [];
    for (let i = 0; i < sorted.length; i += WINDOW_SIZE) {
      windows.push(sorted.slice(i, i + WINDOW_SIZE));
    }
    return windows;
  }, [isTelemetry, filteredRows]);

  const totalConns = filteredRows.length;

  // Reset history and telemetry index when mode or IP changes
  useEffect(() => {
    setHistory([]);
    setAlertLog([]);
    telemetryIdx.current = 0;
    setCountdown(INTERVAL_MS / 1000);
  }, [selectedIps.join(',')]);

  const tick = useCallback(() => {
    let point: LiveDataPoint;

    if (isTelemetry && deviceWindows.length > 0 && selectedDevice) {
      // Telemetry mode: aggregate a window of connections
      const idx = telemetryIdx.current % deviceWindows.length;
      const windowRows = deviceWindows[idx];
      const windowNum = idx + 1;
      point = aggregateWindow(windowRows, selectedDevice, `W${windowNum}`);
      telemetryIdx.current = idx + 1;
    } else {
      // Simulation mode
      point = generateSimulatedPoint();
    }

    setHistory((prev) => [...prev.slice(-(MAX_POINTS - 1)), point]);

    if (point.status === 'Critical') {
      setAlertLog((prev) => [{
        time: point.time,
        message: `${point.sourceIp} → ${point.destIp}:${point.destPort} — ${point.attackType} — Trust: ${point.trustScore}, IF: ${point.ifScore}, XGB: ${point.xgbScore}, ${point.connectionCount} conns${point.cusumShift ? ', CUSUM SHIFT' : ''}`,
        level: 'critical',
      }, ...prev].slice(0, 15));
    } else if (point.status === 'Suspicious') {
      setAlertLog((prev) => [{
        time: point.time,
        message: `${point.sourceIp} — ${point.attackType} — Trust: ${point.trustScore}, IF: ${point.ifScore}, XGB: ${point.xgbScore}, ${point.connectionCount} conns, failed: ${(point.failedRatio * 100).toFixed(1)}%`,
        level: 'warning',
      }, ...prev].slice(0, 15));
    }
    setCountdown(INTERVAL_MS / 1000);
  }, [isTelemetry, deviceWindows, selectedDevice]);

  useEffect(() => {
    tick();
    if (!isRunning) return;
    const interval = setInterval(tick, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Countdown timer
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? INTERVAL_MS / 1000 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const latest = history[history.length - 1];
  if (!latest) return null;

  const statusColor = latest.status === 'Healthy' ? '#22c55e' : latest.status === 'Suspicious' ? '#f59e0b' : '#ef4444';
  const statusBg = latest.status === 'Healthy' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
    latest.status === 'Suspicious' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
    'bg-red-500/20 border-red-500/30 text-red-400';

  const malCount = history.filter((h) => h.label === 'Malicious').length;
  const benignCount = history.filter((h) => h.label === 'Benign').length;

  return (
    <div className="rounded-lg border-2 border-blue-500/30 bg-slate-900/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
          <div>
            <h3 className="text-lg font-bold text-slate-100">Live Device Monitor</h3>
            {isTelemetry ? (
              <p className="text-xs text-cyan-400">
                TELEMETRY — {selectedIps[0]} — {totalConns.toLocaleString()} connections in {deviceWindows.length} windows — Window {Math.min(telemetryIdx.current, deviceWindows.length)}/{deviceWindows.length}
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                SIMULATION — IoT-23 attack patterns — Select a single IP in the filter for real telemetry
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode badge */}
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
            isTelemetry ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400' : 'bg-purple-500/20 border border-purple-500/40 text-purple-400'
          }`}>
            {isTelemetry ? 'Telemetry' : 'Simulation'}
          </span>
          <div className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5">
            <span className="text-[10px] text-slate-400 uppercase">Next</span>
            <span className={`text-sm font-mono font-bold ${countdown <= 5 ? 'text-red-400 animate-pulse' : countdown <= 15 ? 'text-yellow-400' : 'text-blue-400'}`}>
              {countdown}s
            </span>
          </div>
          <span className={`inline-block rounded-full border px-3 py-1 text-sm font-bold ${statusBg}`}>
            {latest.status}
          </span>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
          >
            {isRunning ? '⏸ Pause' : '▶ Resume'}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Current State — ML Scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="rounded-lg bg-slate-800/80 p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase">Trust Score</p>
            <p className="text-2xl font-bold mt-1" style={{ color: statusColor }}>{latest.trustScore}</p>
          </div>
          <div className="rounded-lg bg-slate-800/80 p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase">IF Score</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{latest.ifScore}</p>
          </div>
          <div className="rounded-lg bg-slate-800/80 p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase">XGB Score</p>
            <p className="text-2xl font-bold text-orange-400 mt-1">{latest.xgbScore}</p>
          </div>
          <div className="rounded-lg bg-slate-800/80 p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase">CUSUM</p>
            <p className={`text-2xl font-bold mt-1 ${latest.cusumShift ? 'text-red-400' : 'text-slate-400'}`}>
              {latest.cusumShift ? 'SHIFT' : 'Stable'}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/80 p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase">Classification</p>
            <p className={`text-lg font-bold mt-1 ${latest.label === 'Malicious' ? 'text-red-400' : 'text-green-400'}`}>
              {latest.label}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/80 p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase">Attack Type</p>
            <p className={`text-sm font-semibold mt-1 ${latest.label === 'Malicious' ? 'text-red-300' : 'text-green-300'}`}>{latest.attackType}</p>
          </div>
          <div className="rounded-lg bg-slate-800/80 p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase">Connections</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{latest.connectionCount}</p>
          </div>
          <div className="rounded-lg bg-slate-800/80 p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase">Failed %</p>
            <p className={`text-2xl font-bold mt-1 ${latest.failedRatio > 0.5 ? 'text-red-400' : 'text-slate-300'}`}>
              {(latest.failedRatio * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Network Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3">
            <p className="text-[10px] text-slate-500 uppercase">Source IP</p>
            <p className={`text-sm font-mono font-bold mt-1 ${COMPROMISED_IPS.includes(latest.sourceIp) ? 'text-red-400' : 'text-slate-200'}`}>
              {latest.sourceIp}
              {COMPROMISED_IPS.includes(latest.sourceIp) && <span className="text-[9px] ml-1.5 text-red-500">(COMPROMISED)</span>}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3">
            <p className="text-[10px] text-slate-500 uppercase">Destination IP</p>
            <p className="text-sm font-mono font-bold text-slate-200 mt-1">{latest.destIp}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3">
            <p className="text-[10px] text-slate-500 uppercase">Dest Port</p>
            <p className="text-sm font-mono font-bold text-cyan-400 mt-1">
              {latest.destPort}
              <span className="text-[9px] text-slate-500 ml-1.5">
                {latest.destPort === 80 ? '(HTTP)' : latest.destPort === 443 ? '(HTTPS)' : latest.destPort === 6667 ? '(IRC)' : latest.destPort === 53 ? '(DNS)' : latest.destPort === 63798 ? '(Scan)' : ''}
              </span>
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3">
            <p className="text-[10px] text-slate-500 uppercase">Conn State</p>
            <p className={`text-sm font-mono font-bold mt-1 ${latest.connState === 'SF' ? 'text-green-400' : latest.connState === 'S0' ? 'text-red-400' : 'text-yellow-400'}`}>
              {latest.connState}
              <span className="text-[9px] text-slate-500 ml-1.5">
                {latest.connState === 'SF' ? '(Complete)' : latest.connState === 'S0' ? '(No reply)' : latest.connState === 'OTH' ? '(Midstream)' : latest.connState === 'S3' ? '(Teardown)' : latest.connState === 'RSTR' ? '(Reset)' : latest.connState === 'S1' ? '(Established)' : ''}
              </span>
            </p>
          </div>
        </div>

        {/* Trust Formula Breakdown */}
        <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-4">
          <p className="text-xs text-slate-400 mb-2 font-semibold uppercase">Trust Score Calculation</p>
          <div className="flex items-center gap-2 text-sm font-mono text-slate-300 flex-wrap">
            <span className="text-emerald-400">{(0.4 * latest.ifScore).toFixed(1)}</span>
            <span className="text-slate-500">(0.4 x IF:{latest.ifScore})</span>
            <span className="text-slate-500">+</span>
            <span className="text-orange-400">{(0.5 * latest.xgbScore).toFixed(1)}</span>
            <span className="text-slate-500">(0.5 x XGB:{latest.xgbScore})</span>
            <span className="text-slate-500">-</span>
            <span className={latest.cusumShift ? 'text-red-400' : 'text-slate-400'}>{latest.cusumShift ? '10.0' : '0.0'}</span>
            <span className="text-slate-500">(CUSUM penalty)</span>
            <span className="text-slate-500">=</span>
            <span className="text-lg font-bold" style={{ color: statusColor }}>{latest.trustScore}</span>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase mb-3">Trust Score Timeline</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Healthy', fill: '#22c55e', fontSize: 10 }} />
                <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Suspicious', fill: '#f59e0b', fontSize: 10 }} />
                <Area type="monotone" dataKey="trustScore" stroke={statusColor} fill={statusColor} fillOpacity={0.15} strokeWidth={2} name="Trust Score"
                  dot={(props: { cx: number; cy: number; payload: LiveDataPoint }) => {
                    const { cx, cy, payload } = props;
                    const c = payload.status === 'Healthy' ? '#22c55e' : payload.status === 'Suspicious' ? '#f59e0b' : '#ef4444';
                    return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3} fill={c} stroke={c} />;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase mb-3">Algorithm Scores</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="ifScore" stroke="#10b981" strokeWidth={2} dot={false} name="IF Score" />
                <Line type="monotone" dataKey="xgbScore" stroke="#f97316" strokeWidth={2} dot={false} name="XGB Score" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block" /> IF Score</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-orange-500 inline-block" /> XGB Score</span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Traffic + Alert Log */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase mb-3">Traffic Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded bg-slate-800/50 p-2">
                <p className="text-[10px] text-slate-500">Bytes Sent</p>
                <p className="text-sm font-bold text-slate-200">{latest.bytesSent.toLocaleString()}</p>
              </div>
              <div className="rounded bg-slate-800/50 p-2">
                <p className="text-[10px] text-slate-500">Bytes Received</p>
                <p className="text-sm font-bold text-slate-200">{latest.bytesReceived.toLocaleString()}</p>
              </div>
              <div className="rounded bg-slate-800/50 p-2">
                <p className="text-[10px] text-slate-500">External IP Ratio</p>
                <p className={`text-sm font-bold ${latest.externalRatio > 0.5 ? 'text-red-400' : 'text-slate-200'}`}>
                  {(latest.externalRatio * 100).toFixed(1)}%
                </p>
              </div>
              <div className="rounded bg-slate-800/50 p-2">
                <p className="text-[10px] text-slate-500">Avg Duration</p>
                <p className="text-sm font-bold text-slate-200">{latest.duration.toFixed(3)}s</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">Session: <span className="text-green-400 font-bold">{benignCount}</span> benign, <span className="text-red-400 font-bold">{malCount}</span> malicious</span>
              <span className="text-slate-500">{history.length} data points</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase mb-3">Alert Log</h4>
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
              {alertLog.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No alerts yet — monitoring...</p>
              ) : (
                alertLog.map((a, i) => (
                  <div key={i} className={`flex items-start gap-2 rounded px-2 py-1.5 text-[11px] ${
                    a.level === 'critical' ? 'bg-red-900/20 text-red-200' : 'bg-yellow-900/20 text-yellow-200'
                  }`}>
                    <span className="text-slate-500 flex-shrink-0 font-mono">{a.time}</span>
                    <span>{a.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
