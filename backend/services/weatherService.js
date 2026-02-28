/**
 * HeatShield AI - Weather Service
 * Fetches REAL-TIME weather data from Open-Meteo API (free, no key required).
 * Also supports OpenWeatherMap if API key is configured.
 * Falls back to mock data only if all APIs fail.
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
 * Fetch REAL-TIME weather from Open-Meteo API (free, no API key needed).
 */
async function getOpenMeteoWeather(city) {
    const coords = CITY_COORDS[city];
    if (!coords) return null;

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,surface_pressure&timezone=Asia/Kolkata`;
        const response = await axios.get(url, { timeout: 8000 });
        const current = response.data.current;

        const weatherCode = current.weather_code;
        const temp = current.temperature_2m;

        return {
            city,
            temperature: Math.round(temp * 10) / 10,
            humidity: Math.round(current.relative_humidity_2m * 10) / 10,
            wind_speed: Math.round(current.wind_speed_10m * 10) / 10,
            feels_like: Math.round(current.apparent_temperature * 10) / 10,
            pressure: current.surface_pressure,
            description: getWeatherDescription(weatherCode),
            icon: getWeatherIcon(temp, weatherCode),
            source: "open-meteo",
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.warn(`⚠️  Open-Meteo error for ${city}: ${error.message}`);
        return null;
    }
}

/**
 * Map WMO weather code to human description.
 */
function getWeatherDescription(code) {
    const descriptions = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Rime fog",
        51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
        61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
        80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
        95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
    };
    return descriptions[code] || "Unknown";
}

/**
 * Get weather emoji icon.
 */
function getWeatherIcon(temp, weatherCode) {
    if (weatherCode >= 95) return "⛈️";
    if (weatherCode >= 80) return "🌧️";
    if (weatherCode >= 61) return "🌧️";
    if (weatherCode >= 51) return "🌦️";
    if (weatherCode >= 45) return "🌫️";
    if (weatherCode >= 3) return "☁️";
    if (weatherCode >= 1) return "⛅";
    if (temp > 40) return "🔥";
    if (temp > 35) return "☀️";
    return "🌤️";
}

/**
 * Generate mock weather data (fallback only).
 */
function getMockWeather(city) {
    const baseTemps = {
        Delhi: 32, Mumbai: 30, Chennai: 31, Kolkata: 30, Bengaluru: 27,
        Hyderabad: 31, Ahmedabad: 33, Jaipur: 30, Lucknow: 28, Nagpur: 33,
        Bhopal: 30, Varanasi: 29, Patna: 28, Thiruvananthapuram: 29, Chandigarh: 25,
    };
    const baseHumidity = {
        Delhi: 45, Mumbai: 70, Chennai: 65, Kolkata: 65, Bengaluru: 55,
        Hyderabad: 50, Ahmedabad: 40, Jaipur: 35, Lucknow: 50, Nagpur: 35,
        Bhopal: 40, Varanasi: 50, Patna: 55, Thiruvananthapuram: 75, Chandigarh: 45,
    };

    const temp = (baseTemps[city] || 30) + (Math.random() * 4 - 2);
    const humidity = (baseHumidity[city] || 50) + (Math.random() * 10 - 5);
    const windSpeed = Math.random() * 15 + 2;

    return {
        city,
        temperature: Math.round(temp * 10) / 10,
        humidity: Math.round(Math.min(Math.max(humidity, 10), 95) * 10) / 10,
        wind_speed: Math.round(windSpeed * 10) / 10,
        description: temp > 40 ? "Extreme Heat" : temp > 35 ? "Hot" : temp > 25 ? "Warm" : "Pleasant",
        icon: temp > 40 ? "🔥" : temp > 35 ? "☀️" : "🌤️",
        feels_like: Math.round((temp + humidity * 0.1) * 10) / 10,
        source: "mock",
        timestamp: new Date().toISOString(),
    };
}

/**
 * Fetch live weather data — tries Open-Meteo first (free), then OpenWeatherMap, then mock.
 */
async function getLiveWeather(city) {
    // 1. Try Open-Meteo (free, no key needed)
    const openMeteoData = await getOpenMeteoWeather(city);
    if (openMeteoData) return openMeteoData;

    // 2. Try OpenWeatherMap (if API key is configured)
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey) {
        const coords = CITY_COORDS[city];
        if (coords) {
            try {
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`;
                const response = await axios.get(url, { timeout: 8000 });
                const data = response.data;

                return {
                    city,
                    temperature: data.main.temp,
                    humidity: data.main.humidity,
                    wind_speed: data.wind.speed,
                    description: data.weather[0].description,
                    icon: data.weather[0].icon,
                    feels_like: data.main.feels_like,
                    pressure: data.main.pressure,
                    source: "openweathermap",
                    timestamp: new Date().toISOString(),
                };
            } catch (error) {
                console.warn(`⚠️  OpenWeatherMap error for ${city}: ${error.message}`);
            }
        }
    }

    // 3. Fallback to mock
    console.log(`ℹ️  All APIs failed for ${city}. Using mock data.`);
    return getMockWeather(city);
}

/**
 * Fetch live forecast from Open-Meteo (free, no key needed).
 * Returns daily data for up to 7 days.
 */
async function getLiveForecast(city) {
    const coords = CITY_COORDS[city];
    if (!coords) return generate7DayForecast(city);

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max,weather_code&timezone=Asia/Kolkata&forecast_days=7`;
        const response = await axios.get(url, { timeout: 8000 });
        const daily = response.data.daily;

        const forecast = daily.time.map((date, index) => {
            const dateObj = new Date(date);
            return {
                day: index + 1,
                date,
                dayName: dateObj.toLocaleDateString("en-IN", { weekday: "short" }),
                temperature: Math.round(daily.temperature_2m_max[index] * 10) / 10,
                temp_min: Math.round(daily.temperature_2m_min[index] * 10) / 10,
                humidity: Math.round((daily.relative_humidity_2m_mean?.[index] ?? 50) * 10) / 10,
                wind_speed: Math.round(daily.wind_speed_10m_max[index] * 10) / 10,
                weather_code: daily.weather_code[index],
                source: "open-meteo",
            };
        });

        return forecast;
    } catch (error) {
        console.warn(`⚠️  Open-Meteo forecast error for ${city}: ${error.message}`);

        // Try OpenWeatherMap forecast as backup
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (apiKey && coords) {
            try {
                const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`;
                const response = await axios.get(url, { timeout: 8000 });
                const data = response.data;

                const dailyMap = {};
                for (const entry of data.list) {
                    const date = entry.dt_txt.split(" ")[0];
                    if (!dailyMap[date]) {
                        dailyMap[date] = { temps: [], humidities: [], winds: [], date };
                    }
                    dailyMap[date].temps.push(entry.main.temp);
                    dailyMap[date].humidities.push(entry.main.humidity);
                    dailyMap[date].winds.push(entry.wind.speed);
                }

                return Object.values(dailyMap).slice(0, 7).map((day, index) => {
                    const dateObj = new Date(day.date);
                    return {
                        day: index + 1,
                        date: day.date,
                        dayName: dateObj.toLocaleDateString("en-IN", { weekday: "short" }),
                        temperature: Math.round(Math.max(...day.temps) * 10) / 10,
                        humidity: Math.round((day.humidities.reduce((a, b) => a + b, 0) / day.humidities.length) * 10) / 10,
                        wind_speed: Math.round((day.winds.reduce((a, b) => a + b, 0) / day.winds.length) * 10) / 10,
                        source: "openweathermap",
                    };
                });
            } catch (err) {
                console.warn(`⚠️  OpenWeatherMap forecast error: ${err.message}`);
            }
        }

        return generate7DayForecast(city);
    }
}

/**
 * Generate a 7-day mock forecast for a city (fallback only).
 */
function generate7DayForecast(city) {
    const baseWeather = getMockWeather(city);
    const forecast = [];

    for (let day = 0; day < 7; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day);

        const tempVariation = (Math.random() * 6 - 3) + (day < 3 ? 1 : -1);
        const humidityVariation = Math.random() * 15 - 7;

        forecast.push({
            day: day + 1,
            date: date.toISOString().split("T")[0],
            dayName: date.toLocaleDateString("en-IN", { weekday: "short" }),
            temperature: Math.round((baseWeather.temperature + tempVariation) * 10) / 10,
            humidity: Math.round(Math.min(Math.max(baseWeather.humidity + humidityVariation, 10), 95) * 10) / 10,
            wind_speed: Math.round((Math.random() * 15 + 2) * 10) / 10,
            source: "mock",
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

/**
 * Get hourly heat data — uses Open-Meteo hourly forecast (free).
 */
async function getHourlyHeatData(city, targetDate) {
    const coords = CITY_COORDS[city];
    if (!coords) return generateMockHourlyData(city, targetDate);

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&timezone=Asia/Kolkata&start_date=${targetDate}&end_date=${targetDate}`;
        const response = await axios.get(url, { timeout: 8000 });
        const hourly = response.data.hourly;

        const hours = hourly.time.map((time, i) => {
            const temp = Math.round(hourly.temperature_2m[i] * 10) / 10;
            const prevTemp = i > 0 ? hourly.temperature_2m[i - 1] : temp;
            const change = Math.round((temp - prevTemp) * 10) / 10;

            return {
                time: time.split("T")[1].slice(0, 5),
                hour: parseInt(time.split("T")[1].slice(0, 2)),
                temperature: temp,
                humidity: Math.round(hourly.relative_humidity_2m[i]),
                wind_speed: Math.round(hourly.wind_speed_10m[i] * 10) / 10,
                feels_like: Math.round(hourly.apparent_temperature[i] * 10) / 10,
                change,
                trend: change > 0.3 ? "rising" : change < -0.3 ? "falling" : "stable",
                source: "open-meteo",
            };
        });

        return hours;
    } catch (error) {
        console.warn(`⚠️  Open-Meteo hourly error for ${city}: ${error.message}. Using mock.`);
        return generateMockHourlyData(city, targetDate);
    }
}

/**
 * Generate realistic mock hourly temperature data (fallback only).
 */
function generateMockHourlyData(city, targetDate) {
    const baseTemps = {
        Delhi: 32, Mumbai: 30, Chennai: 31, Kolkata: 30, Bengaluru: 27,
        Hyderabad: 31, Ahmedabad: 33, Jaipur: 30, Lucknow: 28, Nagpur: 33,
        Bhopal: 30, Varanasi: 29, Patna: 28, Thiruvananthapuram: 29, Chandigarh: 25,
    };
    const baseHumidity = {
        Delhi: 45, Mumbai: 70, Chennai: 65, Kolkata: 65, Bengaluru: 55,
        Hyderabad: 50, Ahmedabad: 40, Jaipur: 35, Lucknow: 50, Nagpur: 35,
        Bhopal: 40, Varanasi: 50, Patna: 55, Thiruvananthapuram: 75, Chandigarh: 45,
    };

    const peakTemp = (baseTemps[city] || 30) + (Math.random() * 4 - 2);
    const minTemp = peakTemp - 6 - Math.random() * 3;
    const baseHum = baseHumidity[city] || 50;

    const hours = [];
    for (let h = 0; h < 24; h++) {
        const progress = Math.sin(((h - 6) / 18) * Math.PI);
        const clampedProgress = Math.max(0, progress);
        const temp = minTemp + (peakTemp - minTemp) * clampedProgress + (Math.random() * 1 - 0.5);
        const roundedTemp = Math.round(temp * 10) / 10;

        const hum = Math.round(Math.min(95, Math.max(15, baseHum + (1 - clampedProgress) * 15 + (Math.random() * 6 - 3))));
        const wind = Math.round((Math.random() * 12 + 2) * 10) / 10;

        const prevTemp = hours.length > 0 ? hours[hours.length - 1].temperature : roundedTemp;
        const change = Math.round((roundedTemp - prevTemp) * 10) / 10;

        hours.push({
            time: `${String(h).padStart(2, "0")}:00`,
            hour: h,
            temperature: roundedTemp,
            humidity: hum,
            wind_speed: wind,
            feels_like: Math.round((roundedTemp + hum * 0.08) * 10) / 10,
            change,
            trend: change > 0.3 ? "rising" : change < -0.3 ? "falling" : "stable",
            source: "mock",
        });
    }

    return hours;
}

module.exports = {
    getLiveWeather,
    getMockWeather,
    getLiveForecast,
    generate7DayForecast,
    getHourlyHeatData,
    getSupportedCities,
    CITY_COORDS,
};
