/**
 * HeatShield AI - API Service Layer
 * Handles all communication with the backend API.
 */

import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
});

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

export default api;
