'use client';

import React from 'react';

interface StageInfo {
  title: string;
  icon: string;
  description: string;
  details: string[];
  color: string;
  bgColor: string;
}

const stages: StageInfo[] = [
  {
    title: 'IoT-23 Dataset',
    icon: '📦',
    description: 'Real network traffic from Stratosphere Lab (Czech Technical University)',
    details: [
      '29,634 Zeek conn.log connections',
      '19 monitored devices (from 30 source IPs)',
      '21,254 malicious / 8,380 benign',
      '5 capture files (3 malware + 2 benign)',
      'Attack types: DDoS, C&C, Port Scan, File Download',
    ],
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    title: 'Preprocessing & Feature Engineering',
    icon: '🔍',
    description: 'Parse Zeek logs and extract 13 behavioral features per device-window',
    details: [
      'Mixed tab/space delimiter handling for IoT-23 files',
      '30-minute sliding window aggregation per source IP',
      '177 device-window samples generated',
      '13 features: bytes, packets, ports, durations, ratios',
      'Label propagation from detailed-label to attack_type',
    ],
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    title: 'Isolation Forest',
    icon: '🌲',
    description: 'Unsupervised anomaly detection trained on benign-only traffic',
    details: [
      'Trained exclusively on benign samples',
      'contamination=0.1, n_estimators=100',
      'Min-max normalized scores (0-100)',
      'Detects deviations from learned baseline',
      'Weight: 40% of trust score formula',
    ],
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    title: 'XGBoost Classifier',
    icon: '🎯',
    description: 'Supervised binary classifier with 85.2% accuracy',
    details: [
      'n_estimators=50, max_depth=3, heavy regularization',
      'Temporal holdout split (50/50 per device)',
      '85.2% test accuracy on IoT-23 data',
      'Outputs malicious probability per sample',
      'Weight: 50% of trust score formula',
    ],
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
  {
    title: 'CUSUM Change-Point Detection',
    icon: '📉',
    description: 'Detects sudden behavioral shifts in time-windowed traffic metrics',
    details: [
      '5-minute time windows per device',
      'Monitors bytes_sent and connection_count',
      'threshold=8.0, drift=1.0',
      'Penalty: -10 trust points if shift detected',
      '5 change points detected in IoT-23 data',
    ],
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
  {
    title: 'Trust Score Engine & Alerts',
    icon: '⚖️',
    description: 'Combines all 3 algorithms into a single 0-100 trust score',
    details: [
      'Formula: 0.4*IF + 0.5*XGB - CUSUM_penalty',
      '>80 = Healthy, 50-80 = Suspicious, <50 = ALERT',
      'Alert engine with deviation explanations',
      'Attack overview: What/How/Where/When narrative',
      'Exports to JSON for dashboard consumption',
    ],
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
];

function Arrow({ direction = 'vertical' }: { direction?: 'vertical' | 'horizontal' }) {
  if (direction === 'vertical') {
    return (
      <div className="flex justify-center py-4">
        <div className="relative h-8 w-1 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600">
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 transform text-slate-400 dark:text-slate-500">
            ▼
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-center px-0 sm:px-2">
      <div className="relative h-1 w-8 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600">
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 transform text-slate-400 dark:text-slate-500">
          ▶
        </div>
      </div>
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            System Architecture
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            MedIoT Shield: Healthcare IoT Security Monitoring Pipeline
          </p>
          <p className="mt-4 max-w-3xl text-slate-700 dark:text-slate-300">
            An ensemble ML pipeline using Isolation Forest, XGBoost, and CUSUM to detect malicious
            activity in healthcare IoT networks, assign trust scores, and generate actionable alerts.
            Trained and validated on the real IoT-23 dataset from Stratosphere Lab.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* System Overview Statistics */}
        <div className="mb-12 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Connections Analyzed
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
              29,634
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              From 19 unique IoT device IPs
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              XGBoost Accuracy
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              85.2%
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              On 80/20 stratified test split
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Malicious Detected
            </p>
            <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
              71.7%
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              21,254 of 29,634 connections
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              ML Features
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              13
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Per device-window sample (177 total)
            </p>
          </div>
        </div>

        {/* Architecture Pipeline - Desktop */}
        <div className="mb-12 hidden lg:block">
          <div className="rounded-lg border-2 border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-slate-100">
              Data Flow Pipeline
            </h2>

            {/* Desktop Layout - Horizontal */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {stages.map((stage, index) => (
                <React.Fragment key={stage.title}>
                  {/* Stage Card */}
                  <div className="flex-1 min-w-fit">
                    <div
                      className={`rounded-lg border border-slate-200 ${stage.bgColor} p-4 dark:border-slate-700 transition-all hover:shadow-lg`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{stage.icon}</span>
                        <h3 className={`font-bold ${stage.color} text-sm`}>
                          {stage.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  {index < stages.length - 1 && (
                    <div className="px-2">
                      <Arrow direction="horizontal" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Architecture Pipeline - Mobile/Tablet */}
        <div className="mb-12 lg:hidden">
          <div className="rounded-lg border-2 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-slate-100">
              Data Flow Pipeline
            </h2>

            {/* Vertical Layout */}
            <div className="space-y-0">
              {stages.map((stage, index) => (
                <React.Fragment key={stage.title}>
                  {/* Stage Card */}
                  <div
                    className={`rounded-lg border border-slate-200 ${stage.bgColor} p-4 dark:border-slate-700 transition-all hover:shadow-lg`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{stage.icon}</span>
                      <h3 className={`font-bold ${stage.color}`}>
                        {stage.title}
                      </h3>
                    </div>
                  </div>

                  {/* Arrow */}
                  {index < stages.length - 1 && <Arrow direction="vertical" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Stage Explanations */}
        <div className="mb-12">
          <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Pipeline Stages
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {stages.map((stage) => (
              <div
                key={stage.title}
                className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-lg"
              >
                {/* Header */}
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-4xl">{stage.icon}</span>
                  <div>
                    <h3 className={`text-xl font-bold ${stage.color}`}>
                      {stage.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
                  {stage.description}
                </p>

                {/* Details List */}
                <div className={`rounded-lg ${stage.bgColor} p-4 dark:border-slate-700`}>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Key Details
                  </h4>
                  <ul className="space-y-1">
                    {stage.details.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Score Formula */}
        <div className="mb-12">
          <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Trust Score Formula
          </h2>

          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-center mb-6">
              <code className="text-lg font-mono text-slate-100 bg-slate-800 px-4 py-2 rounded">
                trust = 0.4 × IF_score + 0.5 × XGB_score − CUSUM_penalty
              </code>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
                <h3 className="font-bold text-green-900 dark:text-green-100">
                  IF_score (40%)
                </h3>
                <p className="mt-2 text-sm text-green-800 dark:text-green-200">
                  Isolation Forest anomaly score, min-max normalized to 0-100. Higher = more normal.
                </p>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-900/20">
                <h3 className="font-bold text-orange-900 dark:text-orange-100">
                  XGB_score (50%)
                </h3>
                <p className="mt-2 text-sm text-orange-800 dark:text-orange-200">
                  (1 - malicious_probability) × 100. XGBoost confidence that the device is benign.
                </p>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
                <h3 className="font-bold text-red-900 dark:text-red-100">
                  CUSUM_penalty
                </h3>
                <p className="mt-2 text-sm text-red-800 dark:text-red-200">
                  -10 points if CUSUM detects a behavioral change point, 0 otherwise. Final score clamped 0-100.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">&gt;80</p>
                <p className="text-sm text-green-800 dark:text-green-200">Healthy</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">50-80</p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">Suspicious</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">&lt;50</p>
                <p className="text-sm text-red-800 dark:text-red-200">ALERT</p>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mb-12">
          <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Technology Stack
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                ML Pipeline (Python)
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>• scikit-learn — Isolation Forest (unsupervised anomaly detection)</li>
                <li>• XGBoost — Gradient boosted classifier (85.2% accuracy)</li>
                <li>• Custom CUSUM — Change-point detection on time-series</li>
                <li>• Pandas / NumPy — Data processing and feature engineering</li>
                <li>• joblib — Model serialization (PKL files)</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                Dashboard (Next.js 14)
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>• Next.js 14 — App Router with client-side rendering</li>
                <li>• TypeScript — Full type safety across components</li>
                <li>• Tailwind CSS — Responsive dark-mode UI</li>
                <li>• Recharts — Interactive charts and visualizations</li>
                <li>• React Context API — Global filter state management</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                Dataset
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>• IoT-23 — Stratosphere Lab, Czech Technical University</li>
                <li>• Zeek conn.log.labeled format (tab-separated)</li>
                <li>• 3 malware captures: CTU-34-1, CTU-42-1, CTU-44-1</li>
                <li>• 2 benign captures: Honeypot-4-1, Honeypot-5-1</li>
                <li>• Attack types: DDoS, C&C, Port Scan, File Download</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                Feature Set (13 features)
              </h3>
              <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                See detailed breakdown below
              </p>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>• 3 volume features (bytes sent/received, packets)</li>
                <li>• 3 connection features (count, duration, failed ratio)</li>
                <li>• 3 network diversity features (unique IPs, ports, entropy)</li>
                <li>• 4 behavioral features (external ratio, payload, DNS, off-hours)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 13 ML Features Breakdown */}
        <div className="mb-12">
          <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-slate-100">
            13 ML Features — Detailed Breakdown
          </h2>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
            Each feature is extracted per device over a 30-minute sliding window. Together they form
            the input vector for both Isolation Forest and XGBoost models.
          </p>

          {/* Volume Features */}
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold text-blue-600 dark:text-blue-400">
              Volume Features
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">1. bytes_sent</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Total outbound bytes (orig_bytes) from the device within the window. High values may indicate
                  data exfiltration or DDoS participation. DDoS devices averaged 126,459 bytes/connection.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">2. bytes_received</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Total inbound bytes (resp_bytes) received by the device. C&C File Download attacks showed
                  avg 128,613 bytes received per connection — orders of magnitude above normal.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">3. packet_count</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Total number of packets exchanged in the window. Correlates with connection volume and
                  helps distinguish short bursts (scans) from sustained traffic (C&C beaconing).
                </p>
              </div>
            </div>
          </div>

          {/* Connection Features */}
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold text-green-600 dark:text-green-400">
              Connection Features
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">4. connection_count</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Number of individual TCP/UDP connections in the window. Port scanning devices showed 122
                  connections with 100% failure rate. DDoS showed 14,395 rapid connections.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">5. avg_connection_duration</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Mean duration (seconds) per connection. C&C connections averaged 18.77s (persistent beaconing),
                  while DDoS averaged just 0.025s (rapid fire-and-forget).
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">6. failed_connection_ratio</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Proportion of connections in states S0 (no response), REJ (rejected), RSTO/RSTR (reset).
                  Port scans had 100% S0 state. C&C showed 75.6% S0 (probing for C&C servers).
                </p>
              </div>
            </div>
          </div>

          {/* Network Diversity Features */}
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold text-purple-600 dark:text-purple-400">
              Network Diversity Features
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">7. unique_dst_ips</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Count of distinct destination IPs contacted. Normal IoT devices talk to 1-3 servers.
                  Scanning devices contacted 121+ unique IPs across the network.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">8. unique_dst_ports</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Count of distinct destination ports targeted. Normal devices use 1-5 ports.
                  DDoS focused on port 80 (14,394 connections), C&C on port 6667 (IRC protocol, 6,706 connections).
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">9. port_entropy</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Shannon entropy of destination port distribution. Low entropy = concentrated on few ports
                  (DDoS on port 80). High entropy = spread across many ports (reconnaissance scanning).
                </p>
              </div>
            </div>
          </div>

          {/* Behavioral Features */}
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold text-orange-600 dark:text-orange-400">
              Behavioral Features
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">10. external_ip_ratio</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Fraction of connections going to non-RFC1918 (external) IPs. All 10 malicious destinations
                  in the dataset were external. Benign devices mostly communicate internally.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">11. avg_payload_size</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Mean payload bytes per connection (orig_bytes + resp_bytes). File downloads averaged
                  65,065 bytes vs. DDoS at 126,459 bytes outbound with 0 bytes received.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">12. dns_query_count</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Number of DNS resolution requests in the window. Elevated DNS queries can indicate
                  domain generation algorithm (DGA) activity used by botnets for C&C server discovery.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">13. off_hours_ratio</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Fraction of connections occurring outside business hours (8PM-6AM). Malware often operates
                  during off-hours to avoid detection. High ratios flag suspicious nocturnal activity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
            How It Works
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Data Loading
                </h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  Load 29,634 Zeek conn.log.labeled connections from 5 IoT-23 capture files.
                  Parse mixed tab/space delimiters and normalize labels to Malicious/Benign.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-white font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Feature Engineering
                </h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  Group connections by source IP into 30-minute sliding windows. Extract 13 behavioral
                  features per window, producing 177 device-window samples for training.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-white font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Isolation Forest Training
                </h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  Train on benign-only samples to learn normal IoT traffic patterns. At inference,
                  score all 177 samples — anomalous behavior scores lower (further from baseline).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-600 text-white font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  XGBoost Classification
                </h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  Supervised binary classifier trained on labeled data with 80/20 stratified split.
                  Achieves 85.2% accuracy. Outputs malicious probability for each sample.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white font-bold">
                5
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  CUSUM Change-Point Detection
                </h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  Analyze 5-minute time windows per device for sudden shifts in bytes_sent and
                  connection_count. Detected 5 change points across the IoT-23 dataset timeline.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-white font-bold">
                6
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Trust Scoring & Alerts
                </h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  Combine all 3 algorithm scores using the weighted formula (0.4×IF + 0.5×XGB - CUSUM penalty).
                  Generate alerts with severity levels and deviation explanations for each flagged device.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-600 text-white font-bold">
                7
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Attack Overview & Dashboard
                </h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  Generate narrative attack report (What/How/Where/When) and export all results
                  as JSON to the Next.js dashboard for visualization, filtering, and IP deep-dive analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              MedIoT Shield — Team Eclipse
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
              Healthcare IoT security through ensemble ML: Isolation Forest + XGBoost + CUSUM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
