/**
 * HeatShield AI - Forecast Chart Component with Hourly Drill-Down
 * Click any bar to see real-time hourly heat rise/fall for that day.
 */

import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, Line, ComposedChart, Area,
    AreaChart, ReferenceLine,
} from 'recharts';
import { getHourlyHeatData } from '../services/api';

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
            <div className="text-[10px] text-gray-500 mt-1.5 pt-1 border-t border-white/10">
                👆 Click to see hourly breakdown
            </div>
        </div>
    );
}

function HourlyTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    const trendIcon = data.trend === 'rising' ? '🔺' : data.trend === 'falling' ? '🔻' : '➡️';
    const trendColor = data.trend === 'rising' ? '#ef4444' : data.trend === 'falling' ? '#22c55e' : '#9ca3af';

    return (
        <div className="glass-card !p-2.5 !rounded-xl text-xs">
            <div className="font-semibold text-white mb-1">{data.time}</div>
            <div className="text-gray-300">🌡 {data.temperature}°C</div>
            <div className="text-gray-400">🤒 Feels like {data.feels_like}°C</div>
            <div className="text-gray-400">💧 {data.humidity}%</div>
            <div className="text-gray-400">💨 {data.wind_speed} km/h</div>
            <div className="mt-1 pt-1 border-t border-white/10" style={{ color: trendColor }}>
                {trendIcon} {data.change > 0 ? '+' : ''}{data.change}°C {data.trend}
            </div>
        </div>
    );
}

export default function ForecastChart({ forecast, city }) {
    const [selectedDay, setSelectedDay] = useState(null);
    const [hourlyData, setHourlyData] = useState(null);
    const [hourlySummary, setHourlySummary] = useState(null);
    const [loadingHourly, setLoadingHourly] = useState(false);

    // Reset when city changes
    useEffect(() => {
        setSelectedDay(null);
        setHourlyData(null);
        setHourlySummary(null);
    }, [city]);

    if (!forecast || !forecast.forecast) {
        return (
            <div className="glass-card flex items-center justify-center h-72">
                <div className="spinner"></div>
            </div>
        );
    }

    const data = forecast.forecast;

    const handleBarClick = async (entry) => {
        if (!entry || !entry.date) return;

        // Toggle off if already selected
        if (selectedDay === entry.date) {
            setSelectedDay(null);
            setHourlyData(null);
            setHourlySummary(null);
            return;
        }

        setSelectedDay(entry.date);
        setLoadingHourly(true);

        try {
            const cityName = city || forecast.city || 'Delhi';
            const result = await getHourlyHeatData(cityName, entry.date);
            setHourlyData(result.hourly);
            setHourlySummary(result.summary);
        } catch (err) {
            console.error('Failed to load hourly data:', err);
            setHourlyData(null);
        } finally {
            setLoadingHourly(false);
        }
    };

    const selectedDayData = data.find(d => d.date === selectedDay);

    return (
        <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <h2 className="text-lg font-semibold text-white">Heat Risk Forecast</h2>
                </div>
                {selectedDay && (
                    <button
                        onClick={() => { setSelectedDay(null); setHourlyData(null); setHourlySummary(null); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] 
                            border border-white/10 hover:border-white/20 text-gray-300 
                            transition-all duration-200 flex items-center gap-1.5"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to forecast
                    </button>
                )}
            </div>

            {/* Main Forecast Chart */}
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        style={{ cursor: 'pointer' }}
                    >
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
                        <Bar
                            dataKey="risk_score"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                            onClick={(barData) => handleBarClick(barData)}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={index}
                                    fill={getRiskColor(entry.risk_score)}
                                    fillOpacity={selectedDay === entry.date ? 1 : selectedDay ? 0.3 : 0.8}
                                    stroke={selectedDay === entry.date ? '#fff' : 'none'}
                                    strokeWidth={selectedDay === entry.date ? 2 : 0}
                                    style={{ cursor: 'pointer' }}
                                />
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

            {/* ─── HOURLY DRILL-DOWN PANEL ─────────────────────── */}
            {selectedDay && (
                <div className="mt-5 pt-5 border-t border-white/10 animate-fadeIn">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">⏱️</span>
                            <h3 className="text-base font-semibold text-white">
                                Hourly Heat Breakdown — {selectedDayData?.dayName} ({selectedDay})
                            </h3>
                        </div>
                        {hourlySummary && (
                            <div className="flex items-center gap-3 text-xs">
                                <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                                    🔺 Peak {hourlySummary.peak_temp}°C at {hourlySummary.peak_hour}
                                </span>
                                <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    🔻 Low {hourlySummary.min_temp}°C
                                </span>
                                <span className="px-2 py-1 rounded-md bg-white/5 text-gray-400 border border-white/10">
                                    📏 Range {hourlySummary.range}°C
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Loading */}
                    {loadingHourly && (
                        <div className="flex items-center justify-center h-48">
                            <div className="spinner"></div>
                        </div>
                    )}

                    {/* Hourly Chart */}
                    {hourlyData && !loadingHourly && (
                        <>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="hourlyTempGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                                                <stop offset="50%" stopColor="#f97316" stopOpacity={0.2} />
                                                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="time"
                                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                            interval={window.innerWidth < 640 ? 3 : 1}
                                        />
                                        <YAxis
                                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                            domain={['auto', 'auto']}
                                            unit="°"
                                        />
                                        <Tooltip content={<HourlyTooltip />} />
                                        {hourlySummary && (
                                            <ReferenceLine
                                                y={hourlySummary.peak_temp}
                                                stroke="#ef4444"
                                                strokeDasharray="4 4"
                                                strokeOpacity={0.5}
                                            />
                                        )}
                                        <Area
                                            type="monotone"
                                            dataKey="temperature"
                                            stroke="#f97316"
                                            strokeWidth={2.5}
                                            fill="url(#hourlyTempGradient)"
                                            dot={(props) => {
                                                const { cx, cy, payload } = props;
                                                const color = payload.trend === 'rising' ? '#ef4444'
                                                    : payload.trend === 'falling' ? '#22c55e'
                                                        : '#9ca3af';
                                                return (
                                                    <circle
                                                        cx={cx} cy={cy} r={4}
                                                        fill={color}
                                                        stroke="#0a0e1a"
                                                        strokeWidth={2}
                                                    />
                                                );
                                            }}
                                            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Trend Legend */}
                            <div className="flex flex-wrap gap-4 mt-3 justify-center text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                    <span className="text-gray-400">🔺 Heat Rising</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                    <span className="text-gray-400">🔻 Heat Falling</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                                    <span className="text-gray-400">➡️ Stable</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-0.5 bg-red-500" style={{ borderTop: '1px dashed #ef4444' }}></span>
                                    <span className="text-gray-400">Peak Temperature</span>
                                </div>
                            </div>

                            {/* Hourly Data Timeline */}
                            <div className="mt-4 pt-3 border-t border-white/5">
                                <div className="text-xs text-gray-500 mb-2 font-semibold">Hourly Timeline</div>
                                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1">
                                    {hourlyData.map((h) => {
                                        const trendBg = h.trend === 'rising'
                                            ? 'bg-red-500/20 border-red-500/30'
                                            : h.trend === 'falling'
                                                ? 'bg-green-500/20 border-green-500/30'
                                                : 'bg-white/5 border-white/10';
                                        const isPeak = hourlySummary && h.temperature === hourlySummary.peak_temp;
                                        return (
                                            <div
                                                key={h.time}
                                                className={`text-center py-1.5 px-1 rounded-lg border text-[10px] 
                                                    transition-all duration-200 ${trendBg} ${isPeak ? 'ring-1 ring-red-400' : ''}`}
                                                title={`${h.time} — ${h.temperature}°C (${h.trend})`}
                                            >
                                                <div className="text-gray-500">{h.time}</div>
                                                <div className="font-bold text-white">{Math.round(h.temperature)}°</div>
                                                <div className="text-[9px]">
                                                    {h.trend === 'rising' ? '🔺' : h.trend === 'falling' ? '🔻' : '—'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
