/**
 * HeatShield AI - Forecast Routes
 * GET /api/forecast/7days?city=Delhi - Get heat risk forecast (live or mock)
 * GET /api/forecast/hourly?city=Delhi&date=2026-02-28 - Get hourly heat data for a day
 */

const express = require("express");
const router = express.Router();
const { getLiveForecast, generate7DayForecast, getHourlyHeatData } = require("../services/weatherService");
const { predictForecast } = require("../services/mlService");

// GET /api/forecast/7days?city=Delhi
router.get("/7days", async (req, res) => {
    try {
        const city = req.query.city || "Delhi";

        // 1. Get forecast — live if API key is available, mock otherwise
        const forecastWeather = await getLiveForecast(city);

        // 2. Get ML risk predictions for all days
        const predictions = await predictForecast(forecastWeather);

        // 3. Combine weather + predictions
        const forecast = forecastWeather.map((day, index) => ({
            ...day,
            risk_score: predictions[index]?.risk_score || 0,
            risk_category: predictions[index]?.risk_category || "Low",
            confidence: predictions[index]?.confidence || 0,
        }));

        res.json({
            success: true,
            data: {
                city,
                forecast,
                source: forecastWeather[0]?.source || "mock",
                generated_at: new Date().toISOString(),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// GET /api/forecast/hourly?city=Delhi&date=2026-02-28
router.get("/hourly", async (req, res) => {
    try {
        const city = req.query.city || "Delhi";
        const date = req.query.date || new Date().toISOString().split("T")[0];

        const hourlyData = await getHourlyHeatData(city, date);

        // Calculate summary stats
        const temps = hourlyData.map(h => h.temperature);
        const peakTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        const peakHour = hourlyData.find(h => h.temperature === peakTemp);
        const risingCount = hourlyData.filter(h => h.trend === "rising").length;
        const fallingCount = hourlyData.filter(h => h.trend === "falling").length;

        res.json({
            success: true,
            data: {
                city,
                date,
                hourly: hourlyData,
                summary: {
                    peak_temp: peakTemp,
                    min_temp: minTemp,
                    peak_hour: peakHour?.time || "14:00",
                    total_rise_hours: risingCount,
                    total_fall_hours: fallingCount,
                    range: Math.round((peakTemp - minTemp) * 10) / 10,
                },
                source: hourlyData[0]?.source || "mock",
                generated_at: new Date().toISOString(),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

module.exports = router;
