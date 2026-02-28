/**
 * HeatShield AI - API Service Layer with Real-Time WebSocket Support
 * Handles REST API calls + Socket.IO live connection.
 */

import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = '/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
});

// ─── REST API FUNCTIONS ────────────────────────────────────────

/**
 * Get list of supported Indian cities.
 */
export async function getCities() {
    try {
        const res = await api.get('/weather/cities');
        return res.data.cities;
    } catch {
        // Fallback cities
        return [
            'Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Bengaluru',
            'Hyderabad', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Nagpur',
            'Bhopal', 'Varanasi', 'Patna', 'Thiruvananthapuram', 'Chandigarh'
        ];
    }
}

/**
 * Fetch live weather data for a city.
 */
export async function getLiveWeather(city) {
    const res = await api.get(`/weather/live?city=${encodeURIComponent(city)}`);
    return res.data.data;
}

/**
 * Get heat risk prediction for a city.
 */
export async function getRiskPrediction(city) {
    const res = await api.get(`/risk/predict?city=${encodeURIComponent(city)}`);
    return res.data.data;
}

/**
 * Get heat risk data for all cities (heatmap).
 */
export async function getAllCityRisks() {
    const res = await api.get('/risk/all');
    return res.data.data;
}

/**
 * Get 7-day forecast.
 */
export async function get7DayForecast(city) {
    const res = await api.get(`/forecast/7days?city=${encodeURIComponent(city)}`);
    return res.data.data;
}

/**
 * Get hourly heat data for a specific day (for drill-down chart).
 */
export async function getHourlyHeatData(city, date) {
    const res = await api.get(`/forecast/hourly?city=${encodeURIComponent(city)}&date=${encodeURIComponent(date)}`);
    return res.data.data;
}

// ─── SOCKET.IO REAL-TIME CONNECTION ────────────────────────────

let socket = null;

/**
 * Connect to the WebSocket server.
 * Returns the socket instance.
 */
export function connectSocket() {
    if (socket && socket.connected) return socket;

    socket = io('/', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
        console.log('🟢 Real-time connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('🔴 Real-time disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
        console.warn('⚠️ WebSocket error:', err.message);
    });

    return socket;
}

/**
 * Disconnect from the WebSocket server.
 */
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

/**
 * Get the current socket instance.
 */
export function getSocket() {
    return socket;
}

/**
 * Listen for real-time weather updates.
 * @param {Function} callback - Called with the weather update payload
 * @returns {Function} unsubscribe function
 */
export function onWeatherUpdate(callback) {
    if (!socket) return () => { };
    socket.on('weather:update', callback);
    return () => socket.off('weather:update', callback);
}

/**
 * Listen for single-city update responses.
 * @param {Function} callback - Called with city-specific update
 * @returns {Function} unsubscribe function
 */
export function onCityUpdate(callback) {
    if (!socket) return () => { };
    socket.on('city:update', callback);
    return () => socket.off('city:update', callback);
}

/**
 * Request fresh data for a specific city via WebSocket.
 */
export function requestCityUpdate(city) {
    if (socket && socket.connected) {
        socket.emit('request:city', city);
    }
}

/**
 * Listen for socket connection state changes.
 * @param {Function} onConnect
 * @param {Function} onDisconnect
 * @returns {Function} cleanup function
 */
export function onConnectionChange(onConnect, onDisconnect) {
    if (!socket) return () => { };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
    };
}

export default api;
