/**
 * HeatShield AI - ML Service Client
 * Communicates with the Python ML microservice for risk prediction.
 */

const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * Compute heat risk score inline (fallback when ML service is unavailable).
 * This mirrors the Python model's scoring logic.
 */
function computeRiskScoreFallback(temperature, humidity, windSpeed) {
    // Simplified Heat Index calculation
    const T = temperature * 9 / 5 + 32;
    const RH = humidity;
    let HI = (-42.379 + 2.04901523 * T + 10.14333127 * RH
        - 0.22475541 * T * RH - 0.00683783 * T * T
        - 0.05481717 * RH * RH + 0.00122874 * T * T * RH
        + 0.00085282 * T * RH * RH - 0.00000199 * T * T * RH * RH);
    HI = (HI - 32) * 5 / 9;

    const tempFactor = Math.min(Math.max((temperature - 25) / 25, 0), 1) * 40;
    const hiFactor = Math.min(Math.max((HI - 30) / 30, 0), 1) * 35;
    const humidityFactor = Math.min(Math.max(humidity / 100, 0), 1) * 20;
    const windRelief = Math.min(Math.max(windSpeed / 30, 0), 1) * 5;

    const score = Math.min(Math.max(tempFactor + hiFactor + humidityFactor - windRelief, 0), 100);
    return Math.round(score * 100) / 100;
}

function classifyRisk(score) {
    if (score < 25) return "Low";
    if (score < 50) return "Medium";
    if (score < 75) return "High";
    return "Severe";
}

/**
 * Get risk prediction from ML microservice.
 * Falls back to inline computation if service is unavailable.
 */
async function predictRisk(temperature, humidity, windSpeed) {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
            temperature,
            humidity,
            wind_speed: windSpeed,
        }, { timeout: 5000 });

        if (response.data.success) {
            return response.data.prediction;
        }
        throw new Error("ML service returned failure");
    } catch (error) {
        console.warn(`⚠️  ML service unavailable: ${error.message}. Using fallback computation.`);

        const riskScore = computeRiskScoreFallback(temperature, humidity, windSpeed);
        const riskCategory = classifyRisk(riskScore);

        return {
            risk_score: riskScore,
            risk_category: riskCategory,
            confidence: 85.0,
            input: { temperature, humidity, wind_speed: windSpeed },
            source: "fallback",
        };
    }
}

/**
 * Get batch predictions for 7-day forecast.
 */
async function predictForecast(forecastData) {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/forecast`, {
            forecast_data: forecastData,
        }, { timeout: 10000 });

        if (response.data.success) {
            return response.data.predictions;
        }
        throw new Error("ML service returned failure");
    } catch (error) {
        console.warn(`⚠️  ML forecast unavailable: ${error.message}. Using fallback.`);

        return forecastData.map((data) => {
            const riskScore = computeRiskScoreFallback(data.temperature, data.humidity, data.wind_speed);
            return {
                day: data.day,
                date: data.date,
                risk_score: riskScore,
                risk_category: classifyRisk(riskScore),
                confidence: 85.0,
                input: {
                    temperature: data.temperature,
                    humidity: data.humidity,
                    wind_speed: data.wind_speed,
                },
                source: "fallback",
            };
        });
    }
}

module.exports = { predictRisk, predictForecast };
