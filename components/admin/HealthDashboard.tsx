/**
 * ARK Server Health Monitor Dashboard
 */

'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface HealthMetrics {
  fps: number;
  playerCount: number;
  maxPlayers: number;
  cpuUsage: number;
  ramUsage: number;
  maxRam: number;
  timestamp: number;
  issues: string[];
}

interface HealthTrends {
  avgFps: number;
  avgCpu: number;
  avgRam: number;
  healthScore: number;
  trend: 'improving' | 'stable' | 'declining';
  criticalIssues: string[];
}

interface HealthDashboardProps {
  serverId: string;
  serverName: string;
}

const HealthDashboard: React.FC<HealthDashboardProps> = ({ serverId, serverName }) => {
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState<HealthMetrics | null>(null);
  const [history, setHistory] = useState<HealthMetrics[]>([]);
  const [trends, setTrends] = useState<HealthTrends | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 60000); // 1 min refresh

    return () => clearInterval(interval);
  }, [serverId, timeRange]);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24;

      const response = await fetch(
        `/api/servers/${serverId}/health?hours=${hours}&limit=288`
      );

      if (response.ok) {
        const data = await response.json();
        setLatest(data.latest);
        setHistory(data.history);
        setTrends(data.trends);
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp to time string
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format data for recharts
  const chartData = history.map((metric) => ({
    time: formatTime(metric.timestamp),
    fps: Math.round(metric.fps),
    cpu: Math.round(metric.cpuUsage),
    ram: Math.round(metric.ramUsage),
    players: metric.playerCount,
  }));

  // Health score color
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Trend indicator
  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '→';
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{serverName} - Health Monitor</h1>
          <p className="text-gray-400 text-sm">
            Last update: {latest ? formatTime(latest.timestamp) : 'N/A'}
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['1h', '6h', '24h'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && !latest ? (
        <div className="text-center py-8">Loading health data...</div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Health Score */}
            <div className="bg-gray-800 p-4 rounded">
              <p className="text-gray-400 text-sm">Health Score</p>
              <p className={`text-3xl font-bold ${trends ? getHealthColor(trends.healthScore) : ''}`}>
                {trends ? `${Math.round(trends.healthScore)}%` : 'N/A'}
              </p>
              {trends && (
                <p className="text-xs text-gray-500 mt-1">
                  {getTrendIcon(trends.trend)} {trends.trend}
                </p>
              )}
            </div>

            {/* FPS */}
            <div className="bg-gray-800 p-4 rounded">
              <p className="text-gray-400 text-sm">FPS</p>
              <p className={`text-3xl font-bold ${latest && latest.fps < 30 ? 'text-red-500' : 'text-green-500'}`}>
                {latest ? Math.round(latest.fps) : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Avg: {trends ? Math.round(trends.avgFps) : 'N/A'}</p>
            </div>

            {/* CPU Usage */}
            <div className="bg-gray-800 p-4 rounded">
              <p className="text-gray-400 text-sm">CPU</p>
              <p className={`text-3xl font-bold ${latest && latest.cpuUsage > 85 ? 'text-red-500' : 'text-green-500'}`}>
                {latest ? Math.round(latest.cpuUsage) : 'N/A'}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Avg: {trends ? Math.round(trends.avgCpu) : 'N/A'}%</p>
            </div>

            {/* RAM Usage */}
            <div className="bg-gray-800 p-4 rounded">
              <p className="text-gray-400 text-sm">RAM</p>
              <p className={`text-3xl font-bold ${latest && latest.ramUsage > 90 ? 'text-red-500' : 'text-green-500'}`}>
                {latest ? Math.round(latest.ramUsage) : 'N/A'}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Avg: {trends ? Math.round(trends.avgRam) : 'N/A'}%</p>
            </div>

            {/* Player Count */}
            <div className="bg-gray-800 p-4 rounded">
              <p className="text-gray-400 text-sm">Players</p>
              <p className="text-3xl font-bold text-blue-500">
                {latest ? latest.playerCount : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Max: {latest ? latest.maxPlayers : 'N/A'}</p>
            </div>
          </div>

          {/* Critical Issues */}
          {trends && trends.criticalIssues.length > 0 && (
            <div className="bg-red-900/30 border border-red-600 p-4 rounded">
              <h3 className="font-semibold text-red-400 mb-2">⚠️ Critical Issues</h3>
              <ul className="space-y-1">
                {trends.criticalIssues.map((issue, idx) => (
                  <li key={idx} className="text-red-300 text-sm">
                    • {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent Issues */}
          {latest && latest.issues.length > 0 && (
            <div className="bg-yellow-900/30 border border-yellow-600 p-4 rounded">
              <h3 className="font-semibold text-yellow-400 mb-2">🔍 Recent Issues</h3>
              <ul className="space-y-1">
                {latest.issues.map((issue, idx) => (
                  <li key={idx} className="text-yellow-300 text-sm">
                    • {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FPS Chart */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-semibold mb-4">FPS Performance</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="time" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #666' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fps"
                    stroke="#10b981"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* CPU & RAM Chart */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-semibold mb-4">Resource Usage</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="time" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #666' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cpu"
                    stroke="#f59e0b"
                    dot={false}
                    strokeWidth={2}
                    name="CPU %"
                  />
                  <Line
                    type="monotone"
                    dataKey="ram"
                    stroke="#ef4444"
                    dot={false}
                    strokeWidth={2}
                    name="RAM %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Player Count Chart */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-semibold mb-4">Player Count</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="time" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #666' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="players"
                    stroke="#3b82f6"
                    fill="#1e3a8a"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Health Score Trend */}
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-semibold mb-4">Health Score Trend</h3>
              <div className="text-center py-12">
                <p className={`text-5xl font-bold ${trends ? getHealthColor(trends.healthScore) : ''}`}>
                  {trends ? `${Math.round(trends.healthScore)}%` : 'N/A'}
                </p>
                <p className="text-gray-400 text-sm mt-4">
                  {trends?.trend === 'improving' && '✅ Server health is improving'}
                  {trends?.trend === 'stable' && '→ Server health is stable'}
                  {trends?.trend === 'declining' && '❌ Server health is declining'}
                </p>
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-end">
            <button
              onClick={fetchHealthData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white text-sm"
            >
              {loading ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HealthDashboard;
