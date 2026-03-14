'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine,
} from 'recharts';

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
}

const ATTACK_SCENARIOS = [
  { type: 'Normal', label: 'Benign' as const, weight: 0.45 },
  { type: 'DDoS Attack', label: 'Malicious' as const, weight: 0.15 },
  { type: 'C&C Communication', label: 'Malicious' as const, weight: 0.12 },
  { type: 'Port Scan', label: 'Malicious' as const, weight: 0.10 },
  { type: 'Data Exfiltration', label: 'Malicious' as const, weight: 0.08 },
  { type: 'C&C File Download', label: 'Malicious' as const, weight: 0.05 },
  { type: 'Suspicious Traffic', label: 'Benign' as const, weight: 0.05 },
];

function pickScenario() {
  const r = Math.random();
  let cumulative = 0;
  for (const s of ATTACK_SCENARIOS) {
    cumulative += s.weight;
    if (r < cumulative) return s;
  }
  return ATTACK_SCENARIOS[0];
}

function generateDataPoint(prevCusum: number): LiveDataPoint {
  const scenario = pickScenario();
  const now = new Date();
  const time = now.toLocaleTimeString();

  let bytesSent: number, bytesReceived: number, connectionCount: number;
  let failedRatio: number, externalRatio: number, duration: number;

  switch (scenario.type) {
    case 'DDoS Attack':
      bytesSent = 80000 + Math.random() * 150000;
      bytesReceived = Math.random() * 100;
      connectionCount = 200 + Math.floor(Math.random() * 500);
      failedRatio = 0.7 + Math.random() * 0.3;
      externalRatio = 0.9 + Math.random() * 0.1;
      duration = 0.01 + Math.random() * 0.05;
      break;
    case 'C&C Communication':
      bytesSent = 10 + Math.random() * 50;
      bytesReceived = 30 + Math.random() * 100;
      connectionCount = 3 + Math.floor(Math.random() * 10);
      failedRatio = 0.5 + Math.random() * 0.3;
      externalRatio = 0.95 + Math.random() * 0.05;
      duration = 10 + Math.random() * 30;
      break;
    case 'Port Scan':
      bytesSent = 5000 + Math.random() * 30000;
      bytesReceived = 0;
      connectionCount = 50 + Math.floor(Math.random() * 200);
      failedRatio = 0.95 + Math.random() * 0.05;
      externalRatio = 0.3 + Math.random() * 0.5;
      duration = 0.1 + Math.random() * 0.5;
      break;
    case 'Data Exfiltration':
      bytesSent = 500000 + Math.random() * 2000000;
      bytesReceived = 50 + Math.random() * 200;
      connectionCount = 5 + Math.floor(Math.random() * 15);
      failedRatio = 0.05 + Math.random() * 0.1;
      externalRatio = 1.0;
      duration = 5 + Math.random() * 20;
      break;
    case 'C&C File Download':
      bytesSent = 50 + Math.random() * 200;
      bytesReceived = 50000 + Math.random() * 200000;
      connectionCount = 1 + Math.floor(Math.random() * 5);
      failedRatio = 0.0;
      externalRatio = 1.0;
      duration = 1 + Math.random() * 5;
      break;
    case 'Suspicious Traffic':
      bytesSent = 1000 + Math.random() * 10000;
      bytesReceived = 500 + Math.random() * 5000;
      connectionCount = 10 + Math.floor(Math.random() * 30);
      failedRatio = 0.2 + Math.random() * 0.3;
      externalRatio = 0.3 + Math.random() * 0.4;
      duration = 1 + Math.random() * 10;
      break;
    default: // Normal
      bytesSent = 100 + Math.random() * 2000;
      bytesReceived = 200 + Math.random() * 3000;
      connectionCount = 2 + Math.floor(Math.random() * 8);
      failedRatio = Math.random() * 0.1;
      externalRatio = Math.random() * 0.2;
      duration = 0.5 + Math.random() * 5;
      break;
  }

  // Simulate IF score (higher = more normal)
  let ifScore: number;
  if (scenario.label === 'Malicious') {
    ifScore = 10 + Math.random() * 40;
  } else if (scenario.type === 'Suspicious Traffic') {
    ifScore = 40 + Math.random() * 30;
  } else {
    ifScore = 70 + Math.random() * 30;
  }

  // Simulate XGB score (higher = more benign)
  let xgbScore: number;
  if (scenario.label === 'Malicious') {
    xgbScore = 5 + Math.random() * 30;
  } else if (scenario.type === 'Suspicious Traffic') {
    xgbScore = 50 + Math.random() * 20;
  } else {
    xgbScore = 75 + Math.random() * 25;
  }

  // CUSUM: detect shift if sudden change
  const cusumShift = scenario.label === 'Malicious' && Math.random() > 0.6;

  // Trust Score: 0.4*IF + 0.5*XGB - CUSUM_penalty
  const cusumPenalty = cusumShift ? 10 : 0;
  const trustScore = Math.max(0, Math.min(100, 0.4 * ifScore + 0.5 * xgbScore - cusumPenalty));

  // Status
  let status: 'Healthy' | 'Suspicious' | 'Critical';
  if (trustScore > 80) status = 'Healthy';
  else if (trustScore >= 50) status = 'Suspicious';
  else status = 'Critical';

  return {
    time,
    trustScore: Math.round(trustScore * 10) / 10,
    ifScore: Math.round(ifScore * 10) / 10,
    xgbScore: Math.round(xgbScore * 10) / 10,
    bytesSent: Math.round(bytesSent),
    bytesReceived: Math.round(bytesReceived),
    connectionCount,
    failedRatio: Math.round(failedRatio * 1000) / 1000,
    externalRatio: Math.round(externalRatio * 1000) / 1000,
    duration: Math.round(duration * 1000) / 1000,
    status,
    label: scenario.label,
    attackType: scenario.type,
    cusumShift,
  };
}

const INTERVAL_MS = 10000; // 10 seconds for demo (change to 300000 for 5 min)
const MAX_POINTS = 30;

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #475569',
  borderRadius: '0.5rem',
  color: '#e2e8f0',
};

export function LiveDeviceMonitor() {
  const [history, setHistory] = useState<LiveDataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [alertLog, setAlertLog] = useState<{ time: string; message: string; level: string }[]>([]);
  const prevCusum = useRef(0);

  const tick = useCallback(() => {
    const point = generateDataPoint(prevCusum.current);
    setHistory((prev) => [...prev.slice(-(MAX_POINTS - 1)), point]);

    // Generate alert if status changed
    if (point.status === 'Critical') {
      setAlertLog((prev) => [{
        time: point.time,
        message: `${point.attackType} detected — Trust: ${point.trustScore}, IF: ${point.ifScore}, XGB: ${point.xgbScore}${point.cusumShift ? ', CUSUM SHIFT' : ''}`,
        level: 'critical',
      }, ...prev].slice(0, 15));
    } else if (point.status === 'Suspicious') {
      setAlertLog((prev) => [{
        time: point.time,
        message: `${point.attackType} — Trust: ${point.trustScore}, elevated failed ratio: ${(point.failedRatio * 100).toFixed(1)}%`,
        level: 'warning',
      }, ...prev].slice(0, 15));
    }
  }, []);

  useEffect(() => {
    // Initial data
    tick();
    if (!isRunning) return;
    const interval = setInterval(tick, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

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
            <p className="text-xs text-slate-400">192.168.1.100 — Simulated IoT Device — Updates every 10s</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
        {/* Current State */}
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
            <p className="text-sm font-semibold text-slate-200 mt-1">{latest.attackType}</p>
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
          {/* Trust Score Over Time */}
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

          {/* Algorithm Scores Over Time */}
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
          {/* Traffic Stats */}
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

          {/* Alert Log */}
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
