/**
 * HeatShield AI - 7-Day Forecast Chart Component
 * Displays a bar+line chart of heat risk forecast using Recharts.
 */

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, Line, ComposedChart, Area
} from 'recharts';

const RISK_COLORS = {
    Low: '#22c55e',
    Medium: '#eab308',
    High: '#f97316',
    Severe: '#ef4444',
};

function getRiskColor(score) {
    if (score < 25) return RISK_COLORS.Low;
    if (score < 50) return RISK_COLORS.Medium;
    if (score < 75) return RISK_COLORS.High;
    return RISK_COLORS.Severe;
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    const color = getRiskColor(data.risk_score);

    return (
        <div className="glass-card !p-3 !rounded-xl text-sm" style={{ borderColor: `${color}50` }}>
            <div className="font-semibold text-white mb-1">{data.dayName} — {data.date}</div>
            <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                <span style={{ color }}>Risk: {Math.round(data.risk_score)} ({data.risk_category})</span>
            </div>
            <div className="text-gray-400 space-y-0.5">
                <div>🌡 {data.temperature}°C</div>
                <div>💧 {data.humidity}%</div>
                <div>💨 {data.wind_speed} km/h</div>
            </div>
        </div>
    );
}

export default function ForecastChart({ forecast }) {
    if (!forecast || !forecast.forecast) {
        return (
            <div className="glass-card flex items-center justify-center h-72">
                <div className="spinner"></div>
            </div>
        );
    }

    const data = forecast.forecast;

    return (
        <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📊</span>
                <h2 className="text-lg font-semibold text-white">7-Day Heat Risk Forecast</h2>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="dayName"
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="risk_score"
                            fill="url(#riskGradient)"
                            stroke="none"
                        />
                        <Bar dataKey="risk_score" radius={[6, 6, 0, 0]} maxBarSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={index} fill={getRiskColor(entry.risk_score)} fillOpacity={0.8} />
                            ))}
                        </Bar>
                        <Line
                            type="monotone"
                            dataKey="temperature"
                            stroke="#38bdf8"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#38bdf8' }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3 justify-center text-xs">
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ background: '#22c55e' }}></span>
                    <span className="text-gray-400">Low (&lt;25)</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ background: '#eab308' }}></span>
                    <span className="text-gray-400">Medium (25-50)</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ background: '#f97316' }}></span>
                    <span className="text-gray-400">High (50-75)</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ background: '#ef4444' }}></span>
                    <span className="text-gray-400">Severe (75+)</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-sky-400"></span>
                    <span className="text-gray-400">Temperature °C</span>
                </div>
            </div>
        </div>
    );
}
