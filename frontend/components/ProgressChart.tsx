'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

const sampleProgressData = [
  { session: 'Baseline', Arrays: 72, Searching: 55, Trees: 38, Graphs: 20 },
  { session: 'Session 1', Arrays: 80, Searching: 68, Trees: 48, Graphs: 24 },
  { session: 'Session 2', Arrays: 86, Searching: 76, Trees: 55, Graphs: 28 },
  { session: 'Current', Arrays: 91, Searching: 82, Trees: 61, Graphs: 32 },
];

export const ProgressChart: React.FC = () => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sampleProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorArrays" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorSearching" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorTrees" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorGraphs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="session" stroke="#64748b" textAnchor="end" fontSize={11} />
          <YAxis stroke="#64748b" domain={[0, 100]} unit="%" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '0.75rem',
              fontSize: '12px',
              color: '#fff',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

          <Area type="monotone" dataKey="Arrays" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorArrays)" />
          <Area type="monotone" dataKey="Searching" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSearching)" />
          <Area type="monotone" dataKey="Trees" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorTrees)" />
          <Area type="monotone" dataKey="Graphs" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorGraphs)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
