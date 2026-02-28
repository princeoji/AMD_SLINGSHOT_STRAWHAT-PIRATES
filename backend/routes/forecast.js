/**
 * HeatShield AI - 7-Day Forecast Routes
 * GET /api/forecast/7days?city=Delhi - Get 7-day heat risk forecast
 */

const express = require("express");
const router = express.Router();
const { generate7DayForecast } = require("../services/weatherService");
const { predictForecast } = require("../services/mlService");

// GET /api/forecast/7days?city=Delhi
router.get("/7days", async (req, res) => {
    try {
        const city = req.query.city || "Delhi";

        // 1. Generate 7-day weather forecast
        const forecastWeather = generate7DayForecast(city);

        // 2. Get ML risk predictions for all 7 days
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
