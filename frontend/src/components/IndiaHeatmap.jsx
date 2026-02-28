/**
 * HeatShield AI - India Heatmap Component
 * SVG-based map showing risk levels for major Indian cities with color-coded markers.
 */

import React from 'react';

// City coordinates mapped to a 400x450 SVG viewbox (approximate India map positions)
const CITY_POSITIONS = {
    Delhi: { x: 190, y: 110, state: 'NCR' },
    Mumbai: { x: 130, y: 260, state: 'MH' },
    Chennai: { x: 220, y: 370, state: 'TN' },
    Kolkata: { x: 300, y: 210, state: 'WB' },
    Bengaluru: { x: 195, y: 370, state: 'KA' },
    Hyderabad: { x: 200, y: 310, state: 'TS' },
    Ahmedabad: { x: 120, y: 200, state: 'GJ' },
    Jaipur: { x: 160, y: 150, state: 'RJ' },
    Lucknow: { x: 230, y: 140, state: 'UP' },
    Nagpur: { x: 200, y: 240, state: 'MH' },
    Bhopal: { x: 190, y: 200, state: 'MP' },
    Varanasi: { x: 260, y: 160, state: 'UP' },
    Patna: { x: 275, y: 155, state: 'BR' },
    Thiruvananthapuram: { x: 185, y: 420, state: 'KL' },
    Chandigarh: { x: 185, y: 80, state: 'CH' },
};

const RISK_COLORS = {
    Low: '#22c55e',
    Medium: '#eab308',
    High: '#f97316',
    Severe: '#ef4444',
};

export default function IndiaHeatmap({ cityRisks, selectedCity, onCitySelect }) {
    const riskMap = {};
    if (cityRisks) {
        cityRisks.forEach(item => {
            riskMap[item.city] = item.prediction;
        });
    }

    return (
        <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🗺</span>
                <h2 className="text-lg font-semibold text-white">India Heatmap</h2>
            </div>

            <div className="flex justify-center">
                <svg viewBox="0 0 400 470" className="w-full max-w-sm h-auto">
                    {/* Simplified India outline */}
                    <path
                        d="M185,30 L220,25 L250,40 L280,50 L310,60 L330,80 L340,100 L345,130
               L340,160 L330,180 L320,200 L315,220 L310,240 L300,260 L310,280
               L320,290 L330,300 L325,320 L310,340 L290,360 L270,380 L250,395
               L230,410 L210,420 L190,430 L175,435 L165,420 L170,400 L175,380
               L180,360 L175,340 L160,330 L140,320 L120,310 L105,290 L95,270
               L85,250 L80,230 L85,210 L95,190 L100,170 L110,150 L120,130
               L130,110 L140,90 L150,70 L160,50 L170,40 Z"
                        fill="rgba(255,255,255,0.03)"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1.5"
                    />

                    {/* City markers */}
                    {Object.entries(CITY_POSITIONS).map(([city, pos]) => {
                        const risk = riskMap[city];
                        const color = risk ? RISK_COLORS[risk.risk_category] || '#64748b' : '#64748b';
                        const score = risk ? Math.round(risk.risk_score) : '??';
                        const isSelected = city === selectedCity;
                        const isSevere = risk?.risk_category === 'Severe';

                        return (
                            <g key={city}
                                className="cursor-pointer"
                                onClick={() => onCitySelect && onCitySelect(city)}
                                style={{ transition: 'all 0.3s ease' }}>
                                {/* Glow ring for selected/severe */}
                                {(isSelected || isSevere) && (
                                    <circle cx={pos.x} cy={pos.y} r="18"
                                        fill="none" stroke={color} strokeWidth="1.5" opacity="0.4">
                                        {isSevere && (
                                            <animate attributeName="r" values="16;22;16" dur="2s" repeatCount="indefinite" />
                                        )}
                                        {isSevere && (
                                            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                                        )}
                                    </circle>
                                )}

                                {/* Main dot */}
                                <circle cx={pos.x} cy={pos.y} r={isSelected ? 10 : 8}
                                    fill={color} fillOpacity="0.85"
                                    stroke={isSelected ? '#fff' : color}
                                    strokeWidth={isSelected ? 2 : 1}
                                    strokeOpacity={isSelected ? 0.8 : 0.3}
                                />

                                {/* Score label */}
                                <text x={pos.x} y={pos.y + 1}
                                    textAnchor="middle" dominantBaseline="middle"
                                    fill="white" fontSize="6" fontWeight="bold">
                                    {score}
                                </text>

                                {/* City name */}
                                <text x={pos.x} y={pos.y + 22}
                                    textAnchor="middle" dominantBaseline="middle"
                                    fill="#9ca3af" fontSize="7" fontWeight="500">
                                    {city.length > 12 ? city.substring(0, 10) + '…' : city}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-2 text-xs">
                {Object.entries(RISK_COLORS).map(([label, color]) => (
                    <div key={label} className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                        <span className="text-gray-400">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
