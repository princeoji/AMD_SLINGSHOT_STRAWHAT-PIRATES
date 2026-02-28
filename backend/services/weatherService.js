/**
 * HeatShield AI - Weather Service
 * Fetches live weather data from OpenWeatherMap API.
 * Falls back to realistic mock data when no API key is configured.
 */

const axios = require("axios");

// Indian city coordinates for weather API
const CITY_COORDS = {
    Delhi: { lat: 28.6139, lon: 77.2090 },
    Mumbai: { lat: 19.0760, lon: 72.8777 },
    Chennai: { lat: 13.0827, lon: 80.2707 },
    Kolkata: { lat: 22.5726, lon: 88.3639 },
    Bengaluru: { lat: 12.9716, lon: 77.5946 },
    Hyderabad: { lat: 17.3850, lon: 78.4867 },
    Ahmedabad: { lat: 23.0225, lon: 72.5714 },
    Jaipur: { lat: 26.9124, lon: 75.7873 },
    Lucknow: { lat: 26.8467, lon: 80.9462 },
    Nagpur: { lat: 21.1458, lon: 79.0882 },
    Bhopal: { lat: 23.2599, lon: 77.4126 },
    Varanasi: { lat: 25.3176, lon: 82.9739 },
    Patna: { lat: 25.6093, lon: 85.1376 },
    Thiruvananthapuram: { lat: 8.5241, lon: 76.9366 },
    Chandigarh: { lat: 30.7333, lon: 76.7794 },
};

/**
 * Generate realistic mock weather data for a city.
 */
function getMockWeather(city) {
    const baseTemps = {
        Delhi: 38, Mumbai: 33, Chennai: 36, Kolkata: 35, Bengaluru: 30,
        Hyderabad: 37, Ahmedabad: 39, Jaipur: 38, Lucknow: 37, Nagpur: 40,
        Bhopal: 37, Varanasi: 36, Patna: 35, Thiruvananthapuram: 31, Chandigarh: 34,
    };
    const baseHumidity = {
        Delhi: 35, Mumbai: 75, Chennai: 65, Kolkata: 70, Bengaluru: 55,
        Hyderabad: 45, Ahmedabad: 30, Jaipur: 25, Lucknow: 40, Nagpur: 30,
        Bhopal: 35, Varanasi: 45, Patna: 55, Thiruvananthapuram: 80, Chandigarh: 35,
    };

    const temp = (baseTemps[city] || 35) + (Math.random() * 6 - 3);
    const humidity = (baseHumidity[city] || 50) + (Math.random() * 20 - 10);
    const windSpeed = Math.random() * 15 + 2;

    return {
        city,
        temperature: Math.round(temp * 10) / 10,
        humidity: Math.round(Math.min(Math.max(humidity, 10), 95) * 10) / 10,
        wind_speed: Math.round(windSpeed * 10) / 10,
        description: temp > 40 ? "Extreme Heat" : temp > 35 ? "Hot" : "Warm",
        icon: temp > 40 ? "🔥" : temp > 35 ? "☀️" : "🌤️",
        feels_like: Math.round((temp + humidity * 0.1) * 10) / 10,
        source: "mock",
        timestamp: new Date().toISOString(),
    };
}

/**
 * Fetch live weather data for a city from OpenWeatherMap.
 */
async function getLiveWeather(city) {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    // If no API key, use mock data
    if (!apiKey) {
        console.log(`ℹ️  No API key configured. Using mock data for ${city}.`);
        return getMockWeather(city);
    }

    const coords = CITY_COORDS[city];
    if (!coords) {
        // Try geocoding with the API
        try {
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city},IN&limit=1&appid=${apiKey}`;
            const geoResp = await axios.get(geoUrl);
            if (geoResp.data.length > 0) {
                coords = { lat: geoResp.data[0].lat, lon: geoResp.data[0].lon };
            }
        } catch {
            return getMockWeather(city);
        }
    }

    if (!coords) return getMockWeather(city);

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`;
        const response = await axios.get(url);
        const data = response.data;

        return {
            city,
            temperature: data.main.temp,
            humidity: data.main.humidity,
            wind_speed: data.wind.speed,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            feels_like: data.main.feels_like,
            source: "openweathermap",
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.warn(`⚠️  Weather API error for ${city}: ${error.message}. Using mock data.`);
        return getMockWeather(city);
    }
}

/**
 * Generate a 7-day mock forecast for a city.
 */
function generate7DayForecast(city) {
    const baseWeather = getMockWeather(city);
    const forecast = [];

    for (let day = 0; day < 7; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day);

        // Add daily variation
        const tempVariation = (Math.random() * 8 - 4) + (day < 3 ? 1 : -1);
        const humidityVariation = Math.random() * 15 - 7;

        forecast.push({
            day: day + 1,
            date: date.toISOString().split("T")[0],
            dayName: date.toLocaleDateString("en-IN", { weekday: "short" }),
            temperature: Math.round((baseWeather.temperature + tempVariation) * 10) / 10,
            humidity: Math.round(Math.min(Math.max(baseWeather.humidity + humidityVariation, 10), 95) * 10) / 10,
            wind_speed: Math.round((Math.random() * 15 + 2) * 10) / 10,
        });
    }

    return forecast;
}

/**
 * Get list of supported cities.
 */
function getSupportedCities() {
    return Object.keys(CITY_COORDS);
}

module.exports = {
    getLiveWeather,
    getMockWeather,
    generate7DayForecast,
    getSupportedCities,
    CITY_COORDS,
};
