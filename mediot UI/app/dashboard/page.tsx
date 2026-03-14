'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, ScatterChart, Scatter,
} from 'recharts';
import { useFilters } from '@/contexts/filter-context';

const LiveDeviceMonitor = dynamic(() => import('@/components/live-device-monitor').then(m => ({ default: m.LiveDeviceMonitor })), { ssr: false });

const ATTACK_COLORS: Record<string, string> = {
  'DDoS Attack': '#ef4444',
  'Command & Control': '#a855f7',
  'Horizontal Port Scan': '#f59e0b',
  'C&C File Download': '#3b82f6',
  'Malicious File Download': '#06d6a0',
};

const STATUS_COLORS: Record<string, string> = {
  Online: '#22c55e',
  Suspicious: '#f59e0b',
  Critical: '#ef4444',
};

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #475569',
  borderRadius: '0.5rem',
  color: '#e2e8f0',
};

function fmtBytes(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(2)} MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(2)} KB`;
  return `${b} B`;
}

export default function DashboardPage() {
  const {
    filteredDevices: devices, filteredAlerts: alerts, overview, metrics,
    filteredRows: rows, loading, selectedIps,
  } = useFilters();

  // Device health distribution
  const healthDist = useMemo(() => {
    const map: Record<string, number> = { Online: 0, Suspicious: 0, Critical: 0 };
    devices.forEach((d) => { map[d.status] = (map[d.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [devices]);

  // Attack type distribution from overview
  const attackTypeDist = useMemo(() => {
    if (!overview) return [];
    return overview.what.attack_types.map((a) => ({
      name: a.readable_name,
      value: a.count,
      pct: a.percentage,
    }));
  }, [overview]);

  // Trust score distribution (buckets)
  const trustDist = useMemo(() => {
    const buckets = [
      { range: '0-20', count: 0 },
      { range: '20-40', count: 0 },
      { range: '40-60', count: 0 },
      { range: '60-80', count: 0 },
      { range: '80-100', count: 0 },
    ];
    devices.forEach((d) => {
      const idx = Math.min(Math.floor(d.trustScore / 20), 4);
      buckets[idx].count++;
    });
    return buckets;
  }, [devices]);

  // Top compromised devices (lowest trust)
  const topThreats = useMemo(() => {
    return [...devices].sort((a, b) => a.trustScore - b.trustScore).slice(0, 5);
  }, [devices]);

  // Traffic timeline from raw rows
  const trafficTimeline = useMemo(() => {
    if (rows.length === 0) return [];
    const hourMap: Record<string, { benign: number; malicious: number }> = {};
    rows.forEach((r) => {
      const dt = r.datetime?.slice(0, 13) || '';
      if (!dt) return;
      if (!hourMap[dt]) hourMap[dt] = { benign: 0, malicious: 0 };
      if (r.label === 'Malicious') hourMap[dt].malicious++;
      else hourMap[dt].benign++;
    });
    return Object.entries(hourMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, v]) => ({ hour: hour.slice(5), ...v }));
  }, [rows]);

  // IF vs XGB scatter
  const scatterData = useMemo(() => {
    return devices.map((d) => ({
      deviceId: d.deviceId,
      ifScore: d.ifScore || 0,
      xgbScore: d.xgbScore || 0,
      trustScore: d.trustScore,
      status: d.status,
      isMalicious: d.isMalicious,
    }));
  }, [devices]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
          <p className="mt-4 text-slate-400">Loading IoT-23 dataset...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-100">Security Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            IoT-23 Dataset — {metrics?.totalConnections?.toLocaleString() || 0} connections from {metrics?.totalDevices || 0} devices
            {selectedIps.length > 0 && (
              <span className="ml-2 text-blue-400">
                — Filtered to {selectedIps.length} IP{selectedIps.length > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 text-center">
            <p className="text-3xl font-bold text-blue-400">{metrics?.totalDevices || devices.length}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Devices</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 text-center">
            <p className="text-3xl font-bold text-slate-100">{metrics?.totalConnections?.toLocaleString()}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Connections</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 text-center">
            <p className="text-3xl font-bold text-red-400">{metrics?.maliciousConnections?.toLocaleString()}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Malicious</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 text-center">
            <p className="text-3xl font-bold text-red-400">{metrics?.maliciousPct?.toFixed(1)}%</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Malicious Rate</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 text-center">
            <p className="text-3xl font-bold text-orange-400">{metrics?.criticalAlerts || alerts.length}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Critical Alerts</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 text-center">
            <p className="text-3xl font-bold text-cyan-400">{fmtBytes(metrics?.networkTraffic || 0)}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Total Traffic</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Device Health Distribution */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Device Health Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={healthDist} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}>
                  {healthDist.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
              {healthDist.map((h) => (
                <div key={h.name} className="flex items-center gap-2 text-xs">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[h.name] }} />
                  <span className="text-slate-300">{h.name}: {h.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attack Type Distribution */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Attack Type Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={attackTypeDist} layout="vertical" margin={{ left: 160 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={150} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(v: number) => [v.toLocaleString(), 'Connections']} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {attackTypeDist.map((entry) => (
                    <Cell key={entry.name} fill={ATTACK_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Timeline */}
        {trafficTimeline.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Traffic Timeline (Benign vs Malicious)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trafficTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="malicious" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} name="Malicious" />
                <Area type="monotone" dataKey="benign" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.4} name="Benign" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Charts Row 2 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Trust Score Distribution */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Trust Score Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trustDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Devices" radius={[6, 6, 0, 0]}>
                  {trustDist.map((_, i) => {
                    const colors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#22c55e'];
                    return <Cell key={i} fill={colors[i]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* IF vs XGB Scatter */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Isolation Forest vs XGBoost Scores</h3>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="ifScore" type="number" domain={[0, 100]} name="IF Score"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  label={{ value: 'IF Score', position: 'insideBottomRight', offset: -5, fill: '#64748b' }} />
                <YAxis dataKey="xgbScore" type="number" domain={[0, 100]} name="XGB Score"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  label={{ value: 'XGB Score', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                <Tooltip contentStyle={tooltipStyle}
                  content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      const d = payload[0].payload;
                      return (
                        <div className="rounded border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100">
                          <p className="font-semibold">{d.deviceId}</p>
                          <p>Trust: {d.trustScore.toFixed(1)} | IF: {d.ifScore.toFixed(1)} | XGB: {d.xgbScore.toFixed(1)}</p>
                          <p className={d.isMalicious ? 'text-red-400' : 'text-green-400'}>
                            {d.isMalicious ? 'Malicious' : 'Benign'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                <Scatter name="Benign" data={scatterData.filter((d) => !d.isMalicious)} fill="#22c55e" />
                <Scatter name="Malicious" data={scatterData.filter((d) => d.isMalicious)} fill="#ef4444" />
                <Legend />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Threats Table */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Top Threat Devices (Lowest Trust Scores)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">Device IP</th>
                  <th className="pb-3 pr-4 text-center">Status</th>
                  <th className="pb-3 pr-4 text-right">Trust Score</th>
                  <th className="pb-3 pr-4 text-right">IF Score</th>
                  <th className="pb-3 pr-4 text-right">XGB Score</th>
                  <th className="pb-3 pr-4 text-right">Connections</th>
                  <th className="pb-3 pr-4 text-right">Bytes Sent</th>
                  <th className="pb-3 text-right">Failed Conn %</th>
                </tr>
              </thead>
              <tbody>
                {topThreats.map((d) => (
                  <tr key={d.deviceId} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 pr-4 font-mono text-slate-300 text-xs">{d.deviceId}</td>
                    <td className="py-3 pr-4 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        d.status === 'Critical' ? 'bg-red-500/20 text-red-400' :
                        d.status === 'Suspicious' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-xs">
                      <span className={d.trustScore < 50 ? 'text-red-400' : d.trustScore < 80 ? 'text-yellow-400' : 'text-green-400'}>
                        {d.trustScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-xs text-slate-400">{(d.ifScore || 0).toFixed(1)}</td>
                    <td className="py-3 pr-4 text-right font-mono text-xs text-slate-400">{(d.xgbScore || 0).toFixed(1)}</td>
                    <td className="py-3 pr-4 text-right font-mono text-xs text-slate-400">{(d.connectionCount || 0).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right font-mono text-xs text-slate-400">{fmtBytes(d.bytesSent || 0)}</td>
                    <td className="py-3 text-right font-mono text-xs text-slate-400">{((d.failedConnectionRatio || 0) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attack Summary from Overview */}
        {overview && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Where - Compromised Sources */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Compromised Source IPs</h3>
              <div className="space-y-2">
                {overview.where.compromised_sources.map((ip) => {
                  const device = devices.find((d) => d.deviceId === ip);
                  return (
                    <div key={ip} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
                      <span className="font-mono text-sm text-slate-300">{ip}</span>
                      {device && (
                        <span className={`text-xs font-semibold ${
                          device.trustScore < 50 ? 'text-red-400' : device.trustScore < 80 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          Trust: {device.trustScore.toFixed(1)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                  <p className="text-xl font-bold text-red-400">{overview.where.external_destinations}</p>
                  <p className="text-[10px] text-slate-400 uppercase">External Destinations</p>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                  <p className="text-xl font-bold text-blue-400">{overview.where.internal_destinations}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Internal Destinations</p>
                </div>
              </div>
            </div>

            {/* Top Targeted Destinations */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Top Targeted Destinations</h3>
              <div className="space-y-2">
                {Object.entries(overview.where.top_destinations).map(([ip, count]) => {
                  const total = overview.what.total_malicious;
                  const pct = total > 0 ? (count / total * 100) : 0;
                  return (
                    <div key={ip}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono text-slate-300">{ip}</span>
                        <span className="text-slate-400">{count.toLocaleString()} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <h4 className="text-xs font-semibold text-slate-400 uppercase mt-6 mb-3">Top Targeted Ports</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(overview.where.top_dst_ports).map(([port, count]) => (
                  <span key={port} className="rounded-full bg-slate-800 px-3 py-1 text-xs font-mono text-slate-300">
                    :{port} <span className="text-slate-500">({count.toLocaleString()})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Alerts */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">
            Recent Alerts <span className="text-slate-500 font-normal">({alerts.length} total)</span>
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {alerts.slice(0, 10).map((a) => (
              <div key={a.id}
                className={`flex items-center justify-between rounded-lg border p-3 text-xs ${
                  a.severity === 'Critical'
                    ? 'border-red-700 bg-red-900/20 text-red-200'
                    : 'border-yellow-700 bg-yellow-900/20 text-yellow-200'
                }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{a.deviceId}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      a.severity === 'Critical' ? 'bg-red-500/30 text-red-300' : 'bg-yellow-500/30 text-yellow-300'
                    }`}>
                      {a.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] opacity-80 truncate">{a.alertReason}</p>
                </div>
                <span className="text-xs font-mono ml-3 text-slate-400">
                  Trust: {a.trustScore.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Device Monitor */}
      <div className="mt-8">
        <LiveDeviceMonitor />
      </div>
    </div>
  );
}
