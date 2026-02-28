/**
 * HeatShield AI - Main Dashboard Application (Real-Time)
 * Heatwave Risk Intelligence Platform
 *
 * A smart city / climate analytics dashboard for predicting and
 * visualizing heatwave risk levels across India.
 *
 * Uses Socket.IO WebSocket for live data push every 30 seconds.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import HeatRiskScore from './components/HeatRiskScore';
import ForecastChart from './components/ForecastChart';
import IndiaHeatmap from './components/IndiaHeatmap';
import AdvisoryPanel from './components/AdvisoryPanel';
import LocationSelector from './components/LocationSelector';
import {
    getCities, getRiskPrediction, getAllCityRisks, get7DayForecast,
    connectSocket, disconnectSocket, onWeatherUpdate, onConnectionChange,
    requestCityUpdate, onCityUpdate,
} from './services/api';

const FALLBACK_REFRESH_INTERVAL = 300000; // 5 min backup polling

export default function App() {
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState('Delhi');
    const [riskData, setRiskData] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [allCityRisks, setAllCityRisks] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [dataSource, setDataSource] = useState('unknown');
    const selectedCityRef = useRef(selectedCity);

    // Keep ref in sync with state for use inside callbacks
    useEffect(() => {
        selectedCityRef.current = selectedCity;
    }, [selectedCity]);

    // Fetch all data for a city (REST fallback)
    const fetchData = useCallback(async (city) => {
        setLoading(true);
        setError(null);
        try {
            const [risk, forecastData, allRisks] = await Promise.all([
                getRiskPrediction(city),
                get7DayForecast(city),
                getAllCityRisks(),
            ]);
            setRiskData(risk);
            setForecast(forecastData);
            setAllCityRisks(allRisks);
            setLastUpdated(new Date());
            if (risk?.weather?.source) setDataSource(risk.weather.source);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to connect to the backend. Make sure the server is running on port 5000.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load cities on mount
    useEffect(() => {
        getCities().then(setCities);
    }, []);

    // Fetch data when city changes (initial + on city switch)
    useEffect(() => {
        fetchData(selectedCity);
    }, [selectedCity, fetchData]);

    // ─── REAL-TIME WEBSOCKET CONNECTION ────────────────────────
    useEffect(() => {
        const socket = connectSocket();

        // Connection state tracking
        const unsubConnection = onConnectionChange(
            () => setIsConnected(true),
            () => setIsConnected(false)
        );

        // If already connected at mount
        if (socket.connected) setIsConnected(true);

        // Listen for broadcast weather updates (all cities)
        const unsubWeather = onWeatherUpdate((payload) => {
            if (!payload?.data) return;

            // Update all-city heatmap data
            setAllCityRisks(payload.data);
            setLastUpdated(new Date(payload.timestamp));
            setDataSource(payload.source || 'live');

            // Also update the currently selected city's risk data
            const currentCity = selectedCityRef.current;
            const cityData = payload.data.find(c => c.city === currentCity);
            if (cityData) {
                setRiskData({
                    weather: cityData.weather,
                    prediction: cityData.prediction,
                    city: currentCity,
                    timestamp: payload.timestamp,
                });
            }

            setLoading(false);
            setError(null);
        });

        // Listen for on-demand single-city updates
        const unsubCity = onCityUpdate((data) => {
            if (data.city === selectedCityRef.current) {
                setRiskData({
                    weather: data.weather,
                    prediction: data.prediction,
                    city: data.city,
                    timestamp: data.timestamp,
                });
                setLastUpdated(new Date(data.timestamp));
            }
        });

        return () => {
            unsubConnection();
            unsubWeather();
            unsubCity();
            disconnectSocket();
        };
    }, []); // only once on mount

    // When city changes, request a fresh update via WebSocket
    useEffect(() => {
        if (isConnected) {
            requestCityUpdate(selectedCity);
        }
    }, [selectedCity, isConnected]);

    // Backup polling (only fires if WebSocket was not delivering)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isConnected) fetchData(selectedCity);
        }, FALLBACK_REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [selectedCity, fetchData, isConnected]);

    const handleCitySelect = (city) => {
        setSelectedCity(city);
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-white/5"
                style={{ background: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(20px)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 
                              flex items-center justify-center text-xl shadow-lg shadow-orange-500/20">
                                🔥
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg sm:text-xl font-bold">
                                        <span className="gradient-text">HeatShield</span>
                                        <span className="text-white ml-1">AI</span>
                                    </h1>
                                    {/* Live indicator */}
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                                        ${isConnected
                                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                                        }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                                        {isConnected ? 'LIVE' : 'OFFLINE'}
                                    </div>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-500 -mt-0.5">
                                    Heatwave Risk Intelligence Platform
                                    {dataSource && dataSource !== 'unknown' && (
                                        <span className="ml-1 text-gray-600">
                                            • {dataSource === 'mock' ? '🎲 Mock' : '🌐 Live API'}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <LocationSelector
                                cities={cities}
                                selectedCity={selectedCity}
                                onSelect={handleCitySelect}
                            />
                            <button
                                onClick={() => fetchData(selectedCity)}
                                disabled={loading}
                                className="p-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 
                           hover:border-white/20 transition-all duration-200 text-sm disabled:opacity-50"
                                id="refresh-button"
                                title="Manual refresh"
                            >
                                <svg className={`w-4 h-4 text-gray-300 ${loading ? 'animate-spin' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                        <span className="font-semibold">⚠️ Connection Error:</span> {error}
                    </div>
                )}

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left Column - Risk Score + Advisory */}
                    <div className="lg:col-span-4 space-y-5">
                        <HeatRiskScore
                            prediction={riskData?.prediction}
                            weather={riskData?.weather}
                            city={selectedCity}
                        />
                        <AdvisoryPanel
                            riskCategory={riskData?.prediction?.risk_category || 'Low'}
                        />
                    </div>

                    {/* Right Column - Chart + Map */}
                    <div className="lg:col-span-8 space-y-5">
                        <ForecastChart forecast={forecast} city={selectedCity} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <IndiaHeatmap
                                cityRisks={allCityRisks}
                                selectedCity={selectedCity}
                                onCitySelect={handleCitySelect}
                            />

                            {/* Stats Panel */}
                            <div className="glass-card">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-2xl">📈</span>
                                    <h2 className="text-lg font-semibold text-white">City Statistics</h2>
                                </div>

                                {allCityRisks && (
                                    <div className="space-y-2">
                                        {/* Risk distribution */}
                                        {['Severe', 'High', 'Medium', 'Low'].map(category => {
                                            const count = allCityRisks.filter(c =>
                                                c.prediction.risk_category === category
                                            ).length;
                                            const pct = Math.round((count / allCityRisks.length) * 100);
                                            const colors = {
                                                Severe: '#ef4444', High: '#f97316',
                                                Medium: '#eab308', Low: '#22c55e'
                                            };
                                            return (
                                                <div key={category}>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-gray-400">{category}</span>
                                                        <span style={{ color: colors[category] }}>
                                                            {count} cities ({pct}%)
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000"
                                                            style={{
                                                                width: `${pct}%`,
                                                                backgroundColor: colors[category],
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Hottest / Coolest cities */}
                                        <div className="mt-4 pt-3 border-t border-white/5">
                                            <div className="text-xs text-gray-400 mb-2 font-semibold">🔥 Highest Risk</div>
                                            {allCityRisks
                                                .sort((a, b) => b.prediction.risk_score - a.prediction.risk_score)
                                                .slice(0, 3)
                                                .map((item, idx) => (
                                                    <div key={item.city}
                                                        className="flex justify-between text-xs py-1.5 cursor-pointer hover:bg-white/5 px-2 rounded-lg transition-colors"
                                                        onClick={() => handleCitySelect(item.city)}>
                                                        <span className="text-gray-300">
                                                            {idx + 1}. {item.city}
                                                        </span>
                                                        <span style={{
                                                            color: { Low: '#22c55e', Medium: '#eab308', High: '#f97316', Severe: '#ef4444' }[item.prediction.risk_category]
                                                        }}>
                                                            {Math.round(item.prediction.risk_score)} — {item.prediction.risk_category}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>

                                        <div className="pt-2">
                                            <div className="text-xs text-gray-400 mb-2 font-semibold">❄️ Lowest Risk</div>
                                            {allCityRisks
                                                .sort((a, b) => a.prediction.risk_score - b.prediction.risk_score)
                                                .slice(0, 3)
                                                .map((item, idx) => (
                                                    <div key={item.city}
                                                        className="flex justify-between text-xs py-1.5 cursor-pointer hover:bg-white/5 px-2 rounded-lg transition-colors"
                                                        onClick={() => handleCitySelect(item.city)}>
                                                        <span className="text-gray-300">
                                                            {idx + 1}. {item.city}
                                                        </span>
                                                        <span style={{
                                                            color: { Low: '#22c55e', Medium: '#eab308', High: '#f97316', Severe: '#ef4444' }[item.prediction.risk_category]
                                                        }}>
                                                            {Math.round(item.prediction.risk_score)} — {item.prediction.risk_category}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {!allCityRisks && (
                                    <div className="flex items-center justify-center h-40">
                                        <div className="spinner"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-8 pt-4 border-t border-white/5 text-center">
                    <p className="text-xs text-gray-600">
                        HeatShield AI • Heatwave Risk Intelligence Platform • Powered by AI & AMD GPU Acceleration
                        {lastUpdated && (
                            <span className="ml-2 text-gray-700">
                                • Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
                            </span>
                        )}
                        {isConnected && (
                            <span className="ml-2 text-emerald-600">
                                • 🟢 Real-time updates active
                            </span>
                        )}
                    </p>
                </footer>
            </main>
        </div>
    );
}
