/**
 * HeatShield AI - Safety & Hydration Advisory Panel
 * Provides action-oriented recommendations based on the current risk level.
 */

import React from 'react';

const ADVISORIES = {
    Low: {
        color: '#22c55e',
        icon: '✅',
        title: 'Safe Conditions',
        summary: 'Weather conditions are comfortable. Normal outdoor activities are safe.',
        actions: [
            { icon: '💧', text: 'Drink 2-3 liters of water daily' },
            { icon: '☀️', text: 'Use sunscreen if outdoors for long periods' },
            { icon: '👷', text: 'Outdoor workers can operate normally' },
            { icon: '🏫', text: 'Schools can proceed with outdoor activities' },
        ],
        hydration: '2-3 liters/day',
        outdoorSafe: true,
    },
    Medium: {
        color: '#eab308',
        icon: '⚠️',
        title: 'Moderate Heat Risk',
        summary: 'Elevated temperatures expected. Take precautions during peak hours.',
        actions: [
            { icon: '💧', text: 'Increase water intake to 3-4 liters daily' },
            { icon: '🕐', text: 'Avoid outdoor work between 11 AM – 3 PM' },
            { icon: '🧢', text: 'Wear light, loose clothing and hats' },
            { icon: '🏥', text: 'Watch for signs of heat exhaustion' },
            { icon: '👴', text: 'Check on elderly and young children regularly' },
        ],
        hydration: '3-4 liters/day',
        outdoorSafe: 'With caution',
    },
    High: {
        color: '#f97316',
        icon: '🔶',
        title: 'High Heat Danger',
        summary: 'Dangerous heat levels. Limit outdoor exposure significantly.',
        actions: [
            { icon: '💧', text: 'Drink 4-5 liters of water; carry ORS packets' },
            { icon: '🚫', text: 'Suspend outdoor work during 10 AM – 4 PM' },
            { icon: '🏠', text: 'Stay in air-conditioned or shaded areas' },
            { icon: '🚑', text: 'Keep emergency services contacts ready' },
            { icon: '🏫', text: 'Schools should cancel outdoor events' },
            { icon: '🧊', text: 'Set up cooling stations in public areas' },
        ],
        hydration: '4-5 liters/day + ORS',
        outdoorSafe: 'Not recommended',
    },
    Severe: {
        color: '#ef4444',
        icon: '🔥',
        title: 'EXTREME HEAT EMERGENCY',
        summary: 'Life-threatening heat conditions. Stay indoors. Follow emergency protocols.',
        actions: [
            { icon: '🚨', text: 'HEAT EMERGENCY: Stay indoors at all times' },
            { icon: '💧', text: 'Drink 5+ liters daily; use electrolyte solutions' },
            { icon: '🏗', text: 'All outdoor construction/labor must STOP' },
            { icon: '🏫', text: 'Close schools and non-essential outdoor venues' },
            { icon: '🚑', text: 'Hospitals on high alert for heatstroke cases' },
            { icon: '📢', text: 'Issue public alert via sirens, SMS, local media' },
            { icon: '🧊', text: 'Activate all cooling shelters and water stations' },
        ],
        hydration: '5+ liters/day + electrolytes',
        outdoorSafe: '🚫 Absolutely not',
    },
};

export default function AdvisoryPanel({ riskCategory }) {
    const advisory = ADVISORIES[riskCategory] || ADVISORIES.Low;
    const isSevere = riskCategory === 'Severe';

    return (
        <div className={`glass-card ${isSevere ? 'severe-pulse' : ''}`}
            style={{ borderColor: `${advisory.color}33` }}>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{advisory.icon}</span>
                <h2 className="text-lg font-semibold text-white">Safety Advisory</h2>
            </div>

            {/* Status Banner */}
            <div className="rounded-xl p-3 mb-4"
                style={{
                    background: `linear-gradient(135deg, ${advisory.color}15, ${advisory.color}05)`,
                    border: `1px solid ${advisory.color}30`,
                }}>
                <div className="font-bold text-sm mb-1" style={{ color: advisory.color }}>
                    {advisory.title}
                </div>
                <div className="text-xs text-gray-300">{advisory.summary}</div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-white/5">
                    <div className="text-xs text-gray-400">💧 Hydration</div>
                    <div className="text-xs font-semibold text-white mt-1">{advisory.hydration}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/5">
                    <div className="text-xs text-gray-400">🏃 Outdoor Safe?</div>
                    <div className="text-xs font-semibold mt-1"
                        style={{ color: advisory.outdoorSafe === true ? '#22c55e' : advisory.color }}>
                        {typeof advisory.outdoorSafe === 'boolean'
                            ? (advisory.outdoorSafe ? 'Yes' : 'No')
                            : advisory.outdoorSafe}
                    </div>
                </div>
            </div>

            {/* Action Items */}
            <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Recommended Actions
                </div>
                {advisory.actions.map((action, idx) => (
                    <div key={idx}
                        className="flex items-start gap-2 text-xs p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                        <span className="flex-shrink-0 mt-0.5">{action.icon}</span>
                        <span className="text-gray-300">{action.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
