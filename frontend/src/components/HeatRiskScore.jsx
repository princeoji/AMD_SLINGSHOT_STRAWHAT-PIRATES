/**
 * HeatShield AI - Heat Risk Score Gauge Component
 * Displays the live heat risk score with an animated circular gauge.
 */

import React from 'react';

const RISK_COLORS = {
    Low: '#22c55e',
    Medium: '#eab308',
    High: '#f97316',
    Severe: '#ef4444',
};

const RISK_EMOJIS = {
    Low: '✅',
    Medium: '⚠️',
    High: '🔶',
    Severe: '🔥',
};

export default function HeatRiskScore({ prediction, weather, city }) {
    if (!prediction) {
        return (
            <div className="glass-card flex items-center justify-center h-72">
                <div className="spinner"></div>
            </div>
        );
    }

    const { risk_score, risk_category, confidence } = prediction;
    const color = RISK_COLORS[risk_category] || '#94a3b8';
    const emoji = RISK_EMOJIS[risk_category] || '📊';
    const isSevere = risk_category === 'Severe';

    // SVG gauge calculation
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const progress = (risk_score / 100) * circumference;
    const dashOffset = circumference - progress;

    return (
        <div className={`glass-card ${isSevere ? 'severe-pulse' : ''}`}
            style={{ borderColor: `${color}33` }}>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{emoji}</span>
                <h2 className="text-lg font-semibold text-white">Live Heat Risk Score</h2>
            </div>

            <div className="flex flex-col items-center">
                {/* Circular Gauge */}
                <div className="relative w-48 h-48 mb-4">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                        {/* Background circle */}
                        <circle cx="80" cy="80" r={radius}
                            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                        {/* Progress arc */}
                        <circle cx="80" cy="80" r={radius}
                            fill="none" stroke={color} strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                        />
                        {/* Glow effect */}
                        <circle cx="80" cy="80" r={radius}
                            fill="none" stroke={color} strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            opacity="0.3" filter="blur(4px)"
                            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                        />
                    </svg>
                    {/* Score text in center */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold" style={{ color }}>
                            {Math.round(risk_score)}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">/ 100</span>
                    </div>
                </div>

                {/* Risk Category Badge */}
                <div className="px-5 py-2 rounded-full text-sm font-bold mb-3"
                    style={{
                        backgroundColor: `${color}20`,
                        color: color,
                        border: `1px solid ${color}50`,
                    }}>
                    {risk_category} Risk
                </div>

                {/* Weather details */}
                {weather && (
                    <div className="grid grid-cols-3 gap-3 w-full mt-2">
                        <div className="text-center p-2 rounded-lg bg-white/5">
                            <div className="text-xs text-gray-400">🌡 Temp</div>
                            <div className="text-sm font-semibold text-white">{weather.temperature}°C</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/5">
                            <div className="text-xs text-gray-400">💧 Humidity</div>
                            <div className="text-sm font-semibold text-white">{weather.humidity}%</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/5">
                            <div className="text-xs text-gray-400">💨 Wind</div>
                            <div className="text-sm font-semibold text-white">{weather.wind_speed} km/h</div>
                        </div>
                    </div>
                )}

                {/* Confidence */}
                <div className="text-xs text-gray-500 mt-3">
                    AI Confidence: {confidence}% | 📍 {city}
                </div>
            </div>
        </div>
    );
}
